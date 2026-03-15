<template>
  <div
    ref="chartRef"
    class="gantt-chart flex flex-col h-full rounded-lg overflow-hidden"
    tabindex="0"
    @keydown="handleKeydown"
  >
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200"
      style="background-color: var(--gantt-bg, #f3f4f6)"
    >
      <slot name="toolbar">
        <span class="text-xs" style="color: var(--gantt-text-muted, #6b7280)">
          Scale: {{ scale }}h
        </span>
      </slot>
      <button
        class="text-xs px-2 py-1 rounded transition-colors"
        style="background-color: var(--gantt-header-bg, #64748b); color: var(--gantt-header-text, #f3f4f6)"
        @click="scrollToNow"
      >
        Today
      </button>
    </div>

    <!-- Main grid -->
    <div
      class="grid flex-1 overflow-hidden p-3"
      style="grid-template-columns: auto 1fr; background-color: var(--gantt-bg, #f3f4f6)"
    >
      <!-- Sidebar: headers + identifier rows -->
      <GanttSidebar
        ref="sidebarRef"
        :headers="headers"
        :visible-rows="visibleRows"
        :row-height="rowHeight"
        :header-height="sidebarHeaderHeight"
        @group-toggle="handleGroupToggle"
      />

      <!-- Right column: timeline header + grid -->
      <div
        ref="rightColumnRef"
        class="flex flex-col overflow-auto rounded-r-lg"
        @wheel="onWheel"
      >
        <!-- Timeline header -->
        <GanttTimeline
          :timeline="timeline"
          :timeline-levels="timelineLevels"
          :cell-width="cellWidth"
          :header-height="rowHeight"
          :level-height="30"
        />

        <!-- Grid with events -->
        <div ref="gridScrollRef">
          <GanttGrid
            :events="events"
            :visible-rows="visibleRows"
            :timeline="timeline"
            :cell-width="cellWidth"
            :row-height="rowHeight"
            :scale="scale"
            :selected-event-id="selectedEventId"
            :show-current-time="options?.showCurrentTime ?? true"
            :show-hover-line="options?.showHoverLine ?? true"
            :date-to-pixel="dateToPixel"
            :pixel-to-date="pixelToDate"
            :duration-to-pixel="durationToPixel"
            :row-to-pixel="rowToPixel"
            :pixel-to-row="pixelToRow"
            :get-current-time-pixel="getCurrentTimePixel"
            @event-click="handleEventClick"
            @event-drag-end="(p) => emit('event-drag-end', p)"
            @event-resize-end="(p) => emit('event-resize-end', p)"
            @cell-click="handleCellClick"
          >
            <template #event="{ event }">
              <slot name="event" :event="event" />
            </template>
          </GanttGrid>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef } from "vue";
import type {
  GanttEvent,
  GanttGroup,
  GanttRow,
  GanttOptions,
  EventDragPayload,
  EventResizePayload,
  EventClickPayload,
  CellClickPayload,
} from "../types/gantt";
import { flattenGroups, isGanttGroup } from "../types/gantt";
import { useTimeline } from "../composables/useTimeline";
import { useScrollSync } from "../composables/useScrollSync";
import GanttSidebar from "./GanttSidebar.vue";
import GanttTimeline from "./GanttTimeline.vue";
import GanttGrid from "./GanttGrid.vue";

const props = defineProps<{
  start: Date;
  end: Date;
  events: GanttEvent[];
  rows?: (GanttRow | GanttGroup)[];
  headers: string[];
  options?: GanttOptions;
}>();

const emit = defineEmits<{
  "event-click": [payload: EventClickPayload];
  "event-drag-end": [payload: EventDragPayload];
  "event-resize-end": [payload: EventResizePayload];
  "cell-click": [payload: CellClickPayload];
  "group-toggle": [groupId: string, collapsed: boolean];
  "scale-change": [scale: number];
  "event-select": [eventId: string | null];
  "event-delete": [event: GanttEvent];
  "event-add": [event: GanttEvent];
}>();

const optionsRef = computed(() => props.options ?? {});

const {
  cellWidth,
  rowHeight,
  scale,
  timeline,
  timelineLevels,
  dateToPixel,
  pixelToDate,
  durationToPixel,
  rowToPixel,
  pixelToRow,
  getCurrentTimePixel,
  onWheel: handleWheel,
} = useTimeline(
  toRef(props, "start"),
  toRef(props, "end"),
  optionsRef,
);

