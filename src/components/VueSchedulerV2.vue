<template>
  <div
    id="vue3-scheduler"
    class="grid h-full rounded-lg overflow-hidden overscroll-none bg-gray-100 p-3"
    style="grid-template-areas: 'grid1 grid2 grid2 grid2 grid2 '"
  >
    <!-- Headers + Identifers (first column) -->
    <div
      id="first-column"
      class="w-[250px] border-r rounded-l-lg bg-gray-300 mr-px overflow-hidden overscroll-noner"
    >
      <!-- Headers -->
      <div id="headers" class="flex border-b">
        <div
          v-for="(header, index) in headers"
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
          {{ header }}
        </div>
      </div>
      <!-- Identifiers -->
      <div id="identifiers" class="relative">
        <div
          v-for="(identifier, index) in identifiers"
          :key="index"
          class="flex flex-row w-full"
        >
          <div
            v-for="col in identifier"
            :key="col"
            class="grid w-full text-left relative border-b p-2.5 mr-px bg-white text-xs text-gray-400 leading-10 text-medium"
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
            {{ col }}
          </div>
        </div>
      </div>
    </div>
    <!-- Timeline + Events (second column) -->
    <div
      @wheel="onWheel"
      id="second-column"
      class="flex flex-col overflow-auto rounded-r-lg"
    >
      <!-- Timeline -->
      <div id="timeline" class="flex border-b">
        <div
          v-for="time in getTimeline"
          :key="time.id"
          class="overflow-hidden text-center items-center relative p-2.5 border-r bg-slate-500 text-xs text-gray-100"
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
            {{ time.formattedDate }}
            {{ time.formattedTime }}
          </span>
        </div>
      </div>
      <!-- Events -->
      <div
        id="events"
        class="relative"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
      >
        <!-- events -->

        <div
          v-for="(event, index) in events"
          :key="index"
          :data-index="index"
          :data-x="getEventLeft(event.start)"
          :data-y="getEventRow(event.identiferIdx)"
          :class="event.meta?.class || 'bg-blue-500'"
          :style="{
            height: `${rowHeight}px`,
            width: `${getEventWidth(event.start, event.end)}px`,
            left: `${getEventLeft(event.start)}px`,
            top: `${getEventRow(event.identiferIdx)}px`,
          }"
          class="z-10 draggable flex absolute"
        >
          <slot name="event" :event="event" />
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
        <!-- Empty event grid -->
        <div
          v-for="(_row, index) in identifiers"
          :key="index"
          class="flex dropzone"
        >
          <div
            v-for="(_time, timeIdx) in getTimeline"
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
</template>
<script lang="ts">
import { computed, defineComponent, onMounted, PropType, ref } from "vue";
import interact from "interactjs";

interface Event {
  identiferIdx: number;
  start: Date;
  end: Date;
  meta?: {
    class?: string;
    description?: string;
    title?: string;
  };
}

interface Options {
  cellWidth?: number;
  rowHeight?: number;
  scaleUnit?: string;
  scaleCustom?: number;
  scrollSpeed?: number;
  timeFormat?: string;
}

const DEFAULT_OPTIONS: Options = {
  cellWidth: 100,
  rowHeight: 50,
  scaleUnit: "minutes",
  scrollSpeed: 5,
  timeFormat: "HH:mm",
};

