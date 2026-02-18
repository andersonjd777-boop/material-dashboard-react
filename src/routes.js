/**
 * DCG Admin Dashboard - Routes (Reorganized)
 * Navigation configuration for Direct Connect Global admin panel
 * Categorized structure with collapsible sections
 *
 * All layout imports use React.lazy() for code splitting.
 * Each route loads its chunk on demand, reducing initial bundle size.
 */

import { lazy } from "react";

// Lazy-loaded layouts — each becomes a separate webpack chunk
const Dashboard = lazy(() => import("layouts/dashboard"));
const Secrets = lazy(() => import("layouts/secrets"));
const Projects = lazy(() => import("layouts/projects"));
const System = lazy(() => import("layouts/system"));
const Actions = lazy(() => import("layouts/actions"));
const Assistant = lazy(() => import("layouts/assistant"));
const Flagging = lazy(() => import("layouts/flagging"));
const CallLogs = lazy(() => import("layouts/calllogs"));
const CallIssues = lazy(() => import("layouts/callissues"));
const VoiceMessages = lazy(() => import("layouts/voicemessages"));
const Messages = lazy(() => import("layouts/messages"));
const SharedDrive = lazy(() => import("layouts/shareddrive"));
const EmailHub = lazy(() => import("layouts/email"));
const Billing = lazy(() => import("layouts/billing"));
const Profile = lazy(() => import("layouts/profile"));
const SignIn = lazy(() => import("layouts/authentication/sign-in"));
const TaskManagement = lazy(() => import("layouts/taskmanagement"));
const GanttTimeline = lazy(() => import("layouts/gantt"));
const CRMDashboard = lazy(() => import("layouts/crm"));
const AutoHealer = lazy(() => import("layouts/autohealer"));
const AutoDeveloper = lazy(() => import("layouts/autodeveloper"));
const ComplianceOfficer = lazy(() => import("layouts/compliance"));
const AugmentControl = lazy(() => import("layouts/augment"));
const GapChecker = lazy(() => import("layouts/gapchecker"));
const AntiRegression = lazy(() => import("layouts/antiregression"));
const WorkCalendar = lazy(() => import("layouts/workCalendar"));
const CompanyCalendar = lazy(() => import("layouts/companycalendar"));

// AI Workforce Layouts — lazy loaded
const JenkinsTab = lazy(() => import("layouts/ai-workforce/jenkins"));
const VigilTab = lazy(() => import("layouts/ai-workforce/vigil"));
const LedgerTab = lazy(() => import("layouts/ai-workforce/ledger"));
const BellTab = lazy(() => import("layouts/ai-workforce/bell"));
const WardenTab = lazy(() => import("layouts/ai-workforce/warden"));
const ScribeTab = lazy(() => import("layouts/ai-workforce/scribe"));
const IrisTab = lazy(() => import("layouts/ai-workforce/iris"));

// @mui icons — eagerly loaded (shared across all routes)
import Icon from "@mui/material/Icon";

