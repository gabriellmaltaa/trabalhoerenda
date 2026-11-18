import { firebaseConfig, firestoreDatabase } from "../lib/firebase-config.ts";
import { createFirebaseApi } from "./firebase-api.ts";

export function createAppApi(legacy: (request: Request) => Response | Promise<Response>) {
  const firebase = createFirebaseApi({ projectId:firebaseConfig.projectId,databaseId:firestoreDatabase });
  return (request: Request) => request.headers.has("authorization") ? firebase(request) : legacy(request);
}
