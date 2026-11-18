import { Pool } from "pg";
import { createApi } from "./api";

const globalDb = globalThis as unknown as { crmPool?: Pool; crmApi?: ReturnType<typeof createApi> };
export function handleRequest(request: Request) {
  if (!process.env.DATABASE_URL) return Response.json({ error: "Banco não configurado. Defina DATABASE_URL para conectar o PostgreSQL." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  globalDb.crmPool ||= new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
  globalDb.crmApi ||= createApi(globalDb.crmPool);
  return globalDb.crmApi(request);
}
