# Vue3 Scheduler -> Gantt Chart Transformation

## Context

The current project has two scheduler components (V1 and V2), both with significant issues. V2 has critical bugs — drag/resize are completely broken, no events are emitted to the parent, and types are duplicated. The goal is to consolidate into a single, well-architected Gantt chart component with proper decomposition, bug fixes, and new features like dependency arrows, progress bars, collapsible groups, and multi-level timeline headers.

---

## New File Structure

```
src/
  types/
    gantt.ts                        # All interfaces (replaces VueScheduler.ts)
  composables/
    useTimeline.ts                  # Timeline generation, scale, time<->pixel math
    useInteract.ts                  # InteractJS drag/resize (fixes all bugs)
    useScrollSync.ts                # Sync sidebar + grid vertical scroll
  components/
    GanttChart.vue                  # Root orchestrator
    GanttSidebar.vue                # Left column: headers + rows + collapsible groups
    GanttTimeline.vue               # Multi-level timeline header
    GanttGrid.vue                   # Background grid + event overlay + SVG arrows
    GanttEventBar.vue               # Single event bar (progress, resize handles, slot)
    GanttMilestone.vue              # Diamond milestone marker
    GanttDependencyLines.vue        # SVG overlay for dependency arrows
    GanttCurrentTimeLine.vue        # Red vertical "now" line
    GanttHoverLine.vue              # Mouse-following vertical line
  App.vue                          # Demo harness
```

**Files to delete:** `src/components/VueScheduler.vue`, `src/types/VueScheduler.ts`

---

## Phase 1: Bug Fixes, Consolidation & Foundation

> **Status: COMPLETE**

### 1.1 — New type definitions (`src/types/gantt.ts`)

- [x] Create `GanttEvent` interface (id, rowId, start, end, progress, isMilestone, dependencies, meta)
- [x] Create `GanttRow` interface (id, columns, groupId)
- [x] Create `GanttGroup` interface (id, label, collapsed, recursive children)
- [x] Create `GanttOptions` interface (cellWidth, rowHeight, scale, timelineLevels, etc.)
- [x] Create emit payload interfaces (EventDragPayload, EventResizePayload, EventClickPayload, CellClickPayload)
- [x] Create ScaleUnit, DependencyType types

```typescript
export interface GanttEvent {
  id: string;
  rowId: string;              // links to GanttRow.id
  start: Date;
  end: Date;
  progress?: number;          // 0-100
  isMilestone?: boolean;
  dependencies?: string[];    // event IDs (finish-to-start)
  meta?: { class?: string; title?: string; description?: string; [key: string]: unknown; };
}

export interface GanttRow {
  id: string;
  columns: string[];          // values for each header column
  groupId?: string;
}

export interface GanttGroup {
  id: string;
  label: string;
  collapsed?: boolean;
  children?: (GanttRow | GanttGroup)[];  // recursive: supports deep nesting
}

export type ScaleUnit = 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
export type DependencyType = 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';

export interface GanttTimelineLevel { unit: ScaleUnit; format?: string; }

export interface GanttOptions {
  cellWidth?: number;          // default 100
  rowHeight?: number;          // default 50
  scale?: number;
  scaleUnit?: ScaleUnit;
  timelineLevels?: GanttTimelineLevel[];
  scrollSpeed?: number;
  showCurrentTime?: boolean;
  showHoverLine?: boolean;
}

// Emit payloads
export interface EventDragPayload { event: GanttEvent; oldStart: Date; oldEnd: Date; oldRowId: string; }
export interface EventResizePayload { event: GanttEvent; edge: 'left' | 'right'; oldStart: Date; oldEnd: Date; }
export interface EventClickPayload { event: GanttEvent; nativeEvent: MouseEvent; }
export interface CellClickPayload { rowId: string; date: Date; nativeEvent: MouseEvent; }
```

### 1.2 — `useTimeline.ts` composable

