// Genera los íconos PWA a public/icons/ desde un SVG con los colores del sistema
// "Forge". Reproducible: `pnpm pwa:icons`. Requiere `sharp` (devDependency).
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

// --- oklch -> sRGB hex (los tokens del sistema están en oklch) -----------------
function oklchToHex(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  const g = (v) => {
    const c = v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, Math.round(c * 255)));
  };
  return "#" + lin.map((v) => g(v).toString(16).padStart(2, "0")).join("");
}

const VOLT = oklchToHex(0.86, 0.19, 122); // --primary (dark)
const CARBON = oklchToHex(0.175, 0.004, 96); // --background (dark)
const INK = oklchToHex(0.2, 0.03, 122); // --primary-foreground (dark)

// Rayo "volt" centrado. viewBox 512; la zona segura maskable es el 80% central.
const bolt = (cx = 256, scale = 1) => {
  const p = [
    [292, 40],
    [140, 288],
    [236, 288],
    [220, 472],
    [372, 224],
    [276, 224],
  ]
    .map(([x, y]) => `${(x - 256) * scale + cx},${(y - 256) * scale + 256}`)
    .join(" ");
  return `<polygon points="${p}" fill="${INK}"/>`;
};

const svg = (maskable) => {
  const r = maskable ? 0 : 96;
  const s = maskable ? 0.78 : 1;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${r}" fill="${CARBON}"/>
  <circle cx="256" cy="256" r="${maskable ? 150 : 168}" fill="${VOLT}"/>
  ${bolt(256, s)}
</svg>`;
};

await mkdir(OUT, { recursive: true });
const jobs = [
  ["icon-192.png", svg(false), 192],
  ["icon-512.png", svg(false), 512],
  ["maskable-192.png", svg(true), 192],
  ["maskable-512.png", svg(true), 512],
  ["apple-icon.png", svg(false), 180],
];
for (const [name, source, size] of jobs) {
  await sharp(Buffer.from(source)).resize(size, size).png().toFile(join(OUT, name));
  console.log("✓", name, `${size}×${size}`);
}
// apple-icon también en src/app para el <link> automático de Next.
await sharp(Buffer.from(svg(false)))
  .resize(180, 180)
  .png()
  .toFile(join(OUT, "..", "..", "src", "app", "apple-icon.png"));
await writeFile(join(OUT, "..", "..", "src", "app", "icon.svg"), svg(false));
console.log("✓ src/app/apple-icon.png + src/app/icon.svg");
