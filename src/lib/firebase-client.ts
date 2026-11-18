"use client";

import type { Auth, User as FirebaseUser } from "firebase/auth";
import type * as AppSdk from "firebase/app";
import type * as AuthSdk from "firebase/auth";
import { firebaseConfig } from "./firebase-config";

const sdkBase = "https://www.gstatic.com/firebasejs/13.4.0";
let loading: Promise<{ auth: Auth; sdk: typeof AuthSdk }> | undefined;
function firebase() {
  if (typeof window === "undefined") return Promise.reject(new Error("Firebase disponível apenas no navegador."));
  loading ||= (async () => {
    const [appSdk,authSdk] = await Promise.all([
      import(/* webpackIgnore: true */ sdkBase+"/firebase-app.js") as Promise<typeof AppSdk>,
      import(/* webpackIgnore: true */ sdkBase+"/firebase-auth.js") as Promise<typeof AuthSdk>,
    ]);
    const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
    const auth = authSdk.getAuth(app);
    await auth.authStateReady();
    return { auth,sdk:authSdk };
  })().catch(error => { loading = undefined; throw error; });
  return loading;
}
export async function googleSignIn(): Promise<FirebaseUser> {
  const { auth,sdk } = await firebase();
  const provider = new sdk.GoogleAuthProvider();
  provider.setCustomParameters({ prompt:"select_account" });
  try { return (await sdk.signInWithPopup(auth,provider)).user; }
  catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") throw new Error("O acesso Google foi cancelado. Tente novamente quando quiser.");
    if (code === "auth/popup-blocked") throw new Error("Permita a janela de login Google no navegador e tente novamente.");
    if (code === "auth/unauthorized-domain") throw new Error("Este endereço ainda não foi autorizado no Firebase Authentication.");
    throw new Error("Não foi possível entrar com Google. Confira a conexão e tente novamente.");
  }
}
export async function firebaseIdToken() {
  const runtime = await firebase().catch(() => null);
  return runtime?.auth.currentUser ? runtime.auth.currentUser.getIdToken() : null;
}
export async function firebaseSignOut() {
  if (!loading) return;
  const { auth,sdk } = await loading;
  await sdk.signOut(auth);
}
