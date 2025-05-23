<template>
  <div class="sheets-demo">
    <h1>Google Sheets API Demo</h1>

    <div v-if="!gapiClientLoaded || !gisLoaded" class="loading-notice">
      <p>Загрузка Google API клиента... Пожалуйста, подождите.</p>
      <p v-if="sheetsError">Ошибка загрузки: {{ sheetsError.message || sheetsError }}</p>
    </div>

    <div v-else>
      <div class="auth-status">
        <p v-if="isSignedIn">Статус: Авторизован</p>
        <p v-else>Статус: Не авторизован</p>
        <p v-if="isSignedIn && userToken">Токен: {{ userToken.substring(0, 10) }}...</p>
        <button @click="handleSignIn" :disabled="isSignedIn">Войти через Google</button>
        <button @click="handleSignOut" :disabled="!isSignedIn">Выйти</button>
      </div>

      <div v-if="isSignedIn" class="actions-panel">
        <hr />
        <h2>Операции с таблицами</h2>
        <div>
          <label for="spreadsheetId">ID таблицы:</label>
          <input type="text" id="spreadsheetId" v-model="spreadsheetId" />
        </div>

        <div class="operation-group">
          <h3>Получить данные</h3>
          <label for="range">Диапазон (например, Sheet1!A1:C5):</label>
          <input type="text" id="range" v-model="rangeToGet" />
          <button @click="handleGetData" :disabled="!spreadsheetId || !rangeToGet">
            Получить данные
          </button>
          <div v-if="fetchedData" class="data-display">
            <h4>Полученные данные:</h4>
            <pre>{{ JSON.stringify(fetchedData, null, 2) }}</pre>
          </div>
        </div>

        <div class="operation-group">
          <h3>Записать данные из JSON</h3>
          <label for="sheetName">Имя листа (для записи, например, Sheet1):</label>
          <input type="text" id="sheetName" v-model="sheetNameToWrite" />
          <p>
            Данные будут записаны из <code>public/sampleData.json</code> начиная с A1 указанного
            листа.
          </p>
          <button @click="handleWriteData" :disabled="!spreadsheetId || !sheetNameToWrite">
            Записать демо-данные
          </button>
          <div v-if="writeDataResult" class="data-display">
            <h4>Результат записи:</h4>
            <pre>{{ JSON.stringify(writeDataResult, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <div v-if="sheetsError" class="error-notice">
        <p>
          <strong>Ошибка:</strong>
          {{ sheetsError.message || sheetsError.details || JSON.stringify(sheetsError) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useGoogleSheets } from '@/services/googleSheetsService'

const {
  gapiClientLoaded,
  gisLoaded,
  isSignedIn,
  accessToken: userToken,
  error: sheetsError,
  initializeModule,
  signIn,
  signOut,
  getSheetData,
  fetchAndWriteJsonData,
} = useGoogleSheets()

const spreadsheetId = ref('') // Вы можете предзаполнить тестовым ID
const rangeToGet = ref('Sheet1!A1:E10')
const sheetNameToWrite = ref('Sheet1')

const fetchedData = ref<any[][] | null>(null)
const writeDataResult = ref<any | null>(null)

onMounted(async () => {
  try {
    // Модуль должен уже автоматически инициализироваться при импорте
    // Если этого не произошло, можно вызвать инициализацию вручную
    if (!gapiClientLoaded.value || !gisLoaded.value) {
      await initializeModule()
    }
  } catch (e) {
    console.error('Ошибка инициализации в компоненте:', e)
    // Ошибка уже обрабатывается в сервисе через реактивный ref error
  }
})

async function handleSignIn() {
  fetchedData.value = null
  writeDataResult.value = null
  await signIn()
}

async function handleSignOut() {
  fetchedData.value = null
  writeDataResult.value = null
  await signOut()
}

async function handleGetData() {
  if (!spreadsheetId.value || !rangeToGet.value) {
    alert('Пожалуйста, введите ID таблицы и диапазон.')
    return
  }
  fetchedData.value = null
  writeDataResult.value = null
  const data = await getSheetData(spreadsheetId.value, rangeToGet.value)
  if (data) {
    fetchedData.value = data
  } else {
    // Ошибка уже установлена в sheetsError сервисом
    fetchedData.value = null
  }
}

async function handleWriteData() {
  if (!spreadsheetId.value || !sheetNameToWrite.value) {
    alert('Пожалуйста, введите ID таблицы и имя листа.')
    return
  }
  fetchedData.value = null
  writeDataResult.value = null
  const result = await fetchAndWriteJsonData(
    spreadsheetId.value,
    sheetNameToWrite.value,
    '/sampleData.json',
  )
  if (result) {
    writeDataResult.value = result
  } else {
    // Ошибка уже установлена в sheetsError сервисом
    writeDataResult.value = null
  }
}

// Очищаем ошибки при изменении состояния авторизации
watch([isSignedIn, gapiClientLoaded, gisLoaded], () => {
  if (sheetsError.value) {
    // Потенциально можно очищать определенные типы ошибок или логировать их
    // Пока сервис хранит ошибку до появления новой или ручной очистки
  }
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

.auth-status button {
  margin-left: 10px;
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
</style>
