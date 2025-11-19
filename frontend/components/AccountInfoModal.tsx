import React from "react";

interface AccountInfoModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  email: string;
  phone: string | null;
  onSavePhone: (phone: string) => void;
}

const AccountInfoModal: React.FC<AccountInfoModalProps> = ({ open, onClose, name, email, phone, onSavePhone }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold">Account Info</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 p-1 rounded"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-500">Name</div>
            <div className="font-medium text-slate-800">{name || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Email</div>
            <div className="font-medium text-slate-800">{email || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Phone</div>
            <PhoneEditor initialValue={phone || ""} onSave={onSavePhone} />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountInfoModal;

// Internal simple phone editor with Save action
const PhoneEditor: React.FC<{ initialValue: string; onSave: (phone: string) => void }> = ({ initialValue, onSave }) => {
  const [value, setValue] = React.useState<string>(initialValue);
  const [saving, setSaving] = React.useState(false);

  const handleSave = async () => {
    const v = value.trim();
    setSaving(true);
    try {
      await onSave(v);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="tel"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="+15551234567"
        className="flex-1 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={saving}
      />
      <button
        type="button"
        onClick={handleSave}
        className="px-3 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
};
