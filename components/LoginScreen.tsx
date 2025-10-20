import React from "react";
import { Building, LogIn, HardHat } from "lucide-react";

interface LoginScreenProps {
  onEnterDemo?: () => void;
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onEnterDemo, onLogin }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100">
      <div className="text-center p-8 sm:p-12 bg-white shadow-xl rounded-2xl max-w-md w-full border border-slate-200 mx-4">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-lg mr-4">
            <Building className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">SiteCoord AI</h1>
        </div>
        <p className="text-slate-600 mb-8 text-lg">
          Your AI-powered construction project management dashboard.
        </p>
        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-2 p-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
        >
          <LogIn size={18} />
          Log In or Sign Up
        </button>
        {onEnterDemo && (
          <>
            <div className="my-6 flex items-center">
              <div className="flex-grow border-t border-slate-300"></div>
              <span className="flex-shrink mx-4 text-slate-500 text-sm">
                OR
              </span>
              <div className="flex-grow border-t border-slate-300"></div>
            </div>
            <button
              onClick={onEnterDemo}
              className="w-full flex items-center justify-center gap-2 p-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all duration-200"
            >
              <HardHat size={18} />
              View Demo
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
