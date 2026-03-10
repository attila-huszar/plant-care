<script setup lang="ts">
  import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <div class="flex justify-center">
    <img src="/plant-care.svg" class="logo size-36" alt="logo" />
  </div>
  <HelloWorld msg="Plant Care Diary" />
</template>

<style scoped>
  .logo {
    will-change: filter;
    transition: filter 300ms;
  }

  .logo:hover {
    filter: drop-shadow(0 0 2em #42b883aa);
  }
</style>
