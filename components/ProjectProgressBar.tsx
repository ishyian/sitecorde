import React, { useMemo } from "react";
import type { Task, Trade, ProjectMilestone } from "../types";
import { TaskStatus, MilestoneStatus } from "../types";
import {
  Layers,
  Home,
  Wrench,
  ShieldCheck,
  Wind,
  Paintbrush,
  Sparkles,
  Check,
} from "lucide-react";

interface ProjectProgressBarProps {
  tasks: Task[];
  trades: Trade[];
}

const MILESTONE_DEFINITIONS = [
  { name: "Foundation", icon: Layers, tradeNames: ["Foundation"] },
  { name: "Framing", icon: Home, tradeNames: ["Framing"] },
  {
    name: "Rough-ins",
    icon: Wrench,
    tradeNames: [
      "Plumbing (Rough-in)",
      "Electrical (Rough-in)",
      "HVAC (Rough-in)",
    ],
  },
  {
    name: "Inspections",
    icon: ShieldCheck,
    tradeNames: ["Municipal Inspector"],
  },
  { name: "Exterior", icon: Wind, tradeNames: ["Roofing"] },
  { name: "Interior", icon: Paintbrush, tradeNames: ["Drywall", "Painting"] },
  { name: "Final", icon: Sparkles, tradeNames: [] }, // Final is typically based on others being done
];

const getMilestones = (tasks: Task[], trades: Trade[]): ProjectMilestone[] => {
  if (!tasks || tasks.length === 0 || !trades || trades.length === 0) {
    return MILESTONE_DEFINITIONS.map((def) => ({
      name: def.name,
      icon: def.icon,
      status: MilestoneStatus.Incomplete,
    }));
  }

  const tradeIdToNameMap = new Map(trades.map((t) => [t.id, t.name]));

  const getTasksForMilestone = (tradeNames: string[]): Task[] => {
    return tasks.filter((task) => {
      const tradeName = tradeIdToNameMap.get(task.tradeId);
      return tradeName && tradeNames.includes(tradeName);
    });
  };

  let hasInProgress = false;

  const milestones: ProjectMilestone[] = MILESTONE_DEFINITIONS.map((def) => {
    const milestoneTasks = getTasksForMilestone(def.tradeNames);
    let status: MilestoneStatus = MilestoneStatus.Incomplete;

    if (milestoneTasks.length > 0) {
      const areAllComplete = milestoneTasks.every(
        (t) => t.status === TaskStatus.Completed
      );
      const isAnyInProgress = milestoneTasks.some(
        (t) =>
          t.status === TaskStatus.InProgress || t.status === TaskStatus.Delayed
      );

      if (areAllComplete) {
        status = MilestoneStatus.Completed;
      } else if (isAnyInProgress) {
        status = MilestoneStatus.InProgress;
        hasInProgress = true;
      }
    }
    return { name: def.name, icon: def.icon, status };
  });

  // Assign "Next" status
  if (!hasInProgress) {
    const firstIncompleteIndex = milestones.findIndex(
      (m) => m.status === MilestoneStatus.Incomplete
    );
    if (firstIncompleteIndex !== -1) {
      milestones[firstIncompleteIndex].status = MilestoneStatus.Next;
    } else {
      // All are complete, check if the "Final" milestone can be marked complete.
      const allBeforeFinalAreComplete = milestones
        .slice(0, -1)
        .every((m) => m.status === MilestoneStatus.Completed);
      if (allBeforeFinalAreComplete && milestones.length > 0) {
        milestones[milestones.length - 1].status = MilestoneStatus.Completed;
      }
    }
  }

  // Special case for 'Final' - if all others are complete, it's 'Next' or 'Completed'
  const finalMilestone = milestones[milestones.length - 1];
  if (finalMilestone && finalMilestone.status === MilestoneStatus.Incomplete) {
    const allOthersComplete = milestones
      .slice(0, -1)
      .every((m) => m.status === MilestoneStatus.Completed);
    if (allOthersComplete) {
      finalMilestone.status = MilestoneStatus.Next;
    }
  }

  return milestones;
};

const MilestoneStep: React.FC<{
  milestone: ProjectMilestone;
  isFirst: boolean;
  isLast: boolean;
}> = ({ milestone, isFirst, isLast }) => {
  const isCompleted = milestone.status === MilestoneStatus.Completed;
  const isInProgress =
    milestone.status === MilestoneStatus.InProgress ||
    milestone.status === MilestoneStatus.Next;

  const circleBaseClass =
    "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 z-10";
  const circleColorClass = isCompleted
    ? "bg-blue-600 text-white"
    : isInProgress
    ? "bg-blue-100 text-blue-600 ring-4 ring-blue-200"
    : "bg-slate-200 text-slate-500";
  const pulseClass =
    milestone.status === MilestoneStatus.InProgress ? "animate-pulse" : "";
  const Icon = milestone.icon;

  return (
    <div className="flex flex-col items-center flex-1">
      <div className={`${circleBaseClass} ${circleColorClass} ${pulseClass}`}>
        {isCompleted ? (
          <Check className="w-6 h-6" />
        ) : (
          <Icon className="w-6 h-6" />
        )}
      </div>
      <p
        className={`mt-2 text-center text-xs sm:text-sm font-semibold ${
          isCompleted || isInProgress ? "text-slate-800" : "text-slate-500"
        }`}
      >
        {milestone.name}
      </p>
    </div>
  );
};

const ProjectProgressBar: React.FC<ProjectProgressBarProps> = ({
  tasks,
  trades,
}) => {
  const milestones = useMemo(
    () => getMilestones(tasks, trades),
    [tasks, trades]
  );

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-base font-semibold text-slate-800 mb-6 text-center">
        Project Milestones
      </h3>
      <div className="flex items-start">
        {milestones.map((milestone, index) => {
          const isLast = index === milestones.length - 1;
          const nextMilestone = isLast ? null : milestones[index + 1];
          const isConnectorActive =
            milestone.status === MilestoneStatus.Completed;

          return (
            <div key={milestone.name} className="flex-1 flex items-center">
              <MilestoneStep
                milestone={milestone}
                isFirst={index === 0}
                isLast={isLast}
              />
              {!isLast && (
                <div className="flex-1 h-1 bg-slate-200 relative -mx-2">
                  <div
                    className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-500"
                    style={{ width: isConnectorActive ? "100%" : "0%" }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectProgressBar;
