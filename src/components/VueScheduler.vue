<template>
  <div class="flex items-center justify-center overscroll-none">
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
            <div id="row-header" class="flex border-b">
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
                  class="grid w-full text-left relative border-b p-2.5 mr-px bg-white text-xs text-gray-400 leading-10 text-medium"
                  :style="
                    'min-width: ' +
                    cellWidth +
                    'px; ' +
                    'min-height: ' +
                    getRowHeight +
                    'px; ' +
                    'max-height: ' +
                    getRowHeight +
                    'px; '
                  "
                >
                  {{ col }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex flex-col overflow-auto rounded-r-lg">
            <div id="head" class="flex border-b">
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
                class="z-10 absolute top-0 bottom-0 border-r-2 border-emerald-400 opacity-60"
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
                :data-index="index"
                class="z-10 draggable flex absolute"
                :style="{
                  height: `${rowHeight}px`,
                  width: `${eventProperties[index].width}px`,
                  left: `${eventProperties[index].left}px`,
                  top: `${eventProperties[index].top}px`,
                }"
              >
                <slot
                  name="event"
                  :event="timeline"
                  :properties="eventProperties[index]"
                />
                <!-- resize handle -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 192 512"
                  class="absolute right-0 h-4 w-4 resize-handle"
                  :style="{
                    top: `${rowHeight / 3}px`,
                  }"
                >
                  <path
                    class="opacity-40 fill-white"
                    d="M0 64C0 46.33 14.33 32 32 32C49.67 32 64 46.33 64 64V448C64 465.7 49.67 480 32 480C14.33 480 0 465.7 0 448V64z"
                  />
                  <path
                    class="opacity-40 fill-white"
                    d="M128 64C128 46.33 142.3 32 160 32C177.7 32 192 46.33 192 64V448C192 465.7 177.7 480 160 480C142.3 480 128 465.7 128 448V64z"
                  />
                </svg>
              </div>
              <div
                v-for="(_row, index) in items"
                :key="index"
                class="flex dropzone"
              >
                <div
                  v-for="(_time, timeIdx) in timeline"
                  :key="timeIdx"
                  class="text-center relative p-2.5 border-b border-r bg-white text-xs text-white leading-10 text-medium"
                  :style="
                    'min-width: ' +
                    cellWidth +
                    'px; ' +
                    'max-width: ' +
                    cellWidth +
                    'px; ' +
                    'min-height: ' +
                    getRowHeight +
                    'px; ' +
                    'max-height: ' +
                    getRowHeight +
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
import { computed, defineComponent, onMounted, PropType, ref } from "vue";
import { TimelineItem, TimelineOptions } from "../types/VueScheduler";
import interact from "interactjs";

