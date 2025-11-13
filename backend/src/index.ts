import { getApps, initializeApp } from "firebase-admin/app";

if (!getApps().length) {
  initializeApp({
    projectId: process.env.PROJECT_ID!,
  });
}



export { onUserCreated } from "./functions/onUserCreated";
export { sendSmsVerification } from "./functions/verification";
export { verifySmsCode } from "./functions/verification";


