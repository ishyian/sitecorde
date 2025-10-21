import { auth } from "firebase-admin";
import { beforeUserCreated, HttpsError } from "firebase-functions/identity";

export const onUserCreated = beforeUserCreated(async (event) => {
  const user = event.data;
  if (!user) {
    throw new HttpsError("invalid-argument", "No user data provided");
  }
  await auth().setCustomUserClaims(user.uid, { role: "Project Manager" });
});