- [x] Extract from V2's `generateTimeline`, `getEventWidth`, `getEventLeft`, `getEventRow`
- [x] `dateToPixel(date)` — convert Date to pixel left position
- [x] `pixelToDate(px)` — inverse (for drag/resize end)
- [x] `durationToPixel(start, end)` — event width
- [x] `rowToPixel(rowIndex)` — event top
- [x] `generateTimeline()` — computed timeline slots
- [x] `generateTimelineLevels()` — multi-level header data (stub, Phase 2)
- [x] `onWheel` — zoom handler
- [x] `getCurrentTimePixel()` — for current time line

### 1.3 — `useInteract.ts` composable

Fixes all 6 bugs:
- [x] **Bug 1 (broken resize):** Resize callback uses pixel math instead of string regex on `propData`
- [x] **Bug 2 (no-op dragMoveListener):** Applies `transform` during drag
- [x] **Bug 3 (drag doesn't move visually):** Transform applied during drag, reset on dragend
- [x] **Bug 4 (no emits):** Callbacks for `onDragEnd`, `onResizeEnd` that parent wires to Vue emits
- [x] **Bug 5 (global pollution):** No `window.dragMoveListener`, uses closures
- [x] **Bug 6 (interactjs in devDeps):** Moved to `dependencies` in package.json
- [x] **New:** Proper cleanup via `interact(el).unset()` on unmount

### 1.4 — `GanttChart.vue` (root component, `<script setup lang="ts">`)

- [x] Props: `start`, `end`, `events`, `rows`, `headers`, `options`
- [x] Emits: `event-drag-end`, `event-resize-end`, `event-click`, `cell-click`, `group-toggle`, `scale-change`
- [x] CSS Grid layout: sidebar (left) + timeline/grid (right)
- [x] Scroll sync between sidebar and grid
- [x] Slot: `#event` passed through to `GanttEventBar`

### 1.5 — Sub-components

- [x] **GanttSidebar.vue** — Headers + identifier rows, group collapse toggle, indent support
- [x] **GanttTimeline.vue** — Timeline header with formatted date/time slots
- [x] **GanttGrid.vue** — Empty background cells + absolutely-positioned events + milestones
- [x] **GanttEventBar.vue** — Single event with progress fill, left+right resize handles, `#event` slot

### 1.6 — Port V1 features missing in V2

- [x] Current time indicator (`GanttCurrentTimeLine.vue`)
- [x] Hover line indicator (`GanttHoverLine.vue`, no hardcoded offset)

### 1.7 — Cleanup

- [x] Delete `VueScheduler.vue`, `VueSchedulerV2.vue`, `VueScheduler.ts`
- [x] Move `interactjs` to `dependencies`
- [x] Update `App.vue` with new GanttChart + project plan demo data
- [x] TypeScript type check passes
- [x] Production build succeeds

---

## Phase 2: Gantt Features

> **Status: COMPLETE**

### 2.1 — Multi-level timeline header
- [x] `GanttTimeline.vue` renders merged cells with configurable levels
- [x] Configurable via `options.timelineLevels` array (e.g., `[{unit:'weeks', format:'Week dd'}]`)
- [x] `useTimeline.ts` generates level cells with span counts via `generateTimelineLevel()`
- [x] Custom format strings supported (YYYY, MMM, DD, dd, HH, mm)

### 2.2 — Progress bars
- [x] In `GanttEventBar.vue`, progress fill div with `bg-white/20` overlay (implemented in Phase 1)

### 2.3 — Dependency arrows (`GanttDependencyLines.vue`)
- [x] SVG overlay with `pointer-events: none` over the grid
- [x] Right-angle connector paths from source right edge to target left edge
- [x] Arrowhead via SVG `<marker>` definition
- [x] Handles milestones, hidden rows, and close/overlapping events

### 2.4 — Collapsible row groups (deep nesting)
- [x] Recursive `GanttGroup.children` with `flattenGroups()` helper (implemented in Phase 1)
- [x] Sidebar renders with increasing indent per depth level
- [x] Collapsing a parent hides all descendants
- [x] Chevron icon on group rows

### 2.5 — Milestones
- [x] Diamond shape (rotated square) in `GanttGrid.vue` (implemented in Phase 1)
- [x] Positioned at `start` date, sized relative to rowHeight

### 2.6 — Current time line (`GanttCurrentTimeLine.vue`)
- [x] Red vertical line with dot marker, updates every 60s (implemented in Phase 1)
- [x] Conditional on `options.showCurrentTime`

### 2.7 — Left-edge resize
- [x] Left resize handle in `GanttEventBar.vue` (implemented in Phase 1)
- [x] `useInteract.ts` handles left edge with `deltaRect.left` adjustment

### 2.8 — Click-to-create
- [x] `@click` on empty grid cells emits `cell-click` with `{ rowId, date }` (implemented in Phase 1)

### 2.9 — Scroll-to-now button
- [x] "Today" button in `GanttChart.vue` toolbar
- [x] `scrollToNow()` centers the viewport on the current time
- [x] Toolbar slot available for customization

---

## Phase 3: Polish

> **Status: COMPLETE**

### 3.1 — `useScrollSync.ts`
- [x] Extracted to `src/composables/useScrollSync.ts`
- [x] `requestAnimationFrame` + syncing flag to prevent infinite loops
- [x] Auto-reconnects via `watch` when refs resolve after mount

### 3.2 — Keyboard navigation
- [x] Arrow Left/Right to scroll timeline
- [x] Arrow Up/Down to select adjacent events
- [x] Delete/Backspace emits `event-delete`
- [x] Escape to deselect
- [x] Selected event state as `ref<string | null>` with `ring-2` visual indicator
- [x] New emits: `event-select`, `event-delete`

### 3.3 — CSS variable theming
- [x] All structural colors use `var(--gantt-*)` with Tailwind-equivalent fallbacks
- [x] Variables: `--gantt-bg`, `--gantt-header-bg`, `--gantt-header-bg-alt`, `--gantt-header-text`, `--gantt-sidebar-bg`, `--gantt-group-bg`, `--gantt-group-text`, `--gantt-text-muted`, `--gantt-cell-bg`, `--gantt-grid-border`
- [x] Override at any parent level to theme the entire chart

---

## Key Design Decisions

1. **SVG overlay for dependency arrows** (not inline per-event) — simpler, arrows can cross element boundaries, `pointer-events: none` avoids blocking interactions
2. **InteractJS for gesture detection only** — apply `transform` during drag for visual feedback, then update reactive data on `dragend` so Vue re-renders correctly
3. **String IDs on events/rows** (not numeric indices) — required for dependency references, decouples from array order
4. **Recursive groups** — `GanttGroup.children` can contain both `GanttRow` and nested `GanttGroup` items, supporting deep project hierarchies. Sidebar renders with increasing indent per depth level. Collapsing a parent hides all descendants.
5. **Composables over mixins** — `useTimeline`, `useInteract`, `useScrollSync` are testable, reusable, and follow Vue 3 patterns

---

## Execution Strategy

**Phase 1 first.** Get the foundation solid (types, composables, bug fixes, component decomposition), verify it works, then layer on Gantt features in Phase 2. Phase 3 (polish) comes last.

## Demo Data

App.vue will use a **realistic software project plan**: phases (Design, Development, QA, Launch) as groups, tasks as events within each phase, milestones at phase gates, and dependencies between tasks. This showcases all Gantt features naturally.

## Verification

1. `npm run dev` — demo should render with sample events, timeline, and sidebar
2. Drag an event — should move visually, snap to grid, emit `event-drag-end` with correct dates
3. Resize from left and right edges — should emit `event-resize-end` with updated dates
4. Mouse wheel — should zoom in/out, timeline re-renders
5. Click empty cell — should emit `cell-click` with correct row and date
6. Collapse a group — child rows and their events should hide/show
7. Dependency arrows — should render between linked events
8. Progress bars — should show fill percentage
9. Current time line — red line at correct position
10. Scroll sync — sidebar and grid scroll together vertically
