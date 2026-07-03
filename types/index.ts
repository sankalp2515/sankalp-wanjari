export type AppId =
  | "about"
  | "projects"
  | "skills"
  | "experience"
  | "research"
  | "contact"
  | "agent";

export type WindowState = {
  id: AppId;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { w: number; h: number };
};

export type OSState = {
  windows: Record<AppId, WindowState>;
  activeWindow: AppId | null;
  bootComplete: boolean;
  visitorType: "recruiter" | "cto" | "developer" | "explorer" | null;
  topZIndex: number;
};

export type AgentMessage = {
  role: "user" | "agent";
  content: string;
  timestamp: Date;
};

export type Persona = "recruiter" | "cto" | "developer" | "explorer" | null;

export type SectionId =
  | "hero"
  | "studio"
  | "arc"
  | "projects"
  | "capabilities"
  | "credibility"
  | "fit"
  | "contact";

export type SkillCategory = "AI/ML" | "Engineering" | "Product";

export type ProjectStatus = "DEPLOYED" | "LIVE" | "IN PROGRESS" | "ARCHIVED";

export type LogType = "INFO" | "WARN" | "ERROR" | "SUCCESS";
