import { Pool } from "pg";
import { createApi } from "../server/api";
import { brotliDecompressSync } from "node:zlib";

declare const __HTML__: string;
declare const __JS_BR__: string;
declare const __CSS_BR__: string;
declare const __ASSET_VERSION__: string;
declare const Bun: { serve: (options: { port: number; hostname: string; fetch: (request: Request) => Promise<Response> }) => void };

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
pool.on("error", error => console.error("PostgreSQL connection:", error.name));
const api = createApi(pool);
const javascript = brotliDecompressSync(Buffer.from(__JS_BR__, "base64")).toString("utf8");
const stylesheet = brotliDecompressSync(Buffer.from(__CSS_BR__, "base64")).toString("utf8");
const headers = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
};
async function handle(request: Request) {
  const path = new URL(request.url).pathname;
  if (path.startsWith("/api/")) {
    const response = process.env.DATABASE_URL ? await api(request) : Response.json({ error: "Banco não configurado. Defina DATABASE_URL no Railway." }, { status: 503 });
    for (const [key,value] of Object.entries(headers)) response.headers.set(key,value);
    return response;
  }
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Método não permitido",{ status: 405, headers });
  const assetHeaders = { ...headers, "Cache-Control": "public, max-age=31536000, immutable" };
  if (path === `/assets/app-${__ASSET_VERSION__}.js`) return new Response(request.method === "HEAD" ? null : javascript,{ headers: { ...assetHeaders, "Content-Type": "application/javascript; charset=utf-8" } });
  if (path === `/assets/app-${__ASSET_VERSION__}.css`) return new Response(request.method === "HEAD" ? null : stylesheet,{ headers: { ...assetHeaders, "Content-Type": "text/css; charset=utf-8" } });
  if (path === "/robots.txt") return new Response("User-agent: *\nDisallow: /\n",{ headers: { ...headers, "Content-Type": "text/plain" } });
  if (path !== "/") return new Response("Página não encontrada",{ status: 404, headers });
  return new Response(request.method === "HEAD" ? null : __HTML__,{ headers: { ...headers, "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
Bun.serve({ port: Number(process.env.PORT || 8080), hostname: "::", fetch: handle });
