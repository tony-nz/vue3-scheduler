<template>
  <div
    v-if="visible"
    class="absolute top-0 bottom-0 border-l-2 border-red-500 z-20 pointer-events-none"
    :style="{ left: `${position}px` }"
  >
    <div
      class="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  getPixelPosition: () => number;
  visible: boolean;
}>();

const position = ref(props.getPixelPosition());
let timer: ReturnType<typeof setInterval>;

onMounted(() => {
  position.value = props.getPixelPosition();
  timer = setInterval(() => {
    position.value = props.getPixelPosition();
  }, 60000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>
