<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { onMounted, ref, computed, watchEffect, watch } from 'vue'
import { useGoogleSheets } from '@/services/googleSheetsService'

const {
  initializeModule,
  error,
  isSignedIn,
  isAuthLoading,
  accessToken: userToken,
  idToken,
  signIn,
  signOut,
  trySilentSignIn,
} = useGoogleSheets()

const userEmail = ref('')
const userAvatar = ref('')
const errorList = ref<{ date: string; message: string; details: any }[]>([])
const showErrorDropdown = ref(false)

function parseJwt(token: string): any {
  if (!token) return null
  const base64Url = token.split('.')[1]
  if (!base64Url) return null
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      })
      .join(''),
  )
  return JSON.parse(jsonPayload)
}

watchEffect(() => {
  if (isSignedIn.value && idToken.value) {
    const payload = parseJwt(idToken.value)
    userEmail.value = payload?.email || ''
    userAvatar.value = payload?.picture || ''
  } else {
    userEmail.value = ''
    userAvatar.value = ''
  }
})

watch(error, (val) => {
  if (val) {
    errorList.value.unshift({
      date: new Date().toLocaleString(),
      message: val.context,
      details: val.details,
    })
  }
})

function clearErrors() {
  errorList.value = []
}

onMounted(() => {
  initializeModule()
  const handleVisibilityOrFocus = () => {
    trySilentSignIn()
  }
  window.addEventListener('visibilitychange', handleVisibilityOrFocus)
  window.addEventListener('focus', handleVisibilityOrFocus)
})

function handleSignIn() {
  signIn()
}
function handleSignOut() {
  signOut()
}
</script>

<template>
  <nav class="app-nav">
    <RouterLink to="/">Граф Бонусов</RouterLink>
    <RouterLink to="/sheet">Таблица</RouterLink>
    <RouterLink to="/config">Настройки</RouterLink>
    <div class="auth-status-navbar">
      <template v-if="isAuthLoading">
        <span class="auth-loading">Загрузка...</span>
      </template>
      <template v-else>
        <template v-if="isSignedIn">
          <img v-if="userAvatar" :src="userAvatar" class="user-avatar" :alt="userEmail" />
          <span v-if="userEmail" class="user-email">{{ userEmail }}</span>
          <button @click="handleSignOut" class="auth-btn-door" title="Выйти">🚪 Выйти</button>
        </template>
        <button v-else @click="handleSignIn" class="auth-btn-login">Войти</button>
      </template>
      <span
        v-if="errorList.length > 0"
        class="auth-error"
        @click="showErrorDropdown = !showErrorDropdown"
        style="cursor: pointer; position: relative"
      >
        ⚠️ Ошибка
        <div v-if="showErrorDropdown" class="error-dropdown">
          <div class="error-dropdown-header">
            <span>Ошибки</span>
            <button @click.stop="clearErrors" class="clear-errors-btn">Очистить</button>
          </div>
          <ul class="error-list">
            <li v-for="(err, idx) in errorList" :key="idx" class="error-item">
              <div class="error-date">{{ err.date }}</div>
              <div class="error-message">{{ err.message }}</div>
              <div class="error-details">{{ err.details }}</div>
            </li>
          </ul>
        </div>
      </span>
    </div>
  </nav>
  <div class="app-container">
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
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
}

.app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
  margin-top: 0;
  padding-top: 20px;
}

.app-nav {
  display: flex;
  gap: 1rem;
  padding: 0.5rem 1rem;
  background-color: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  z-index: 1000;
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  margin-top: 0;
  align-items: center;
}
.auth-status-navbar {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  background: none;
  border: none;
  box-shadow: none;
  padding: 0;
  min-width: unset;
  position: static;
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
  width: 100%;
  padding-top: 0px;
  overflow: visible;
}

.user-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}
.user-email {
  font-size: 13px;
  color: #444;
  margin-right: 8px;
}
.auth-btn-door {
  background: #fee2e2;
  color: #b91c1c;
  border: none;
  border-radius: 4px;
  padding: 4px 14px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 8px;
  transition: background 0.2s;
}
.auth-btn-door:hover:not(:disabled) {
  background: #fecaca;
}
.auth-btn-door:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.auth-btn-login {
  background: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 14px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 8px;
  transition: background 0.2s;
}
.auth-btn-login:hover:not(:disabled) {
  background: #0056b3;
}
.auth-btn-login:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.auth-loading {
  color: #007bff;
  font-size: 11px;
}
.auth-error {
  color: #dc2626;
  font-weight: bold;
  margin-left: 10px;
  position: relative;
}
.error-dropdown {
  position: absolute;
  right: 0;
  top: 24px;
  background: #fff;
  border: 1px solid #f99;
  border-radius: 6px;
  min-width: 320px;
  z-index: 9999;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 0;
}
.error-dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f99;
  background: #fdd;
  font-weight: bold;
}
.clear-errors-btn {
  background: #fee2e2;
  color: #b91c1c;
  border: none;
  border-radius: 4px;
  padding: 2px 10px;
  font-size: 13px;
  cursor: pointer;
}
.clear-errors-btn:hover {
  background: #fecaca;
}
.error-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 300px;
  overflow-y: auto;
}
.error-item {
  padding: 8px 12px;
  border-bottom: 1px solid #f3f4f6;
}
.error-item:last-child {
  border-bottom: none;
}
.error-date {
  font-size: 11px;
  color: #888;
  margin-bottom: 2px;
}
.error-message {
  font-weight: bold;
  color: #b91c1c;
  margin-bottom: 2px;
}
.error-details {
  font-size: 12px;
  color: #444;
  word-break: break-all;
}
@media (max-width: 1023px) {
  .app-nav {
    top: 0;
    margin-top: 0;
  }
}
</style>
