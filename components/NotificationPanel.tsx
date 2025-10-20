import React, { useMemo } from "react";
import type { Task, Trade } from "../types";
import { TaskStatus } from "../types";
import {
  Bell,
  User,
  Calendar,
  AlertCircle,
  X,
  Truck,
  ListChecks,
  Search,
  ClipboardCheck,
} from "lucide-react";

interface NotificationPanelProps {
  tasks: Task[];
  trades: Trade[];
  rescheduledTaskIds: string[];
  onClearReschedules: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  tasks,
  trades,
  rescheduledTaskIds,
  onClearReschedules,
}) => {
  const {
    readyToStart,
    waitingOnMaterials,
    needsDailyUpdate,
    schedulingSuggestions,
  } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const completedTaskIds = new Set(
      tasks.filter((t) => t.status === TaskStatus.Completed).map((t) => t.id)
    );

    const upcomingTasks = tasks
      .filter((task) => {
        const taskStartDate = new Date(task.startDate);
        return (
          (task.status === TaskStatus.NotStarted ||
            task.status === TaskStatus.JobSiteReady) &&
          (!task.dependency || completedTaskIds.has(task.dependency)) &&
          taskStartDate >= today &&
          taskStartDate <= sevenDaysFromNow
        );
      })
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

    const readyToStart = upcomingTasks.filter(
      (t) => t.materialsDelivered || !t.materialTrackingLink
    );
    const waitingOnMaterials = upcomingTasks.filter(
      (t) => !t.materialsDelivered && t.materialTrackingLink
    );
    const needsDailyUpdate = tasks.filter(
      (t) => t.status === TaskStatus.InProgress
    );

    // Scheduling suggestions
    const suggestions = [];
    const majorTrades = [
      "Foundation",
      "Framing",
      "Electrical (Rough-in)",
      "Plumbing (Rough-in)",
    ];
    const tasksWithInspections = new Set(
      tasks
        .filter((t) => t.dependency && t.isInspection)
        .map((t) => t.dependency)
    );

    for (const task of tasks) {
      const trade = trades.find((t) => t.id === task.tradeId);
      if (
        trade &&
        majorTrades.includes(trade.name) &&
        !tasksWithInspections.has(task.id)
      ) {
        suggestions.push(
          `Consider adding an inspection task after '${trade.name}'.`
        );
      }
    }

    return {
      readyToStart: readyToStart.slice(0, 1),
      waitingOnMaterials,
      needsDailyUpdate,
      schedulingSuggestions: [...new Set(suggestions)],
    };
  }, [tasks, trades]);

  const rescheduledTasks = useMemo(() => {
    return rescheduledTaskIds
      .map((id) => tasks.find((t) => t.id === id))
      .filter(Boolean) as Task[];
  }, [rescheduledTaskIds, tasks]);

  const hasNotifications =
    readyToStart.length > 0 ||
    rescheduledTasks.length > 0 ||
    waitingOnMaterials.length > 0 ||
    needsDailyUpdate.length > 0 ||
    schedulingSuggestions.length > 0;

  if (!hasNotifications) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 text-center">
        <Bell className="mx-auto h-8 w-8 text-green-500" />
        <h3 className="mt-2 text-lg font-semibold text-slate-800">
          All Clear!
        </h3>
        <p className="text-sm text-slate-500">
          No immediate notifications or alerts.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border-2 border-blue-200 border-dashed p-5 rounded-xl space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-slate-800">
          Notification Center (Simulation)
        </h3>
      </div>

      {rescheduledTasks.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <h4 className="text-md font-semibold text-orange-800">
                Reschedule Alerts
              </h4>
            </div>
            <button
              onClick={onClearReschedules}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 p-1 -mt-1 rounded hover:bg-slate-200"
            >
              <X size={14} /> Dismiss All
            </button>
          </div>
          <div className="space-y-2">
            {rescheduledTasks.map((task) => {
              const trade = trades.find((t) => t.id === task.tradeId);
              return (
                <div
                  key={task.id}
                  className="text-sm bg-white p-2 rounded border border-slate-200"
                >
                  <span className="font-semibold text-slate-700">
                    {trade?.name || "A task"}
                  </span>{" "}
                  has been moved. New start:{" "}
                  <span className="font-bold text-slate-800">
                    {new Date(task.startDate).toLocaleDateString()}
                  </span>
                  .
                </div>
              );
            })}
          </div>
        </div>
      )}

      {readyToStart.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200">
          <p className="font-bold text-blue-700">ALERT: UPCOMING TASK</p>
          <p className="text-sm text-slate-600 mb-3 mt-1">
            The following subcontractor is clear to start and would be notified.
          </p>
          {readyToStart.map((task) => {
            const trade = trades.find((t) => t.id === task.tradeId)!;
            const daysUntilStart = Math.ceil(
              (new Date(task.startDate).getTime() - new Date().getTime()) /
                (1000 * 3600 * 24)
            );
            const daysText =
              daysUntilStart <= 0
                ? "today"
                : daysUntilStart === 1
                ? "in 1 day"
                : `in ${daysUntilStart} days`;

            return (
              <div key={task.id}>
                <p className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  {task.isInspection && (
                    <ClipboardCheck size={18} className="text-indigo-600" />
                  )}{" "}
                  {trade.name}
                </p>
                <div className="text-sm text-slate-500 mt-2 flex items-center flex-wrap gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5" title="Contact">
                    <User size={14} />
                    <span>
                      {trade.contact} ({trade.phone})
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1.5"
                    title="Scheduled Start"
                  >
                    <Calendar size={14} />
                    <span className="font-medium">
                      {new Date(task.startDate).toLocaleDateString()} (
                      {daysText})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {needsDailyUpdate.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <ListChecks className="h-6 w-6 text-gray-600" />
            <h4 className="text-md font-semibold text-gray-800">
              Daily Updates Required
            </h4>
          </div>
          <div className="space-y-2">
            {needsDailyUpdate.map((task) => {
              const trade = trades.find((t) => t.id === task.tradeId);
              return (
                <div
                  key={task.id}
                  className="text-sm bg-white p-2 rounded border border-slate-200"
                >
                  Follow up with{" "}
                  <span className="font-semibold text-slate-700">
                    {trade?.name || "Unknown"}
                  </span>{" "}
                  for a daily progress report.
                </div>
              );
            })}
          </div>
        </div>
      )}

      {schedulingSuggestions.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Search className="h-6 w-6 text-indigo-600" />
            <h4 className="text-md font-semibold text-indigo-800">
              Scheduling Suggestions
            </h4>
          </div>
          <div className="space-y-2">
            {schedulingSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="text-sm bg-white p-2 rounded border border-slate-200"
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {waitingOnMaterials.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="h-6 w-6 text-yellow-600" />
            <h4 className="text-md font-semibold text-yellow-800">
              Waiting on Materials
            </h4>
          </div>
          <div className="space-y-2">
            {waitingOnMaterials.map((task) => {
              const trade = trades.find((t) => t.id === task.tradeId);
              return (
                <div
                  key={task.id}
                  className="text-sm bg-white p-2 rounded border border-slate-200"
                >
                  <span className="font-semibold text-slate-700">
                    {trade?.name || "Unknown"}
                  </span>{" "}
                  is scheduled to start soon but materials have not been marked
                  as delivered.
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
