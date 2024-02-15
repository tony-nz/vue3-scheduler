<template>
  <div
    class="container mx-auto flex h-screen items-center justify-center overscroll-none"
  >
    <div class="bg-white grid rounded-lg max-w-6xl p-6 overscroll-none">
      <div class="flex flex-row justify-between p-4">
        <h1 class="text-2xl font-bold">Scheduler</h1>
        <div>Scale: {{ scale }} ({{ scale * 60 }}min)</div>
      </div>
      <div
        id="main-timeline"
        class="overflow-hidden overscroll-none"
        @wheel="onWheel"
      >
        <div
          id="grids"
          class="grid h-full rounded-lg overflow-auto overscroll-none bg-gray-100 p-3"
          style="grid-template-areas: 'grid1 grid2 grid2 grid2 grid2 '"
        >
          <div
            id="main-items"
            class="w-[250px] border-r rounded-l-lg bg-gray-100 mr-px overflow-hidden overscroll-noner"
          >
            <div id="row-header" class="flex">
              <div
                v-for="(row, index) in headers"
                :key="index"
                class="grid w-full text-left items-center relative p-2.5 mr-px text-xs text-gray-100 bg-slate-500"
                :style="
                  'min-width: ' +
                  cellWidth +
                  'px; ' +
                  'min-height: ' +
                  rowHeight +
                  'px; ' +
                  'max-height: ' +
                  rowHeight +
                  'px; '
                "
              >
                {{ row }}
              </div>
            </div>
            <div id="body" class="relative">
              <div
                v-for="(row, index) in items"
                :key="index"
                class="flex flex-row w-full"
              >
                <div
                  v-for="col in row"
                  :key="col"
                  class="grid w-full text-left relative mt-px p-2.5 mr-px bg-white text-xs text-gray-400 leading-10 text-medium"
                  :class="'min-w-[' + cellWidth + 'px]'"
                >
                  {{ col }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-col overflow-auto rounded-r-lg">
            <div id="head" class="flex">
              <div
                v-for="time in timeline"
                :key="time"
                class="text-center items-center relative p-2.5 border-r bg-slate-500 text-xs text-gray-100"
                :style="
                  'min-width: ' +
                  cellWidth +
                  'px; ' +
                  'max-width: ' +
                  cellWidth +
                  'px; ' +
                  'min-height: ' +
                  rowHeight +
                  'px; ' +
                  'max-height: ' +
                  rowHeight +
                  'px; '
                "
              >
                <span v-if="time === '24:00'">00:00 AM</span>
                <span v-else
                  >{{ time }}
                  <span class="uppercase">{{ getTimeOfDay(time) }}</span></span
                >
              </div>
            </div>
            <div
              id="body"
              class="relative"
              @mousemove="handleMouseMove"
              @mouseleave="handleMouseLeave"
            >
              <div
                v-if="showVerticalLine"
                id="vertical-line"
                :style="{ left: verticalLineX + 'px' }"
                class="z-20 absolute top-0 bottom-0 border-r-2 border-emerald-600 opacity-60"
              />
              <div
                class="z-20 border-r-2 border-red-500 h-full align-center flex absolute"
                :style="{
                  left: `${getCurrentTimePosition}px`,
                }"
              />
              <div
                v-for="(timeline, index) in data"
                :key="index"
                draggable="true"
                class="z-10 align-center flex absolute text-center text-xs rounded-md text-nowrap"
                :class="timeline.background + ' ' + timeline.text"
                style="margin-top: 4px; height: 53px"
                :style="{
                  width: `${eventProperties[index].width}px`,
                  left: `${eventProperties[index].left}px`,
                  top: `${eventProperties[index].top}px`,
                }"
                @dragstart="startDrag($event, timeline)"
                @dragover.prevent="dragOverRow = index"
                @dragenter.prevent="dragOverRow = index"
                @dragleave.prevent="dragOverRow = null"
                @drop="onDrop($event, timeline)"
              >
                <div class="p-1">
                  <div>start: {{ timeline.start }}</div>
                  <div>end: {{ timeline.end }}</div>
                </div>
              </div>
              <div v-for="(row, index) in items" :key="index" class="flex">
                <div
                  v-for="(_time, timeIdx) in timeline"
                  :key="timeIdx"
                  class="drop-zone text-center relative mt-px p-2.5 border-r bg-white text-xs text-white leading-10 text-medium"
                  :style="
                    'min-width: ' +
                    cellWidth +
                    'px; ' +
                    'max-width: ' +
                    cellWidth +
                    'px; ' +
                    'min-height: ' +
                    rowHeight +
                    'px; ' +
                    'max-height: ' +
                    rowHeight +
                    'px; '
                  "
                  @drop="onDrop($event, row)"
                  @dragover.prevent
                  @dragenter.prevent
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";

interface TimelineItem {
  background: string;
  text: string;
  start: string;
  end: string;
  row: number;
  // Add other properties as needed
}
interface IItem {
  start: string;
  end: string;
  row: number;
}

