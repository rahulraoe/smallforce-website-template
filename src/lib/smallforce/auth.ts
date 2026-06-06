import { sfDb } from "./db";

const DEFAULT_SESSION_COOKIE_NAME = "sf_app_session";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_PASSWORD_ITERATIONS = 210_000;
const PASSWORD_HASH_ALGORITHM = "pbkdf2-sha256";

let authTablesPromise: Promise<void> | null = null;

export type SmallForceAuthRole = "admin" | "user" | string;

export type SmallForceAuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: SmallForceAuthRole;
};

export type SmallForceAuthSession = {
  id: string;
  userId: string;
  expiresAt: string;
};

export type SmallForceAuthContext = {
  user: SmallForceAuthUser;
  session: SmallForceAuthSession;
};

export type SmallForceCreateSessionResult = {
  token: string;
  cookie: string;
  session: SmallForceAuthSession;
};

export type SmallForceAuthOptions = {
  cookieName?: string;
  ensureTables?: boolean;
};

type AuthSessionRow = {
  session_id: string;
  session_user_id: string;
  session_expires_at: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  user_role: string;
};

type AuthUserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  password_hash: string | null;
};

export class SmallForceAuthError extends Error {
  constructor(
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
    message: string,
    readonly status: 401 | 403,
  ) {
    super(message);
    this.name = "SmallForceAuthError";
  }
}

export async function ensureAuthTables(): Promise<void> {
  if (!authTablesPromise) {
    authTablesPromise = createAuthTables().catch((error) => {
      authTablesPromise = null;
      throw error;
    });
  }

  return authTablesPromise;
}

export async function requireUser(
  request: Request,
  options: SmallForceAuthOptions = {},
): Promise<SmallForceAuthContext> {
  if (options.ensureTables !== false) {
    await ensureAuthTables();
  }

  const cookieName = options.cookieName || DEFAULT_SESSION_COOKIE_NAME;
  const token = readCookie(request.headers.get("cookie"), cookieName);

  if (!token) {
    throw new SmallForceAuthError("UNAUTHENTICATED", "Authentication is required.", 401);
  }

  const tokenHash = await hashSessionToken(token);
  const result = await sfDb.query<AuthSessionRow>(
    `SELECT
       s.id AS session_id,
       s.user_id AS session_user_id,
       s.expires_at AS session_expires_at,
       u.id AS user_id,
       u.email AS user_email,
       u.name AS user_name,
       u.role AS user_role
     FROM auth_sessions s
     INNER JOIN auth_users u ON u.id = s.user_id
     WHERE s.session_token_hash = ?
     LIMIT 1`,
    [tokenHash],
  );
  const row = readDbFirst<AuthSessionRow>(result);

  if (!row) {
    throw new SmallForceAuthError("UNAUTHENTICATED", "Session is invalid.", 401);
  }

  if (Date.parse(row.session_expires_at) <= Date.now()) {
    await sfDb.query("DELETE FROM auth_sessions WHERE id = ?", [row.session_id]);
    throw new SmallForceAuthError("UNAUTHENTICATED", "Session has expired.", 401);
  }

  return {
    user: {
      id: row.user_id,
      email: row.user_email,
      name: row.user_name,
      role: row.user_role,
    },
    session: {
      id: row.session_id,
      userId: row.session_user_id,
      expiresAt: row.session_expires_at,
    },
  };
}

export async function requireAdmin(
  request: Request,
  options: SmallForceAuthOptions = {},
): Promise<SmallForceAuthContext> {
  const context = await requireUser(request, options);

  if (context.user.role !== "admin") {
    throw new SmallForceAuthError("FORBIDDEN", "Admin access is required.", 403);
  }

  return context;
}

export async function findAuthUserByEmail(email: string): Promise<(SmallForceAuthUser & {
  passwordHash: string | null;
}) | null> {
  await ensureAuthTables();

  const result = await sfDb.query<AuthUserRow>(
    `SELECT id, email, name, role, password_hash
       FROM auth_users
      WHERE email = ?
      LIMIT 1`,
    [normalizeEmail(email)],
  );
  const row = readDbFirst<AuthUserRow>(result);

  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    passwordHash: row.password_hash,
  };
}

