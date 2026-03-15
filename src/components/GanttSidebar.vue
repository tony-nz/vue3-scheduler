<template>
  <div ref="sidebarRef" class="gantt-sidebar w-[250px] border-r overflow-hidden"
    style="background-color: var(--gantt-sidebar-bg, #d1d5db)"
  >
    <!-- Headers -->
    <div class="flex border-b">
      <div
        v-for="(header, index) in headers"
        :key="index"
        class="grid w-full text-left items-center relative p-2.5 mr-px text-xs"
        :style="{
          minHeight: `${headerHeight}px`,
          maxHeight: `${headerHeight}px`,
          backgroundColor: 'var(--gantt-header-bg, #64748b)',
          color: 'var(--gantt-header-text, #f3f4f6)',
        }"
      >
        {{ header }}
      </div>
    </div>

    <!-- Rows -->
    <div ref="rowsRef" class="overflow-auto" :style="{ maxHeight: `calc(100% - ${headerHeight}px)` }">
      <div
        v-for="row in visibleRows"
        :key="row.id"
        class="flex flex-row w-full border-b bg-white"
        :style="{
          minHeight: `${rowHeight}px`,
          maxHeight: `${rowHeight}px`,
        }"
      >
        <div
          v-if="row.isGroup"
          class="flex items-center w-full px-2 text-xs font-semibold cursor-pointer select-none"
          style="background-color: var(--gantt-group-bg, #f9fafb); color: var(--gantt-group-text, #4b5563)"
          :style="{ paddingLeft: `${row.depth * 16 + 8}px` }"
          @click="$emit('group-toggle', row.id)"
        >
          <svg
            class="w-3 h-3 mr-1.5 transition-transform"
            :class="{ 'rotate-90': !row.collapsed }"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clip-rule="evenodd"
            />
          </svg>
          {{ row.columns[0] }}
        </div>
        <template v-else>
          <div
            v-for="(col, colIdx) in row.columns"
            :key="colIdx"
            class="grid w-full text-left relative p-2.5 mr-px text-xs leading-10"
            style="color: var(--gantt-text-muted, #9ca3af)"
            :style="{ paddingLeft: `${row.depth * 16 + 10}px` }"
          >
            {{ col }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FlattenedRow } from "../types/gantt";

defineProps<{
  headers: string[];
  visibleRows: FlattenedRow[];
  rowHeight: number;
  headerHeight: number;
}>();

defineEmits<{
  "group-toggle": [groupId: string];
}>();

const sidebarRef = ref<HTMLElement>();
const rowsRef = ref<HTMLElement>();

defineExpose({ rowsRef });
</script>
