import React, { useState, useRef, useEffect } from "react";
import {
  Building,
  ChevronDown,
  Check,
  PlusCircle,
  UserPlus,
  LogOut,
} from "lucide-react";
import type { Project, AppUser } from "../types";

interface SidebarProps {
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (project: Project) => void;
  users: AppUser[];
  viewingAsUser: AppUser | null;
  onSelectUserView: (user: AppUser | null) => void;
  onAddNewProject: () => void;
  onAddNewSubcontractor: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  projects,
  selectedProject,
  setSelectedProject,
  users,
  viewingAsUser,
  onSelectUserView,
  onAddNewProject,
  onAddNewSubcontractor,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const groupedUsers = users.reduce((acc, user) => {
    const role = user.role;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(user);
    return acc;
  }, {} as Record<string, AppUser[]>);

  const roleOrder: (keyof typeof groupedUsers)[] = [
    "Project Manager",
    "Subcontractor",
    "Customer",
    "Admin",
  ];
  const canManage =
    !viewingAsUser ||
    viewingAsUser.role === "Project Manager" ||
    viewingAsUser.role === "Admin";

  return (
    <aside className="bg-white lg:w-80 lg:min-h-screen lg:border-r border-slate-200 p-4 shrink-0 no-print flex flex-col">
      <div className="flex-1">
        <div className="flex items-center mb-6">
          <div className="bg-blue-600 p-2 rounded-lg mr-3">
            <Building className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SiteCoord AI</h1>
        </div>

        <div className="mb-4">
          <button
            onClick={onAddNewProject}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle size={18} />
            Create New Project
          </button>
          {canManage && (
            <button
              onClick={onAddNewSubcontractor}
              className="w-full flex items-center justify-center gap-2 p-2 mt-2 bg-white text-blue-600 font-semibold rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              <UserPlus size={18} />
              Add Subcontractor
            </button>
          )}
        </div>

        <div className="mb-4">
          <label className="text-xs text-slate-500 mb-1 font-semibold tracking-wide block">
            VIEWING AS
          </label>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen((o) => !o)}
              className="w-full text-left p-2.5 bg-slate-100 rounded-lg flex justify-between items-center hover:bg-slate-200 transition-colors"
              aria-haspopup="true"
              aria-expanded={isUserMenuOpen}
            >
              <span className="font-semibold text-slate-700">
                {viewingAsUser?.name ?? "All Projects"}
              </span>
              <ChevronDown
                className={`h-5 w-5 text-slate-500 transition-transform ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-full bg-white rounded-md shadow-lg z-20 border border-slate-200 py-1">
                <button
                  onClick={() => {
                    onSelectUserView(null);
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                >
                  All Projects
                  {!viewingAsUser && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </button>

                {roleOrder.map(
                  (role) =>
                    groupedUsers[role] && (
                      <div key={role}>
                        <div className="my-1 border-t border-slate-100"></div>
                        <h3 className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-400 uppercase">
                          {role}s
                        </h3>
                        {groupedUsers[role].map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              onSelectUserView(user);
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                          >
                            {user.name}
                            {viewingAsUser?.id === user.id && (
                              <Check size={16} className="text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )
                )}
                <div className="my-1 border-t border-slate-100"></div>
                <button
                  onClick={() => {
                    onLogout();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>

        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Projects
        </h2>
        <nav className="space-y-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
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
              No projects for this view.
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
