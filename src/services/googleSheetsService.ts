/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, readonly, onBeforeMount } from 'vue'

// Расширяем интерфейс Window для TypeScript
declare global {
  interface Window {
    gapi: any
    google: any
  }
}

const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Отладочная информация:
console.log('API Key loaded:', API_KEY ? 'Defined (значение получено)' : 'UNDEFINED (нет значения)')
console.log(
  'Client ID loaded:',
  CLIENT_ID
    ? `Defined (начинается с: ${CLIENT_ID.substring(0, 8)}...)`
    : 'UNDEFINED (нет значения)',
)

// Array of API discovery doc URLs for APIs used.
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4']
// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'
const LOGIN_HINT = '' // Можно оставить пустым или указать email для предзаполнения

const gapiLoaded = ref(false)
const gapiClientLoaded = ref(false)
const gisLoaded = ref(false)
const isSignedIn = ref(false)
const accessToken = ref<string | null>(null)
const tokenClient = ref<any>(null)
const error = ref<any>(null)

// Загружаем скрипт Google Identity Services
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (window.google && window.google.accounts) {
        console.log('Google Identity Services уже загружен')
        gisLoaded.value = true
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        console.log('Google Identity Services загружен')
        gisLoaded.value = true
        resolve()
      }
      script.onerror = (e) => {
        console.error('Ошибка загрузки Google Identity Services:', e)
        error.value = 'Ошибка загрузки Google Identity Services'
        reject(new Error('Ошибка загрузки Google Identity Services'))
      }
      document.head.appendChild(script)
    } catch (e) {
      console.error('Исключение при загрузке GIS:', e)
      error.value = e
      reject(e)
    }
  })
}

// Загружаем Google API (только client, без auth2)
function loadGapiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (window.gapi) {
        console.log('GAPI уже загружен')
        gapiLoaded.value = true

        if (window.gapi.client) {
          console.log('GAPI client уже загружен')
          gapiClientLoaded.value = true
          resolve()
          return
        }

        // Загружаем только client без auth2
        window.gapi.load('client', () => {
          console.log('GAPI client загружен')
          gapiClientLoaded.value = true
          resolve()
        })
        return
      }

      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.async = true
      script.defer = true
      script.onload = () => {
        console.log('GAPI загружен')
        gapiLoaded.value = true

        // Загружаем только client без auth2
        window.gapi.load('client', () => {
          console.log('GAPI client загружен')
          gapiClientLoaded.value = true
          resolve()
        })
      }
      script.onerror = (e) => {
        console.error('Ошибка загрузки GAPI:', e)
        error.value = 'Ошибка загрузки GAPI'
        reject(new Error('Ошибка загрузки GAPI'))
      }
      document.body.appendChild(script)
    } catch (e) {
      console.error('Исключение при загрузке GAPI:', e)
      error.value = e
      reject(e)
    }
  })
}

// Инициализируем Google API client
async function initClient() {
  if (!window.gapi || !window.gapi.client) {
    console.error('GAPI client не загружен')
    error.value = 'GAPI client не загружен'
    return
  }

  if (!window.google || !window.google.accounts) {
    console.error('Google Identity Services не загружен')
    error.value = 'Google Identity Services не загружен'
    return
  }

  try {
    // Инициализируем только GAPI client без авторизации
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: DISCOVERY_DOCS,
    })

    // Логируем информацию
    console.log('Client ID used:', CLIENT_ID)
    console.log('Current origin:', window.location.origin)

    // Создаем tokenClient для авторизации через Google Identity Services
    tokenClient.value = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        if (tokenResponse.error !== undefined) {
          console.error('Ошибка авторизации:', tokenResponse)
          error.value = tokenResponse
          isSignedIn.value = false
          return
        }

        // Устанавливаем токен для API
        console.log('Получен токен доступа')
        accessToken.value = tokenResponse.access_token
        isSignedIn.value = true

        // Устанавливаем токен для GAPI client
        window.gapi.client.setToken({
          access_token: tokenResponse.access_token,
        })
      },
    })

    console.log('Клиент Google APIs инициализирован')

    // Проверяем, есть ли уже токен
    if (window.gapi.client.getToken() !== null) {
      console.log('Уже есть действующий токен')
      isSignedIn.value = true
      const token = window.gapi.client.getToken()
      accessToken.value = token.access_token
    }
  } catch (e) {
    console.error('Ошибка инициализации клиента:', e)
    error.value = e
  }
}

// Запрашиваем токен авторизации
async function signIn() {
  if (!tokenClient.value) {
    console.error('Token client не инициализирован')
    error.value = 'Token client не инициализирован'
    return
  }

  try {
    console.log('Запрашиваем токен доступа...')

    // Запрашиваем токен
    tokenClient.value.requestAccessToken({
      prompt: 'consent',
      hint: LOGIN_HINT || undefined,
    })
  } catch (e) {
    console.error('Ошибка авторизации:', e)
    error.value = e
  }
}

