<script setup lang="ts">
import BonusGraph from '@/components/BonusGraph.vue'
import TheWelcome from '../components/TheWelcome.vue'
</script>

<template>
  <main class="bonus-graph-container">
    <BonusGraph />
  </main>
</template>

<style>
.bonus-graph-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}
</style>
