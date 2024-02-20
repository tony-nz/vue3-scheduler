<template>
  <div class="mx-auto hidden">
    <!-- github link -->
    <div class="mx-2 flex justify-end mt-4">
      <a
        href="https://github.com/tony-nz/vue3-scheduler"
        target="_blank"
        class="text-xs text-gray-400"
      >
        <span class="mr-2"
          >Created by tony-nz
          <span class="text-xs text-gray-300">(Tony Myers)</span></span
        >
        <img src="/github.svg" alt="github" class="w-4 h-4 inline-block mr-2" />
      </a>
    </div>
    <VueScheduler
      :data="timelineData"
      :headers="timelineHeaders"
      :items="timelineItems"
      :options="timelineOptions"
    >
      <template #event="{ event }">
        <div
          :class="[
            event.background,
            event.text,
            'p-2',
            'w-full',
            'rounded-lg',
            'shadow-md',
            'text-xs',
            'text-left',
            'text-xs',
            'rounded-md',
            'text-nowrap',
            'overflow-auto',
            'opacity-80',
            'truncate',
          ]"
        >
          <div class="flex flex-col truncate">
            <div class="font-bold">{{ event.meta?.title }}</div>
            <div class="text-slate-200">{{ event.meta?.description }}</div>
          </div>
        </div>
      </template>
    </VueScheduler>
  </div>
  <!-- toolbar for scale -->
  <div class="flex justify-center items-center my-4 space-x-4">
    <h1 class="text-gray-700 text-lg font-bold"></h1>
    <div>
      <button
        class="bg-gray-300 text-gray-700 p-1 rounded-md mr-1"
        @click="newOptions.scale -= 0.5"
      >
        -
      </button>
      <button
        class="bg-gray-300 text-gray-700 p-1 rounded-md"
        @click="newOptions.scale += 0.5"
      >
        +
      </button>
    </div>
  </div>
  <div>
    <VueSchedulerV2
      :end="newEnd"
      :events="newData"
      :headers="timelineHeaders"
      :identifiers="timelineItems"
      :options="newOptions"
      :start="newStart"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { TimelineItem, TimelineOptions } from "./types/VueScheduler";
import VueScheduler from "./components/VueScheduler.vue";
import VueSchedulerV2 from "./components/VueSchedulerV2.vue";

interface Event {
  identiferIdx: number;
  start: Date;
  end: Date;
  meta?: {
    description?: string;
    text?: string;
    title?: string;
  };
}

export default defineComponent({
  name: "App",
  components: {
    VueScheduler,
    VueSchedulerV2,
  },
  setup() {
    /**
     * Today's date
     */
    const start = new Date();
    const end = new Date();

    start.setDate(17);
    start.setMonth(2);
    start.setFullYear(2024);

    end.setDate(17);
    end.setMonth(2);
    end.setFullYear(2024);

    /**
     * Add one day to the end date
     */
    end.setDate(end.getDate() + 1);

    /**
     * Timeline data
     */
    const timelineData = ref<TimelineItem[]>([
      {
        row: 0,
        background: "bg-emerald-500",
        text: "text-white",
        start: "17/02/2024 01:00",
        end: "17/02/2024 02:00",
        meta: { title: "Event 1", description: "Event 1 description" },
      },
      {
        row: 1,
        background: "bg-orange-500",
        text: "text-white",
        start: "17/02/2024 01:00",
        end: "17/02/2024 02:15",
        meta: { title: "Event 2", description: "Event 2 description" },
      },
      {
        row: 1,
        background: "bg-purple-500",
        text: "text-white",
        start: "17/02/2024 02:00",
        end: "17/02/2024 03:15",
        meta: { title: "Event 3", description: "Event 3 description" },
      },
      {
        row: 3,
        background: "bg-orange-500",
        text: "text-white",
        start: "17/02/2024 02:24",
        end: "17/02/2024 03:27",
        meta: { title: "Event 4", description: "Event 4 description" },
      },
      {
        row: 4,
        background: "bg-orange-500",
        text: "text-white",
        start: "18/02/2024 02:24",
        end: "18/02/2024 03:27",
        meta: { title: "Event 5", description: "Event 5 description" },
      },
      {
        row: 5,
        background: "bg-orange-500",
        text: "text-white",
        start: "18/02/2024 02:24",
        end: "19/02/2024 03:27",
        meta: { title: "Event 6", description: "Event 6 description" },
      },
    ]);

    /**
     * Timeline headers
     */
    const timelineHeaders = ref(["Route", "Start time"]);

    /**
     * Generate row data
     */
    const timelineItems = [
      ["BMON-A", "08:00am"],
      ["BMON-B", "08:00am"],
      ["BMON-C", "08:00am"],
      ["BMON-D", "08:00am"],
      ["BMON-E", "08:00am"],
      ["BMON-F", "08:00am"],
      ["BMON-G", "08:00am"],
    ];

    /**
     * Timeline options
     */
    const timelineOptions = ref<TimelineOptions>({
      cellWidth: 50,
      row: {
        height: 81,
        marginTop: 4,
      },
      scale: 0.5,
      start: "17/02/2024 00:00",
      end: "19/02/2024 23:59",
    });

    /**
     * Refactored data
     */

    const newEnd = new Date(2024, 1, 1, 23, 0);
    const newStart = new Date(2024, 1, 1, 0, 0);

    const newOptions = ref({
      cellWidth: 50,
      rowHeight: 81,
      scaleUnit: "hours",
      timeFormat: "HH:mm",
    });

    const newData = ref<Event[]>([
      {
        identiferIdx: 0,
        start: new Date(2024, 1, 1, 1, 15),
        end: new Date(2024, 1, 1, 2, 0),
        meta: { title: "Event 1", description: "Event 1 description" },
      },
      {
        identiferIdx: 1,
        start: new Date(2024, 1, 1, 3, 0),
        end: new Date(2024, 1, 1, 5, 0),
        meta: { title: "Event 2", description: "Event 2 description" },
      },
    ]);

    return {
      timelineData,
      timelineHeaders,
      timelineItems,
      timelineOptions,
      newStart,
      newEnd,
      newOptions,
      newData,
    };
  },
});
</script>
