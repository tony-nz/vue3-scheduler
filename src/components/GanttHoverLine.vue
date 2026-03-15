<template>
  <div
    v-if="visible"
    class="absolute top-0 bottom-0 border-l-2 border-emerald-400 opacity-60 z-10 pointer-events-none"
    :style="{ left: `${x}px` }"
  />
</template>

<script setup lang="ts">
defineProps<{
  x: number;
  visible: boolean;
}>();
</script>
