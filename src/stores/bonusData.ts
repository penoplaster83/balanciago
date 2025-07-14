import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'

export interface BonusDataItem {
  id: string
  name: string
  value: number
  category: string
  [key: string]: any // для дополнительных полей
}

export interface DataVersion {
  version: 'Initial' | 'Changes'
  data: BonusDataItem[]
  timestamp: number
}

export const useBonusDataStore = defineStore(
  'bonusData',
  () => {
    // Состояние
    const initialData = ref<BonusDataItem[]>([])
    const changesData = ref<BonusDataItem[]>([])
    const isTableVisible = ref(false)
    const isLoading = ref(false)

    // Вычисляемые свойства
    const hasChanges = computed(() => {
      if (initialData.value.length !== changesData.value.length) return true

      return changesData.value.some((changeItem, index) => {
        const initialItem = initialData.value[index]
        if (!initialItem) return true

        return JSON.stringify(changeItem) !== JSON.stringify(initialItem)
      })
    })

    const currentData = computed(() => changesData.value)

    // Методы
    function setInitialData(data: any[][]) {
      if (!data || data.length === 0) {
        initialData.value = []
        changesData.value = []
        return
      }

      // Преобразуем данные из Google Sheets в структурированный формат
      const headers = data[0]
      const rows = data.slice(1)

      const structuredData: BonusDataItem[] = rows.map((row, index) => {
        const item: BonusDataItem = {
          id: `item-${index}`,
          name: row[0] || '',
          value: parseFloat(row[1]) || 0,
          category: row[2] || '',
        }

        // Добавляем дополнительные поля из заголовков
        headers.forEach((header, headerIndex) => {
          if (headerIndex > 2) {
            // Пропускаем основные поля
            item[header] = row[headerIndex] || ''
          }
        })

        return item
      })

      initialData.value = structuredData
      // Клонируем данные для изменений
      cloneDataForChanges()
    }

    function cloneDataForChanges() {
      // Глубокое клонирование данных
      changesData.value = JSON.parse(JSON.stringify(initialData.value))
    }

    function updateItem(id: string, field: string, value: any) {
      const item = changesData.value.find((item) => item.id === id)
      if (item) {
        item[field] = value
      }
    }

    function addItem(item: BonusDataItem) {
      changesData.value.push(item)
    }

    function removeItem(id: string) {
      const index = changesData.value.findIndex((item) => item.id === id)
      if (index !== -1) {
        changesData.value.splice(index, 1)
      }
    }

    function toggleTableVisibility() {
      isTableVisible.value = !isTableVisible.value
    }

    function resetToInitial() {
      cloneDataForChanges()
    }

    function getDataForSheets(): any[][] {
      if (changesData.value.length === 0) return []

      // Получаем все уникальные поля из данных
      const allFields = new Set<string>()
      changesData.value.forEach((item) => {
        Object.keys(item).forEach((key) => {
          if (key !== 'id') {
            // Исключаем внутренний id
            allFields.add(key)
          }
        })
      })

      const fields = Array.from(allFields)

      // Создаем заголовки
      const headers = fields

      // Создаем строки данных
      const rows = changesData.value.map((item) => fields.map((field) => item[field] || ''))

      return [headers, ...rows]
    }

    function clearData() {
      initialData.value = []
      changesData.value = []
      isTableVisible.value = false
    }

    return {
      // Состояние
      initialData,
      changesData,
      isTableVisible,
      isLoading: readonly(isLoading),

      // Вычисляемые свойства
      hasChanges,
      currentData,

      // Методы
      setInitialData,
      cloneDataForChanges,
      updateItem,
      addItem,
      removeItem,
      toggleTableVisibility,
      resetToInitial,
      getDataForSheets,
      clearData,
    }
  },
  {
    persist: {
      key: 'balanciago-bonus-data',
      storage: localStorage,
    },
  },
)