const routes = [
  // Main Dashboard - Always visible at top
  {
    type: "collapse",
    name: "Overview",
    key: "dashboard",
    icon: <Icon fontSize="small">dashboard</Icon>,
    route: "/dashboard",
    component: <Dashboard />,
  },

  // CATEGORY: AI Workforce
  {
    type: "title",
    title: "AI Workforce",
    key: "ai-workforce-title",
  },
  {
    type: "collapse",
    name: "Jenkins (DevOps)",
    key: "jenkins",
    icon: <Icon fontSize="small">dns</Icon>,
    route: "/ai/jenkins",
    component: <JenkinsTab />,
  },
  {
    type: "collapse",
    name: "Vigil (Security)",
    key: "vigil",
    icon: <Icon fontSize="small">security</Icon>,
    route: "/ai/vigil",
    component: <VigilTab />,
  },
  {
    type: "collapse",
    name: "Ledger (Finance)",
    key: "ledger",
    icon: <Icon fontSize="small">account_balance</Icon>,
    route: "/ai/ledger",
    component: <LedgerTab />,
  },
  {
    type: "collapse",
    name: "Bell (Telecom)",
    key: "bell",
    icon: <Icon fontSize="small">perm_phone_msg</Icon>,
    route: "/ai/bell",
    component: <BellTab />,
  },
  {
    type: "collapse",
    name: "Warden (Compliance)",
    key: "warden",
    icon: <Icon fontSize="small">policy</Icon>,
    route: "/ai/warden",
    component: <WardenTab />,
  },
  {
    type: "collapse",
    name: "Scribe (Knowledge)",
    key: "scribe",
    icon: <Icon fontSize="small">library_books</Icon>,
    route: "/ai/scribe",
    component: <ScribeTab />,
  },
  {
    type: "collapse",
    name: "Iris (Comms)",
    key: "iris",
    icon: <Icon fontSize="small">notifications</Icon>,
    route: "/ai/iris",
    component: <IrisTab />,
  },

  // CATEGORY: Automation Systems
  {
    type: "title",
    title: "Automation Systems",
    key: "automation-title",
  },
  {
    type: "collapse",
    name: "Augment Control",
    key: "augment",
    icon: <Icon fontSize="small">settings_suggest</Icon>,
    route: "/augment",
    component: <AugmentControl />,
  },
  {
    type: "collapse",
    name: "Auto-Healer",
    key: "autohealer",
    icon: <Icon fontSize="small">healing</Icon>,
    route: "/autohealer",
    component: <AutoHealer />,
  },
  {
    type: "collapse",
    name: "Auto-Developer",
    key: "autodeveloper",
    icon: <Icon fontSize="small">smart_toy</Icon>,
    route: "/autodeveloper",
    component: <AutoDeveloper />,
  },
  {
    type: "collapse",
    name: "Compliance Officer",
    key: "compliance",
    icon: <Icon fontSize="small">gavel</Icon>,
    route: "/compliance",
    component: <ComplianceOfficer />,
  },
  {
    type: "collapse",
    name: "Gap Checker",
    key: "gap-checker",
    icon: <Icon fontSize="small">find_in_page</Icon>,
    route: "/gap-checker",
    component: <GapChecker />,
  },
  {
    type: "collapse",
    name: "Anti-Regression",
    key: "anti-regression",
    icon: <Icon fontSize="small">security_update</Icon>,
    route: "/anti-regression",
    component: <AntiRegression />,
  },

  // CATEGORY: Business Operations
  {
    type: "title",
    title: "Business Operations",
    key: "business-title",
  },
  {
    type: "collapse",
    name: "DCG Calendar",
    key: "work-calendar",
    icon: <Icon fontSize="small">calendar_today</Icon>, // Use calendar icon
    route: "/work-calendar",
    component: <WorkCalendar />,
  },
  {
    type: "collapse",
    name: "Company Calendar",
    key: "company-calendar",
    icon: <Icon fontSize="small">event_note</Icon>,
    route: "/company-calendar",
    component: <CompanyCalendar />,
  },
  {
    type: "collapse",
    name: "Task Management",
    key: "tasks",
    icon: <Icon fontSize="small">task_alt</Icon>,
    route: "/tasks",
    component: <TaskManagement />,
  },
  {
    type: "collapse",
    name: "Project Timeline",
    key: "gantt",
    icon: <Icon fontSize="small">timeline</Icon>,
    route: "/gantt",
    component: <GanttTimeline />,
  },
  {
    type: "collapse",
    name: "CRM",
    key: "crm",
    icon: <Icon fontSize="small">people</Icon>,
    route: "/crm",
    component: <CRMDashboard />,
  },
  {
    type: "collapse",
    name: "Billing",
    key: "billing",
    icon: <Icon fontSize="small">receipt_long</Icon>,
    route: "/billing",
    component: <Billing />,
  },
  {
    type: "collapse",
    name: "Projects",
    key: "projects",
    icon: <Icon fontSize="small">assignment</Icon>,
    route: "/projects",
    component: <Projects />,
  },
  {
    type: "collapse",
    name: "Quick Actions",
    key: "actions",
    icon: <Icon fontSize="small">bolt</Icon>,
    route: "/actions",
    component: <Actions />,
  },

  // CATEGORY: Communication & Content
  {
    type: "title",
    title: "Communication & Content",
    key: "communication-title",
  },
  {
    type: "collapse",
    name: "Call Logs",
    key: "calllogs",
    icon: <Icon fontSize="small">phone</Icon>,
    route: "/calllogs",
    component: <CallLogs />,
  },
  {
    type: "collapse",
    name: "Call Issues",
    key: "callissues",
    icon: <Icon fontSize="small">error_outline</Icon>,
    route: "/callissues",
    component: <CallIssues />,
  },
  {
    type: "collapse",
    name: "Messages",
    key: "messages",
    icon: <Icon fontSize="small">chat</Icon>,
    route: "/messages",
    component: <Messages />,
  },
  {
    type: "collapse",
    name: "Voice Messages",
    key: "voicemessages",
    icon: <Icon fontSize="small">voicemail</Icon>,
    route: "/voicemessages",
    component: <VoiceMessages />,
  },
  {
    type: "collapse",
    name: "Work Email Hub",
    key: "email",
    icon: <Icon fontSize="small">email</Icon>,
    route: "/email",
    component: <EmailHub />,
  },
  {
    type: "collapse",
    name: "Flagged Content",
    key: "flagging",
    icon: <Icon fontSize="small">flag</Icon>,
    route: "/flagging",
    component: <Flagging />,
  },
  {
    type: "collapse",
    name: "Shared Drive",
    key: "shareddrive",
    icon: <Icon fontSize="small">folder_shared</Icon>,
    route: "/shareddrive",
    component: <SharedDrive />,
  },

  // CATEGORY: Technical Monitoring
  {
    type: "title",
    title: "Technical Monitoring",
    key: "monitoring-title",
  },
  {
    type: "collapse",
    name: "System Health",
    key: "system",
    icon: <Icon fontSize="small">monitor_heart</Icon>,
    route: "/system",
    component: <System />,
  },
  {
    type: "collapse",
    name: "Jenkins Assistant",
    key: "assistant",
    icon: <Icon fontSize="small">psychology</Icon>,
    route: "/assistant",
    component: <Assistant />,
  },

  // CATEGORY: Configuration
  {
    type: "title",
    title: "Configuration",
    key: "configuration-title",
  },
  {
    type: "collapse",
    name: "Secrets Manager",
    key: "secrets",
    icon: <Icon fontSize="small">vpn_key</Icon>,
    route: "/secrets",
    component: <Secrets />,
  },
  {
    type: "collapse",
    name: "Profile",
    key: "profile",
    icon: <Icon fontSize="small">person</Icon>,
    route: "/profile",
    component: <Profile />,
  },

  // Hidden routes (authentication, etc.)
  {
    type: "hidden",
    name: "Sign In",
    key: "sign-in",
    icon: <Icon fontSize="small">login</Icon>,
    route: "/authentication/sign-in",
    component: <SignIn />,
  },
];

export default routes;