// Выходим из аккаунта
async function signOut() {
  if (!window.google || !window.google.accounts) {
    console.error('Google Identity Services не загружен')
    error.value = 'Google Identity Services не загружен'
    return
  }

  try {
    // Очищаем токен в GAPI
    if (window.gapi && window.gapi.client) {
      window.gapi.client.setToken(null)
    }

    // Отзываем доступ через Google Identity Services
    if (accessToken.value) {
      window.google.accounts.oauth2.revoke(accessToken.value, () => {
        console.log('Токен доступа отозван')
      })
    }

    accessToken.value = null
    isSignedIn.value = false
    console.log('Выход выполнен')
  } catch (e) {
    console.error('Ошибка при выходе:', e)
    error.value = e
  }
}

/**
 * Method to get data from a specified sheet.
 * @param spreadsheetId The ID of the spreadsheet.
 * @param range The A1 notation of the range to retrieve, e.g., "Sheet1!A1:B5".
 */
async function getSheetData(spreadsheetId: string, range: string): Promise<any[][] | undefined> {
  if (!isSignedIn.value || !window.gapi?.client?.sheets) {
    error.value = 'Пользователь не авторизован или API Sheets не загружен'
    console.error('Пользователь не авторизован или API Sheets не загружен')
    return
  }
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    })
    return response.result.values
  } catch (e: any) {
    error.value = e.result?.error || e
    console.error('Ошибка при получении данных из таблицы:', e)
    return undefined
  }
}

/**
 * Method to write data to a specified sheet.
 * @param spreadsheetId The ID of the spreadsheet.
 * @param range The A1 notation of the range to write to, e.g., "Sheet1!A1".
 * @param values A 2D array of values to write.
 */
async function writeSheetData(
  spreadsheetId: string,
  range: string,
  values: any[][],
): Promise<any | undefined> {
  if (!isSignedIn.value || !window.gapi?.client?.sheets) {
    error.value = 'Пользователь не авторизован или API Sheets не загружен'
    console.error('Пользователь не авторизован или API Sheets не загружен')
    return
  }
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: values,
      },
    })
    return response.result
  } catch (e: any) {
    error.value = e.result?.error || e
    console.error('Ошибка при записи данных в таблицу:', e)
    return undefined
  }
}

/**
 * Fetches data from a local JSON file (in public folder) and writes it to the specified sheet.
 * The JSON file is expected to have a "rows" property containing an array of arrays.
 * @param spreadsheetId The ID of the spreadsheet.
 * @param sheetName The name of the sheet to write to (e.g., "Sheet1"). Data will be written starting at A1.
 * @param jsonPath The path to the JSON file relative to the public folder (e.g., "/sampleData.json").
 */
async function fetchAndWriteJsonData(
  spreadsheetId: string,
  sheetName: string,
  jsonPath: string,
): Promise<any | undefined> {
  if (!isSignedIn.value) {
    error.value = 'Пользователь не авторизован'
    console.error('Пользователь не авторизован')
    return
  }
  try {
    const response = await fetch(jsonPath)
    if (!response.ok) {
      throw new Error(`Не удалось загрузить JSON данные из ${jsonPath}: ${response.statusText}`)
    }
    const jsonData = await response.json()

    // Basic transformation: assuming jsonData has a "rows" property which is an array of arrays.
    // You can implement more complex transformation logic here.
    const valuesToWrite: any[][] = jsonData.rows
    if (!Array.isArray(valuesToWrite) || !valuesToWrite.every((row) => Array.isArray(row))) {
      throw new Error('Неверная структура JSON: свойство "rows" должно быть массивом массивов')
    }

    // If you want to write headers as well (optional):
    // const headers: string[] = jsonData.headers;
    // if (headers && Array.isArray(headers)) {
    //   valuesToWrite.unshift(headers);
    // }

    if (valuesToWrite.length === 0) {
      console.warn('Нет данных для записи из JSON')
      return { message: 'Нет данных для записи' }
    }

    const range = `${sheetName}!A1` // Write starting from A1 of the specified sheet
    return await writeSheetData(spreadsheetId, range, valuesToWrite)
  } catch (e: any) {
    error.value = e.message || e
    console.error('Ошибка при загрузке или записи JSON данных:', e)
    return undefined
  }
}

// Инициализация модуля
async function initializeModule() {
  try {
    // Загружаем оба скрипта параллельно
    await Promise.all([loadGisScript(), loadGapiScript()])
    // Инициализируем клиент
    await initClient()
  } catch (e) {
    console.error('Ошибка инициализации модуля:', e)
    error.value = e
  }
}

// Запускаем инициализацию при загрузке модуля
if (typeof window !== 'undefined') {
  // Запускаем инициализацию после небольшой задержки, чтобы дать время DOM полностью загрузиться
  setTimeout(initializeModule, 100)
}

// Expose reactive state and methods
export function useGoogleSheets() {
  return {
    gapiLoaded: readonly(gapiLoaded),
    gapiClientLoaded: readonly(gapiClientLoaded),
    gisLoaded: readonly(gisLoaded),
    isSignedIn: readonly(isSignedIn),
    accessToken: readonly(accessToken),
    error: readonly(error),
    initializeModule,
    signIn,
    signOut,
    getSheetData,
    writeSheetData,
    fetchAndWriteJsonData,
  }
}
