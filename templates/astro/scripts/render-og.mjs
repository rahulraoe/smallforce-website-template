/**
 * Reproduces the versioned SmallForce fallback Open Graph card.
 *
 * This is intentionally an editable build tool rather than a runtime route.
 * A finished customer site should replace the source photo, logo, typography,
 * palette, headline, lockup, domain, and output filename with approved brand
 * material. Keep the split composition: photography establishes the business,
 * while the flat paper band keeps the headline readable in small previews.
 *
 * Run `bun run og:render` after editing. Never overwrite an already published
 * filename with new artwork; social platforms cache OG image URLs aggressively.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "og-assets");
const OUT_DIR = path.join(HERE, "..", "public", "og");

const WIDTH = 1200;
const HEIGHT = 630;
const ART_HEIGHT = 330;

const PAPER = "#f7f5ef";
const INK = "#1d211c";
const MUTED = "#8a917f";
const SAGE = "#4f6b4a";

const CARD = {
  output: "smallforce-default-v2.jpg",
  source: path.join(ASSETS, "florist.png"),
  logo: path.join(ASSETS, "smallforce-logo.png"),
  cropTop: 104,
  grade: {
    gain: [1.01, 1, 0.965],
    offset: [3, 3, 2],
    brightness: 1.02,
    saturation: 0.88,
  },
  headline: [
    { text: "Your business, run by", color: INK },
    { text: "AI employees.", color: SAGE },
  ],
  brandName: "SmallForce",
  domain: "smallforcehq.com",
};

const font = (name) => fs.readFileSync(path.join(ASSETS, "fonts", name));
const FONTS = [
  { name: "Geist", data: font("geist-600.ttf"), weight: 600, style: "normal" },
  { name: "Source Sans 3", data: font("ss3-400.ttf"), weight: 400, style: "normal" },
];

const element = (type, style, children) => ({
  type,
  props: { style, children },
});
const image = (src, style) => ({ type: "img", props: { src, style } });

async function logoDataUri(source, size) {
  const pixels = size * 2;
  const radius = Math.round(pixels * 0.22);
  const mask = Buffer.from(
    `<svg width="${pixels}" height="${pixels}"><rect width="${pixels}" height="${pixels}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`,
  );
  const buffer = await sharp(source)
    .resize(pixels, pixels, { fit: "cover" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function buildPhotograph(card) {
  const metadata = await sharp(card.source).metadata();
  const cropHeight = Math.round(metadata.width / (WIDTH / ART_HEIGHT));
  const top = Math.max(0, Math.min(card.cropTop, metadata.height - cropHeight));

  const photograph = await sharp(card.source)
    .extract({ left: 0, top, width: metadata.width, height: cropHeight })
    .resize(WIDTH, ART_HEIGHT)
    .linear(card.grade.gain, card.grade.offset)
    .modulate({
      brightness: card.grade.brightness,
      saturation: card.grade.saturation,
    })
    .toBuffer();

  const fade = Buffer.from(
    `<svg width="${WIDTH}" height="${ART_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="fade" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${PAPER}" stop-opacity="0.06"/>
        <stop offset="55%" stop-color="${PAPER}" stop-opacity="0.10"/>
        <stop offset="72%" stop-color="${PAPER}" stop-opacity="0.34"/>
        <stop offset="88%" stop-color="${PAPER}" stop-opacity="0.80"/>
        <stop offset="100%" stop-color="${PAPER}" stop-opacity="1"/>
      </linearGradient></defs>
      <rect width="${WIDTH}" height="${ART_HEIGHT}" fill="url(#fade)"/>
    </svg>`,
  );
  const veiled = await sharp(photograph)
    .composite([{ input: fade }])
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 3,
      background: PAPER,
    },
  })
    .composite([{ input: veiled, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

async function buildTypography(card) {
  const logo = await logoDataUri(card.logo, 26);
  const svg = await satori(
    element(
      "div",
      {
        width: WIDTH,
        height: HEIGHT,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Geist",
      },
      [
        element("div", { height: ART_HEIGHT }, ""),
        element(
          "div",
          {
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: HEIGHT - ART_HEIGHT,
            padding: "40px 64px 42px 64px",
          },
          [
            element(
              "div",
              { display: "flex", flexDirection: "column" },
              card.headline.map((line) =>
                element(
                  "div",
                  {
                    fontSize: 60,
                    fontWeight: 600,
                    color: line.color,
                    letterSpacing: "-0.03em",
                    lineHeight: 1.06,
                  },
                  line.text,
                ),
              ),
            ),
            element(
              "div",
              {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: WIDTH - 128,
              },
              [
                element("div", { display: "flex", alignItems: "center", gap: 9 }, [
                  image(logo, { width: 26, height: 26, borderRadius: 6 }),
                  element(
                    "div",
                    {
                      fontSize: 18,
                      fontWeight: 600,
                      color: INK,
                      letterSpacing: "-0.01em",
                    },
                    card.brandName,
                  ),
                ]),
                element(
                  "div",
                  {
                    fontFamily: "Source Sans 3",
                    fontSize: 17,
                    color: MUTED,
                  },
                  card.domain,
                ),
              ],
            ),
          ],
        ),
      ],
    ),
    { width: WIDTH, height: HEIGHT, fonts: FONTS },
  );

  return new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
    background: "rgba(0,0,0,0)",
  })
    .render()
    .asPng();
}

const [photograph, typography] = await Promise.all([
  buildPhotograph(CARD),
  buildTypography(CARD),
]);

fs.mkdirSync(OUT_DIR, { recursive: true });
const target = path.join(OUT_DIR, CARD.output);
const result = await sharp(photograph)
  .composite([{ input: typography }])
  .jpeg({ quality: 88, chromaSubsampling: "4:4:4" })
  .toFile(target);

console.log(
  `[og] wrote public/og/${CARD.output} — ${result.width}x${result.height}, ${Math.round(result.size / 1024)} KB`,
);
