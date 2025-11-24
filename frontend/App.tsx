import React, {useState, useEffect} from "react";
import {Unsubscribe, User} from "firebase/auth";
import {Home, AlertTriangle} from "lucide-react";

import type {
    Project,
    Trade,
    Task,
    AppState,
    AITaskUpdate,
    ChangeRequest,
    AppUser,
} from "./types";
import {TaskStatus} from "./types";
import {
    MOCK_PROJECTS,
    MOCK_TRADES,
    MOCK_TASKS,
    MOCK_USERS,
} from "./constants";
import {auth, db, functionsClient} from "./services/firebaseService";
import {logOut} from "./services/authService";
import Sidebar from "./components/Sidebar";
import AccountInfoModal from "./components/AccountInfoModal";
import ProjectDashboard from "./components/ProjectDashboard";
import LoadingScreen from "./components/LoadingScreen";
import LoginScreen from "./components/LoginScreen";
import EmailLoginScreen from "./components/EmailLoginScreen";
import EmailSignUpScreen from "./components/EmailSignUpScreen";
import CustomerView from "./components/CustomerView";
import SubcontractorView from "./components/SubcontractorView";
import CreateProjectModal from "./components/CreateProjectModal";
import AddSubcontractorModal from "./components/AddSubcontractorModal";
import {ChatService} from "./services/chatService";
import ChatWidget from "./components/ChatWidget";
import {
    collection,
    doc,
    Firestore,
    getDocs,
    onSnapshot,
    QuerySnapshot,
    updateDoc,
    writeBatch,
    setDoc,
} from "firebase/firestore";
import { httpsCallable, HttpsCallableResult } from "firebase/functions";

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [appState, setAppState] = useState<AppState>({
        db: null,
        isLoading: true,
        isOffline: false,
        projects: [],
        trades: [],
        users: [],
        tasks: {},
        changeRequests: {},
        selectedProject: null,
        viewingAsUser: null,
        error: null,
    });
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    const [isAddingSubcontractor, setIsAddingSubcontractor] = useState(false);
    const [chatService, setChatService] = useState<ChatService | null>(null);
    const [isDemo, setIsDemo] = useState(false);
    const [authView, setAuthView] = useState<"landing" | "login" | "signup">("landing");

    // Phone verification dialog state
    const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
    const [verifyStep, setVerifyStep] = useState<"phone" | "code">("phone");
    const [phoneInput, setPhoneInput] = useState("+1");
    const [codeInput, setCodeInput] = useState("");
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [toast, setToast] = useState<null | { type: "success" | "error"; message: string }>(null);

    // Account modal state
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [accountInfo, setAccountInfo] = useState<{ name: string; email: string; phone: string | null }>({
        name: "",
        email: "",
        phone: null,
    });

    useEffect(() => {
        // This effect should only run once on mount.
        let unsubscribe: Unsubscribe = () => {
        };

        const initializeAuth = async () => {
            try {
                // onAuthStateChanged will handle user state from popups, redirects, or session.
                // It is the central place to manage user authentication state.
                unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
                    setUser(firebaseUser);
                    // If user signed out, return to landing (LoginScreen)
                    if (!firebaseUser) {
                        setAuthView("landing");
                    }
                    setIsAuthLoading(false); // Auth state is now determined, stop loading.
                });
            } catch (error: any) {
                console.error("Authentication setup error:", error);
                // If persistence or auth listeners fail to set up, show an error.
                setAppState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: `Authentication setup failed: ${error.message}`,
                }));
                setIsAuthLoading(false);
            }
        };

        initializeAuth();

        // The cleanup function will run when the component unmounts.
        return () => unsubscribe();
    }, []);

    const isAuthenticated = !!user;

    const setupDemoOrOfflineMode = () => {
        console.log("Setting up mock data for offline/demo mode.");
        const initialTasks = MOCK_TASKS as {
            [projectId: string]: Omit<Task, "id" | "projectId">[];
        };
        const tasksWithIds: { [projectId: string]: Task[] } = {};
        Object.keys(initialTasks).forEach((projId) => {
            tasksWithIds[projId] = initialTasks[projId].map((task, index) => ({
                ...task,
                id: `${projId}-task-${index}`,
                projectId: projId,
            }));
        });

        setAppState((prev) => ({
            ...prev,
            isLoading: false,
            isOffline: true,
            projects: MOCK_PROJECTS,
            trades: MOCK_TRADES,
            users: MOCK_USERS,
            tasks: tasksWithIds,
            selectedProject: MOCK_PROJECTS[0] || null,
            viewingAsUser: null,
        }));
    };

    useEffect(() => {
        // Initialize Chat Service if API key exists
        if (process.env.API_KEY) {
            try {
                setChatService(new ChatService(process.env.API_KEY));
            } catch (e) {
                console.error("Failed to initialize Chat Service", e);
            }
        } else {
            console.warn(
                "Gemini API_KEY not found. Chat and AI features will be disabled."
            );
        }

        if (isDemo) {
            setupDemoOrOfflineMode();
            return;
        }

        if (db) {
            // @ts-ignore
            setAppState((prev) => ({...prev, db, viewingAsUser: null}));
        } else {
            console.log("Running in offline mode. No Firebase connection.");
            setupDemoOrOfflineMode();
        }
    }, [isDemo]);

    const seedData = async (dbInstance: Firestore, currentUserId: string) => {
        const projectsRef = collection(dbInstance, "projects");
        const tradesRef = collection(dbInstance, "trades");

        const projectsSnap = await getDocs(projectsRef);

        if (projectsSnap.empty) {
            console.log("Seeding initial data...");
            const batch = writeBatch(dbInstance);

            if (projectsSnap.empty) {
                MOCK_TRADES.forEach((trade) => {
                    const tradeDocRef = doc(tradesRef, trade.id);
                    batch.set(tradeDocRef, {...trade, createdBy: currentUserId});
                });

                MOCK_PROJECTS.forEach((project) => {
                    const projectDocRef = doc(projectsRef, project.id);
                    batch.set(projectDocRef, {...project});
                    const tasksForProject =
                        MOCK_TASKS[project.id as keyof typeof MOCK_TASKS] || [];
                    tasksForProject.forEach((task) => {
                        const taskColRef = collection(
                            dbInstance,
                            `projects/${project.id}/tasks`
                        );
                        const newTaskRef = doc(taskColRef);
                        batch.set(newTaskRef, {...task, projectId: project.id});
                    });
                });
            }

            await batch.commit();
            console.log("Data seeding complete.");
        }
    };

    // Effect for fetching top-level collections (projects, trades, users)
    useEffect(() => {
        if (
            appState.isOffline ||
            !isAuthenticated ||
            !appState.db ||
            appState.error
        ) {
            // If we are not fetching data for any reason, stop the main loading indicator.
            // The component will then show the login screen, an error, or an empty state.
            setAppState((prev) => ({...prev, isLoading: false}));
            return;
        }

        const projectsQuery = collection(appState.db, "projects");

        const unsubscribeProjects = onSnapshot(
            projectsQuery,
            (snapshot: QuerySnapshot) => {
                // Ensure Firestore doc.id is the authoritative id, even if a legacy 'id' field exists in data
                const projectsData = snapshot.docs.map(
                    (doc) => ({ ...doc.data(), id: doc.id } as Project)
                );
                setAppState((prev) => {
                    // Ensure a selected project is set when projects load, or recover if the selected one disappears
                    let selectedProject = prev.selectedProject;
                    if (!selectedProject && projectsData.length > 0) {
                        selectedProject = projectsData[0];
                    } else if (selectedProject) {
                        const stillExists = projectsData.some(
                            (p) => p.id === selectedProject!.id
                        );
                        if (!stillExists) {
                            selectedProject = projectsData[0] || null;
                        }
                    }

                    // Pre-initialize tasks map entries for each project so appState.tasks always
                    // contains a key for every project. This avoids cases where tasks stays `{}`
                    // until the subcollection snapshot arrives, which can confuse downstream logic.
                    const nextTasksMap: { [projectId: string]: Task[] } = { ...prev.tasks };
                    for (const p of projectsData) {
                        if (!nextTasksMap[p.id]) {
                            nextTasksMap[p.id] = [];
                        }
                    }

                    return {
                        ...prev,
                        projects: projectsData,
                        tasks: nextTasksMap,
                        selectedProject,
                        isLoading: snapshot.metadata.hasPendingWrites
                            ? prev.isLoading
                            : false,
                    };
                });
            },
            (error) => {
                console.error("Error fetching projects:", error);
                setAppState((prev) => ({
                    ...prev,
                    isLoading: false,
                    error: "Failed to fetch project data.",
                }));
            }
        );

        const tradesQuery = collection(appState.db, "trades");
        const unsubscribeTrades = onSnapshot(
            tradesQuery,
            (snapshot: QuerySnapshot) => {
                const tradesData = snapshot.docs.map(
                    (doc) => ({id: doc.id, ...doc.data()} as Trade)
                );
                setAppState((prev) => ({...prev, trades: tradesData}));
            },
            (error) => console.error("Error fetching trades:", error)
        );

        return () => {
            unsubscribeProjects();
            unsubscribeTrades();
        };
    }, [isAuthenticated, appState.db, user]);

    // Effect for subscribing to tasks sub-collections based on the current projects
    useEffect(() => {
        if (appState.isOffline || !appState.db || appState.projects.length === 0) {
            return;
        }

        const tasksUnsubscribers = appState.projects.map((project) => {
            const tasksQuery = collection(
                appState.db!,
                `projects/${project.id}/tasks`
            );
            return onSnapshot(
                tasksQuery,
                (snapshot: QuerySnapshot) => {
                    // Ensure each Task.id matches the Firestore document id
                    const tasksData = snapshot.docs.map(
                        (doc) => ({ ...doc.data(), id: doc.id } as Task)
                    );
                    setAppState((prev) => ({
                        ...prev,
                        tasks: {...prev.tasks, [project.id]: tasksData},
                    }));
                },
                (error) =>
                    console.error(
                        `Error fetching tasks for project ${project.id}:`,
                        error
                    )
            );
        });

        return () => {
            tasksUnsubscribers.forEach((unsub) => unsub());
        };
    }, [appState.projects, appState.db]);

    const handleSelectProject = async (project: Project) => {
        setAppState((prev) => {
            const hasKey = Object.prototype.hasOwnProperty.call(prev.tasks, project.id);
            const nextTasks = hasKey ? prev.tasks : { ...prev.tasks, [project.id]: [] };
            return { ...prev, selectedProject: project, tasks: nextTasks };
        });

        if (db) {
            const snap = await getDocs(collection(db, `projects/${project.id}/tasks`));
            console.log("[getDocs check] project:", project.id, "count:", snap.size);
        }
    };

    const handleSelectUserView = (user: AppUser | null) => {
        setAppState((prev) => {
            let newSelectedProject: Project | null = null;
            const role = user?.role ?? "Project Manager";
            let projectsForView: Project[] = [];

            switch (role) {
                case "Customer":
                    projectsForView = prev.projects.filter(
                        (p) => p.client === user!.name
                    );
                    newSelectedProject = projectsForView[0] || null;
                    break;
                case "Subcontractor":
                    projectsForView = prev.projects.filter((p) =>
                        (prev.tasks[p.id] || []).some((t) => t.tradeId === user!.tradeId)
                    );
                    newSelectedProject = projectsForView[0] || null;
                    break;
                default: // PM or All
                    projectsForView = user
                        ? prev.projects.filter((p) => p.pmId === user.id)
                        : prev.projects;
                    const isSelectedProjectVisible =
                        prev.selectedProject &&
                        projectsForView.some((p) => p.id === prev.selectedProject!.id);
                    newSelectedProject = isSelectedProjectVisible
                        ? prev.selectedProject
                        : projectsForView[0] || null;
                    break;
            }

            return {
                ...prev,
                viewingAsUser: user,
                selectedProject: newSelectedProject,
            };
        });
    };

    const handleTaskUpdate = async (
        projectId: string,
        taskId: string,
        update: Partial<Task> & Partial<AITaskUpdate>
    ) => {
        const {delayDurationInDays, delayReason, ...taskUpdate} = update;

        if (
            taskUpdate.status === TaskStatus.Completed &&
            taskUpdate.progress !== 100
        )
            taskUpdate.progress = 100;
        if (
            taskUpdate.status === TaskStatus.NotStarted &&
            taskUpdate.progress !== 0
        )
            taskUpdate.progress = 0;

        if (
            delayDurationInDays &&
            delayDurationInDays > 0 &&
            taskUpdate.status === "Delayed"
        ) {
            const trade = appState.trades.find(
                (t) =>
                    t.id ===
                    (appState.tasks[projectId].find((tsk) => tsk.id === taskId) as Task)
                        .tradeId
            );
            const newRequest: ChangeRequest = {
                id: `cr-${Date.now()}`,
                projectId,
                taskId,
                tradeName: trade?.name || "Unknown Trade",
                proposedUpdate: {
                    delayDurationInDays,
                    notes: taskUpdate.notes || "",
                    status: taskUpdate.status,
                    delayReason: delayReason || "No reason provided.",
                },
                createdAt: new Date().toISOString(),
            };

            setAppState((prev) => ({
                ...prev,
                changeRequests: {
                    ...prev.changeRequests,
                    [projectId]: [...(prev.changeRequests[projectId] || []), newRequest],
                },
            }));
        } else {
            if (appState.isOffline || !appState.db) {
                console.log(`(Offline) Updating task ${taskId}:`, taskUpdate);
                setAppState((prev) => {
                    const updatedTasks = (prev.tasks[projectId] || []).map((t) =>
                        t.id === taskId ? {...t, ...taskUpdate} : t
                    );
                    return {
                        ...prev,
                        tasks: {...prev.tasks, [projectId]: updatedTasks},
                    };
                });
            } else {
                const taskRef = doc(
                    appState.db,
                    "projects",
                    projectId,
                    "tasks",
                    taskId
                );
                await updateDoc(taskRef, taskUpdate as { [x: string]: any });
            }
        }
    };

    const handleCreateProject = async (
        projectData: Omit<Project, "id" | "pmId">,
        selectedSubcontractorIds: string[]
    ) => {
        const today = new Date().toISOString().split("T")[0];

        const pmId =
            (appState.viewingAsUser?.role === "Project Manager"
                ? appState.viewingAsUser.id
                : appState.users.find((u) => u.role === "Project Manager")?.id) ||
            "unassigned";

        const fullProjectData: Omit<Project, "id"> = {...projectData, pmId};

        // selectedSubcontractorIds come from the CreateProjectModal. We now
        // populate the selectable list from trades (ids == trade ids). For
        // backward compatibility, also support when ids point to users with
        // a tradeId.
        const tradeIdsForNewTasks = selectedSubcontractorIds
            .map((selectedId) => {
                // If it's a user id, resolve to their tradeId
                const user = appState.users.find((u) => u.id === selectedId);
                if (user?.tradeId) return user.tradeId;
                // Otherwise, if it's already a trade id, pass it through when it exists
                const trade = appState.trades.find((t) => t.id === selectedId);
                return trade?.id;
            })
            .filter((id): id is string => !!id);

        if (appState.isOffline || !appState.db) {
            const newProjectId = `offline-proj-${Date.now()}`;
            const newProject = {...fullProjectData, id: newProjectId};
            const newTasks = tradeIdsForNewTasks.map((tradeId, index) => ({
                id: `${newProjectId}-task-${index}`,
                projectId: newProjectId,
                tradeId,
                status: TaskStatus.NotStarted,
                dependency: null,
                notes: "Initial task created for this trade.",
                startDate: today,
                endDate: today,
                progress: 0,
            }));

            setAppState((prev) => ({
                ...prev,
                projects: [...prev.projects, newProject],
                tasks: {
                    ...prev.tasks,
                    [newProjectId]: newTasks,
                },
                selectedProject: newProject,
            }));
        } else {

            const batch = writeBatch(appState.db);
            const newProjectRef = doc(collection(appState.db, "projects"));
            const newProject = {...fullProjectData, id: newProjectRef.id};
            batch.set(newProjectRef, newProject);

            tradeIdsForNewTasks.forEach((tradeId) => {
                const taskColRef = collection(
                    appState.db!,
                    `projects/${newProjectRef.id}/tasks`
                );
                const newTaskRef = doc(taskColRef);
                batch.set(newTaskRef, {
                    projectId: newProjectRef.id,
                    tradeId: tradeId,
                    status: TaskStatus.NotStarted,
                    dependency: null,
                    notes: "Initial task created for this trade.",
                    startDate: today,
                    endDate: today,
                    progress: 0,
                });
            });

            await batch.commit();
            // The onSnapshot listener handles the UI update for projects and tasks.
            // Select the new project automatically.
            setAppState((prev) => ({...prev, selectedProject: newProject}));
        }
        setIsCreatingProject(false);
    };

    const handleAddSubcontractor = async (data: {
        name: string;
        tradeType: string;
        phone: string;
        email: string;
    }) => {
        if (appState.isOffline || !appState.db) {
            const newTradeId = `offline-trade-${Date.now()}`;
            const newTrade: Trade = {
                id: newTradeId,
                name: data.tradeType,
                contact: data.name,
                phone: data.phone,
                email: data.email,
            };
            const newSub: AppUser = {
                id: `offline-sub-${Date.now()}`,
                name: data.name,
                tradeId: newTradeId,
                role: "Subcontractor",
            };
            setAppState((prev) => ({
                ...prev,
                trades: [...prev.trades, newTrade],
                users: [...prev.users, newSub],
            }));
        } else {
            console.log("Adding subcontractor:", data);
            const batch = writeBatch(appState.db);

            // Create new Trade
            const newTradeRef = doc(collection(appState.db, "trades"));
            const newTradeData: Omit<Trade, "id"> = {
                name: data.tradeType,
                contact: data.name,
                phone: data.phone,
                email: data.email,
            };
            batch.set(newTradeRef, newTradeData);

            await batch.commit();
            // Snapshot listener will update state
        }
        setIsAddingSubcontractor(false);
    };

    const handleApproveChangeRequest = async (request: ChangeRequest) => {
        const fullNotes = `Delay Approved. Reason: ${request.proposedUpdate.delayReason}\n---\nOriginal Note: ${request.proposedUpdate.notes}`;
        await handleCascadingUpdate(
            request.projectId,
            request.taskId,
            request.proposedUpdate.delayDurationInDays,
            {
                status: request.proposedUpdate.status,
                notes: fullNotes,
            }
        );
        handleDenyChangeRequest(request.id, request.projectId);
    };

    const handleDenyChangeRequest = (requestId: string, projectId: string) => {
        setAppState((prev) => ({
            ...prev,
            changeRequests: {
                ...prev.changeRequests,
                [projectId]: (prev.changeRequests[projectId] || []).filter(
                    (r) => r.id !== requestId
                ),
            },
        }));
    };

    const handleCascadingUpdate = async (
        projectId: string,
        rootTaskId: string,
        delayDays: number,
        rootUpdate: Partial<Task>
    ) => {
        const projectTasks = appState.tasks[projectId] || [];
        if (projectTasks.length === 0) return;

        const tasksMap = new Map(projectTasks.map((t) => [t.id, {...t}]));
        const dependencyMap = new Map<string, string[]>();
        projectTasks.forEach((t) => {
            if (t.dependency) {
                if (!dependencyMap.has(t.dependency))
                    dependencyMap.set(t.dependency, []);
                dependencyMap.get(t.dependency)!.push(t.id);
            }
        });

        const updatesToApply: { [taskId: string]: Partial<Task> } = {};
        const rootTask = tasksMap.get(rootTaskId);
        if (!rootTask) return;

        const originalStartDate = new Date(rootTask.startDate);
        const originalEndDate = new Date(rootTask.endDate);
        const newStartDate = new Date(
            originalStartDate.setDate(originalStartDate.getDate() + delayDays)
        );
        const newEndDate = new Date(
            originalEndDate.setDate(originalEndDate.getDate() + delayDays)
        );

        updatesToApply[rootTaskId] = {
            ...rootUpdate,
            startDate: newStartDate.toISOString().split("T")[0],
            endDate: newEndDate.toISOString().split("T")[0],
        };

        const queue = [...(dependencyMap.get(rootTaskId) || [])];
        const visited = new Set<string>([rootTaskId, ...queue]);

        while (queue.length > 0) {
            const currentTaskId = queue.shift()!;
            const currentTask = tasksMap.get(currentTaskId)!;
            const dependencyTask = tasksMap.get(currentTask.dependency!)!;

            const depNewEndDateStr =
                updatesToApply[dependencyTask.id]?.endDate || dependencyTask.endDate;
            const depNewEndDate = new Date(depNewEndDateStr);

            const newCurrentStartDate = new Date(depNewEndDate);
            newCurrentStartDate.setDate(newCurrentStartDate.getDate() + 1);

            const originalDuration =
                (new Date(currentTask.endDate).getTime() -
                    new Date(currentTask.startDate).getTime()) /
                (1000 * 3600 * 24);
            const newCurrentEndDate = new Date(newCurrentStartDate);
            newCurrentEndDate.setDate(newCurrentEndDate.getDate() + originalDuration);

            updatesToApply[currentTaskId] = {
                startDate: newCurrentStartDate.toISOString().split("T")[0],
                endDate: newCurrentEndDate.toISOString().split("T")[0],
            };

            const children = dependencyMap.get(currentTaskId) || [];
            for (const childId of children) {
                if (!visited.has(childId)) {
                    queue.push(childId);
                    visited.add(childId);
                }
            }
        }

        if (appState.isOffline || !appState.db) {
            console.log("(Offline) Applying cascading updates:", updatesToApply);
            setAppState((prev) => {
                const updatedTasks = (prev.tasks[projectId] || []).map((t) =>
                    updatesToApply[t.id] ? {...t, ...updatesToApply[t.id]} : t
                );
                return {...prev, tasks: {...prev.tasks, [projectId]: updatedTasks}};
            });
        } else {
            const batch = appState.db.batch();
            for (const taskId in updatesToApply) {
                const taskRef = appState.db
                    .collection("projects")
                    .doc(projectId)
                    .collection("tasks")
                    .doc(taskId);
                batch.update(taskRef, updatesToApply[taskId]);
            }
            await batch.commit();
        }
    };

    if (isAuthLoading || appState.isLoading) {
        return <LoadingScreen/>;
    }

    if (!isAuthenticated && !isDemo) {
        if (authView === "login") {
            return (
                <EmailLoginScreen
                    onBack={() => setAuthView("landing")}
                    onGoToSignup={() => setAuthView("signup")}
                />
            );
        }
        if (authView === "signup") {
            return <EmailSignUpScreen onBack={() => setAuthView("login")} />;
        }
        // landing view
        return (
            <LoginScreen
                onEnterDemo={() => setIsDemo(true)}
                onLogin={() => setAuthView("login")}
            />
        );
    }

    if (appState.error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
                <div className="text-center p-8 bg-white shadow-xl rounded-lg max-w-lg border border-red-200">
                    <AlertTriangle className="mx-auto h-12 w-12 text-red-500"/>
                    <h2 className="mt-4 text-2xl font-bold text-slate-800">
                        Application Error
                    </h2>
                    <p className="mt-2 text-base text-slate-600">{appState.error}</p>
                    <p className="mt-6 text-sm text-slate-500">
                        This is often a configuration issue. Please check the error message
                        for instructions.
                    </p>
                </div>
            </div>
        );
    }

    const {viewingAsUser, selectedProject} = appState;
    const role = viewingAsUser?.role ?? "Project Manager";

    if (role === "Customer") {
        return (
            <CustomerView
                user={viewingAsUser!}
                project={selectedProject}
                tasks={selectedProject ? appState.tasks[selectedProject.id] || [] : []}
                trades={appState.trades}
                allUsers={appState.users}
                onSelectUserView={handleSelectUserView}
            />
        );
    }

    if (role === "Subcontractor") {
        const subProjects = appState.projects.filter((p) =>
            (appState.tasks[p.id] || []).some(
                (t) => t.tradeId === viewingAsUser!.tradeId
            )
        );
        return (
            <SubcontractorView
                user={viewingAsUser!}
                projects={subProjects}
                selectedProject={selectedProject}
                onSelectProject={handleSelectProject}
                tasksByProject={appState.tasks}
                trades={appState.trades}
                onTaskUpdate={handleTaskUpdate}
                allUsers={appState.users}
                onSelectUserView={handleSelectUserView}
            />
        );
    }

    // Default: Project Manager / Admin View
    const visibleProjects = viewingAsUser
        ? appState.projects.filter((p) => p.pmId === viewingAsUser.id)
        : appState.projects;

    // Build selectable "subcontractors" from trades collection so user can add
    // initial subcontractors when creating a project. We map each trade to a
    // pseudo AppUser with role "Subcontractor" for compatibility with
    // CreateProjectModal props and rendering.
    const subcontractors = appState.trades.map((t) => ({
        id: t.id, // use trade id as selectable id
        name: t.contact || t.name, // show contact if available, otherwise trade name
        role: "Subcontractor" as const,
        tradeId: t.id,
    }));
    const handleLogout = () => {
        if (isDemo) {
            window.location.reload();
            return;
        }
        logOut();
    };

    const handleVerifyPhoneNumber = () => {
        // Open dialog; if offline/demo, still allow showing UI but inform user
        setIsVerifyDialogOpen(true);
        setVerifyStep("phone");
        setCodeInput("");
    };

    const closeVerifyDialog = () => {
        setIsVerifyDialogOpen(false);
        setVerifyStep("phone");
        setPhoneInput((v) => v || "+1");
        setCodeInput("");
        setVerifyLoading(false);
    };

    const showToast = (type: "success" | "error", message: string) => {
        setToast({ type, message });
        window.setTimeout(() => setToast(null), 3500);
    };

    const sendVerification = async () => {
        if (appState.isOffline) {
            showToast("error", "App is offline. Configure Firebase to send SMS.");
            return;
        }
        const phone = phoneInput?.trim();
        if (!phone || !/^\+\d{6,15}$/.test(phone)) {
            showToast("error", "Enter a valid phone in E.164 format (e.g., +15551234567).");
            return;
        }
        setVerifyLoading(true);
        try {
            const callable = httpsCallable(functionsClient, "sendSmsVerification");
            const res = (await callable({ phone })) as HttpsCallableResult<{ sid: string; status: string }>;
            if (res?.data?.sid) {
                setVerifyStep("code");
                showToast("success", "Verification code sent.");
            } else {
                showToast("error", "Failed to send verification code.");
            }
        } catch (e: any) {
            const msg = e?.message || e?.code || "Failed to send verification code";
            showToast("error", String(msg));
        } finally {
            setVerifyLoading(false);
        }
    };

    const verifyCode = async () => {
        if (appState.isOffline) {
            showToast("error", "App is offline. Configure Firebase to verify code.");
            return;
        }
        const phone = phoneInput?.trim();
        const code = codeInput?.trim();
        if (!phone || !code) {
            showToast("error", "Phone and code are required.");
            return;
        }
        setVerifyLoading(true);
        try {
            const callable = httpsCallable(functionsClient, "verifySmsCode");
            const res = (await callable({ phone, code })) as HttpsCallableResult<{ valid: boolean; status: string }>;
            if (res?.data?.valid) {
                showToast("success", "Phone successfully verified.");
                // Save verified phone into /users/{uid} (upsert)
                if (user && db) {
                    try {
                        await setDoc(doc(db as Firestore, "users", user.uid), { phone }, { merge: true });
                        // reflect in local account modal if open
                        setAccountInfo((prev) => ({ ...prev, phone }));
                    } catch (e) {
                        console.warn("Failed to save phone to Firestore", e);
                    }
                }
                closeVerifyDialog();
            } else {
                const status = res?.data?.status || "unknown";
                showToast("error", `Verification failed (status: ${status}).`);
            }
        } catch (e: any) {
            const msg = e?.message || e?.code || "Verification failed";
            showToast("error", String(msg));
        } finally {
            setVerifyLoading(false);
        }
    };

    const openAccount = async () => {
        const authUser = user;
        const base = {
            name: authUser?.displayName || "",
            email: authUser?.email || "",
            phone: null as string | null,
        };
        if (!appState.isOffline && authUser) {
            try {
                const ref = doc(db as Firestore, "users", authUser.uid);
                const snap = await (await import("firebase/firestore")).getDoc(ref);
                const data = snap.exists() ? snap.data() as any : null;
                setAccountInfo({
                    name: (data?.fullName as string) || base.name,
                    email: (data?.email as string) || base.email,
                    phone: (data?.phone as string | null) ?? base.phone,
                });
            } catch (e) {
                setAccountInfo(base);
            }
        } else {
            setAccountInfo(base);
        }
        setIsAccountOpen(true);
    };


    return (
        <div className="bg-slate-100 min-h-screen font-sans text-slate-800 flex flex-col lg:flex-row">
            <Sidebar
                projects={visibleProjects}
                selectedProject={selectedProject}
                setSelectedProject={handleSelectProject}
                users={appState.users}
                viewingAsUser={viewingAsUser}
                onSelectUserView={handleSelectUserView}
                onAddNewProject={() => setIsCreatingProject(true)}
                onAddNewSubcontractor={() => setIsAddingSubcontractor(true)}
                onLogout={handleLogout}
                onVerifyPhoneNumber={handleVerifyPhoneNumber}
                onOpenAccount={openAccount}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {/* Toast */}
                {toast && (
                    <div
                        className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}
                        role="status"
                        aria-live="polite"
                    >
                        {toast.message}
                    </div>
                )}

                {/* Phone Verification Dialog */}
                {isVerifyDialogOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40" onClick={closeVerifyDialog} />
                        <div className="relative z-50 w-full max-w-md bg-white rounded-lg shadow-xl p-6">
                            <h3 className="text-lg font-semibold mb-4">Verify your phone</h3>
                            {verifyStep === "phone" ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone number</label>
                                    <input
                                        type="tel"
                                        value={phoneInput}
                                        onChange={(e) => setPhoneInput(e.target.value)}
                                        placeholder="+15551234567"
                                        className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={verifyLoading}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Use E.164 format including country code.</p>
                                    <div className="mt-4 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={closeVerifyDialog}
                                            className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
                                            disabled={verifyLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={sendVerification}
                                            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                                            disabled={verifyLoading}
                                        >
                                            {verifyLoading ? "Sending..." : "Send Code"}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Enter code</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={codeInput}
                                        onChange={(e) => setCodeInput(e.target.value)}
                                        placeholder="123456"
                                        className="w-full border rounded-md p-2 tracking-widest text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={verifyLoading}
                                    />
                                    <div className="mt-4 flex justify-between items-center">
                                        <button
                                            type="button"
                                            onClick={() => setVerifyStep("phone")}
                                            className="text-sm text-blue-600 hover:underline"
                                            disabled={verifyLoading}
                                        >
                                            Change phone
                                        </button>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={closeVerifyDialog}
                                                className="px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
                                                disabled={verifyLoading}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={verifyCode}
                                                className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                                                disabled={verifyLoading}
                                            >
                                                {verifyLoading ? "Verifying..." : "Verify"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {appState.isOffline && (
                    <div
                        className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-r-lg mb-6 shadow-md no-print"
                        role="alert"
                    >
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0"/>
                            <div>
                                <h3 className="font-bold">
                                    {isDemo ? "Demo Mode Active" : "Offline Mode Active"}
                                </h3>
                                <p className="text-sm">
                                    {isDemo
                                        ? "You are viewing the app in demo mode with sample data. Live updates and AI features are disabled."
                                        : "Could not connect to the backend (Firebase configuration is likely missing). The app is running with local sample data. Live updates and AI features are disabled."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                {selectedProject ? (
                    <ProjectDashboard
                        key={selectedProject.id}
                        project={selectedProject}
                        tasks={appState.tasks[selectedProject.id] || []}
                        trades={appState.trades}
                        changeRequests={appState.changeRequests[selectedProject.id] || []}
                        onTaskUpdate={handleTaskUpdate}
                        onApproveRequest={handleApproveChangeRequest}
                        onDenyRequest={handleDenyChangeRequest}
                        isOffline={appState.isOffline}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Home className="mx-auto h-12 w-12 text-slate-400"/>
                            <h2 className="mt-4 text-xl font-medium text-slate-600">
                                {viewingAsUser
                                    ? `No Projects for ${viewingAsUser.name}`
                                    : "No Projects Found"}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {appState.isOffline
                                    ? "Running in offline mode."
                                    : "Select a different user view or create a new project."}
                            </p>
                        </div>
                    </div>
                )}
            </main>
            {isCreatingProject && (
                <CreateProjectModal
                    onClose={() => setIsCreatingProject(false)}
                    onCreate={handleCreateProject}
                    subcontractors={subcontractors}
                    trades={appState.trades}
                />
            )}
            {isAddingSubcontractor && (
                <AddSubcontractorModal
                    onClose={() => setIsAddingSubcontractor(false)}
                    onCreate={handleAddSubcontractor}
                />
            )}
            {isAccountOpen && (
                <AccountInfoModal
                    open={isAccountOpen}
                    onClose={() => setIsAccountOpen(false)}
                    name={accountInfo.name}
                    email={accountInfo.email}
                    phone={accountInfo.phone}
                    onSavePhone={async (phone: string) => {
                        const trimmed = (phone || "").trim();
                        if (!trimmed) {
                            showToast("error", "Please enter a phone number.");
                            return;
                        }
                        if (appState.isOffline) {
                            setAccountInfo((prev) => ({ ...prev, phone: trimmed }));
                            showToast("success", "Phone saved locally (offline mode).");
                            setIsAccountOpen(false);
                            return;
                        }
                        if (user && db) {
                            try {
                                await setDoc(doc(db as Firestore, "users", user.uid), { phone: trimmed }, { merge: true });
                                setAccountInfo((prev) => ({ ...prev, phone: trimmed }));
                                showToast("success", "Phone saved.");
                                setIsAccountOpen(false);
                            } catch (e: any) {
                                const msg = e?.message || "Failed to save phone";
                                showToast("error", String(msg));
                            }
                        } else {
                            showToast("error", "You must be signed in to save phone.");
                        }
                    }}
                />
            )}
            <ChatWidget chatService={chatService} isOffline={appState.isOffline}/>
        </div>
    );
};

export default App;
