<template>
  <VueScheduler
    :data="timelineData"
    :headers="timelineHeaders"
    :items="timelineItems"
  />
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import VueScheduler from "./components/VueScheduler.vue";

export default defineComponent({
  name: "App",
  components: {
    VueScheduler,
  },
  setup() {
    /**
     * Timeline data
     */
    const timelineData = ref([
      {
        row: 0,
        background: "bg-emerald-500",
        text: "text-white",
        start: "00:00",
        end: "00:45",
      },
      {
        row: 1,
        background: "bg-orange-500",
        text: "text-white",
        start: "01:00",
        end: "02:30",
      },
      {
        row: 2,
        background: "bg-purple-500",
        text: "text-white",
        start: "01:00",
        end: "02:35",
      },
      {
        row: 3,
        background: "bg-red-500",
        text: "text-white",
        start: "01:00",
        end: "02:35",
      },
      {
        row: 1,
        background: "bg-emerald-500",
        text: "text-white",
        start: "04:00",
        end: "05:35",
      },
      {
        row: 2,
        background: "bg-emerald-500",
        text: "text-white",
        start: "06:00",
        end: "07:35",
      },
      {
        row: 2,
        background: "bg-emerald-500",
        text: "text-white",
        start: "08:00",
        end: "09:35",
      },
      {
        row: 3,
        background: "bg-emerald-500",
        text: "text-white",
        start: "10:00",
        end: "11:35",
      },
      {
        row: 3,
        background: "bg-emerald-500",
        text: "text-white",
        start: "12:00",
        end: "13:35",
      },
      {
        row: 4,
        background: "bg-emerald-500",
        text: "text-white",
        start: "14:00",
        end: "15:35",
      },
      {
        row: 4,
        background: "bg-emerald-500",
        text: "text-white",
        start: "16:00",
        end: "17:35",
      },
      {
        row: 5,
        background: "bg-emerald-500",
        text: "text-white",
        start: "18:00",
        end: "19:35",
      },
      {
        row: 5,
        background: "bg-emerald-500",
        text: "text-white",
        start: "20:00",
        end: "21:35",
      },
      {
        row: 6,
        background: "bg-emerald-500",
        text: "text-white",
        start: "22:00",
        end: "23:35",
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

    return {
      timelineData,
      timelineHeaders,
      timelineItems,
    };
  },
});
</script>
