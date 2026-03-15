<template>
  <div
    ref="gridRef"
    class="gantt-grid relative overflow-hidden"
    :style="{ width: `${timeline.length * cellWidth}px` }"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- Hover line -->
    <GanttHoverLine :x="hoverX" :visible="hoverVisible && showHoverLine" />

    <!-- Current time line -->
    <GanttCurrentTimeLine
      :get-pixel-position="getCurrentTimePixel"
      :visible="showCurrentTime"
    />

    <!-- Event bars -->
    <GanttEventBar
      v-for="event in visibleEvents"
      :key="event.id"
      :event="event"
      :left="dateToPixel(event.start)"
      :top="rowToPixel(getRowIndex(event.rowId))"
      :width="durationToPixel(event.start, event.end)"
      :row-height="rowHeight"
      :cell-width="cellWidth"
      :scale="scale"
      :selected="event.id === selectedEventId"
      @event-click="$emit('event-click', $event)"
      @drag-end="(_el, dx, dy) => handleDragEnd(event, dx, dy)"
      @resize-end="(_el, width, edge) => handleResizeEnd(event, width, edge)"
    >
      <template #default="{ event: evt }">
        <slot name="event" :event="evt" />
      </template>
    </GanttEventBar>

    <!-- Milestone markers -->
    <div
      v-for="milestone in milestones"
      :key="milestone.id"
      class="absolute z-10 pointer-events-auto cursor-pointer"
      :style="{
        left: `${dateToPixel(milestone.start) - rowHeight * 0.2}px`,
        top: `${rowToPixel(getRowIndex(milestone.rowId)) + rowHeight * 0.1}px`,
        width: `${rowHeight * 0.4}px`,
        height: `${rowHeight * 0.4}px`,
      }"
      @click.stop="$emit('event-click', { event: milestone, nativeEvent: $event })"
    >
      <div
        class="w-full h-full rotate-45"
        :class="milestone.meta?.class ?? 'bg-yellow-500'"
      />
    </div>

    <!-- Dependency arrows -->
    <GanttDependencyLines
      :events="events"
      :visible-rows="visibleRows"
      :date-to-pixel="dateToPixel"
      :row-height="rowHeight"
    />

    <!-- Background grid cells -->
    <div
      v-for="row in visibleRows"
      :key="row.id"
      class="flex"
    >
      <div
        v-for="slot in timeline"
        :key="slot.id"
        class="border-b border-r text-xs"
        :style="{
          minWidth: `${cellWidth}px`,
          maxWidth: `${cellWidth}px`,
          minHeight: `${rowHeight}px`,
          maxHeight: `${rowHeight}px`,
          backgroundColor: 'var(--gantt-cell-bg, white)',
          borderColor: 'var(--gantt-grid-border, #e5e7eb)',
        }"
        @click="handleCellClick(row.id, slot.date, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type {
  GanttEvent,
  EventClickPayload,
  EventDragPayload,
  EventResizePayload,
  CellClickPayload,
  FlattenedRow,
} from "../types/gantt";
import type { TimelineSlot } from "../composables/useTimeline";
import GanttEventBar from "./GanttEventBar.vue";
import GanttCurrentTimeLine from "./GanttCurrentTimeLine.vue";
import GanttHoverLine from "./GanttHoverLine.vue";
import GanttDependencyLines from "./GanttDependencyLines.vue";

const props = defineProps<{
  events: GanttEvent[];
  visibleRows: FlattenedRow[];
  timeline: TimelineSlot[];
  cellWidth: number;
  rowHeight: number;
  scale: number;
  selectedEventId: string | null;
  showCurrentTime: boolean;
  showHoverLine: boolean;
  dateToPixel: (date: Date) => number;
  pixelToDate: (px: number) => Date;
  durationToPixel: (start: Date, end: Date) => number;
  rowToPixel: (rowIndex: number) => number;
  pixelToRow: (px: number) => number;
  getCurrentTimePixel: () => number;
}>();

const emit = defineEmits<{
  "event-click": [payload: EventClickPayload];
  "event-drag-end": [payload: EventDragPayload];
  "event-resize-end": [payload: EventResizePayload];
  "cell-click": [payload: CellClickPayload];
}>();

const gridRef = ref<HTMLElement>();
const hoverX = ref(0);
const hoverVisible = ref(false);

// Separate regular events from milestones
const visibleEvents = computed(() => {
  const visibleRowIds = new Set(props.visibleRows.map((r) => r.id));
  return props.events.filter(
    (e) => !e.isMilestone && visibleRowIds.has(e.rowId),
  );
});

const milestones = computed(() => {
  const visibleRowIds = new Set(props.visibleRows.map((r) => r.id));
  return props.events.filter(
    (e) => e.isMilestone && visibleRowIds.has(e.rowId),
  );
});

function getRowIndex(rowId: string): number {
  return props.visibleRows.findIndex((r) => r.id === rowId);
}

// --- Mouse hover ---
function onMouseMove(event: MouseEvent) {
  if (!gridRef.value) return;
  const rect = gridRef.value.getBoundingClientRect();
  hoverX.value = event.clientX - rect.left;
  hoverVisible.value = true;
}

function onMouseLeave() {
  hoverVisible.value = false;
}

// --- Drag end: convert pixel delta to new dates ---
function handleDragEnd(event: GanttEvent, dx: number, dy: number) {
  const durationMs = event.end.getTime() - event.start.getTime();
  const currentLeft = props.dateToPixel(event.start);
  const newStart = props.pixelToDate(currentLeft + dx);
  const newEnd = new Date(newStart.getTime() + durationMs);

  const currentRowIdx = getRowIndex(event.rowId);
  const newRowIdx = Math.max(
    0,
    Math.min(currentRowIdx + Math.round(dy / props.rowHeight), props.visibleRows.length - 1),
  );
  const newRowId = props.visibleRows[newRowIdx]?.id ?? event.rowId;

  emit("event-drag-end", {
    event: { ...event, start: newStart, end: newEnd, rowId: newRowId },
    oldStart: event.start,
    oldEnd: event.end,
    oldRowId: event.rowId,
  });
}

// --- Resize end: convert pixel width to new dates ---
function handleResizeEnd(
  event: GanttEvent,
  newWidth: number,
  edge: "left" | "right",
) {
  const oldStart = event.start;
  const oldEnd = event.end;

  if (edge === "right") {
    const minutesDuration =
      (newWidth / props.cellWidth) * props.scale * 60;
    const newEnd = new Date(
      event.start.getTime() + minutesDuration * 60000,
    );
    emit("event-resize-end", {
      event: { ...event, end: newEnd },
      edge,
      oldStart,
      oldEnd,
    });
  } else {
    const currentLeft = props.dateToPixel(event.start);
    const newLeft = currentLeft + (props.durationToPixel(event.start, event.end) - newWidth);
    const newStart = props.pixelToDate(newLeft);
    emit("event-resize-end", {
      event: { ...event, start: newStart },
      edge,
      oldStart,
      oldEnd,
    });
  }
}

// --- Cell click ---
function handleCellClick(rowId: string, date: Date, nativeEvent: MouseEvent) {
  emit("cell-click", { rowId, date, nativeEvent });
}
</script>
