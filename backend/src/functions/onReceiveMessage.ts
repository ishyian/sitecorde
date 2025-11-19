import * as functions from "firebase-functions";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Note: Signature validation disabled per request. We keep only parsing and writing.

// Frontend TaskStatus enum string values for consistency
const TaskStatus = {
  Completed: "Completed",
  InProgress: "In Progress",
  Delayed: "Delayed",
  NotStarted: "Not Started",
  JobSiteReady: "Job Site Ready",
} as const;

type ParsedMessage = {
  status: keyof typeof TaskStatus | null; // keys of TaskStatus map
  task: string | null;
  where: string | null; // address
};

function normalizeText(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

// Parse messages like: "finished with plumbing at 92 turtleback road"
function parseMessage(body: string): ParsedMessage {
  const normalized = normalizeText(body);
  const lowered = normalized.toLowerCase();

  const statusWords = [
    "finished",
    "complete",
    "completed",
    "done",
    "started",
    "begin",
    "began",
    "paused",
    "resumed",
    "blocked",
    "delayed",
    "in-progress",
  ];

  const statusAlt = statusWords
    .map((w) => w.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&"))
    .join("|");
  const re = new RegExp(
    `^(?<status>${statusAlt})(?:\\s+with)?\\s+(?<task>.+?)\\s+(?:at|@)\\s+(?<where>.+)$`,
    "i"
  );

  const m = re.exec(normalized);
  let statusKey: ParsedMessage["status"] = null;
  if (m && m.groups) {
      const s = m.groups.status.toLowerCase();
    // Map to TaskStatus keys
    const map: Record<string, ParsedMessage["status"]> = {
      finished: "Completed",
      complete: "Completed",
      completed: "Completed",
      done: "Completed",
      started: "InProgress",
      begin: "InProgress",
      began: "InProgress",
      paused: "Delayed",
      delayed: "Delayed",
      blocked: "Delayed",
      resumed: "InProgress",
      "in-progress": "InProgress",
    };
    statusKey = map[s] ?? null;
    return {
      status: statusKey,
      task: m.groups.task.trim(),
      where: m.groups.where.trim(),
    };
  }

  // Fallback: try to detect just status
  const found = statusWords.find((w) => lowered.includes(w));
  if (found) {
    const map: Record<string, ParsedMessage["status"]> = {
      finished: "Completed",
      complete: "Completed",
      completed: "Completed",
      done: "Completed",
      started: "InProgress",
      begin: "InProgress",
      began: "InProgress",
      paused: "Delayed",
      delayed: "Delayed",
      blocked: "Delayed",
      resumed: "InProgress",
      "in-progress": "InProgress",
    };
    return { status: map[found] ?? null, task: null, where: null };
  }
  return { status: null, task: null, where: null };
}

// Try to find a project by address. We do a simple contains/equals match, case-insensitive.
async function findProjectIdByAddress(address: string | null): Promise<string | null> {
  if (!address) return null;
  const addrNorm = normalizeText(address).toLowerCase();
  const db = getFirestore();
  const snap = await db.collection("projects").get();
  for (const doc of snap.docs) {
    const data = doc.data() as { address?: string };
    if (!data?.address) continue;
    const projectAddr = normalizeText(String(data.address)).toLowerCase();
    if (projectAddr === addrNorm || projectAddr.includes(addrNorm) || addrNorm.includes(projectAddr)) {
      return doc.id;
    }
  }
  return null;
}

// Normalize a phone number to digits-only for comparison
function normalizePhone(num: string): string {
  return String(num || "").replace(/\D+/g, "");
}

// Try to find a Trade by phone number (match by last digits to tolerate country codes)
async function findTradeIdByPhone(phone: string): Promise<string | null> {
  const fromDigits = normalizePhone(phone);
  if (!fromDigits) return null;
  const db = getFirestore();
  const snap = await db.collection("trades").get();
  let bestMatch: { id: string; len: number } | null = null;
  for (const d of snap.docs) {
    const data = d.data() as { phone?: string };
    if (!data?.phone) continue;
    const tradeDigits = normalizePhone(data.phone);
    if (!tradeDigits) continue;
    // Compare by suffix so +1 / country codes don't break match
    if (fromDigits.endsWith(tradeDigits)) {
      const len = tradeDigits.length;
      if (!bestMatch || len > bestMatch.len) {
        bestMatch = { id: d.id, len };
      }
    }
  }
  return bestMatch?.id ?? null;
}

export const onReceiveMessage = functions.https.onRequest(
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const params = req.body || {};

      const from = String(params.From || "");
      const body = String(params.Body || "");

      const parsed = parseMessage(body);

      // Find project by address
      const projectId = await findProjectIdByAddress(parsed.where);

      const db = getFirestore();

      // If we found a project, add the task into its tasks subcollection so it appears on dashboard
      if (projectId) {
        const today = new Date();
        const ymd = today.toISOString().slice(0, 10); // YYYY-MM-DD

        const taskCol = db.collection("projects").doc(projectId).collection("tasks");
        // Attempt to resolve trade by sender phone number
        const resolvedTradeId = await findTradeIdByPhone(from);
        await taskCol.add({
          projectId,
          tradeId: resolvedTradeId ?? "unassigned",
          status: parsed.status ? TaskStatus[parsed.status] : TaskStatus.InProgress,
          dependency: null,
          notes: parsed.task ? `${parsed.task}${parsed.where ? ` @ ${parsed.where}` : ""}` : body,
          startDate: ymd,
          endDate: ymd,
          progress: parsed.status === "Completed" ? 100 : 0,
          _source: "sms", // non-breaking additional metadata
          _from: from,
          _createdAt: FieldValue.serverTimestamp(),
        });
      } else {
        // If no project matched, still record the inbound message for later triage
        await db.collection("inboundMessages").add({
          from,
          body,
          parsed,
          createdAt: FieldValue.serverTimestamp(),
          reason: "project_not_found",
        });
      }

      // No reply for now: just acknowledge receipt with 200 OK and empty body
      res.status(200).end();
    } catch (err) {
      console.error("onReceiveMessage error", err);
      res.status(500).send("Server error");
    }
  }
);
