import { firebaseIdToken } from "./firebase-client";

export class RequestError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}
export async function api<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  // Uma falha de carregamento do SDK não impede o acesso legado por senha.
  const token = await firebaseIdToken();
  const response = await fetch(path, {
    method, credentials: "same-origin", cache: "no-store",
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(token ? { Authorization:"Bearer "+token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return undefined as T;
  const data = await response.json();
  if (!response.ok) throw new RequestError(data.error || "Não foi possível concluir a operação.", response.status);
  return data;
}
