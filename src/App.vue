<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <nav class="app-nav">
      <RouterLink to="/">Граф Бонусов</RouterLink>
      <RouterLink to="/about">О проекте</RouterLink>
      <RouterLink to="/sheets-demo">Sheets Demo</RouterLink>
    </nav>

    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
}

.app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
}

.app-nav {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  z-index: 10;
}

.app-nav a {
  color: #374151;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.app-nav a:hover {
  background-color: #e5e7eb;
}

.app-nav a.router-link-active {
  font-weight: bold;
  color: #1f2937;
  background-color: #e5e7eb;
}

.app-content {
  flex: 1;
  overflow: hidden;
}
</style>
