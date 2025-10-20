import React, { useMemo } from "react";
import type { Project, Task, Trade, AppUser } from "../types";
import { TaskStatus } from "../types";
import ViewHeader from "./ViewHeader";
import TaskCard from "./TaskCard";
import { GanttChartSquare, ClipboardList, AlertTriangle } from "lucide-react";

interface SubcontractorViewProps {
  user: AppUser;
  projects: Project[];
  selectedProject: Project | null;
  onSelectProject: (project: Project) => void;
  tasksByProject: { [projectId: string]: Task[] };
  trades: Trade[];
  onTaskUpdate: (
    projectId: string,
    taskId: string,
    update: Partial<Task>
  ) => void;
  allUsers: AppUser[];
  onSelectUserView: (user: AppUser | null) => void;
}

const SubcontractorView: React.FC<SubcontractorViewProps> = (props) => {
  const {
    user,
    projects,
    selectedProject,
    onSelectProject,
    tasksByProject,
    trades,
    onTaskUpdate,
    allUsers,
    onSelectUserView,
  } = props;

  const visibleTasks = useMemo(() => {
    if (!selectedProject) return [];

    const projectTasks = tasksByProject[selectedProject.id] || [];
    const subcontractorTradeId = user.tradeId;

    return projectTasks
      .filter(
        (task) =>
          task.tradeId === subcontractorTradeId ||
          task.status === TaskStatus.Completed
      )
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
  }, [selectedProject, tasksByProject, user.tradeId]);

  return (
    <div className="bg-slate-100 min-h-screen w-full flex flex-col">
      <ViewHeader
        user={user}
        allUsers={allUsers}
        onSelectUserView={onSelectUserView}
      />

      <div className="flex-1 flex">
        {/* Left-side navigation for projects */}
        <aside className="bg-white w-72 border-r border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <GanttChartSquare size={16} /> Your Projects
          </h2>
          <nav className="space-y-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p)}
                className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                  selectedProject?.id === p.id
                    ? "bg-blue-100 text-blue-700 font-semibold"
                    : "hover:bg-slate-100"
                }`}
              >
                <p className="font-medium">{p.name}</p>
                <p
                  className={`text-xs ${
                    selectedProject?.id === p.id
                      ? "text-blue-600"
                      : "text-slate-500"
                  }`}
                >
                  {p.address}
                </p>
              </button>
            ))}
            {projects.length === 0 && (
              <div className="text-center py-4 px-2 text-sm text-slate-500">
                No projects assigned to you yet.
              </div>
            )}
          </nav>
        </aside>

        {/* Main content area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {selectedProject ? (
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {selectedProject.name}
              </h1>
              <p className="text-slate-500 mt-1 mb-6">
                {selectedProject.address}
              </p>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <ClipboardList size={20} /> Task List
                  </h3>
                </div>
                <div className="p-4 bg-slate-50/50">
                  <div className="space-y-3">
                    {visibleTasks.length > 0 ? (
                      visibleTasks.map((task) => {
                        const trade = trades.find((t) => t.id === task.tradeId);
                        if (!trade) return null;
                        const isOwner = task.tradeId === user.tradeId;
                        return (
                          <TaskCard
                            key={task.id}
                            task={task}
                            trade={trade}
                            onUpdateTask={(update) =>
                              onTaskUpdate(selectedProject.id, task.id, update)
                            }
                            onEditTask={
                              isOwner
                                ? () =>
                                    alert(
                                      "Editing not implemented in this view."
                                    )
                                : undefined
                            }
                            hideContactInfo={!isOwner}
                          />
                        );
                      })
                    ) : (
                      <p className="text-slate-500 text-center py-4">
                        No relevant tasks to display for this project.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-slate-400" />
                <h2 className="mt-4 text-xl font-medium text-slate-600">
                  {projects.length > 0
                    ? "Select a project to view tasks"
                    : "No Projects Found"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Please select a project from the list on the left.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SubcontractorView;
