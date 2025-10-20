import React from "react";
import type { Project, Task, Trade, AppUser } from "../types";
import ViewHeader from "./ViewHeader";
import ProjectProgressBar from "./ProjectProgressBar";
import { User } from "lucide-react";

interface CustomerViewProps {
  user: AppUser;
  project: Project | null;
  tasks: Task[];
  trades: Trade[];
  allUsers: AppUser[];
  onSelectUserView: (user: AppUser | null) => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({
  user,
  project,
  tasks,
  trades,
  allUsers,
  onSelectUserView,
}) => {
  return (
    <div className="bg-slate-100 min-h-screen w-full">
      <ViewHeader
        user={user}
        allUsers={allUsers}
        onSelectUserView={onSelectUserView}
      />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto max-w-4xl">
          {project ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
              <header className="space-y-4 text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                  {project.name}
                </h1>
                <p className="text-slate-500 text-lg">{project.address}</p>
                <div className="inline-flex items-center gap-2 bg-slate-100 p-3 rounded-lg">
                  <User className="text-slate-500" size={20} />
                  <span className="font-medium text-slate-700">
                    Project for: {project.client}
                  </span>
                </div>
              </header>
              <ProjectProgressBar tasks={tasks} trades={trades} />
            </div>
          ) : (
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold text-slate-700">
                No Project Found
              </h2>
              <p className="text-slate-500 mt-2">
                There is no project associated with this customer account.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerView;
