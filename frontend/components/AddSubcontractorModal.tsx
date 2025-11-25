import React, { useState } from "react";
import { X, UserPlus } from "lucide-react";

interface AddSubcontractorModalProps {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    tradeType: string;
    phone: string;
    email: string;
  }) => void;
}

const AddSubcontractorModal: React.FC<AddSubcontractorModalProps> = ({
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !tradeType.trim() || !phone.trim() || !email.trim()) {
      setError("All fields are required.");
      return;
    }
    onCreate({ name, tradeType, phone, email });
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-sub-title"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md relative flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <h2
            id="add-sub-title"
            className="text-xl font-bold text-slate-800 flex items-center gap-2"
          >
            <UserPlus size={22} className="text-blue-600" />
            Add New Subcontractor
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {error && (
              <div
                className="bg-red-100 text-red-700 p-3 rounded-lg text-sm"
                role="alert"
              >
                {error}
              </div>
            )}

            <fieldset>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="tradeType"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Trade Type
                  </label>
                  <input
                    type="text"
                    name="tradeType"
                    id="tradeType"
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value)}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Plumbing, Electrical, etc."
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Subcontractor/Company Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Sparky Electric"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 555-123-4567"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., contact@sparky.com"
                    required
                  />
                </div>
              </div>
            </fieldset>
          </div>
          {/* Info label above action buttons */}
          <div className="px-6 pb-2">
            <p className="text-sm text-slate-700">
              Subcontractors should text to this phone number:
              <span className="block font-bold text-blue-700 mt-1">+1 844 748 9277</span>
            </p>
          </div>
          <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Add Subcontractor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddSubcontractorModal;