export default defineComponent({
  name: "VueScheduler",
  props: {
    data: {
      type: Array as PropType<TimelineItem[]>,
      required: true,
    },
    headers: {
      type: Array,
      required: true,
    },
    items: {
      type: Array,
      required: true,
    },
  },
  setup(props) {
    const cellWidth = ref(50);
    const clicksDown = ref(0);
    const clicksUp = ref(0);
    const draggingItem = ref<TimelineItem | null>(null);
    const dragOverRow = ref<number | null>(null);
    const rowHeight = ref(60);
    const scale = ref(0.5);
    const showVerticalLine = ref(false);
    const timeline = computed(() => generateTimeline(scale.value));
    const verticalLineX = ref(0);

    /**
     * Returns "am" or "pm" based on the time
     */
    const getTimeOfDay = (time: string) => {
      const hour = parseInt(time.split(":")[0]);
      if (hour < 12) {
        return "am";
      }
      return "pm";
    };

    /**
     * Generate the timeline based on the scale
     * @param scale
     * @returns {Array} Array of strings representing the time slots
     */
    function generateTimeline(scale: number) {
      const startTime = 0; // Assuming start time is 00:00
      const endTime = 24 * 60; // Assuming end time is 23:00 converted to minutes

      const timeSlots = [];
      for (let time = startTime; time <= endTime; time += scale * 60) {
        timeSlots.push(formatTime(time));
      }

      return timeSlots;
    }

    /**
     * Helper function to format time in HH:mm format
     * @param {number} minutes
     * @returns {string} Formatted time
     */
    function formatTime(minutes: number) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(
        2,
        "0"
      )}`;
    }

    /**
     *
     * Calculate the properties of the events
     * based on the scale and the start and end time
     * of the event
     * @returns {Array} Array of objects with top, left and width properties
     */
    const eventProperties = computed(() => {
      return props.data.map((event) => {
        const { start, end, row } = event as IItem;
        const [startHour, startMinutes] = start.split(":");
        const [endHour, endMinutes] = end.split(":");
        const startInMinutes =
          (parseInt(startHour) === parseInt("00")
            ? parseInt(startHour)
            : parseInt(startHour) - 0) *
            60 +
          parseInt(startMinutes);
        const endInMinutes = parseInt(endHour) * 60 + parseInt(endMinutes);

        // Calculate the width based on the scale
        const eventWidth =
          ((endInMinutes - startInMinutes) / (scale.value * 60)) *
          cellWidth.value;

        // convert scale (0.25) to time (15)

        const top = row * rowHeight.value + (row + 1) * 1;
        const left =
          (parseInt(startHour) * 60 + parseInt(startMinutes)) *
            (cellWidth.value / (scale.value * 60)) +
          1;

        return { top, left, width: eventWidth };
      });
    });

    /**
     * Scroll to zoom in and out
     * @param e
     * @returns {void}
     */
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        clicksUp.value++;
        if (clicksUp.value === 5) {
          scale.value = Math.min(scale.value + 0.25, 5); // Limit the scale to 5
          clicksUp.value = 0;
        }
      }
      if (event.deltaY > 0) {
        clicksDown.value++;
        if (clicksDown.value === 5) {
          scale.value = Math.max(scale.value - 0.25, 0.25); // Limit the scale to 0.25
          clicksDown.value = 0;
        }
      }
    };

    /**
     * Get the current time position
     * @returns {number} Current time position in pixels
     */
    const getCurrentTimePosition = computed(() => {
      const date = new Date();
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      const timeInMinutes = hours * 60 + minutes + seconds / 60;
      return timeInMinutes * (cellWidth.value / (scale.value * 60)) + 1;
    });

    /**
     * Show the vertical line on mouse move
     * @param event
     * @returns {void}
     */
    const handleMouseMove = (event: MouseEvent) => {
      const bodyRect = document.getElementById("body")?.getBoundingClientRect();
      if (!bodyRect) return;
      const mouseX = event.clientX - bodyRect.left;
      verticalLineX.value = mouseX - 250;
      showVerticalLine.value = true;
    };

    /**
     * Hide the vertical line on mouse leave
     * @returns {void}
     */
    const handleMouseLeave = () => {
      showVerticalLine.value = false;
    };

    /**
     * Start dragging the event
     * @param evt
     * @param item
     */
    const startDrag = (event: DragEvent, item: TimelineItem) => {
      if (!event.dataTransfer) return;
      event.dataTransfer.dropEffect = "move";
      event.dataTransfer.effectAllowed = "move";
      draggingItem.value = item;
    };

    /**
     * Drop the event
     * @param evt
     * @param index
     */
    const onDrop = (event: DragEvent, row: unknown) => {
      if (draggingItem.value) {
        console.log(event, row);
        // Move the dragged item to the new row
        // draggingItem.value.row = index - 1;
        // draggingItem.value = null;
        // dragOverRow.value = null;
      }
    };

    return {
      cellWidth,
      draggingItem,
      dragOverRow,
      eventProperties,
      getCurrentTimePosition,
      getTimeOfDay,
      handleMouseMove,
      handleMouseLeave,
      onDrop,
      onWheel,
      rowHeight,
      scale,
      showVerticalLine,
      startDrag,
      timeline,
      verticalLineX,
    };
  },
});
</script>
