<template>
  <div
    ref="eventRef"
    class="gantt-event-bar absolute flex items-stretch cursor-grab"
    :class="[
      event.meta?.class ?? 'bg-blue-500 rounded',
      selected ? 'ring-2 ring-offset-1 ring-blue-400' : '',
    ]"
    :style="{
      width: `${width}px`,
      height: `${rowHeight}px`,
      left: `${left}px`,
      top: `${top}px`,
    }"
    :data-event-id="event.id"
    @click.stop="$emit('event-click', { event, nativeEvent: $event })"
  >
    <!-- Left resize handle -->
    <div
      class="resize-handle-left absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 192 512"
        class="h-4 w-2"
      >
        <path
          class="opacity-60 fill-white"
          d="M0 64C0 46.33 14.33 32 32 32C49.67 32 64 46.33 64 64V448C64 465.7 49.67 480 32 480C14.33 480 0 465.7 0 448V64z"
        />
      </svg>
    </div>

    <!-- Progress bar fill -->
    <div
      v-if="event.progress != null && event.progress > 0"
      class="absolute inset-y-0 left-0 bg-white/20 rounded-l pointer-events-none"
      :style="{ width: `${event.progress}%` }"
    />

    <!-- Event content slot -->
    <div class="flex-1 min-w-0 overflow-hidden z-10 pointer-events-none">
      <slot :event="event">
        <div class="px-2 py-1 text-xs text-white truncate">
          {{ event.meta?.title ?? event.id }}
        </div>
      </slot>
    </div>

    <!-- Right resize handle -->
    <div
      class="resize-handle-right absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 192 512"
        class="h-4 w-2"
      >
        <path
          class="opacity-60 fill-white"
          d="M0 64C0 46.33 14.33 32 32 32C49.67 32 64 46.33 64 64V448C64 465.7 49.67 480 32 480C14.33 480 0 465.7 0 448V64z"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import type { GanttEvent, EventClickPayload } from "../types/gantt";
import { useInteract, type InteractOptions } from "../composables/useInteract";

const props = defineProps<{
  event: GanttEvent;
  left: number;
  top: number;
  width: number;
  rowHeight: number;
  cellWidth: number;
  scale: number;
  selected?: boolean;
}>();

const emit = defineEmits<{
  "event-click": [payload: EventClickPayload];
  "drag-end": [el: HTMLElement, totalX: number, totalY: number];
  "resize-end": [el: HTMLElement, width: number, edge: "left" | "right"];
}>();

const eventRef = ref<HTMLElement>();
const { initDraggable, cleanup } = useInteract();

function setupInteract() {
  if (!eventRef.value) return;
  cleanup();

  const opts: InteractOptions = {
    cellWidth: props.cellWidth,
    rowHeight: props.rowHeight,
    scale: props.scale,
    onDragEnd(el, totalX, totalY) {
      emit("drag-end", el, totalX, totalY);
    },
    onResizeEnd(el, width, edge) {
      emit("resize-end", el, width, edge);
    },
  };

  initDraggable(eventRef.value, opts);
}

onMounted(setupInteract);

watch(
  () => [props.cellWidth, props.rowHeight, props.scale],
  () => {
    setupInteract();
  },
);
</script>
