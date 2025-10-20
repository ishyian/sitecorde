import React, { useState } from "react";
import { TaskStatus } from "../types";
import type { Task, Trade } from "../types";
import { X, ExternalLink } from "lucide-react";

interface TaskEditModalProps {
  task: Task;
  trade: Trade;
  allTasks: Task[];
  onClose: () => void;
  onUpdate: (update: Partial<Task>) => void;
  onDelete: () => void;
}

const TaskEditModal: React.FC<TaskEditModalProps> = ({
  task,
  trade,
  allTasks,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [formData, setFormData] = useState({
    status: task.status,
    notes: task.notes,
    startDate: task.startDate,
    endDate: task.endDate,
    materialTrackingLink: task.materialTrackingLink || "",
    materialsDelivered: task.materialsDelivered || false,
    isInspection: task.isInspection || false,
    progress: task.progress || 0,
  });
  const [error, setError] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "range" || type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value, 10) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    if (start > end) {
      setError("End date cannot be before the start date.");
      return;
    }

    const updateData = { ...formData };
    if (updateData.status === TaskStatus.Completed) updateData.progress = 100;

    onUpdate(updateData);
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Edit Task</h2>
            <p className="text-sm text-slate-500">{trade.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <fieldset>
              <legend className="text-base font-semibold text-slate-800 mb-2">
                Schedule
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    id="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    id="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-base font-semibold text-slate-800 mb-2">
                Status & Notes
              </legend>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Status
                  </label>
                  <select
                    name="status"
                    id="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.values(TaskStatus).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="progress"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Progress:{" "}
                    <span className="font-bold">{formData.progress}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    name="progress"
                    id="progress"
                    value={formData.progress}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    id="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-base font-semibold text-slate-800 mb-2">
                Logistics & Type
              </legend>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="materialTrackingLink"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Material Tracking Link
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="materialTrackingLink"
                      id="materialTrackingLink"
                      placeholder="https://provider.com/tracking/..."
                      value={formData.materialTrackingLink}
                      onChange={handleInputChange}
                      className="w-full border-slate-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.materialTrackingLink && (
                      <a
                        href={formData.materialTrackingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100"
                      >
                        <ExternalLink size={18} className="text-slate-500" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="materialsDelivered"
                    id="materialsDelivered"
                    checked={formData.materialsDelivered}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="materialsDelivered"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Materials have been delivered to site
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isInspection"
                    id="isInspection"
                    checked={formData.isInspection}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="isInspection"
                    className="block text-sm font-medium text-slate-700"
                  >
                    This task is an inspection
                  </label>
                </div>
              </div>
            </fieldset>
          </div>
          <div className="sticky bottom-0 bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 font-semibold hover:bg-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEditModal;
