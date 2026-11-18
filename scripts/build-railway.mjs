import { build, transform } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { brotliCompressSync, constants } from "node:zlib";

const common = { absWorkingDir: process.cwd(), tsconfig: resolve("tsconfig.json") };

await mkdir("dist",{ recursive:true });
const client = await build({ ...common, entryPoints:[resolve("src/railway/client.tsx")], bundle:true, write:false, minify:true, platform:"browser", target:"es2020", jsx:"automatic", alias:{ "react-dom/client":"preact/compat/client", "react-dom":"preact/compat", "react/jsx-runtime":"preact/jsx-runtime", "react/jsx-dev-runtime":"preact/jsx-dev-runtime", "react":"preact/compat" }, define:{ "process.env.NODE_ENV":'"production"' }, legalComments:"none" });
const js = client.outputFiles[0].text;
const css = (await transform(await readFile("src/app/crm.css","utf8"),{ loader:"css", minify:true })).code;
const version = createHash("sha256").update(js+css).digest("hex").slice(0,12);
const compress = value => brotliCompressSync(Buffer.from(value),{ params:{ [constants.BROTLI_PARAM_QUALITY]:11 } }).toString("base64");
const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Organize contatos, oportunidades e tarefas no CRM Trabalho e Renda."><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#142e25"><title>Trabalho e Renda | CRM</title><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='10' fill='%23247657'/%3E%3Cpath d='M12 28 28 12M12 12h16v16' fill='none' stroke='%23d6ee9f' stroke-width='3'/%3E%3C/svg%3E"><link rel="stylesheet" href="/assets/app-${version}.css"></head><body><div id="root"></div><script type="module" src="/assets/app-${version}.js"></script></body></html>`;
const server = await build({ ...common, entryPoints:[resolve("src/railway/server.ts")],bundle:true,write:false,minify:true,platform:"node",format:"esm",target:"es2022",packages:"external",define:{ __HTML__:JSON.stringify(html), __JS_BR__:JSON.stringify(compress(js)), __CSS_BR__:JSON.stringify(compress(css)), __ASSET_VERSION__:JSON.stringify(version) },legalComments:"none" });
const code = server.outputFiles[0].text.replaceAll('from"pg"','from"pg@8.23.1"').replaceAll('from"zod"','from"zod@4.6.7"');
if (Buffer.byteLength(code) > 96*1024) throw new Error("Pacote excede o limite de 96 KB do Railway Functions.");
await writeFile("dist/railway-function.ts",code);
await writeFile("dist/index.html",html);
await writeFile("dist/app.js",js);
await writeFile("dist/app.css",css);
console.log(`Railway Function gerada: ${Buffer.byteLength(code)} bytes; assets ${version}.`);
