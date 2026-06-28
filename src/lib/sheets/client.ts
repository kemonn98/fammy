import { google } from "googleapis";
import type { PushSubscriptionRecord, Task } from "@/lib/types";
import {
  PUSH_TAB,
  SETTINGS_TAB,
  TASK_TAB,
  getPushHeaders,
  getSettingsHeaders,
  getTaskHeaders,
  pushSubscriptionToRow,
  rowToPushSubscription,
  rowToTask,
  taskToRow,
} from "@/lib/sheets/schema";

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (!email || !key) {
    throw new Error("Google service account credentials are not configured");
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetId(): string {
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("GOOGLE_SHEET_ID is not configured");
  return id;
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

async function readTab(tab: string): Promise<string[][]> {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: getSheetId(),
    range: `${tab}!A:Z`,
  });
  return (res.data.values as string[][]) ?? [];
}

async function writeTab(tab: string, rows: string[][]): Promise<void> {
  const sheets = await getSheets();
  const spreadsheetId = getSheetId();

  // Clear the whole tab first so removed rows don't linger as stale
  // duplicates (values.update only overwrites the cells it writes).
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tab}!A:Z`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tab}!A1`,
    valueInputOption: "RAW",
    requestBody: { values: rows },
  });
}

export async function ensureSheetTabs(): Promise<void> {
  const sheets = await getSheets();
  const spreadsheetId = getSheetId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Set(
    meta.data.sheets?.map((s) => s.properties?.title).filter(Boolean),
  );

  const required = [TASK_TAB, PUSH_TAB, SETTINGS_TAB];
  const toCreate = required.filter((t) => !existing.has(t));

  if (toCreate.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: toCreate.map((title) => ({
          addSheet: { properties: { title } },
        })),
      },
    });
  }

  if (!existing.has(TASK_TAB)) {
    await writeTab(TASK_TAB, getTaskHeaders());
  }
  if (!existing.has(PUSH_TAB)) {
    await writeTab(PUSH_TAB, getPushHeaders());
  }
  if (!existing.has(SETTINGS_TAB)) {
    await writeTab(SETTINGS_TAB, getSettingsHeaders());
  }
}

async function readAllTasksFromSheet(): Promise<Task[]> {
  const rows = await readTab(TASK_TAB);
  return rows
    .map((row) => rowToTask(row))
    .filter((t): t is Task => t !== null);
}

export async function getAllTasks(): Promise<Task[]> {
  const tasks = await readAllTasksFromSheet();
  return tasks.filter((t) => !t.deleted);
}

export async function upsertTasks(tasks: Task[]): Promise<void> {
  if (tasks.length === 0) return;

  const existing = await getAllTasks();
  const map = new Map(existing.map((t) => [t.id, t]));

  for (const task of tasks) {
    map.set(task.id, { ...task, deleted: false });
  }

  const rows = [getTaskHeaders()[0], ...Array.from(map.values()).map(taskToRow)];
  await writeTab(TASK_TAB, rows);
}

export async function deleteTasks(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  const idSet = new Set(ids);
  const remaining = (await readAllTasksFromSheet()).filter(
    (t) => !idSet.has(t.id) && !t.deleted,
  );
  const rows = [getTaskHeaders()[0], ...remaining.map(taskToRow)];
  await writeTab(TASK_TAB, rows);
}

export async function getAllPushSubscriptions(): Promise<
  PushSubscriptionRecord[]
> {
  const rows = await readTab(PUSH_TAB);
  return rows
    .map((row) => rowToPushSubscription(row))
    .filter((s): s is PushSubscriptionRecord => s !== null && !s.deleted);
}

export async function upsertPushSubscription(
  sub: PushSubscriptionRecord,
): Promise<void> {
  const rows = await readTab(PUSH_TAB);
  const subs = rows
    .map((row) => rowToPushSubscription(row))
    .filter((s): s is PushSubscriptionRecord => s !== null);

  const idx = subs.findIndex((s) => s.id === sub.id || s.endpoint === sub.endpoint);
  if (idx >= 0) {
    subs[idx] = sub;
  } else {
    subs.push(sub);
  }

  const active = subs.filter((s) => !s.deleted);
  const data = [getPushHeaders()[0], ...active.map(pushSubscriptionToRow)];
  await writeTab(PUSH_TAB, data);
}

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await readTab(SETTINGS_TAB);
  const settings: Record<string, string> = {};
  for (const row of rows.slice(1)) {
    if (row[0]) settings[row[0]] = row[1] ?? "";
  }
  return settings;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const rows = await readTab(SETTINGS_TAB);
  const data = rows.length > 0 ? rows : getSettingsHeaders();
  const idx = data.findIndex((r) => r[0] === key);
  if (idx >= 0) {
    data[idx] = [key, value];
  } else {
    data.push([key, value]);
  }
  await writeTab(SETTINGS_TAB, data);
}
