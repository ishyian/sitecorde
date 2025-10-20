import React, { useState, useEffect, useRef } from "react";
import type {
  Project,
  Task,
  Trade,
  AITaskUpdate,
  ChangeRequest,
} from "../types";
import { TaskStatus } from "../types";
import AISimulator from "./AISimulator";
import TaskCard from "./TaskCard";
import TimelineView from "./TimelineView";
import TaskEditModal from "./TaskEditModal";
import NotificationPanel from "./NotificationPanel";
import ChangeRequestPanel from "./ChangeRequestPanel";
import ProjectProgressBar from "./ProjectProgressBar";
import { User, List, GanttChartSquare, Printer } from "lucide-react";

interface ProjectDashboardProps {
  project: Project;
  tasks: Task[];
  trades: Trade[];
  changeRequests: ChangeRequest[];
  onTaskUpdate: (
    projectId: string,
    taskId: string,
    update: Partial<Task> & Partial<AITaskUpdate>
  ) => void;
  onApproveRequest: (request: ChangeRequest) => void;
  onDenyRequest: (requestId: string, projectId: string) => void;
  isOffline: boolean;
}

type ViewMode = "list" | "timeline";

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  tasks,
  trades,
  changeRequests,
  onTaskUpdate,
  onApproveRequest,
  onDenyRequest,
  isOffline,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [rescheduledTaskIds, setRescheduledTaskIds] = useState<string[]>([]);
  const prevTasksRef = useRef<Task[] | undefined>(undefined);

  useEffect(() => {
    if (
      prevTasksRef.current &&
      prevTasksRef.current.length > 0 &&
      tasks.length > 0
    ) {
      const prevTasksMap = new Map(prevTasksRef.current.map((t) => [t.id, t]));
      const changedIds = tasks
        .filter((currentTask) => {
          const prevTask = prevTasksMap.get(currentTask.id);
          return (
            prevTask &&
            (currentTask.startDate !== prevTask.startDate ||
              currentTask.endDate !== prevTask.endDate)
          );
        })
        .map((t) => t.id);

      if (changedIds.length > 0) {
        setRescheduledTaskIds((ids) => [...new Set([...ids, ...changedIds])]);
      }
    }
    prevTasksRef.current = tasks;
  }, [tasks]);

  const sortedTasks = [...tasks].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      [TaskStatus.InProgress]: 1,
      [TaskStatus.Delayed]: 2,
      [TaskStatus.JobSiteReady]: 3,
      [TaskStatus.NotStarted]: 4,
      [TaskStatus.Completed]: 5,
    };
    return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
  });

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleUpdateAndClose = (update: Partial<Task>) => {
    if (editingTask) {
      onTaskUpdate(project.id, editingTask.id, update);
    }
    setEditingTask(null);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {project.name}
            </h1>
            <p className="text-slate-500 mt-1">{project.address}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2 bg-white p-3 rounded-lg shadow-sm border border-slate-200">
            <User className="text-slate-500" size={20} />
            <span className="font-medium text-slate-700">{project.client}</span>
          </div>
        </div>
        <ProjectProgressBar tasks={tasks} trades={trades} />
      </header>

      {changeRequests.length > 0 && (
        <div className="no-print">
          <ChangeRequestPanel
            requests={changeRequests}
            onApprove={onApproveRequest}
            onDeny={(requestId) => onDenyRequest(requestId, project.id)}
          />
        </div>
      )}

      <div className="no-print">
        <NotificationPanel
          tasks={tasks}
          trades={trades}
          rescheduledTaskIds={rescheduledTaskIds}
          onClearReschedules={() => setRescheduledTaskIds([])}
        />
      </div>

      <div className="no-print">
        <AISimulator
          project={project}
          trades={trades}
          tasks={tasks}
          onTaskUpdate={(taskId, update) =>
            onTaskUpdate(project.id, taskId, update)
          }
          isOffline={isOffline}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 flex justify-between items-center border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            Task Overview
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg no-print">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:bg-slate-200"
                }`}
              >
                <List size={16} /> List
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-sm font-semibold transition-colors ${
                  viewMode === "timeline"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:bg-slate-200"
                }`}
              >
                <GanttChartSquare size={16} /> Timeline
              </button>
            </div>
            <button
              onClick={() => window.print()}
              className="no-print flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
            >
              <Printer size={16} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="p-4 bg-slate-50/50 task-list-container">
            <div className="space-y-3">
              {sortedTasks.length > 0 ? (
                sortedTasks.map((task) => {
                  const trade = trades.find((t) => t.id === task.tradeId);
                  if (!trade) return null;
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      trade={trade}
                      onEditTask={() => handleEditTask(task)}
                      onUpdateTask={(update) =>
                        onTaskUpdate(project.id, task.id, update)
                      }
                    />
                  );
                })
              ) : (
                <p className="text-slate-500 text-center py-4">
                  No tasks found for this project.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="timeline-view-container">
            <TimelineView
              tasks={tasks}
              trades={trades}
              onSelectTask={handleEditTask}
            />
          </div>
        )}
      </div>

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          trade={trades.find((t) => t.id === editingTask.tradeId)!}
          allTasks={tasks}
          onClose={() => setEditingTask(null)}
          onUpdate={handleUpdateAndClose}
          onDelete={() => {
            console.log("Delete not implemented");
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

export default ProjectDashboard;
