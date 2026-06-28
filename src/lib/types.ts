export type TaskType = "todo" | "event";
export type Visibility = "private" | "shared";
export type TaskStatus = "active" | "done" | "skipped";
export type Priority = "low" | "medium" | "high";
export type Repeat = "none" | "daily" | "weekly" | "monthly" | "custom";

export interface Task {
  id: string;
  title: string;
  note: string;
  type: TaskType;
  visibility: Visibility;
  assignee: string;
  createdBy: string;
  dueDate: string | null;
  dueTime: string | null;
  repeat: Repeat;
  repeatInterval: number | null;
  repeatUntil: string | null;
  priority: Priority;
  category: string;
  status: TaskStatus;
  completedAt: string | null;
  completedBy: string | null;
  remindBefore: number | null;
  updatedAt: string;
  deleted: boolean;
  recurrenceParentId: string | null;
  lastNotifiedAt: string | null;
}

export type LocalTask = Task & {
  syncStatus: "synced" | "pending" | "conflict";
};

export type VisibilityFilter = "mine" | "shared";

export interface PushSubscriptionRecord {
  id: string;
  userEmail: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  createdAt: string;
  deleted: boolean;
}

export interface PendingMutation {
  id: string;
  mutationId: string;
  action: "create" | "update" | "delete";
  payload: Task;
  clientTimestamp: string;
  retryCount: number;
}

export interface SyncMeta {
  key: string;
  value: string;
}

export interface SyncRequest {
  mutations: PendingMutation[];
}

export interface SyncResponse {
  tasks: Task[];
  applied: string[];
  conflicts: string[];
}
