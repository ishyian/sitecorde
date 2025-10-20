import { GoogleGenAI, Type } from "@google/genai";
import type { Project, Trade, AITaskUpdate, TaskStatus } from "../types";

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set for Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    tradeId: {
      type: Type.STRING,
      description: "The unique ID of the trade this message is about.",
    },
    status: {
      type: Type.STRING,
      description:
        "The new status of the task. Must be one of the allowed values.",
      enum: [
        "Completed",
        "In Progress",
        "Delayed",
        "Not Started",
        "Job Site Ready",
      ],
    },
    notes: {
      type: Type.STRING,
      description:
        'Any relevant notes or comments extracted from the message, prefixed with "Updated via AI: ".',
    },
    delayDurationInDays: {
      type: Type.INTEGER,
      description:
        'If the status is "Delayed" and a duration is mentioned (e.g., "a week", "3 days"), this is the duration in days. A week is 7 days. Omit if no duration is mentioned.',
    },
    delayReason: {
      type: Type.STRING,
      description:
        'If the status is "Delayed", provide a concise, one-sentence summary of the reason for the delay (e.g., "Waiting on material delivery", "Weather issues"). Omit if no reason is given.',
    },
    progress: {
      type: Type.INTEGER,
      description:
        'An integer between 0 and 100 representing the task completion percentage. If the message says "done" or "complete", use 100. If it says "halfway" or "50%", use 50. Infer from context. If a task is starting, use 5. If status is Not Started, use 0.',
    },
  },
  required: ["tradeId", "status"],
};

export const parseSubcontractorMessage = async (
  message: string,
  project: Project,
  trades: Trade[]
): Promise<AITaskUpdate> => {
  const tradeInfo = trades
    .map((t) => ({ id: t.id, name: t.name, contact: t.contact }))
    .join(", ");

  const systemInstruction = `You are an intelligent assistant for a construction project manager. Your job is to parse text messages from subcontractors and extract structured data to update a project timeline.
The message is about the project: "${project.name}" at "${project.address}".
Here is the list of trades on this project, with their IDs and names: ${JSON.stringify(
    tradeInfo
  )}.
Your task is to identify the correct trade and match it to its ID.
Also determine the new status. Valid statuses are: "Completed", "In Progress", "Delayed", "Not Started", "Job Site Ready".
Also extract the task's progress as a percentage from 0 to 100. If the message says "complete" or "done", progress is 100. "Started" is 5. "Halfway" is 50. Infer otherwise.
If the status is "Delayed", you MUST extract the duration in days (a 'week' is 7 days) and a CONCISE summary of the reason.
Also, extract any useful comments into the notes field, prefixed with "Updated via AI: ".
This includes updates about inspections passing or failing.
Respond ONLY with a JSON object matching the provided schema.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Parse this message: "${message}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const parsedJson = JSON.parse(jsonText) as AITaskUpdate;

    if (!parsedJson.tradeId || !parsedJson.status) {
      throw new Error(
        "AI response was missing required fields (tradeId, status)."
      );
    }

    if (!trades.some((t) => t.id === parsedJson.tradeId)) {
      throw new Error(
        `AI identified an invalid tradeId: ${parsedJson.tradeId}`
      );
    }

    return parsedJson;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error(
      "The AI could not understand the message. Please try rephrasing it to be more specific about the trade name and their status (e.g., 'start', 'done', '50% complete', 'delay by 5 days due to weather')."
    );
  }
};
