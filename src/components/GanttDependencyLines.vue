<template>
  <svg
    v-if="paths.length > 0"
    class="absolute top-0 left-0 w-full h-full pointer-events-none z-30"
    :style="{ overflow: 'visible' }"
  >
    <defs>
      <marker
        id="arrowhead"
        markerWidth="8"
        markerHeight="6"
        refX="8"
        refY="3"
        orient="auto"
      >
        <polygon points="0 0, 8 3, 0 6" class="fill-gray-400" />
      </marker>
    </defs>
    <path
      v-for="(p, idx) in paths"
      :key="idx"
      :d="p.d"
      fill="none"
      stroke-width="1.5"
      class="stroke-gray-400"
      marker-end="url(#arrowhead)"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { GanttEvent, FlattenedRow } from "../types/gantt";

interface ArrowPath {
  d: string;
}

const props = defineProps<{
  events: GanttEvent[];
  visibleRows: FlattenedRow[];
  dateToPixel: (date: Date) => number;
  rowHeight: number;
}>();

function getRowIndex(rowId: string): number {
  return props.visibleRows.findIndex((r) => r.id === rowId);
}

function durationToPixel(start: Date, end: Date): number {
  return props.dateToPixel(end) - props.dateToPixel(start);
}

const paths = computed<ArrowPath[]>(() => {
  const result: ArrowPath[] = [];
  const eventMap = new Map<string, GanttEvent>();
  for (const evt of props.events) {
    eventMap.set(evt.id, evt);
  }

  const visibleRowIds = new Set(props.visibleRows.map((r) => r.id));

  for (const evt of props.events) {
    if (!evt.dependencies || evt.dependencies.length === 0) continue;
    if (!visibleRowIds.has(evt.rowId)) continue;

    for (const depId of evt.dependencies) {
      const dep = eventMap.get(depId);
      if (!dep || !visibleRowIds.has(dep.rowId)) continue;

      const depRowIdx = getRowIndex(dep.rowId);
      const evtRowIdx = getRowIndex(evt.rowId);
      if (depRowIdx < 0 || evtRowIdx < 0) continue;

      // Start: right edge center of dependency event
      const fromX = dep.isMilestone
        ? props.dateToPixel(dep.start)
        : props.dateToPixel(dep.start) + durationToPixel(dep.start, dep.end);
      const fromY = depRowIdx * props.rowHeight + props.rowHeight / 2;

      // End: left edge center of target event
      const toX = evt.isMilestone
        ? props.dateToPixel(evt.start) - props.rowHeight * 0.2
        : props.dateToPixel(evt.start);
      const toY = evtRowIdx * props.rowHeight + props.rowHeight / 2;

      // Draw path with right-angle connectors
      const midX = fromX + 15;
      let d: string;

      if (toX > fromX + 30) {
        // Simple: horizontal right, then down/up, then horizontal to target
        d = `M ${fromX} ${fromY} H ${midX} V ${toY} H ${toX}`;
      } else {
        // Target is to the left or very close — route around
        const midY = fromY + (toY > fromY ? 1 : -1) * (props.rowHeight / 2 + 5);
        d = `M ${fromX} ${fromY} H ${midX} V ${midY} H ${toX - 15} V ${toY} H ${toX}`;
      }

      result.push({ d });
    }
  }

  return result;
});
</script>
