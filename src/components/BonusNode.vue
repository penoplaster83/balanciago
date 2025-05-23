<script setup lang="ts">
defineProps<{
  data: {
    label: string
    description: string
  }
  dragging: boolean
}>()
</script>

<template>
  <div :class="['bonus-node', dragging ? 'dragging' : '']">
    <div class="bonus-node-header">{{ data.label }}</div>
    <div class="bonus-node-description">{{ data.description }}</div>
  </div>
</template>

<style>
.bonus-node {
  width: 200px;
  padding: 10px;
  border-radius: 8px;
  background-color: #9e9e9e;
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.1),
    0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.bonus-node:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.bonus-node.dragging {
  opacity: 0.8;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.bonus-node-header {
  font-weight: bold;
  font-size: 1rem;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 6px;
}

.bonus-node-description {
  font-size: 0.875rem;
  color: #4b5563;
}
</style>
