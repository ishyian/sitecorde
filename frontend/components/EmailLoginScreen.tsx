import React, { useState } from "react";
import { LogIn, ArrowLeft, Mail } from "lucide-react";
import { emailSignIn } from "../services/authService";

interface EmailLoginScreenProps {
  onBack: () => void;
  onGoToSignup: () => void;
}

const EmailLoginScreen: React.FC<EmailLoginScreenProps> = ({ onBack, onGoToSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await emailSignIn(email.trim(), password);
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="p-6 sm:p-8 bg-white shadow-xl rounded-2xl w-full max-w-md border border-slate-200 mx-4">
        <button onClick={onBack} className="flex items-center text-slate-600 hover:text-slate-800 mb-4">
          <ArrowLeft size={18} className="mr-1" /> Back
        </button>
        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center">
          <Mail className="mr-2" size={20} /> Log In
        </h2>
        <p className="text-slate-600 mb-6">Use your email and password to access your account.</p>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 text-sm border border-red-200">{error}</div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-60"
          >
            <LogIn size={18} /> {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={onGoToSignup} className="text-blue-600 hover:text-blue-700 font-medium">
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailLoginScreen;
