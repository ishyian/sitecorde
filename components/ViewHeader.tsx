import React, { useState, useRef, useEffect } from "react";
import { Building, ChevronDown, Check } from "lucide-react";
import type { AppUser } from "../types";

interface ViewHeaderProps {
  user: AppUser;
  allUsers: AppUser[];
  onSelectUserView: (user: AppUser | null) => void;
}

const ViewHeader: React.FC<ViewHeaderProps> = ({
  user,
  allUsers,
  onSelectUserView,
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

  const groupedUsers = allUsers.reduce((acc, u) => {
    const role = u.role;
    if (!acc[role]) acc[role] = [];
    acc[role].push(u);
    return acc;
  }, {} as Record<string, AppUser[]>);

  const roleOrder: (keyof typeof groupedUsers)[] = [
    "Project Manager",
    "Subcontractor",
    "Customer",
    "Admin",
  ];

  return (
    <header className="bg-white shadow-sm p-4 border-b border-slate-200">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <div className="bg-blue-600 p-2 rounded-lg mr-3">
            <Building className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">SiteCoord AI</h1>
        </div>

        <div>
          <label className="text-xs text-slate-500 font-semibold tracking-wide block text-right mb-1">
            VIEWING AS
          </label>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen((o) => !o)}
              className="w-56 text-left p-2.5 bg-slate-100 rounded-lg flex justify-between items-center hover:bg-slate-200 transition-colors"
              aria-haspopup="true"
              aria-expanded={isUserMenuOpen}
            >
              <span className="font-semibold text-slate-700">{user.name}</span>
              <ChevronDown
                className={`h-5 w-5 text-slate-500 transition-transform ${
                  isUserMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isUserMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-20 border border-slate-200 py-1">
                <button
                  onClick={() => {
                    onSelectUserView(null);
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                >
                  All Projects
                </button>
                {roleOrder.map(
                  (role) =>
                    groupedUsers[role] && (
                      <div key={role}>
                        <div className="my-1 border-t border-slate-100"></div>
                        <h3 className="px-3 pt-2 pb-1 text-xs font-semibold text-slate-400 uppercase">
                          {role}s
                        </h3>
                        {groupedUsers[role].map((u) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              onSelectUserView(u);
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 flex items-center justify-between"
                          >
                            {u.name}
                            {user.id === u.id && (
                              <Check size={16} className="text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ViewHeader;
