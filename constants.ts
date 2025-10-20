import { TaskStatus } from "./types";
import type { AppUser } from "./types";

export const MOCK_PROJECTS = [
  {
    id: "proj-1",
    name: "Lot 12 - Modern Farmhouse",
    address: "123 Oak Lane, Pleasantville",
    client: "The Johnson Family",
    pmId: "pm-user-123",
  },
  {
    id: "proj-2",
    name: "Renovation - 45 Elm Street",
    address: "45 Elm Street, Mapleton",
    client: "Smith Renovations LLC",
    pmId: "pm-user-456",
  },
];

export const MOCK_USERS: AppUser[] = [
  { id: "pm-user-123", name: "Alex Ray", role: "Project Manager" },
  { id: "pm-user-456", name: "Brenda Smith", role: "Project Manager" },
  { id: "customer-user-789", name: "The Johnson Family", role: "Customer" },
  {
    id: "sub-user-1",
    name: "Frank's Concrete",
    role: "Subcontractor",
    tradeId: "trade-1",
  },
  {
    id: "sub-user-2",
    name: "Frame-Up Bros",
    role: "Subcontractor",
    tradeId: "trade-2",
  },
];

export const MOCK_TRADES = [
  {
    id: "trade-1",
    name: "Foundation",
    contact: "Frank's Concrete",
    phone: "555-1001",
    email: "frank@concrete.com",
  },
  {
    id: "trade-2",
    name: "Framing",
    contact: "Frame-Up Bros",
    phone: "555-1002",
    email: "contact@frameup.com",
  },
  {
    id: "trade-3",
    name: "Plumbing (Rough-in)",
    contact: "Pipeline Plumbing",
    phone: "555-1003",
    email: "service@pipeline.com",
  },
  {
    id: "trade-4",
    name: "Electrical (Rough-in)",
    contact: "Sparky Electric",
    phone: "555-1004",
    email: "office@sparky.com",
  },
  {
    id: "trade-5",
    name: "HVAC (Rough-in)",
    contact: "Cool Air Inc.",
    phone: "555-1005",
    email: "install@coolair.com",
  },
  {
    id: "trade-6",
    name: "Roofing",
    contact: "Top Tier Roofing",
    phone: "555-1006",
    email: "quotes@toptier.com",
  },
  {
    id: "trade-7",
    name: "Drywall",
    contact: "Smooth Finish Drywall",
    phone: "555-1007",
    email: "jobs@smoothfinish.com",
  },
  {
    id: "trade-8",
    name: "Painting",
    contact: "Perfect Painters",
    phone: "555-1008",
    email: "contact@perfectpainters.com",
  },
  {
    id: "inspector-1",
    name: "Municipal Inspector",
    contact: "City Hall",
    phone: "555-CITY",
    email: "inspections@city.gov",
  },
];

const today = new Date();
const d = (days: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

export const MOCK_TASKS = {
  "proj-1": [
    {
      tradeId: "trade-1",
      status: TaskStatus.Completed,
      dependency: null,
      notes: "Poured on schedule.",
      startDate: d(-10),
      endDate: d(-7),
      progress: 100,
      isInspection: false,
    },
    {
      tradeId: "inspector-1",
      status: TaskStatus.Completed,
      dependency: "trade-1",
      notes: "Foundation inspection passed.",
      startDate: d(-6),
      endDate: d(-6),
      progress: 100,
      isInspection: true,
    },
    {
      tradeId: "trade-2",
      status: TaskStatus.InProgress,
      dependency: "inspector-1",
      notes: "Exterior walls are up.",
      startDate: d(-5),
      endDate: d(4),
      progress: 60,
      isInspection: false,
    },
    {
      tradeId: "trade-6",
      status: TaskStatus.NotStarted,
      dependency: "trade-2",
      notes: "Scheduled.",
      startDate: d(5),
      endDate: d(8),
      progress: 0,
      isInspection: false,
    },
    {
      tradeId: "trade-3",
      status: TaskStatus.NotStarted,
      dependency: "trade-2",
      notes: "",
      startDate: d(5),
      endDate: d(10),
      materialTrackingLink: "https://some-supplier.com/tracking/XYZ123",
      materialsDelivered: false,
      progress: 0,
      isInspection: false,
    },
    {
      tradeId: "trade-4",
      status: TaskStatus.NotStarted,
      dependency: "trade-2",
      notes: "",
      startDate: d(5),
      endDate: d(11),
      materialTrackingLink: "https://some-supplier.com/tracking/ABC456",
      materialsDelivered: true,
      progress: 0,
      isInspection: false,
    },
    {
      tradeId: "trade-5",
      status: TaskStatus.NotStarted,
      dependency: "trade-2",
      notes: "",
      startDate: d(6),
      endDate: d(9),
      progress: 0,
      isInspection: false,
    },
  ],
  "proj-2": [
    {
      tradeId: "trade-2",
      status: TaskStatus.Completed,
      dependency: null,
      notes: "Demo and re-framing complete.",
      startDate: d(-20),
      endDate: d(-10),
      progress: 100,
      isInspection: false,
    },
    {
      tradeId: "inspector-1",
      status: TaskStatus.Completed,
      dependency: "trade-2",
      notes: "Framing inspection passed.",
      startDate: d(-9),
      endDate: d(-9),
      progress: 100,
      isInspection: true,
    },
    {
      tradeId: "trade-4",
      status: TaskStatus.InProgress,
      dependency: "inspector-1",
      notes: "Rewiring kitchen.",
      startDate: d(-8),
      endDate: d(2),
      progress: 75,
      isInspection: false,
    },
    {
      tradeId: "trade-3",
      status: TaskStatus.Delayed,
      dependency: "inspector-1",
      notes: "Waiting on special order fixtures. New ETA next week.",
      startDate: d(-8),
      endDate: d(5),
      materialTrackingLink: "https://some-supplier.com/tracking/DEF789",
      materialsDelivered: false,
      progress: 10,
      isInspection: false,
    },
    {
      tradeId: "trade-7",
      status: TaskStatus.NotStarted,
      dependency: "trade-4",
      notes: "",
      startDate: d(3),
      endDate: d(8),
      progress: 0,
      isInspection: false,
    },
  ],
};
