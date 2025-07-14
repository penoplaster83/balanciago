<template>
  <div class="editable-table-container">
    <div class="table-header">
      <h3>Данные бонусов</h3>
      <div class="table-controls">
        <button @click="addNewRow" class="btn-add">+ Добавить строку</button>
        <button @click="resetToInitial" class="btn-reset" :disabled="!hasChanges">
          Сбросить изменения
        </button>
      </div>
    </div>

    <div v-if="currentData.length === 0" class="empty-state">
      <p>Нет данных для отображения</p>
    </div>

    <div v-else class="table-wrapper">
      <table class="editable-table">
        <thead>
          <tr>
            <th v-for="field in tableFields" :key="field" class="table-header-cell">
              {{ field }}
            </th>
            <th class="actions-header">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in currentData" :key="item.id" class="table-row">
            <td v-for="field in tableFields" :key="field" class="table-cell">
              <input
                v-if="field === 'value'"
                type="number"
                :value="item[field]"
                @input="updateItemField(item.id, field, $event)"
                class="cell-input number-input"
                step="0.01"
              />
              <input
                v-else
                type="text"
                :value="item[field]"
                @input="updateItemField(item.id, field, $event)"
                class="cell-input"
              />
            </td>
            <td class="actions-cell">
              <button @click="removeItem(item.id)" class="btn-remove" title="Удалить">×</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="hasChanges" class="changes-indicator">
      <span class="changes-badge">Есть изменения</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBonusDataStore, type BonusDataItem } from '@/stores/bonusData'

const bonusDataStore = useBonusDataStore()

const currentData = computed(() => bonusDataStore.currentData)
const hasChanges = computed(() => bonusDataStore.hasChanges)

// Получаем все уникальные поля из данных для отображения в таблице
const tableFields = computed(() => {
  if (currentData.value.length === 0) return []

  const allFields = new Set<string>()
  currentData.value.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== 'id') {
        // Исключаем внутренний id
        allFields.add(key)
      }
    })
  })

  return Array.from(allFields)
})

function updateItemField(id: string, field: string, event: Event) {
  const target = event.target as HTMLInputElement
  const value = field === 'value' ? parseFloat(target.value) || 0 : target.value
  bonusDataStore.updateItem(id, field, value)
}

function addNewRow() {
  const newItem: BonusDataItem = {
    id: `item-${Date.now()}`,
    name: '',
    value: 0,
    category: '',
  }
  bonusDataStore.addItem(newItem)
}

function removeItem(id: string) {
  bonusDataStore.removeItem(id)
}

function resetToInitial() {
  bonusDataStore.resetToInitial()
}
</script>

<style scoped>
.editable-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
}

.table-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.table-controls {
  display: flex;
  gap: 10px;
}

.btn-add,
.btn-reset {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-add {
  background-color: #28a745;
  color: white;
}

.btn-add:hover {
  background-color: #218838;
}

.btn-reset {
  background-color: #6c757d;
  color: white;
}

.btn-reset:hover:not(:disabled) {
  background-color: #545b62;
}

.btn-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #6c757d;
}

.table-wrapper {
  overflow-x: auto;
}

.editable-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.table-header-cell {
  background-color: #f2f2f2;
  padding: 12px 8px;
  text-align: left;
  font-weight: bold;
  color: #333;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.actions-header {
  background-color: #f2f2f2;
  padding: 12px 8px;
  text-align: center;
  font-weight: bold;
  color: #333;
  border-bottom: 2px solid #dee2e6;
  width: 80px;
}

.table-row {
  border-bottom: 1px solid #eee;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.table-cell {
  padding: 8px;
  border-right: 1px solid #eee;
  vertical-align: middle;
}

.cell-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 4px;
  font-size: 14px;
  background: transparent;
  transition: all 0.2s ease;
}

.cell-input:focus {
  outline: none;
  border-color: #007bff;
  background: white;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.number-input {
  text-align: right;
}

.actions-cell {
  padding: 8px;
  text-align: center;
  border-right: none;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  background: #c82333;
  transform: scale(1.1);
}

.changes-indicator {
  padding: 12px 20px;
  background: #fff3cd;
  border-top: 1px solid #ffeaa7;
}

.changes-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #ffc107;
  color: #856404;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
</style>
