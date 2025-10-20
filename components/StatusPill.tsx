import React from "react";
import { TaskStatus } from "../types";
import { CheckCircle, Clock, XCircle, Coffee, MapPin } from "lucide-react";

interface StatusPillProps {
  status: TaskStatus;
}

const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const getStatusInfo = () => {
    switch (status) {
      case TaskStatus.Completed:
        return {
          icon: <CheckCircle size={16} />,
          text: "Completed",
          className: "text-green-800 bg-green-100",
        };
      case TaskStatus.InProgress:
        return {
          icon: <Clock size={16} />,
          text: "In Progress",
          className: "text-yellow-800 bg-yellow-100",
        };
      case TaskStatus.Delayed:
        return {
          icon: <XCircle size={16} />,
          text: "Delayed",
          className: "text-red-800 bg-red-100",
        };
      case TaskStatus.JobSiteReady:
        return {
          icon: <MapPin size={16} />,
          text: "Site Ready",
          className: "text-blue-700 bg-blue-100",
        };
      default:
        return {
          icon: <Coffee size={16} />,
          text: "Not Started",
          className: "text-slate-700 bg-slate-200",
        };
    }
  };

  const { icon, text, className } = getStatusInfo();

  return (
    <div
      className={`flex items-center justify-center gap-2 px-3 py-1 rounded-full ${className}`}
    >
      {icon}
      <span className="font-medium text-sm">{text}</span>
    </div>
  );
};

export default StatusPill;
