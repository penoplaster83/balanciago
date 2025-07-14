<template>
  <div class="config-view">
    <h1>Настройки Google Sheets</h1>

    <div class="config-form">
      <div class="form-group">
        <label for="spreadsheetId">ID таблицы:</label>
        <input
          type="text"
          id="spreadsheetId"
          v-model="localConfig.spreadsheetId"
          placeholder="Введите ID таблицы Google Sheets"
        />
        <small>ID можно найти в URL таблицы после /d/ и перед /edit</small>
      </div>

      <div class="form-group">
        <label for="defaultRange">Диапазон по умолчанию:</label>
        <input
          type="text"
          id="defaultRange"
          v-model="localConfig.defaultRange"
          placeholder="Например: Sheet1!A1:E10"
        />
        <small>Диапазон в формате A1 (например: Sheet1!A1:E10)</small>
      </div>

      <div class="form-group">
        <label for="sheetName">Имя листа:</label>
        <input
          type="text"
          id="sheetName"
          v-model="localConfig.sheetName"
          placeholder="Например: Sheet1"
        />
        <small>Имя листа для записи данных</small>
      </div>

      <div class="actions">
        <button @click="saveConfig" class="btn-primary">Сохранить настройки</button>
        <button @click="resetConfig" class="btn-secondary">
          Сбросить к значениям по умолчанию
        </button>
      </div>
    </div>

    <div v-if="saveStatus" class="status-message" :class="saveStatus.type">
      {{ saveStatus.message }}
    </div>

    <div class="current-config">
      <h3>Текущие настройки:</h3>
      <pre>{{ JSON.stringify(configStore.sheetsConfig, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useConfigStore } from '@/stores/config'
import type { SheetsConfig } from '@/stores/config'

const configStore = useConfigStore()

const localConfig = reactive<SheetsConfig>({
  spreadsheetId: '',
  defaultRange: 'Sheet1!A1:E10',
  sheetName: 'Sheet1',
})

const saveStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null)

onMounted(() => {
  // Загружаем текущие настройки из стора
  localConfig.spreadsheetId = configStore.sheetsConfig.spreadsheetId
  localConfig.defaultRange = configStore.sheetsConfig.defaultRange
  localConfig.sheetName = configStore.sheetsConfig.sheetName
})

function saveConfig() {
  try {
    configStore.updateSheetsConfig(localConfig)
    saveStatus.value = {
      type: 'success',
      message: 'Настройки успешно сохранены!',
    }

    // Очищаем сообщение через 3 секунды
    setTimeout(() => {
      saveStatus.value = null
    }, 3000)
  } catch (error) {
    saveStatus.value = {
      type: 'error',
      message: `Ошибка сохранения: ${error}`,
    }
  }
}

function resetConfig() {
  configStore.resetSheetsConfig()
  localConfig.spreadsheetId = configStore.sheetsConfig.spreadsheetId
  localConfig.defaultRange = configStore.sheetsConfig.defaultRange
  localConfig.sheetName = configStore.sheetsConfig.sheetName

  saveStatus.value = {
    type: 'success',
    message: 'Настройки сброшены к значениям по умолчанию!',
  }

  setTimeout(() => {
    saveStatus.value = null
  }, 3000)
}
</script>

<style scoped>
.config-view {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.config-form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #666;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

.status-message {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.status-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.current-config {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.current-config h3 {
  margin-top: 0;
  color: #333;
}

.current-config pre {
  background: #fff;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ddd;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}
</style>
