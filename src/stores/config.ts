import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SheetsConfig {
  spreadsheetId: string
  defaultRange: string
  sheetName: string
}

export const useConfigStore = defineStore(
  'config',
  () => {
    const sheetsConfig = ref<SheetsConfig>({
      spreadsheetId: '',
      defaultRange: 'Sheet1!A1:E10',
      sheetName: 'Sheet1',
    })

    function updateSheetsConfig(newConfig: Partial<SheetsConfig>) {
      sheetsConfig.value = { ...sheetsConfig.value, ...newConfig }
    }

    function resetSheetsConfig() {
      sheetsConfig.value = {
        spreadsheetId: '',
        defaultRange: 'Sheet1!A1:E10',
        sheetName: 'Sheet1',
      }
    }

    return {
      sheetsConfig,
      updateSheetsConfig,
      resetSheetsConfig,
    }
  },
  {
    persist: {
      key: 'balanciago-config',
      storage: localStorage,
    },
  },
)
