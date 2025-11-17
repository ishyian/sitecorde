import { getApps, initializeApp } from "firebase-admin/app";

if (!getApps().length) {
  // Let Firebase Admin SDK auto-detect credentials and project configuration
  // from the Cloud Functions environment. Supplying projectId explicitly can
  // break deployments when the env var isn't set, and may lead to ancillary
  // service initialization errors (e.g., Pub/Sub service identity generation).
  initializeApp();
}



export { onUserCreated } from "./functions/onUserCreated";
export { sendSmsVerification } from "./functions/verification";
export { verifySmsCode } from "./functions/verification";
export { onReceiveMessage } from "./functions/onReceiveMessage";