// --- Sidebar header height must match timeline header total height ---
const sidebarHeaderHeight = computed(() => {
  const levelCount = timelineLevels.value.length;
  const levelH = 30;
  return rowHeight.value + (levelCount * levelH);
});

// --- Flatten rows/groups for rendering ---
const visibleRows = computed(() => {
  if (!props.rows || props.rows.length === 0) return [];
  return flattenGroups(props.rows);
});

// --- Selection state ---
const selectedEventId = ref<string | null>(null);
const chartRef = ref<HTMLElement>();

function handleEventClick(payload: EventClickPayload) {
  selectedEventId.value = payload.event.id;
  emit("event-select", payload.event.id);
  emit("event-click", payload);
}

function handleCellClick(payload: CellClickPayload) {
  selectedEventId.value = null;
  emit("event-select", null);
  emit("cell-click", payload);
}

// --- Public helpers for add/remove ---
function createEventAt(rowId: string, date: Date, durationHours = 24): GanttEvent {
  const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const start = new Date(date);
  const end = new Date(start.getTime() + durationHours * 3600000);
  return {
    id,
    rowId,
    start,
    end,
    progress: 0,
    meta: {
      title: "New Event",
      class: "bg-gray-500 rounded",
    },
  };
}

// --- Keyboard navigation ---
function handleKeydown(e: KeyboardEvent) {
  const container = rightColumnRef.value;
  const scrollAmount = cellWidth.value;

  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      if (container) container.scrollLeft -= scrollAmount;
      break;
    case "ArrowRight":
      e.preventDefault();
      if (container) container.scrollLeft += scrollAmount;
      break;
    case "ArrowUp":
      e.preventDefault();
      selectAdjacentEvent(-1);
      break;
    case "ArrowDown":
      e.preventDefault();
      selectAdjacentEvent(1);
      break;
    case "Escape":
      selectedEventId.value = null;
      emit("event-select", null);
      break;
    case "Delete":
    case "Backspace": {
      if (!selectedEventId.value) break;
      const evt = props.events.find((ev) => ev.id === selectedEventId.value);
      if (evt) {
        emit("event-delete", evt);
        selectedEventId.value = null;
        emit("event-select", null);
      }
      break;
    }
  }
}

function selectAdjacentEvent(direction: 1 | -1) {
  const nonMilestones = props.events.filter((e) => !e.isMilestone);
  if (nonMilestones.length === 0) return;

  if (!selectedEventId.value) {
    selectedEventId.value = nonMilestones[0].id;
    emit("event-select", selectedEventId.value);
    return;
  }

  const currentIdx = nonMilestones.findIndex((e) => e.id === selectedEventId.value);
  const nextIdx = Math.max(0, Math.min(currentIdx + direction, nonMilestones.length - 1));
  selectedEventId.value = nonMilestones[nextIdx].id;
  emit("event-select", selectedEventId.value);
}

// --- Group toggle ---
function handleGroupToggle(groupId: string) {
  function toggleInList(items: (GanttRow | GanttGroup)[]): boolean {
    for (const item of items) {
      if (isGanttGroup(item)) {
        if (item.id === groupId) {
          item.collapsed = !item.collapsed;
          emit("group-toggle", groupId, item.collapsed ?? false);
          return true;
        }
        if (item.children && toggleInList(item.children)) return true;
      }
    }
    return false;
  }

  if (props.rows) {
    toggleInList(props.rows);
  }
}

// --- Wheel zoom with emit ---
function onWheel(event: WheelEvent) {
  const oldScale = scale.value;
  handleWheel(event);
  if (scale.value !== oldScale) {
    emit("scale-change", scale.value);
  }
}

// --- Scroll sync between sidebar and grid ---
const sidebarRef = ref<InstanceType<typeof GanttSidebar>>();
const gridScrollRef = ref<HTMLElement>();
const rightColumnRef = ref<HTMLElement>();

const sidebarRowsRef = computed(() => sidebarRef.value?.rowsRef);
useScrollSync(sidebarRowsRef, gridScrollRef);

// --- Scroll to now ---
function scrollToNow() {
  const container = rightColumnRef.value;
  if (!container) return;
  const nowPx = getCurrentTimePixel();
  container.scrollLeft = Math.max(0, nowPx - container.clientWidth / 2);
}

// --- Expose for parent ---
defineExpose({ scale, scrollToNow, selectedEventId, createEventAt });
</script>