export async function createAuthUser(input: {
  email: string;
  password?: string;
  passwordHash?: string | null;
  name?: string | null;
  role?: SmallForceAuthRole;
}): Promise<SmallForceAuthUser> {
  await ensureAuthTables();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash =
    input.passwordHash ?? (input.password ? await hashPassword(input.password) : null);
  const user: SmallForceAuthUser = {
    id,
    email: normalizeEmail(input.email),
    name: input.name?.trim() || null,
    role: input.role || "user",
  };

  await sfDb.query(
    `INSERT INTO auth_users (
       id, email, name, role, password_hash, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [user.id, user.email, user.name, user.role, passwordHash, now, now],
  );

  return user;
}

export async function createSession(
  userId: string,
  options: {
    cookieName?: string;
    ttlSeconds?: number;
  } = {},
): Promise<SmallForceCreateSessionResult> {
  await ensureAuthTables();

  const ttlSeconds = options.ttlSeconds || DEFAULT_SESSION_TTL_SECONDS;
  const token = createSessionToken();
  const tokenHash = await hashSessionToken(token);
  const session: SmallForceAuthSession = {
    id: crypto.randomUUID(),
    userId,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  };
  const now = new Date().toISOString();

  await sfDb.query(
    `INSERT INTO auth_sessions (
       id, user_id, session_token_hash, expires_at, created_at
     ) VALUES (?, ?, ?, ?, ?)`,
    [session.id, session.userId, tokenHash, session.expiresAt, now],
  );

  return {
    token,
    cookie: createSessionCookie(token, {
      cookieName: options.cookieName,
      maxAgeSeconds: ttlSeconds,
    }),
    session,
  };
}

export async function destroyCurrentSession(
  request: Request,
  options: {
    cookieName?: string;
  } = {},
): Promise<string> {
  const cookieName = options.cookieName || DEFAULT_SESSION_COOKIE_NAME;
  const token = readCookie(request.headers.get("cookie"), cookieName);

  if (token) {
    await ensureAuthTables();
    await sfDb.query("DELETE FROM auth_sessions WHERE session_token_hash = ?", [
      await hashSessionToken(token),
    ]);
  }

  return clearSessionCookie({ cookieName });
}

export function createSessionCookie(
  token: string,
  options: {
    cookieName?: string;
    maxAgeSeconds?: number;
  } = {},
): string {
  return serializeCookie(options.cookieName || DEFAULT_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: options.maxAgeSeconds || DEFAULT_SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(options: { cookieName?: string } = {}): string {
  return serializeCookie(options.cookieName || DEFAULT_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export function authErrorResponse(error: unknown): Response | null {
  if (!(error instanceof SmallForceAuthError)) {
    return null;
  }

  return Response.json(
    {
      ok: false,
      error: error.code,
      message: error.message,
    },
    { status: error.status },
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await pbkdf2(password, salt, DEFAULT_PASSWORD_ITERATIONS);

  return [
    PASSWORD_HASH_ALGORITHM,
    String(DEFAULT_PASSWORD_ITERATIONS),
    bytesToBase64Url(salt),
    bytesToBase64Url(hash),
  ].join(".");
}

export async function verifyPassword(password: string, storedHash: string | null): Promise<boolean> {
  if (!storedHash) return false;

  const [algorithm, iterationsValue, saltValue, hashValue] = storedHash.split(".");
  const iterations = Number(iterationsValue);

  if (
    algorithm !== PASSWORD_HASH_ALGORITHM ||
    !Number.isInteger(iterations) ||
    iterations < 100_000 ||
    !saltValue ||
    !hashValue
  ) {
    return false;
  }

  const expected = base64UrlToBytes(hashValue);
  const actual = await pbkdf2(password, base64UrlToBytes(saltValue), iterations);

  return timingSafeEqual(actual, expected);
}

async function createAuthTables(): Promise<void> {
  await sfDb.query(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      password_hash TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await sfDb.query(`
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_token_hash TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
    )
  `);

  await sfDb.query(`
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_token_hash
      ON auth_sessions (session_token_hash)
  `);

  await sfDb.query(`
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id
      ON auth_sessions (user_id)
  `);
}

function readDbRows<Row>(value: unknown): Row[] {
  const body = value as {
    results?: Row[];
    result?: Array<{ results?: Row[] }>;
  };

  if (Array.isArray(body.results)) {
    return body.results;
  }

  const firstResult = body.result?.[0];
  if (firstResult && Array.isArray(firstResult.results)) {
    return firstResult.results;
  }

  return [];
}

function readDbFirst<Row>(value: unknown): Row | null {
  return readDbRows<Row>(value)[0] || null;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;

  for (const part of header.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) {
      const value = rawValue.join("=");

      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  return null;
}

function serializeCookie(
  name: string,
  value: string,
  options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "Lax" | "Strict" | "None";
    path?: string;
    maxAge?: number;
    expires?: Date;
  },
): string {
  const segments = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) segments.push(`Max-Age=${Math.max(0, options.maxAge)}`);
  if (options.expires) segments.push(`Expires=${options.expires.toUTCString()}`);
  if (options.path) segments.push(`Path=${options.path}`);
  if (options.httpOnly) segments.push("HttpOnly");
  if (options.secure) segments.push("Secure");
  if (options.sameSite) segments.push(`SameSite=${options.sameSite}`);

  return segments.join("; ");
}

function createSessionToken(): string {
  return bytesToBase64Url(randomBytes(32));
}

async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return bytesToBase64Url(new Uint8Array(digest));
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: toArrayBuffer(salt),
      iterations,
    },
    key,
    256,
  );

  return new Uint8Array(bits);
}

function randomBytes(size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes);
  return copy.buffer;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let value = "";
  for (const byte of bytes) {
    value += String.fromCharCode(byte);
  }

  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "=",
  );
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }

  return diff === 0;
}
