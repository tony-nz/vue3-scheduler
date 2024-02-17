<template>
  <div
    class="container mx-auto flex h-screen items-center justify-center overscroll-none"
  >
    <div class="bg-white grid rounded-lg max-w-6xl p-6 overscroll-none">
      <div class="flex flex-row justify-between p-4">
        <h1 class="text-2xl font-bold">Scheduler</h1>
        <div>Scale: {{ scale }} ({{ getScaleTime(scale) }})</div>
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
                :key="time.id"
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
                <span>
                  {{ time.date }}
                  {{ time.formattedTime }}
                  <span class="uppercase">{{
                    getTimeOfDay(time.formattedTime)
                  }}</span>
                </span>
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
              >
                <div class="p-1">
                  <div>start: {{ timeline.start }}</div>
                  <div>end: {{ timeline.end }}</div>
                </div>
              </div>
              <div v-for="(_row, index) in items" :key="index" class="flex">
                <div
                  v-for="(_time, timeIdx) in timeline"
                  :key="timeIdx"
                  class="text-center relative mt-px p-2.5 border-r bg-white text-xs text-white leading-10 text-medium"
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
import { TimelineItem, TimelineOptions } from "../types/VueScheduler";

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
    options: {
      type: Object as PropType<TimelineOptions>,
      default: () => ({
        cellWidth: 50,
        rowHeight: 60,
        scale: 0.5,
        start: new Date(),
        end: new Date(),
      }),
    },
  },
  setup(props) {
    const cellWidth = ref(props.options.cellWidth);
    const clicksDown = ref(0);
    const clicksUp = ref(0);
    const rowHeight = ref(props.options.rowHeight);
    const scale = ref(props.options.scale);
    const showVerticalLine = ref(false);
    const timeline = computed(() =>
      generateTimeline(scale.value, props.options.start, props.options.end)
    );
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
     * Parse date string to Date object
     * @param dateStr
     * @returns {Date} Date object
     * @example
     * parseDate("17/02/2024 01:00")
     */
    const parseDate = (dateStr: string) => {
      // eslint-disable-next-line no-useless-escape
      const [day, month, year, hour, minutes] = dateStr.split(/[\/\s:]+/);
      return new Date(`${year}-${month}-${day}T${hour}:${minutes}`);
    };

    /**
     * Generate the timeline based on the scale
     * @param scale
     * @returns {Array} Array of strings representing the time slots
     */
    function generateTimeline(
      scale: number,
      startTimeStr: string,
      endTimeStr: string
    ) {
      const startTime = parseDate(startTimeStr);
      const endTime = parseDate(endTimeStr);
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(endTime);
      const timeSlots = [];

      // Iterate through days
      for (
        let currentDay = new Date(startDateTime);
        currentDay <= endDateTime;
        currentDay.setDate(currentDay.getDate() + 1)
      ) {
        // Convert start and end times to minutes
        const startMinutes =
          currentDay.getHours() * 60 + currentDay.getMinutes();
        const endMinutes =
          currentDay.getDate() === endDateTime.getDate()
            ? endDateTime.getHours() * 60 + endDateTime.getMinutes()
            : 24 * 60 - 1; // Set to end of the day for the last day

        // Iterate through minutes of the current day
        for (let time = startMinutes; time <= endMinutes; time += scale * 60) {
          timeSlots.push({
            id: timeSlots.length,
            dateTime: new Date(
              currentDay.getFullYear(),
              currentDay.getMonth(),
              currentDay.getDate(),
              Math.floor(time / 60),
              time % 60
            ),
            date: `${currentDay.getDate()}/${currentDay.getMonth() + 1}`,
            formattedTime: formatTime(time),
          });
        }
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
        const { start, end, row } = event as TimelineItem;
        const optStartDate = new Date(parseDate(props.options.start));

        // Extract date and time parts
        const [startDate, startTime] = start.split(" ");
        const endTime = end.split(" ")[1];

        const [startDay, startMonth, startYear] = startDate.split("/");
        // const [endDay, endMonth, endYear] = endDate.split("/");

        const [startHour, startMinutes] = startTime.split(":");
        const [endHour, endMinutes] = endTime.split(":");

        // Convert date and time parts to numbers
        const startInMinutes =
          (parseInt(startHour) === 0
            ? parseInt(startHour)
            : parseInt(startHour) - 0) *
            60 +
          parseInt(startMinutes);
        const endInMinutes = parseInt(endHour) * 60 + parseInt(endMinutes);

        // Calculate the width based on the scale
        let eventWidth =
          ((endInMinutes - startInMinutes) / (scale.value * 60)) *
          cellWidth.value;
        const top = row * rowHeight.value + (row + 1) * 1;
        // Calculate left position based on date and time
        const startDateObject = new Date(
          `${startYear}-${startMonth}-${startDay}T${startTime}`
        );
        const startInMinutesOfDay =
          startDateObject.getHours() * 60 + startDateObject.getMinutes();
        let left =
          (startInMinutesOfDay / (scale.value * 60)) * cellWidth.value + 1;

        // check to see how many days are between the start date and the options start date
        if (parseInt(startDay) > optStartDate.getDate()) {
          // add the number of days between the start date and the options start date
          left += (24 / scale.value) * cellWidth.value;
          eventWidth += (24 / scale.value) * cellWidth.value;
        }

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
     * Convert scale to minutes, hours
     */
    const getScaleTime = (scale: number) => {
      const time = scale * 60;

      if (time < 60) {
        return `${time}min`;
      } else {
        return `${time / 60}h`;
      }
    };

    return {
      cellWidth,
      eventProperties,
      getCurrentTimePosition,
      getScaleTime,
      getTimeOfDay,
      handleMouseMove,
      handleMouseLeave,
      onWheel,
      rowHeight,
      scale,
      showVerticalLine,
      timeline,
      verticalLineX,
    };
  },
});
</script>
