import React, { useState, useEffect, useRef } from "react";
import type { Task, Trade } from "../types";
import { TaskStatus } from "../types";
import StatusPill from "./StatusPill";
import { User, Phone, MoreVertical, Edit, ClipboardCheck } from "lucide-react";

interface TaskCardProps {
  task: Task;
  trade: Trade;
  onUpdateTask: (update: Partial<Task>) => void;
  onEditTask?: () => void; // Make optional
  hideContactInfo?: boolean;
}

const getStatusColorClass = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.Completed:
      return "border-green-500";
    case TaskStatus.InProgress:
      return "border-yellow-500";
    case TaskStatus.Delayed:
      return "border-red-500";
    case TaskStatus.JobSiteReady:
      return "border-blue-500";
    default:
      return "border-slate-300";
  }
};

const getProgressBarColor = (status: TaskStatus): string => {
  switch (status) {
    case TaskStatus.Completed:
      return "bg-green-500";
    case TaskStatus.InProgress:
      return "bg-yellow-500";
    case TaskStatus.Delayed:
      return "bg-red-500";
    case TaskStatus.JobSiteReady:
      return "bg-blue-500";
    default:
      return "bg-slate-400";
  }
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  trade,
  onUpdateTask,
  onEditTask,
  hideContactInfo = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleStatusChange = (newStatus: TaskStatus) => {
    const update: Partial<Task> = { status: newStatus };
    if (newStatus === TaskStatus.Completed) update.progress = 100;
    if (newStatus === TaskStatus.NotStarted) update.progress = 0;
    onUpdateTask(update);
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const progress = task.progress || 0;

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-sm border ${getStatusColorClass(
        task.status
      )} flex flex-col gap-4 task-card-container`}
    >
      {/* Top Section: Info and Menu */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {task.isInspection && (
              <span title="Inspection Task">
                <ClipboardCheck className="h-5 w-5 text-indigo-600 flex-shrink-0" />
              </span>
            )}
            <p className="font-bold text-lg text-slate-800">{trade.name}</p>
          </div>
          {!hideContactInfo && (
            <div className="text-sm text-slate-500 mt-1 flex items-center flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5">
                <User size={14} />
                <span>{trade.contact}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone size={14} />
                <span>{trade.phone}</span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="w-40">
            <StatusPill status={task.status} />
          </div>
          {onEditTask && (
            <div className="relative task-card-menu-button" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen((o) => !o)}
                className="p-2 rounded-full hover:bg-slate-200 transition-colors"
              >
                <MoreVertical size={20} />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-slate-200">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onEditTask();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <Edit size={14} /> Edit Task
                    </button>
                    <div className="my-1 border-t border-slate-100"></div>
                    {(
                      Object.values(TaskStatus) as Array<
                        keyof typeof TaskStatus
                      >
                    ).map((statusKey) => (
                      <button
                        key={statusKey}
                        onClick={() =>
                          handleStatusChange(TaskStatus[statusKey])
                        }
                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                      >
                        {TaskStatus[statusKey]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Progress and Notes */}
      <div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div
            className={`${getProgressBarColor(
              task.status
            )} h-2.5 rounded-full transition-all duration-500`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-slate-500">Progress</p>
          <p className="text-xs font-semibold text-slate-600">{progress}%</p>
        </div>

        {task.notes && (
          <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100 whitespace-pre-wrap">
            Notes: {task.notes}
          </p>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
