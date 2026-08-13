type PackageMetadata = {
  name: string;
  version?: string;
  license?: string | { type?: string };
  description?: string;
  deprecated?: string;
  homepage?: string;
  repository?: string | { type?: string; url?: string; directory?: string };
  peerDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
  engines?: Record<string, string>;
  scripts?: Record<string, string>;
  dist?: {
    tarball?: string;
    integrity?: string;
    unpackedSize?: number;
  };
  time?: Record<string, string>;
};

function packageNameFromSpecifier(specifier: string): string {
  if (specifier.startsWith("@")) {
    const slash = specifier.indexOf("/");
    const versionMarker = specifier.indexOf("@", slash + 1);
    return versionMarker === -1 ? specifier : specifier.slice(0, versionMarker);
  }

  const versionMarker = specifier.indexOf("@");
  return versionMarker === -1 ? specifier : specifier.slice(0, versionMarker);
}

function repositoryUrl(
  repository: PackageMetadata["repository"],
): string | undefined {
  if (typeof repository === "string") return repository;
  if (!repository?.url) return undefined;
  return repository.directory
    ? `${repository.url}#${repository.directory}`
    : repository.url;
}

function licenseLabel(license: PackageMetadata["license"]): string | undefined {
  return typeof license === "string" ? license : license?.type;
}

const [specifier] = Bun.argv.slice(2);

if (!specifier) {
  console.error("Usage: bun run inspect:package -- <npm-package>[@version]");
  process.exit(1);
}

const packageName = packageNameFromSpecifier(specifier);
if (
  !packageName.startsWith("@slidev/theme-") &&
  !packageName.startsWith("slidev-theme-") &&
  !packageName.startsWith("slidev-addon-") &&
  !packageName.startsWith("slidev-component-") &&
  packageName !== "slidev-pane" &&
  packageName !== "slidev-agent"
) {
  console.error(
    `Refusing to inspect ${packageName}: expected a Slidev theme or add-on package.`,
  );
  process.exit(1);
}

const metadataProcess = Bun.spawn(
  ["npm", "view", specifier, "--json"],
  { stderr: "pipe", stdout: "pipe" },
);
const stdout = await new Response(metadataProcess.stdout).text();
const stderr = await new Response(metadataProcess.stderr).text();
const exitCode = await metadataProcess.exited;

if (exitCode !== 0) {
  console.error(stderr.trim() || `npm view failed with code ${exitCode}.`);
  process.exit(exitCode);
}

const parsed: PackageMetadata | PackageMetadata[] = JSON.parse(stdout);
const metadata = Array.isArray(parsed) ? parsed.at(-1) : parsed;

if (!metadata) {
  console.error(`No npm metadata returned for ${specifier}.`);
  process.exit(1);
}

const license = licenseLabel(metadata.license);
const registryModifiedAt = metadata.time?.modified;
const warnings: string[] = [];

if (!license) warnings.push("npm metadata does not declare a license");
if (metadata.deprecated) warnings.push(`package is deprecated: ${metadata.deprecated}`);
if (!repositoryUrl(metadata.repository)) warnings.push("repository URL is missing");

console.log(
  JSON.stringify(
    {
      name: metadata.name,
      version: metadata.version,
      description: metadata.description,
      license: license ?? null,
      deprecated: metadata.deprecated ?? null,
      repository: repositoryUrl(metadata.repository) ?? null,
      homepage: metadata.homepage ?? null,
      peerDependencies: metadata.peerDependencies ?? {},
      dependencies: metadata.dependencies ?? {},
      engines: metadata.engines ?? {},
      lifecycleScripts: Object.fromEntries(
        Object.entries(metadata.scripts ?? {}).filter(([name]) =>
          ["preinstall", "install", "postinstall"].includes(name),
        ),
      ),
      registryModifiedAt: registryModifiedAt ?? null,
      unpackedSize: metadata.dist?.unpackedSize ?? null,
      integrity: metadata.dist?.integrity ?? null,
      warnings,
      requiredManualReview: [
        "Read the package README and repository license.",
        "Inspect bundled images, fonts, and other assets separately from code.",
        "Check peer dependencies against this project.",
        "Install an exact version and verify the real feature in bun run build.",
      ],
    },
    null,
    2,
  ),
);

if (warnings.length > 0) process.exitCode = 2;
