import React, { useMemo } from "react";
import type { Task, Trade } from "../types";
import { TaskStatus } from "../types";
import { ClipboardCheck } from "lucide-react";

interface TimelineViewProps {
  tasks: Task[];
  trades: Trade[];
  onSelectTask: (task: Task) => void;
}

const getStatusClass = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.Completed:
      return "bg-green-400/70 border-green-600";
    case TaskStatus.InProgress:
      return "bg-yellow-400/70 border-yellow-600";
    case TaskStatus.Delayed:
      return "bg-red-400/70 border-red-600";
    case TaskStatus.JobSiteReady:
      return "bg-blue-400/70 border-blue-600";
    default:
      return "bg-slate-400/70 border-slate-600";
  }
};

const getProgressClass = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.Completed:
      return "bg-green-600";
    case TaskStatus.InProgress:
      return "bg-yellow-600";
    case TaskStatus.Delayed:
      return "bg-red-600";
    case TaskStatus.JobSiteReady:
      return "bg-blue-600";
    default:
      return "bg-slate-500";
  }
};

const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  trades,
  onSelectTask,
}) => {
  const { timelineStart, timelineEnd, totalDays, dateMarkers } = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date();
      const timelineStart = new Date(today);
      timelineStart.setDate(today.getDate() - 15);
      const timelineEnd = new Date(today);
      timelineEnd.setDate(today.getDate() + 15);
      return { timelineStart, timelineEnd, totalDays: 30, dateMarkers: [] };
    }

    const startDates = tasks.map((t) => new Date(t.startDate));
    const endDates = tasks.map((t) => new Date(t.endDate));

    const timelineStart = new Date(
      Math.min(...startDates.map((d) => d.getTime()))
    );
    timelineStart.setDate(timelineStart.getDate() - 2); // Add padding

    const timelineEnd = new Date(Math.max(...endDates.map((d) => d.getTime())));
    timelineEnd.setDate(timelineEnd.getDate() + 2); // Add padding

    const totalDays = Math.ceil(
      (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 3600 * 24)
    );

    const markers = [];
    for (let i = 0; i <= totalDays; i++) {
      const date = new Date(timelineStart);
      date.setDate(date.getDate() + i);
      markers.push(date);
    }

    return { timelineStart, timelineEnd, totalDays, dateMarkers: markers };
  }, [tasks]);

  const getDayOffset = (date: string) => {
    const taskDate = new Date(date);
    return Math.floor(
      (taskDate.getTime() - timelineStart.getTime()) / (1000 * 3600 * 24)
    );
  };

  if (tasks.length === 0) {
    return (
      <p className="text-slate-500 text-center p-8">
        No tasks with dates to display in timeline.
      </p>
    );
  }

  return (
    <div className="p-4 overflow-x-auto bg-slate-50/50">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `150px repeat(${totalDays}, minmax(40px, 1fr))`,
          gap: "1px",
        }}
      >
        {/* Header Row */}
        <div className="sticky left-0 bg-slate-100 z-20 p-2 font-semibold text-slate-600 text-sm border-b border-r border-slate-200">
          Trade
        </div>
        {dateMarkers.map((date, i) => (
          <div
            key={i}
            className="text-center p-2 border-b border-l border-slate-200"
          >
            <div className="text-xs text-slate-500">
              {date.toLocaleString("default", { month: "short" })}
            </div>
            <div className="font-semibold text-slate-700">{date.getDate()}</div>
          </div>
        ))}

        {/* Task Rows */}
        {tasks.map((task) => {
          const trade = trades.find((t) => t.id === task.tradeId);
          if (!trade) return null;

          const startOffset = getDayOffset(task.startDate);
          const duration = getDayOffset(task.endDate) - startOffset + 1;
          const progress = task.progress || 0;

          const inspectionStyle = task.isInspection
            ? {
                backgroundImage:
                  "repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)",
              }
            : {};

          return (
            <React.Fragment key={task.id}>
              <div
                className="sticky left-0 bg-white z-10 p-2 border-b border-r border-slate-200 font-medium text-slate-800 truncate flex items-center gap-2"
                title={trade.name}
              >
                {task.isInspection && (
                  <ClipboardCheck
                    size={14}
                    className="text-indigo-600 flex-shrink-0"
                  />
                )}
                <span className="truncate">{trade.name}</span>
              </div>
              <div
                className="col-span-full -ml-[151px]"
                style={{ gridColumn: `${startOffset + 2} / span ${duration}` }}
              >
                <button
                  onClick={() => onSelectTask(task)}
                  title={`${trade.name}: ${task.startDate} to ${task.endDate} (${progress}% complete)`}
                  className={`relative h-full w-full text-left text-white text-xs font-semibold rounded-md overflow-hidden transition-transform hover:scale-105 hover:z-20 border ${getStatusClass(
                    task.status
                  )}`}
                  style={inspectionStyle}
                >
                  <div
                    className={`absolute top-0 left-0 h-full rounded-l-md ${getProgressClass(
                      task.status
                    )}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                  <span className="relative z-10 p-2">{trade.name}</span>
                </button>
              </div>
              <div
                className="col-start-2"
                style={{ gridColumnEnd: totalDays + 2, display: "contents" }}
              >
                {Array.from({ length: totalDays }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 border-r border-b border-slate-200"
                  ></div>
                ))}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default TimelineView;
