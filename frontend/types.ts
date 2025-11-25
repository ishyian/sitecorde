import firebase from "firebase/compat/app";
import type { ElementType } from "react";

export enum TaskStatus {
  Completed = "Completed",
  InProgress = "In Progress",
  Delayed = "Delayed",
  NotStarted = "Not Started",
  JobSiteReady = "Job Site Ready",
}

export interface Project {
  id: string;
  name: string;
  address: string;
  client: string;
  pmId: string;
  // The Firebase auth user id of the creator of this project
  createdBy?: string;
}

export interface Trade {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  // The Firebase auth user id of the creator of this trade
  createdBy?: string;
}

export interface Task {
  id: string;
  projectId: string;
  tradeId: string;
  status: TaskStatus;
  dependency: string | null;
  notes: string;
  startDate: string; // ISO 8601 format: 'YYYY-MM-DD'
  endDate: string; // ISO 8601 format: 'YYYY-MM-DD'
  materialTrackingLink?: string;
  materialsDelivered?: boolean;
  isInspection?: boolean;
  progress?: number; // Percentage 0-100
}

export interface AITaskUpdate {
  tradeId: string;
  status: TaskStatus;
  notes: string;
  delayDurationInDays?: number;
  delayReason?: string;
  progress?: number;
}

export interface ChangeRequest {
  id: string;
  projectId: string;
  taskId: string;
  tradeName: string;
  proposedUpdate: {
    delayDurationInDays: number;
    notes: string;
    status: TaskStatus;
    delayReason?: string;
  };
  createdAt: string; // ISO string
}

export interface AppUser {
  id: string;
  name: string;
  role: "Project Manager" | "Admin" | "Customer" | "Subcontractor";
  tradeId?: string; // For Subcontractor role
}

export enum MilestoneStatus {
  Completed = "Completed",
  InProgress = "In Progress",
  Next = "Next",
  Incomplete = "Incomplete",
}

export interface ProjectMilestone {
  name: string;
  status: MilestoneStatus;
  icon: ElementType;
}

export interface AppState {
  db: firebase.firestore.Firestore | null;
  isLoading: boolean;
  isOffline: boolean;
  projects: Project[];
  trades: Trade[];
  users: AppUser[];
  tasks: { [projectId: string]: Task[] };
  changeRequests: { [projectId: string]: ChangeRequest[] };
  selectedProject: Project | null;
  viewingAsUser: AppUser | null;
  error: string | null;
}
