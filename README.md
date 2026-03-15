# Vue3 Gantt Chart

Interactive Gantt chart component built with Vue 3, TypeScript, and Tailwind CSS.

**[View Demo](https://vue3-scheduler.netlify.app/)**

## Features

- Drag-and-drop event repositioning
- Resize events from left and right edges
- Dependency arrows between linked events (SVG overlay)
- Progress bars on event bars
- Milestone markers (diamond shape)
- Collapsible row groups with deep nesting
- Multi-level timeline headers (days/weeks/months)
- Mouse wheel zoom to adjust time scale
- Current time indicator and hover line
- Keyboard navigation (arrow keys, delete, escape)
- Event selection with visual highlight
- Click empty cells to create events
- Scroll-to-today button
- CSS variable theming (6 built-in themes)
- Synchronized sidebar/grid scrolling

## Getting Started

```sh
npm install
npm run dev
```

## Usage

```vue
<template>
  <GanttChart
    :start="startDate"
    :end="endDate"
    :events="events"
    :rows="rows"
    :headers="['Task', 'Owner']"
    :options="options"
    @event-click="onEventClick"
    @event-drag-end="onDragEnd"
    @event-resize-end="onResizeEnd"
    @cell-click="onCellClick"
    @group-toggle="onGroupToggle"
    @event-delete="onEventDelete"
  >
    <template #event="{ event }">
      <div class="px-2 py-1 text-xs text-white truncate">
        <div class="font-bold">{{ event.meta?.title }}</div>
      </div>
    </template>
  </GanttChart>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import type { GanttEvent, GanttGroup, GanttOptions } from "./types/gantt";
import GanttChart from "./components/GanttChart.vue";

const startDate = new Date(2024, 2, 1);
const endDate = new Date(2024, 3, 1);

const options: GanttOptions = {
  cellWidth: 80,
  rowHeight: 45,
  scale: 24,            // hours per cell
  scaleUnit: "days",
  scrollSpeed: 3,
  showCurrentTime: true,
  showHoverLine: true,
  timelineLevels: [{ unit: "weeks" }],
};

const rows = reactive<GanttGroup[]>([
  {
    id: "phase-1",
    label: "Phase 1",
    children: [
      { id: "task-1", columns: ["Design", "Alice"] },
      { id: "task-2", columns: ["Development", "Bob"] },
    ],
  },
]);

const events = ref<GanttEvent[]>([
  {
    id: "evt-1",
    rowId: "task-1",
    start: new Date(2024, 2, 1, 8, 0),
    end: new Date(2024, 2, 5, 17, 0),
    progress: 75,
    meta: {
      title: "Design",
      description: "UI/UX design",
      class: "bg-blue-500 rounded",
    },
  },
  {
    id: "evt-2",
    rowId: "task-2",
    start: new Date(2024, 2, 5, 8, 0),
    end: new Date(2024, 2, 15, 17, 0),
    progress: 30,
    dependencies: ["evt-1"],
    meta: {
      title: "Development",
      description: "Build features",
      class: "bg-emerald-500 rounded",
    },
  },
]);
</script>
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `start` | `Date` | Yes | Timeline start date |
| `end` | `Date` | Yes | Timeline end date |
| `events` | `GanttEvent[]` | Yes | Array of events to display |
| `rows` | `(GanttRow \| GanttGroup)[]` | No | Row/group definitions for the sidebar |
| `headers` | `string[]` | Yes | Column headers for the sidebar |
| `options` | `GanttOptions` | No | Display and behavior options |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `event-click` | `EventClickPayload` | Event bar clicked |
| `event-drag-end` | `EventDragPayload` | Event finished dragging |
| `event-resize-end` | `EventResizePayload` | Event finished resizing |
| `cell-click` | `CellClickPayload` | Empty grid cell clicked |
| `group-toggle` | `groupId, collapsed` | Group expanded/collapsed |
| `scale-change` | `scale` | Zoom level changed |
| `event-select` | `eventId \| null` | Event selected/deselected |
| `event-delete` | `GanttEvent` | Delete key pressed on selected event |

## Data Types

```typescript
interface GanttEvent {
  id: string;
  rowId: string;
  start: Date;
  end: Date;
  progress?: number;        // 0-100
  isMilestone?: boolean;    // renders as diamond
  dependencies?: string[];  // event IDs (draws arrows)
  meta?: {
    class?: string;         // Tailwind classes for styling
    title?: string;
    description?: string;
    [key: string]: unknown;
  };
}

interface GanttGroup {
  id: string;
  label: string;
  collapsed?: boolean;
  children?: (GanttRow | GanttGroup)[];  // supports deep nesting
}

interface GanttRow {
  id: string;
  columns: string[];
}

interface GanttOptions {
  cellWidth?: number;       // default 100
  rowHeight?: number;       // default 50
  scale?: number;           // hours per cell
  scaleUnit?: ScaleUnit;    // "minutes" | "hours" | "days" | "weeks" | "months"
  timelineLevels?: GanttTimelineLevel[];
  scrollSpeed?: number;     // wheel events before zoom
  showCurrentTime?: boolean;
  showHoverLine?: boolean;
}
```

## Theming

Override CSS variables on any parent element:

```css
.my-gantt {
  --gantt-bg: #1e293b;
  --gantt-header-bg: #334155;
  --gantt-header-bg-alt: #1e293b;
  --gantt-header-text: #e2e8f0;
  --gantt-sidebar-bg: #334155;
  --gantt-group-bg: #1e293b;
  --gantt-group-text: #94a3b8;
  --gantt-text-muted: #64748b;
  --gantt-cell-bg: #0f172a;
  --gantt-grid-border: #334155;
}
```

## Tech Stack

- **Vue 3** with `<script setup>` and Composition API
- **TypeScript** with strict mode
- **Tailwind CSS** for styling
- **InteractJS** for drag and resize interactions
- **Vite** for development and builds

## Architecture

```
src/
  types/gantt.ts              # All interfaces and helpers
  composables/
    useTimeline.ts            # Timeline generation, pixel math, zoom
    useInteract.ts            # Drag/resize via InteractJS
    useScrollSync.ts          # Synchronized scrolling
  components/
    GanttChart.vue            # Root orchestrator
    GanttSidebar.vue          # Left column with groups
    GanttTimeline.vue         # Multi-level timeline header
    GanttGrid.vue             # Grid cells + event overlay
    GanttEventBar.vue         # Single event bar
    GanttDependencyLines.vue  # SVG dependency arrows
    GanttCurrentTimeLine.vue  # Red "now" line
    GanttHoverLine.vue        # Mouse-following line
```

## License

Distributed under the MIT License. See [LICENSE](https://github.com/tony-nz/vue3-scheduler/blob/main/LICENSE.md) for more information.
