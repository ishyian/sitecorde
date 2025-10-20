import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, X, RotateCcw } from "lucide-react";
import { ChatService } from "../services/chatService";

interface ChatWidgetProps {
  chatService: ChatService | null;
  isOffline: boolean;
}

interface Message {
  sender: "user" | "ai";
  text: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ chatService, isOffline }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isStreaming]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isStreaming || !chatService) return;

    const newUserMessage: Message = { sender: "user", text: inputValue };
    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsStreaming(true);

    try {
      // Add a placeholder for the AI response
      setMessages((prev) => [...prev, { sender: "ai", text: "" }]);
      const stream = await chatService.sendMessage(newUserMessage.text);
      let fullResponse = "";

      for await (const chunk of stream) {
        fullResponse += chunk.text;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = fullResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage =
        "Sorry, I encountered an error. Please check the console for details or try again.";
      setMessages((prev) => {
        const newMessages = [...prev];
        // If the last message is an empty AI placeholder, update it. Otherwise, add a new one.
        if (
          newMessages.length > 0 &&
          newMessages[newMessages.length - 1].sender === "ai" &&
          newMessages[newMessages.length - 1].text === ""
        ) {
          newMessages[newMessages.length - 1].text = errorMessage;
        } else {
          newMessages.push({ sender: "ai", text: errorMessage });
        }
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleResetChat = () => {
    if (chatService) {
      chatService.resetChat();
    }
    setMessages([]);
  };

  if (isOffline || !chatService) {
    return null;
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="no-print fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform hover:scale-110 z-40"
        aria-label="Open AI Chat Assistant"
      >
        <MessageCircle size={28} />
      </button>
    );
  }

  return (
    <div
      className="no-print fixed bottom-6 right-6 h-[75vh] w-[90vw] max-w-md max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-slate-200 z-50 transition-all duration-300 ease-out"
      role="dialog"
      aria-modal="true"
    >
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl flex-shrink-0">
        <h3 className="font-bold text-lg text-slate-800">
          SiteCoord AI Assistant
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetChat}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            aria-label="Reset Chat"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 h-full flex flex-col justify-center items-center">
            <MessageCircle size={40} className="mb-4 text-slate-400" />
            <p className="text-lg font-semibold">Welcome!</p>
            <p>Ask me about project status, tasks, or suggestions.</p>
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.sender === "ai" && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                AI
              </div>
            )}
            <div
              className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl shadow-sm ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-white text-slate-800 rounded-bl-none border border-slate-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">
                {msg.text}
                {isStreaming && index === messages.length - 1 && (
                  <span className="inline-block w-2 h-4 bg-slate-600 animate-pulse ml-1" />
                )}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Ask anything..."
            className="w-full pl-4 pr-12 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            disabled={isStreaming}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isStreaming}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