export default defineComponent({
  name: "VueSchedulerV2",
  props: {
    end: {
      type: Date,
      required: true,
    },
    events: {
      type: Array as PropType<Event[]>,
      required: true,
    },
    headers: {
      type: Array,
      required: true,
    },
    identifiers: {
      type: Array,
      required: true,
    },
    options: {
      type: Object as PropType<Options>,
      required: false,
    },
    start: {
      type: Date,
      required: true,
    },
  },
  setup(props) {
    const cellWidth =
      ref(props.options?.cellWidth) || DEFAULT_OPTIONS.cellWidth;
    const rowHeight = ref(
      props.options?.rowHeight || DEFAULT_OPTIONS.rowHeight
    );
    const scale = ref(0.5);
    const scaleIngrement = ref(0.5);
    const scrollDown = ref(0);
    const scrollUp = ref(0);

    /**
     * Generate the timeline based on the scale
     * @param scale
     * @returns {Array} Array of strings representing the time slots
     */
    function generateTimeline() {
      const timeSlots = [];
      const start = new Date(props.start);
      const end = new Date(props.end);

      // convert scale from decimal to minutes
      const scaleInMinutes = scale.value * 60;

      for (
        let i = start;
        i < end;
        i.setMinutes(i.getMinutes() + scaleInMinutes)
      ) {
        timeSlots.push({
          id: i.getTime(),
          date: i,
          // formattedTime: i.toLocaleTimeString(),
          // hh:mm am/pm
          formattedDate: `${i.getDate()}/${i.getMonth() + 1}`,
          formattedTime: i.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
        });
      }

      return timeSlots;
    }

    /**
     * Get the timeline
     */
    const getTimeline = computed(() => generateTimeline());

    /**
     * Get event width
     * @param start
     * @param end
     * @returns {number} Width of the event
     */
    function getEventWidth(start: Date, end: Date) {
      const duration = (end.getTime() - start.getTime()) / 60000;
      if (!cellWidth.value) return 0;

      return (duration / 60 / scale.value) * cellWidth.value;
    }

    /**
     * Get event left
     * @param start
     * @returns {number} Left position of the event
     */
    function getEventLeft(eventStart: Date) {
      if (!cellWidth.value) return 0;
      const start = new Date(props.start);
      const timeDifference = (eventStart.getTime() - start.getTime()) / 60000;
      const left = (timeDifference / 60 / scale.value) * cellWidth.value;

      return left;
    }

    /**
     * Get event row
     * @param identiferIdx
     * @returns {number} Top position of the event
     */
    function getEventRow(identiferIdx: number) {
      return identiferIdx * rowHeight.value;
    }

    /**
     * Scroll to zoom in and out
     * @param e
     * @returns {void}
     */
    const onWheel = (event: WheelEvent) => {
      if (event.deltaY < 0) {
        scrollUp.value++;
        if (scrollUp.value === props.options?.scrollSpeed) {
          scale.value = Math.min(scale.value + scaleIngrement.value, 5); // Limit the scale to 5
          scrollUp.value = 0;
        }
      }
      if (event.deltaY > 0) {
        scrollDown.value++;
        if (scrollDown.value === props.options?.scrollSpeed) {
          scale.value = Math.max(scale.value - scaleIngrement.value, 0.5); // Limit the scale to 0.5
          scrollDown.value = 0;
        }
      }
    };

    const setScale = () => {
      // check if custom scale is set
      if (props.options?.scaleCustom) {
        scale.value = props.options.scaleCustom;
        return;
      }

      switch (props.options?.scaleUnit) {
        case "minutes":
          // if minute scroll by 0.5
          scale.value = 0.5;
          scaleIngrement.value = 0.5;
          break;
        case "hours":
          // if hour scroll by 1.0
          scale.value = 1.0;
          scaleIngrement.value = 1.0;
          break;
        case "days":
          // if day scroll by 24.0
          scale.value = 24.0;
          scaleIngrement.value = 24.0;
          break;
        default:
          scale.value = 0.5;
          scaleIngrement.value = 0.5;
      }
    };

    /**
     * Drag move listener
     * @param event
     * @returns {void}
     */
    function dragMoveListener(event: MouseEvent) {
      // console.log(event.target.attributes[0]);
      const target = event.target as HTMLElement; // Cast event.target to HTMLElement

      // extract x and y from css (event.target.style.transform)
      // keep the dragged position in the data-x/data-y attributes
      const x = parseFloat(target.getAttribute("data-x") ?? "0") || 0;
      const y = parseFloat(target.getAttribute("data-y") ?? "0") || 0;

      // translate the element
      // target.style.transform = "translate(" + x + "px, " + y + "px)";
      // target.style.left = x + "px";
      // target.style.top = y + "px";

      // update the posiion attributes
      // target.setAttribute("data-x", x.toString());
      // target.setAttribute("data-y", y.toString());
    }

    /**
     * Initialize the draggable and resizable elements
     * @param element
     * @returns {void}
     */
    const initDraggable = (element: HTMLDivElement) => {
      if (!element || !cellWidth.value) return;
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
                interact.snappers.grid({ x: 10, y: rowHeight.value || 50 }),
              ],
              range: Infinity,
              relativePoints: [{ x: 0, y: 0 }],
              offset: "#events",
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
          event.target.setAttribute("data-x", x.toString());
          event.target.setAttribute("data-y", y.toString());
          // event.target.style.transform = "translate(" + x + "px, " + y + "px)";
          // event.target.style.left = x + "px";
          // event.target.style.top = y + "px";
          // updateEvent(event.target as HTMLDivElement, x, y);
        });
    };

    onMounted(() => {
      setScale();
      document.querySelectorAll(".draggable").forEach((element: Element) => {
        initDraggable(element as HTMLDivElement);
      });
    });

    return {
      cellWidth,
      rowHeight,
      getTimeline,
      getEventWidth,
      getEventLeft,
      getEventRow,
      scale,
      onWheel,
    };
  },
});
</script>
