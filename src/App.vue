<template>
  <div class="container mx-auto">
    <!-- github link -->
    <div class="container mx-auto flex justify-end mt-4">
      <a
        href="https://github.com/tony-nz/vue3-scheduler"
        target="_blank"
        class="text-xs text-gray-400"
      >
        <span class="mr-2">Created by Tony Myers</span>
        <img src="/github.svg" alt="github" class="w-4 h-4 inline-block mr-2" />
      </a>
    </div>
  </div>
  <VueScheduler
    :data="timelineData"
    :headers="timelineHeaders"
    :items="timelineItems"
    :options="timelineOptions"
  />
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { TimelineItem, TimelineOptions } from "./types/VueScheduler";
import VueScheduler from "./components/VueScheduler.vue";

export default defineComponent({
  name: "App",
  components: {
    VueScheduler,
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
      },
      {
        row: 1,
        background: "bg-orange-500",
        text: "text-white",
        start: "17/02/2024 01:00",
        end: "17/02/2024 02:15",
      },
      {
        row: 3,
        background: "bg-orange-500",
        text: "text-white",
        start: "17/02/2024 02:24",
        end: "17/02/2024 03:27",
      },
      {
        row: 4,
        background: "bg-orange-500",
        text: "text-white",
        start: "18/02/2024 02:24",
        end: "18/02/2024 03:27",
      },
      {
        row: 5,
        background: "bg-orange-500",
        text: "text-white",
        start: "18/02/2024 02:24",
        end: "19/02/2024 03:27",
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
      rowHeight: 60,
      scale: 0.5,
      start: "17/02/2024 00:00",
      end: "19/02/2024 23:59",
    });

    return {
      timelineData,
      timelineHeaders,
      timelineItems,
      timelineOptions,
    };
  },
});
</script>
