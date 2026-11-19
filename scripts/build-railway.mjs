import { build, transform } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { brotliCompressSync, constants } from "node:zlib";

const common = { absWorkingDir: process.cwd(), tsconfig: resolve("tsconfig.json") };

await mkdir("dist", { recursive: true });
const client = await build({
  ...common,
  entryPoints: [resolve("src/railway/client.tsx")],
  bundle: true,
  write: false,
  minify: true,
  platform: "browser",
  target: "es2020",
  jsx: "automatic",
  alias: {
    "react-dom/client": "preact/compat/client",
    "react-dom": "preact/compat",
    "react/jsx-runtime": "preact/jsx-runtime",
    "react/jsx-dev-runtime": "preact/jsx-dev-runtime",
    react: "preact/compat",
  },
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "none",
});
const js = client.outputFiles[0].text;
const css = (await transform(await readFile("src/app/crm.css", "utf8"), { loader: "css", minify: true })).code;
const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0a2342"/><stop offset="52%" stop-color="#154776"/><stop offset="100%" stop-color="#e3a857"/></linearGradient><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#16839b"/><stop offset="50%" stop-color="#0d5b8e"/><stop offset="100%" stop-color="#071f3b"/></linearGradient></defs><rect width="1600" height="900" fill="url(#sky)"/><circle cx="1290" cy="245" r="145" fill="#f7cf78" opacity=".32"/><path d="M840 455c140-68 295-92 460-42 98 30 198 32 300 12v115H840Z" fill="#0d3156" opacity=".78"/><path d="M520 495c165-82 355-95 545-28 180 62 365 44 535-10v110H520Z" fill="#092544"/><rect y="510" width="1600" height="390" fill="url(#sea)"/><path d="M0 370c175 28 335 96 470 195L325 900H0Z" fill="#102b49"/><path d="M920 610h260M1040 665h340M860 725h290" stroke="#f7cf78" stroke-width="2" stroke-linecap="round" opacity=".35"/><path d="M1170 578l42 0-10 14h-24ZM1191 552v26" stroke="#f8e3b4" stroke-width="2.5" fill="none"/><path d="M1345 628l52 0-12 16h-28ZM1371 595v33" stroke="#f8e3b4" stroke-width="2.5" fill="none"/></svg>`;
const pavilionSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#10365f"/><stop offset="60%" stop-color="#157993"/><stop offset="100%" stop-color="#d7c29e"/></linearGradient></defs><rect width="1200" height="675" fill="url(#bg)"/><circle cx="960" cy="160" r="95" fill="#f9d98c" opacity=".38"/><path d="M0 390c220-48 450-35 690 18 190 42 360 32 510-12v279H0Z" fill="#0c4d78"/><path d="M0 490h1200v185H0Z" fill="#efe6d5"/><rect x="70" y="65" width="1060" height="445" rx="14" fill="none" stroke="#8a5a36" stroke-width="18" opacity=".55"/><path d="M70 130h1060" stroke="#8a5a36" stroke-width="10" opacity=".45"/><rect x="290" y="455" width="620" height="36" rx="6" fill="#9c6b43"/><rect x="360" y="491" width="24" height="120" fill="#7c5231"/><rect x="816" y="491" width="24" height="120" fill="#7c5231"/></svg>`;
const version = createHash("sha256").update(js + css).digest("hex").slice(0, 12);
const compress = value => brotliCompressSync(Buffer.from(value), { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).toString("base64");
const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Portal digital e CRM profissional para organização de contatos, funil de oportunidades em reais, tarefas prioritárias e relatórios executivos."><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#0b2545"><title>Trabalho &amp; Renda | Portal de Oportunidades e Gestão CRM</title><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='10' fill='%230b2545'/%3E%3Cpath d='M9 27c4.5-3 9-3 13 0s8.5 3 9 0' fill='none' stroke='%23f5ca69' stroke-width='2.6' stroke-linecap='round'/%3E%3Ccircle cx='15' cy='15' r='4' fill='none' stroke='%23f5ca69' stroke-width='2.4'/%3E%3Cpath d='M20 20 29 11M22 11h7v7' fill='none' stroke='%23f5ca69' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"><link rel="stylesheet" href="/assets/app-${version}.css"></head><body><div id="root"></div><script type="module" src="/assets/app-${version}.js"></script></body></html>`;
const server = await build({
  ...common,
  entryPoints: [resolve("src/railway/server.ts")],
  bundle: true,
  write: false,
  minify: true,
  platform: "node",
  format: "esm",
  target: "es2022",
  packages: "external",
  define: {
    __HTML__: JSON.stringify(html),
    __JS_BR__: JSON.stringify(compress(js)),
    __CSS_BR__: JSON.stringify(compress(css)),
    __HERO_SVG_BR__: JSON.stringify(compress(heroSvg)),
    __PAVILION_SVG_BR__: JSON.stringify(compress(pavilionSvg)),
    __ASSET_VERSION__: JSON.stringify(version),
  },
  legalComments: "none",
});
const code = server.outputFiles[0].text
  .replaceAll('from"pg"', 'from"pg@8.23.1"')
  .replaceAll('from"zod"', 'from"zod@4.6.7"')
  .replaceAll('from"jose"', 'from"jose@6.2.17"');
if (Buffer.byteLength(code) > 96 * 1024) throw new Error("Pacote excede o limite de 96 KB do Railway Functions.");
await writeFile("dist/railway-function.ts", code);
await writeFile("dist/index.html", html);
await writeFile("dist/app.js", js);
await writeFile("dist/app.css", css);
console.log(`Railway Function gerada: ${Buffer.byteLength(code)} bytes; assets ${version}.`);
