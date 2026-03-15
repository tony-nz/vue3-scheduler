// --- Core types ---

export type ScaleUnit = "minutes" | "hours" | "days" | "weeks" | "months";
export type DependencyType =
  | "finish-to-start"
  | "start-to-start"
  | "finish-to-finish"
  | "start-to-finish";

// --- Row & Group ---

export interface GanttRow {
  id: string;
  columns: string[];
  groupId?: string;
}

export interface GanttGroup {
  id: string;
  label: string;
  collapsed?: boolean;
  children?: (GanttRow | GanttGroup)[];
}

// --- Events ---

export interface GanttEvent {
  id: string;
  rowId: string;
  start: Date;
  end: Date;
  progress?: number;
  isMilestone?: boolean;
  dependencies?: string[];
  meta?: {
    class?: string;
    title?: string;
    description?: string;
    [key: string]: unknown;
  };
}

// --- Options ---

export interface GanttTimelineLevel {
  unit: ScaleUnit;
  format?: string;
}

export interface GanttOptions {
  cellWidth?: number;
  rowHeight?: number;
  scale?: number;
  scaleUnit?: ScaleUnit;
  timelineLevels?: GanttTimelineLevel[];
  scrollSpeed?: number;
  showCurrentTime?: boolean;
  showHoverLine?: boolean;
}

export const DEFAULT_OPTIONS: Required<
  Omit<GanttOptions, "timelineLevels" | "scaleUnit">
> = {
  cellWidth: 100,
  rowHeight: 50,
  scale: 0.5,
  scrollSpeed: 5,
  showCurrentTime: true,
  showHoverLine: true,
};

// --- Emit payloads ---

export interface EventDragPayload {
  event: GanttEvent;
  oldStart: Date;
  oldEnd: Date;
  oldRowId: string;
}

export interface EventResizePayload {
  event: GanttEvent;
  edge: "left" | "right";
  oldStart: Date;
  oldEnd: Date;
}

export interface EventClickPayload {
  event: GanttEvent;
  nativeEvent: MouseEvent;
}

export interface CellClickPayload {
  rowId: string;
  date: Date;
  nativeEvent: MouseEvent;
}

// --- Helpers ---

export function isGanttGroup(
  item: GanttRow | GanttGroup
): item is GanttGroup {
  return "children" in item || "label" in item;
}

export interface FlattenedRow {
  id: string;
  columns: string[];
  depth: number;
  isGroup: boolean;
  collapsed?: boolean;
  hasChildren?: boolean;
}

export function flattenGroups(
  items: (GanttRow | GanttGroup)[],
  depth = 0,
): FlattenedRow[] {
  const result: FlattenedRow[] = [];
  for (const item of items) {
    if (isGanttGroup(item)) {
      result.push({
        id: item.id,
        columns: [item.label],
        depth,
        isGroup: true,
        collapsed: item.collapsed ?? false,
        hasChildren: (item.children?.length ?? 0) > 0,
      });
      if (!item.collapsed && item.children) {
        result.push(...flattenGroups(item.children, depth + 1));
      }
    } else {
      result.push({
        id: item.id,
        columns: item.columns,
        depth,
        isGroup: false,
      });
    }
  }
  return result;
}
