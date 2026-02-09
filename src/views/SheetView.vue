<template>
  <div class="sheets-demo">
    <h1>Таблица</h1>

    <div v-if="!gapiClientLoaded || !gisLoaded" class="loading-notice">
      <p>Загрузка Google API клиента... Пожалуйста, подождите.</p>
    </div>
    <div v-else>
      <div class="actions-panel">
        <div class="operation-group">
          <div class="data-controls">
            <button @click="toggleDataTable" class="btn-toggle-table">
              {{ bonusDataStore.isTableVisible ? 'Скрыть таблицу' : 'Показать таблицу' }}
            </button>
            <button @click="handleGetData" :disabled="isDataLoading" class="btn-parse">
              <span class="icon-download" style="margin-right: 4px">⬇️</span>Спарсить
            </button>
            <button
              @click="handleWriteData"
              :disabled="isDataLoading || !bonusDataStore.hasChanges"
              class="btn-write"
            >
              <span class="icon-upload" style="margin-right: 4px">⬆️</span>Отправить
            </button>
          </div>
          <transition name="fade-toast">
            <div v-if="showToast" class="toast-success">
              {{ toastMessage }}
            </div>
          </transition>
          <div v-if="bonusDataStore.hasChanges" class="data-status">
            <p class="changes-status">🔄 Есть изменения в данных</p>
          </div>
        </div>
        <div v-if="bonusDataStore.isTableVisible" class="table-section">
          <EditableDataTable />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useGoogleSheets } from '@/services/googleSheetsService'
import { useConfigStore } from '@/stores/config'
import { useBonusDataStore } from '@/stores/bonusData'
import EditableDataTable from '@/components/EditableDataTable.vue'

const {
  gapiClientLoaded,
  gisLoaded,
  isSignedIn,
  isAuthLoading,
  isDataLoading,
  accessToken: userToken,
  error: sheetsError,
  signIn,
  signOut,
  getSheetData,
  writeSheetData,
  clearError,
  trySilentSignIn,
} = useGoogleSheets()

const configStore = useConfigStore()
const bonusDataStore = useBonusDataStore()

const rangeToGet = ref(configStore.sheetsConfig.defaultRange)
const writeDataResult = ref<any | null>(null)

// Индикатор: скоро ли истекает токен
const isTokenExpiringSoon = computed(() => {
  const storedTokenString = localStorage.getItem('google_auth_token')
  if (!storedTokenString) return false
  const storedToken = JSON.parse(storedTokenString)
  return storedToken.expiry - Date.now() < 120000
})

const showToast = ref(false)
const toastMessage = ref('')

onMounted(async () => {
  console.log('SheetView mounted')
})

async function handleSignIn() {
  writeDataResult.value = null
  console.log(
    'Клик по Войти через Google, isAuthLoading:',
    isAuthLoading.value,
    'isSignedIn:',
    isSignedIn.value,
  )
  await signIn()
}

async function handleSignOut() {
  writeDataResult.value = null
  console.log('Клик по Выйти, isAuthLoading:', isAuthLoading.value, 'isSignedIn:', isSignedIn.value)
  await signOut()
}

async function handleGetData() {
  if (!configStore.sheetsConfig.spreadsheetId || !rangeToGet.value) {
    alert('Пожалуйста, задайте ID таблицы в настройках и диапазон.')
    return
  }
  // Сначала пробуем silent-авторизацию
  let authed = isSignedIn.value
  if (!authed) authed = await trySilentSignIn()
  if (!authed) {
    authed = await signIn()
  }
  if (!authed) return
  writeDataResult.value = null
  const data = await getSheetData(configStore.sheetsConfig.spreadsheetId, rangeToGet.value)
  if (data) {
    bonusDataStore.setInitialData(data)
    toastMessage.value = `✅ Данные загружены в стор (${data.length} записей)`
    showToast.value = true
    setTimeout(() => (showToast.value = false), 2500)
    console.log('Данные загружены в стор:', data.length, 'записей')
  }
}

async function handleWriteData() {
  if (!configStore.sheetsConfig.spreadsheetId) {
    alert('Пожалуйста, задайте ID таблицы в настройках.')
    return
  }
  if (!bonusDataStore.hasChanges) {
    alert('Нет изменений для записи.')
    return
  }
  let authed = isSignedIn.value
  if (!authed) authed = await trySilentSignIn()
  if (!authed) {
    authed = await signIn()
  }
  if (!authed) return
  writeDataResult.value = null
  const dataToWrite = bonusDataStore.getDataForSheets()
  if (dataToWrite.length === 0) {
    alert('Нет данных для записи.')
    return
  }
  const result = await writeSheetData(
    configStore.sheetsConfig.spreadsheetId,
    configStore.sheetsConfig.defaultRange,
    dataToWrite,
  )
  if (result) {
    writeDataResult.value = result
    bonusDataStore.setInitialData(dataToWrite)
    toastMessage.value = '✅ Данные успешно отправлены в Google Sheets'
    showToast.value = true
    setTimeout(() => (showToast.value = false), 2500)
  }
}

