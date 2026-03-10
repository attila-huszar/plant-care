<script setup lang="ts">
  import { ref } from 'vue'

  defineProps<{ msg: string }>()

  const count = ref(0)
</script>

<template>
  <h1 class="text-emerald-600">{{ msg }}</h1>

  <div class="m-5">
    <button type="button" @click="count++" class="m-5">
      count is {{ count }}
    </button>
    <p class="text-lg">
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>
</template>
