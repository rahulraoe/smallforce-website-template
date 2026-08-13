import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const THEME_REGISTRY =
  "https://raw.githubusercontent.com/slidevjs/slidev/main/docs/.vitepress/themes.ts";
const ADDON_REGISTRY =
  "https://raw.githubusercontent.com/slidevjs/slidev/main/docs/.vitepress/addons.ts";

type ParsedRegistry = {
  official: string[];
  community: string[];
};

function packageIds(section: string): string[] {
  return [...section.matchAll(/\bid:\s*'([^']+)'/g)]
    .map((match) => match[1])
    .filter((id) => id.length > 0);
}

function parseRegistry(source: string): ParsedRegistry {
  const officialStart = source.indexOf("export const official");
  const communityStart = source.indexOf("export const community");
  if (officialStart === -1 || communityStart === -1) {
    throw new Error("Slidev registry shape changed; review the upstream file.");
  }

  return {
    official: packageIds(source.slice(officialStart, communityStart)),
    community: packageIds(source.slice(communityStart)),
  };
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "user-agent": "smallforce-slidev-catalog" },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
}

function bullets(ids: string[]): string {
  return ids.length === 0
    ? "- None currently listed."
    : ids.map((id) => `- \`${id}\``).join("\n");
}

const [themesSource, addonsSource] = await Promise.all([
  fetchText(THEME_REGISTRY),
  fetchText(ADDON_REGISTRY),
]);

const themes = parseRegistry(themesSource);
const addons = parseRegistry(addonsSource);

const output = `# Slidev ecosystem snapshot

Generated from Slidev's public theme and add-on registries at
${new Date().toISOString()}. Treat every entry as discovery metadata, not as an
approval. Run \`bun run refresh:catalog\` to refresh this file before a current
recommendation.

## Official themes

${bullets(themes.official)}

## Community themes

${bullets(themes.community)}

## Official add-ons

${bullets(addons.official)}

## Community add-ons

${bullets(addons.community)}

Sources:

- ${THEME_REGISTRY}
- ${ADDON_REGISTRY}
`;

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = join(scriptDirectory, "..", "references", "gallery-snapshot.md");
await writeFile(outputPath, output, "utf8");

console.log(
  `Updated ${outputPath} with ${themes.official.length + themes.community.length} themes and ${addons.official.length + addons.community.length} add-ons.`,
);