declare global {
  interface Window {
    dragMoveListener: (event: DragEvent) => void;
  }
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
    options: {
      type: Object as PropType<TimelineOptions>,
      default: () => ({
        cellWidth: 50,
        row: {
          height: 60,
        },
        scale: 0.5,
        start: "01/01/2024 00:00",
        end: "01/01/2024 23:00",
      }),
    },
  },
  setup(props) {
    const cellWidth = ref(props.options.cellWidth);
    const clicksDown = ref(0);
    const clicksUp = ref(0);
    const propData = ref(props.data);
    const rowHeight = ref(props.options.row.height);
    const rowMarginTop = ref(props.options.row.marginTop);
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
            : 24 * 60; // Set to end of the day for the last day

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
      return propData.value.map((event) => {
        const { start, end, row } = event as TimelineItem;
        const optStartDate = new Date(parseDate(props.options.start));
        let selectedRow = row;
        selectedRow++;
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
        const top =
          selectedRow * rowHeight.value + selectedRow * 1 - rowHeight.value;
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
        if (clicksUp.value === 3) {
          scale.value = Math.min(scale.value + 0.5, 5); // Limit the scale to 5
          clicksUp.value = 0;
        }
      }
      if (event.deltaY > 0) {
        clicksDown.value++;
        if (clicksDown.value === 3) {
          scale.value = Math.max(scale.value - 0.5, 0.5); // Limit the scale to 0.5
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

    /**
     * Drag move listener
     * @param event
     * @returns {void}
     */
    function dragMoveListener(event: MouseEvent) {
      const target = event.target as HTMLElement; // Cast event.target to HTMLElement

      // keep the dragged position in the data-x/data-y attributes
      const x = parseFloat(target.getAttribute("data-x") ?? "0") || 0;
      const y = parseFloat(target.getAttribute("data-y") ?? "0") || 0;

      // translate the element
      target.style.transform = "translate(" + x + "px, " + y + "px)";

      // update the posiion attributes
      target.setAttribute("data-x", x.toString());
      target.setAttribute("data-y", y.toString());
    }

    /**
     * Initialize the draggable and resizable elements
     * @param element
     * @returns {void}
     */
    const initDraggable = (element: HTMLDivElement) => {
      window.dragMoveListener = dragMoveListener;

      let x = 0;
      let y = 0;

      interact(element)
        .resizable({
          // resize from all edges and corners
          edges: { left: false, right: true, bottom: false, top: false },
          listeners: {
            move(event) {
              const dataIndex: number = parseInt(
                element.getAttribute("data-index") ?? "0"
              );
              const selectedEvent = propData.value[dataIndex];
              const width = event.rect.width;
              const minutes = Math.round(
                (width / cellWidth.value) * scale.value * 60
              ); // convert width to time based on the scale

              // remove decimal from timeLength
              const match = selectedEvent.start.match(
                /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2})/
              );
              if (match) {
                const [, startDay, startMonth, startYear, startTime] = match;
                const startDateObject = new Date(
                  `${startYear}-${startMonth}-${startDay}T${startTime}`
                );
                const endDateObject = startDateObject.setMinutes(
                  startDateObject.getMinutes() + minutes
                );

                // convert endDateObject back to DD/MM/YYYY HH:mm
                const endTime = new Date(endDateObject);

                propData.value[dataIndex].end = `${endTime.getDate()}/${
                  endTime.getMonth() + 1
                }/${endTime.getFullYear()} ${endTime.getHours()}:${endTime.getMinutes()}`;
              }
            },
          },
          modifiers: [
            // keep the edges inside the parent
            interact.modifiers.restrictEdges({
              outer: "parent",
            }),
            // minimum size
            interact.modifiers.restrictSize({
              min: { width: 100, height: rowHeight.value },
            }),
          ],
          inertia: false,
        })
        .draggable({
          listeners: { move: window.dragMoveListener },
          modifiers: [
            interact.modifiers.snap({
              targets: [
                interact.snappers.grid({ x: 10, y: rowHeight.value + 1 }),
              ],
              range: Infinity,
              relativePoints: [{ x: 0, y: 0 }],
              offset: "#body",
            }),
            interact.modifiers.restrict({
              restriction: "parent",
              elementRect: { top: 0, left: 0, bottom: 1, right: 0 },
              endOnly: false,
            }),
          ],
          inertia: true,
        })
        .on("dragmove", function (event) {
          x += event.dx;
          y += event.dy;

          event.target.style.transform = "translate(" + x + "px, " + y + "px)";
        });
    };

    /**
     * Row height border fix
     */
    const getRowHeight = computed(() => {
      return rowHeight.value + 1;
    });

    onMounted(() => {
      document.querySelectorAll(".draggable").forEach((element: Element) => {
        initDraggable(element as HTMLDivElement);
      });
    });

    return {
      cellWidth,
      eventProperties,
      getCurrentTimePosition,
      getRowHeight,
      getScaleTime,
      getTimeOfDay,
      handleMouseMove,
      handleMouseLeave,
      onWheel,
      rowHeight,
      rowMarginTop,
      scale,
      showVerticalLine,
      timeline,
      verticalLineX,
    };
  },
});
</script>
