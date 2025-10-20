import React from "react";
import type { ChangeRequest } from "../types";
import { AlertTriangle, Check, X } from "lucide-react";

interface ChangeRequestPanelProps {
  requests: ChangeRequest[];
  onApprove: (request: ChangeRequest) => void;
  onDeny: (requestId: string) => void;
}

const ChangeRequestPanel: React.FC<ChangeRequestPanelProps> = ({
  requests,
  onApprove,
  onDeny,
}) => {
  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 border-dashed p-5 rounded-xl space-y-4">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-6 w-6 text-yellow-600" />
        <h3 className="text-lg font-semibold text-slate-800">
          Pending Change Requests
        </h3>
      </div>
      <p className="text-sm text-slate-600">
        A subcontractor has reported a delay. Approve to automatically update
        the schedule for all dependent tasks.
      </p>

      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <p className="font-bold text-slate-800">{request.tradeName}</p>
              <p className="text-sm text-yellow-700 font-semibold mt-1">
                Requests a {request.proposedUpdate.delayDurationInDays}-day
                delay.
              </p>
              <p className="text-sm text-slate-600 mt-2 pt-2 border-t border-slate-100">
                <span className="font-semibold">Reason:</span>{" "}
                {request.proposedUpdate.delayReason ||
                  request.proposedUpdate.notes}
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <button
                onClick={() => onDeny(request.id)}
                className="px-3 py-2 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition-colors flex items-center gap-2"
                title="Deny Request"
              >
                <X size={16} /> Deny
              </button>
              <button
                onClick={() => onApprove(request)}
                className="px-3 py-2 rounded-lg bg-green-100 text-green-700 font-semibold hover:bg-green-200 transition-colors flex items-center gap-2"
                title="Approve and Reschedule"
              >
                <Check size={16} /> Approve
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangeRequestPanel;
