import { GoogleGenAI, Chat } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are "SiteCoord AI", a helpful and knowledgeable assistant for construction project management.
- Your goal is to provide concise, accurate, and actionable information to project managers, subcontractors, and customers.
- When asked about project status, refer to information you are given.
- When asked for suggestions (e.g., "what should I do next?", "who should I call?"), provide clear, step-by-step advice.
- You can generate reports, summarize progress, and identify potential risks or delays based on the data provided.
- Keep your tone professional, helpful, and optimistic.
- Do not make up information you don't have. If you don't know something, say so and suggest how the user could find the information.`;

/**
 * Manages a conversational chat session with the Gemini API.
 */
export class ChatService {
  private ai: GoogleGenAI;
  private chat: Chat | null = null;

  /**
   * @param apiKey The Google Gemini API key.
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("API_KEY for Gemini must be provided to ChatService.");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Initializes a new chat session with the predefined system instruction.
   * This is called automatically on the first message.
   */
  private initializeChat() {
    this.chat = this.ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  }

  /**
   * Sends a message to the chat and returns the streaming response.
   * @param message The user's message to send to the chat.
   * @returns An iterable stream of GenerateContentResponse chunks.
   */
  public async sendMessage(message: string) {
    if (!this.chat) {
      this.initializeChat();
    }

    if (this.chat) {
      const response = await this.chat.sendMessageStream({ message });
      return response;
    } else {
      // This should theoretically not be reached due to the initialization above.
      throw new Error("Chat could not be initialized.");
    }
  }

  /**
   * Resets the chat history.
   */
  public resetChat() {
    this.chat = null;
  }
}
