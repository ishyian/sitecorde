import React, { useState } from "react";
import type { Project, Trade, Task, AITaskUpdate } from "../types";
import { parseSubcontractorMessage } from "../services/geminiService";
import { MessageSquare, Send } from "lucide-react";

interface AISimulatorProps {
  project: Project;
  trades: Trade[];
  tasks: Task[];
  onTaskUpdate: (taskId: string, update: AITaskUpdate) => void;
  isOffline: boolean;
}

const AISimulator: React.FC<AISimulatorProps> = ({
  project,
  trades,
  tasks,
  onTaskUpdate,
  isOffline,
}) => {
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleParseMessage = async () => {
    if (!message || isProcessing) return;

    if (isOffline) {
      setFeedback({
        type: "error",
        text: "AI Simulator is disabled in offline mode.",
      });
      setTimeout(() => setFeedback(null), 7000);
      return;
    }

    setIsProcessing(true);
    setFeedback(null);

    try {
      const result = await parseSubcontractorMessage(message, project, trades);

      const taskToUpdate = tasks.find((t) => t.tradeId === result.tradeId);

      if (taskToUpdate) {
        onTaskUpdate(taskToUpdate.id, result);

        const tradeName =
          trades.find((t) => t.id === result.tradeId)?.name || "Unknown Trade";
        let feedbackText;
        if (result.delayDurationInDays && result.status === "Delayed") {
          feedbackText = `Delay of ${result.delayDurationInDays} days for ${tradeName} detected. A change request has been created for your approval.`;
        } else {
          feedbackText = `Successfully updated ${tradeName} to "${result.status}".`;
          if (result.progress !== undefined)
            feedbackText += ` Progress set to ${result.progress}%.`;
        }
        setFeedback({ type: "success", text: feedbackText });
        setMessage("");
      } else {
        throw new Error(
          `Could not find a task associated with trade ID ${result.tradeId} in this project.`
        );
      }
    } catch (error: any) {
      setFeedback({
        type: "error",
        text: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setFeedback(null), 10000);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold mb-2 text-slate-800">
        AI Subcontractor Update (Simulation)
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        Simulate an SMS update. The AI parses it, updates status, progress, and
        creates change requests for delays.
        <br />
        Examples:{" "}
        <span className="font-mono bg-slate-100 p-1 rounded-md text-xs">
          Framing is 50% complete
        </span>{" "}
        or{" "}
        <span className="font-mono bg-slate-100 p-1 rounded-md text-xs">
          Plumbing is delayed by a week due to parts.
        </span>
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-grow">
          <MessageSquare
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleParseMessage()}
            placeholder="Enter simulated text message from a sub..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={isProcessing || isOffline}
          />
        </div>
        <button
          onClick={handleParseMessage}
          disabled={!message || isProcessing || isOffline}
          className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
        >
          {isProcessing ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <Send size={18} />
          )}
          <span>{isProcessing ? "Processing..." : "Process"}</span>
        </button>
      </div>
      {feedback && (
        <div
          className={`mt-3 text-sm p-3 rounded-lg ${
            feedback.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
};

export default AISimulator;
