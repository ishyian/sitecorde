
import * as functions from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import twilio from "twilio";

const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = defineSecret("TWILIO_AUTH_TOKEN");
const TWILIO_VERIFY_SID = defineSecret("TWILIO_VERIFY_SID");

function readTwilioSecrets() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifySid = process.env.TWILIO_VERIFY_SID;

    if (!accountSid || !authToken || !verifySid) {
        throw new functions.https.HttpsError(
            "failed-precondition",
            "Twilio secrets are missing. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SID via 'firebase functions:secrets:set'."
        );
    }
    return { accountSid, authToken, verifySid };
}

export const sendSmsVerification = functions.https.onCall({
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID],
}, async (request) => {
    try {
        const { accountSid, authToken, verifySid } = readTwilioSecrets();
        const twilioClient = twilio(accountSid, authToken);
        const phone: string | undefined = request?.data?.phone;
        const channel = "sms"

        if (!phone) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Parameter 'phone' is required."
            );
        }

        const result = await twilioClient.verify.v2
            .services(verifySid)
            .verifications.create({ to: phone, channel });

        return { sid: result.sid, status: result.status };
    } catch (err: unknown) {
        const { code, message } = toErrorInfo(err);
        throw new functions.https.HttpsError("internal", message, { code });
    }
});

// Verifies an incoming code for a given phone number using Twilio Verify
export const verifySmsCode = functions.https.onCall({
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID],
}, async (request) => {
    try {
        const { accountSid, authToken, verifySid } = readTwilioSecrets();
        const twilioClient = twilio(accountSid, authToken);
        const phone: string | undefined = request?.data?.phone;
        const code: string | undefined = request?.data?.code;

        if (!phone || !code) {
            throw new functions.https.HttpsError(
                "invalid-argument",
                "Parameters 'phone' and 'code' are required."
            );
        }

        const check = await twilioClient.verify.v2
            .services(verifySid)
            .verificationChecks.create({ to: phone, code });

        const isValid = check.status === "approved";
        return { valid: isValid, status: check.status };
    } catch (err: unknown) {
        const { code, message } = toErrorInfo(err);
        const errorCode: functions.https.FunctionsErrorCode =
            code === "20404" ? "failed-precondition" : "internal";
        throw new functions.https.HttpsError(errorCode, message, { code });
    }
});

function toErrorInfo(e: unknown): { code: string; message: string } {
    const message = e instanceof Error ? e.message : "Unexpected error";
    let code = "unknown";
    if (typeof e === "object" && e !== null && "code" in e) {
        // Twilio errors often carry numeric codes; normalize to string
        const v = (e as { code?: unknown }).code;
        if (typeof v === "string" || typeof v === "number") code = String(v);
    }
    return { code, message };
}