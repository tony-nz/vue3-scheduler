<template>
  <div class="gantt-timeline sticky top-0 z-20">
    <!-- Multi-level headers (top levels) -->
    <div
      v-for="(level, levelIdx) in timelineLevels"
      :key="levelIdx"
      class="flex border-b"
    >
      <div
        v-for="(cell, cellIdx) in level"
        :key="cellIdx"
        class="text-center items-center relative px-1 py-1.5 border-r text-xs overflow-hidden truncate"
        style="background-color: var(--gantt-header-bg-alt, #475569); color: var(--gantt-header-text, #f3f4f6)"
        :style="{
          minWidth: `${cell.span * cellWidth}px`,
          maxWidth: `${cell.span * cellWidth}px`,
          minHeight: `${levelHeight}px`,
          maxHeight: `${levelHeight}px`,
        }"
      >
        <span class="whitespace-nowrap">{{ cell.label }}</span>
      </div>
    </div>

    <!-- Bottom level: individual time slots -->
    <div class="flex border-b">
      <div
        v-for="slot in timeline"
        :key="slot.id"
        class="text-center items-center relative p-2.5 border-r text-xs overflow-hidden"
        style="background-color: var(--gantt-header-bg, #64748b); color: var(--gantt-header-text, #f3f4f6)"
        :style="{
          minWidth: `${cellWidth}px`,
          maxWidth: `${cellWidth}px`,
          minHeight: `${headerHeight}px`,
          maxHeight: `${headerHeight}px`,
        }"
      >
        <span class="whitespace-nowrap">
          {{ slot.formattedDate }}
          {{ slot.formattedTime }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimelineSlot, TimelineLevelCell } from "../composables/useTimeline";

defineProps<{
  timeline: TimelineSlot[];
  timelineLevels: TimelineLevelCell[][];
  cellWidth: number;
  headerHeight: number;
  levelHeight?: number;
}>();
</script>