function toggleDataTable() {
  bonusDataStore.toggleTableVisibility()
}

function clearStoredData() {
  bonusDataStore.clearData()
  writeDataResult.value = null
  console.log('Данные из стора очищены.')
}

// Очищаем ошибки при изменении состояния авторизации
watch([isSignedIn, gapiClientLoaded, gisLoaded], () => {
  if (sheetsError.value) {
    // Потенциально можно очищать определенные типы ошибок или логировать их
  }
})

// Обновляем диапазон при изменении конфигурации
watch(
  () => configStore.sheetsConfig.defaultRange,
  (newRange) => {
    if (newRange && !rangeToGet.value) {
      rangeToGet.value = newRange
    }
  },
)

watch([isSignedIn, userToken], () => {
  clearError()
})
</script>

<style scoped>
.sheets-demo {
  padding: 20px;
  font-family: sans-serif;
}

.loading-notice,
.error-notice {
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 4px;
}

.loading-notice {
  background-color: #eef;
  border: 1px solid #aac;
}

.error-notice {
  background-color: #fdd;
  border: 1px solid #f99;
  color: #c00;
}

.auth-notice {
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  text-align: center;
}

.auth-status-navbar {
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
.auth-status-navbar .token-short {
  font-size: 11px;
  color: #888;
}
.auth-status-navbar button {
  margin: 0 0 0 2px;
  padding: 1px 6px;
  font-size: 12px;
  border-radius: 3px;
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  cursor: pointer;
}
.auth-status-navbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.auth-status-navbar .auth-loading {
  color: #007bff;
  font-size: 11px;
}

.config-info {
  margin-bottom: 20px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: #f8f9fa;
  padding: 0 0 10px 0;
}
.config-info[open] {
  padding: 10px 0 10px 0;
}
.config-info summary {
  font-weight: bold;
  font-size: 16px;
  padding: 10px 20px;
  cursor: pointer;
  outline: none;
  border-radius: 4px;
  background: #e9ecef;
  margin-bottom: 8px;
}
.config-info ul {
  margin: 10px 0 0 20px;
  padding-left: 0;
}

.config-info li {
  margin-bottom: 5px;
}

.config-info code {
  background-color: #e9ecef;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

.config-link {
  display: inline-block;
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-size: 14px;
}

.config-link:hover {
  background-color: #0056b3;
}

.actions-panel input[type='text'] {
  margin-bottom: 10px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 300px;
}

.actions-panel label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.operation-group {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.operation-group h3 {
  margin-top: 0;
}

.data-status {
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.changes-status {
  color: #856404;
  font-weight: 500;
}

.data-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.btn-toggle-table {
  background-color: #17a2b8;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.btn-toggle-table:hover {
  background-color: #138496;
}
.btn-parse {
  background-color: #007bff;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.btn-parse:hover:not(:disabled) {
  background-color: #0056b3;
}
.btn-parse:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-write {
  background-color: #28a745;
  color: white;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.btn-write:hover:not(:disabled) {
  background-color: #218838;
}
.btn-write:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-clear {
  background-color: #dc3545;
  color: white;
}

.btn-clear:hover {
  background-color: #c82333;
}

.data-display {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.table-section {
  margin-top: 20px;
}

.token-expiring-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: orange;
  margin-right: 6px;
  vertical-align: middle;
}

.fade-toast-enter-active,
.fade-toast-leave-active {
  transition: opacity 0.5s;
}
.fade-toast-enter-from,
.fade-toast-leave-to {
  opacity: 0;
}
.toast-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  padding: 10px 18px;
  margin: 10px 0 0 0;
  font-size: 15px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
.tw-bg-cyan-600 {
  background-color: #0891b2;
}
.tw-bg-cyan-700 {
  background-color: #0e7490;
}
.tw-bg-blue-600 {
  background-color: #2563eb;
}
.tw-bg-blue-700 {
  background-color: #1d4ed8;
}
.tw-bg-green-600 {
  background-color: #16a34a;
}
.tw-bg-green-700 {
  background-color: #15803d;
}
.tw-text-white {
  color: #fff;
}
.tw-px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}
.tw-py-1 {
  padding-top: 0.25rem;
  padding-bottom: 0.25rem;
}
.tw-rounded {
  border-radius: 0.375rem;
}
.tw-font-medium {
  font-weight: 500;
}
.tw-transition {
  transition: all 0.2s;
}
.tw-mr-1 {
  margin-right: 0.25rem;
}
.tw-gap-2 {
  gap: 0.5rem;
}
.tw-flex {
  display: flex;
}
.tw-mb-2 {
  margin-bottom: 0.5rem;
}
</style>
