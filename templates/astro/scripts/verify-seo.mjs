import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const clientDirectoryUrl = new URL("../dist/client/", import.meta.url);
const clientDirectory = fileURLToPath(clientDirectoryUrl);
const indexPath = join(clientDirectory, "index.html");
const robotsPath = join(clientDirectory, "robots.txt");
const sitemapIndexPath = join(clientDirectory, "sitemap-index.xml");

assertFile(indexPath, "prerendered homepage");
assertFile(robotsPath, "robots.txt");

const homepage = readFileSync(indexPath, "utf8");
for (const requiredFragment of [
  '<meta name="description"',
  '<meta property="og:image"',
  '<meta property="og:image:alt"',
  '<meta name="twitter:card" content="summary_large_image"',
  '<meta name="twitter:image"',
  '<script type="application/ld+json"',
]) {
  if (!homepage.includes(requiredFragment)) {
    throw new Error(`SEO verification failed: index.html is missing ${requiredFragment}.`);
  }
}

const homepageCanonical = metaOrLinkAttribute(
  homepage,
  "link",
  "rel",
  "canonical",
  "href",
);
const homepageOgImage = metaOrLinkAttribute(
  homepage,
  "meta",
  "property",
  "og:image",
  "content",
);
const homepageTwitterImage = metaOrLinkAttribute(
  homepage,
  "meta",
  "name",
  "twitter:image",
  "content",
);

if (!homepageCanonical || !homepageOgImage || !homepageTwitterImage) {
  throw new Error(
    "SEO verification failed: the homepage needs canonical, og:image, and twitter:image URLs.",
  );
}
if (homepageOgImage !== homepageTwitterImage) {
  throw new Error(
    "SEO verification failed: homepage og:image and twitter:image must reference the same fallback.",
  );
}

const siteOrigin = new URL(homepageCanonical).origin;
const defaultImagePath = localAssetPath(homepageOgImage, siteOrigin);
assertFile(defaultImagePath, "default Open Graph image");

const defaultImageMetadata = await sharp(defaultImagePath).metadata();
if (
  !["jpeg", "png"].includes(defaultImageMetadata.format || "") ||
  defaultImageMetadata.width !== 1200 ||
  defaultImageMetadata.height !== 630
) {
  throw new Error(
    `SEO verification failed: default OG image must be a 1200x630 JPEG or PNG, received ${defaultImageMetadata.width}x${defaultImageMetadata.height} ${defaultImageMetadata.format}.`,
  );
}

const htmlPaths = findFiles(clientDirectory, ".html");
let checkedSocialImages = 0;
for (const htmlPath of htmlPaths) {
  const page = readFileSync(htmlPath, "utf8");
  for (const reference of socialImageReferences(page)) {
    const parsed = new URL(reference, siteOrigin);
    if (parsed.origin !== siteOrigin) continue;

    assertFile(
      localAssetPath(parsed.toString(), siteOrigin),
      `social image referenced by ${htmlPath}`,
    );
    checkedSocialImages++;
  }
}

const robots = readFileSync(robotsPath, "utf8");
if (robots.includes("Sitemap:")) {
  assertFile(sitemapIndexPath, "sitemap index");

  if (!homepage.includes('<link rel="sitemap"')) {
    throw new Error("SEO verification failed: index.html is missing its sitemap link.");
  }

  const sitemap = readdirSync(clientDirectory)
    .filter((entry) => /^sitemap-\d+\.xml$/.test(entry))
    .map((entry) => readFileSync(join(clientDirectory, entry), "utf8"))
    .join("\n");
  const sitemapUrls = new Set(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) =>
      new URL(match[1]).toString(),
    ),
  );

  for (const htmlPath of htmlPaths) {
    const page = readFileSync(htmlPath, "utf8");
    if (/<meta name="robots" content="[^"]*noindex/i.test(page)) continue;

    const canonical = metaOrLinkAttribute(
      page,
      "link",
      "rel",
      "canonical",
      "href",
    );
    if (!canonical) {
      throw new Error(`SEO verification failed: ${htmlPath} has no canonical URL.`);
    }
    if (!sitemapUrls.has(new URL(canonical).toString())) {
      throw new Error(
        `SEO verification failed: canonical URL ${canonical} from ${htmlPath} is missing from the sitemap.`,
      );
    }
  }
}

console.log(
  `SEO verification passed; checked ${checkedSocialImages} local social-image references.`,
);

function assertFile(path, label) {
  if (!path || !existsSync(path)) {
    throw new Error(`SEO verification failed: missing ${label}${path ? ` at ${path}` : ""}.`);
  }
}

function findFiles(directory, extension) {
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...findFiles(path, extension));
    } else if (extname(entry.name) === extension) {
      files.push(path);
    }
  }

  return files;
}

function metaOrLinkAttribute(html, tagName, key, value, target) {
  const tagPattern = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  for (const tag of html.match(tagPattern) || []) {
    if (attribute(tag, key)?.toLowerCase() === value.toLowerCase()) {
      return attribute(tag, target);
    }
  }
  return null;
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, "i"))?.[1] || null;
}

function localAssetPath(reference, expectedOrigin) {
  const parsed = new URL(reference, expectedOrigin);
  if (parsed.origin !== expectedOrigin) return null;

  const relativePath = decodeURIComponent(parsed.pathname).replace(/^\/+/, "");
  return join(clientDirectory, relativePath);
}

function socialImageReferences(html) {
  const references = [];
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const kind = attribute(tag, "property") || attribute(tag, "name");
    if (kind === "og:image" || kind === "twitter:image") {
      const content = attribute(tag, "content");
      if (content) references.push(content);
    }
  }

  for (const block of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      collectImageStrings(JSON.parse(block[1]), references);
    } catch {
      throw new Error("SEO verification failed: found invalid JSON-LD.");
    }
  }

  return references;
}

function collectImageStrings(value, references) {
  if (typeof value === "string") {
    if (/\.(png|jpe?g|webp|avif|gif|svg)(?:$|[?#])/i.test(value)) {
      references.push(value);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) collectImageStrings(item, references);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectImageStrings(item, references);
  }
}
