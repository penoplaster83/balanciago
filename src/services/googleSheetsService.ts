/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, readonly } from 'vue'

// --- Интерфейсы ---
interface StoredToken {
  token: string
  expiry: number
}

interface TokenResponse {
  access_token: string
  expires_in: number // Срок жизни в секундах
  error?: string
}

interface ApiError {
  context: string // В какой функции произошла ошибка
  details: any // Оригинальный объект ошибки
}

declare global {
  interface Window {
    gapi: any
    google: any
  }
}

// --- Константы ---
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_AUTH_TOKEN_KEY = 'google_auth_token'
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4']
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'

// --- Реактивное состояние ---
const gapiLoaded = ref(false)
const gapiClientLoaded = ref(false)
const gisLoaded = ref(false)
const isSignedIn = ref(false)
const accessToken = ref<string | null>(null)
const error = ref<ApiError | null>(null)
const isAuthLoading = ref(false)
const isDataLoading = ref(false)
const idToken = ref<string | null>(null)

let tokenClient: any = null

// --- Загрузка скриптов (без изменений) ---
function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (window.google && window.google.accounts) {
        gisLoaded.value = true
        return resolve()
      }
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        gisLoaded.value = true
        resolve()
      }
      script.onerror = (e) => reject(e)
      document.head.appendChild(script)
    } catch (e) {
      reject(e)
    }
  })
}

function loadGapiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      if (window.gapi && window.gapi.client) {
        gapiLoaded.value = true
        gapiClientLoaded.value = true
        return resolve()
      }
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.async = true
      script.defer = true
      script.onload = () => {
        gapiLoaded.value = true
        window.gapi.load('client', () => {
          gapiClientLoaded.value = true
          resolve()
        })
      }
      script.onerror = (e) => reject(e)
      document.body.appendChild(script)
    } catch (e) {
      reject(e)
    }
  })
}

// --- Логика Аутентификации ---

/**
 * Обрабатывает успешный ответ от сервера авторизации.
 * Сохраняет токен, обновляет состояние и устанавливает токен для GAPI клиента.
 * @param response Ответ от сервера Google.
 */
function handleSuccessfulToken(response: TokenResponse & { id_token?: string }) {
  console.log('Ответ Google на запрос токена:', response)
  // Эта функция теперь обрабатывает только успешные ответы
  // или ошибки от явной попытки входа через signIn()
  if (response.error) {
    error.value = { context: 'handleSuccessfulToken', details: response }
    isSignedIn.value = false
    accessToken.value = null
    idToken.value = null
    isAuthLoading.value = false
    localStorage.removeItem(GOOGLE_AUTH_TOKEN_KEY)
    return
  }

  error.value = null
  accessToken.value = response.access_token
  isSignedIn.value = true
  if (response.id_token) {
    idToken.value = response.id_token
  }
  window.gapi.client.setToken({ access_token: response.access_token })
  console.log('Токен доступа успешно получен/обновлен.')

  try {
    const expiryTimestamp = Date.now() + response.expires_in * 1000
    const tokenToStore: StoredToken = { token: response.access_token, expiry: expiryTimestamp }
    localStorage.setItem(GOOGLE_AUTH_TOKEN_KEY, JSON.stringify(tokenToStore))
  } catch (lsError) {
    error.value = { context: 'localStorage', details: lsError }
    console.error('Ошибка сохранения токена в localStorage:', lsError)
  }

  // Убираем isAuthLoading в конце, чтобы интерфейс разблокировался
  isAuthLoading.value = false
}

/**
 * Пытается войти в систему или обновить токен в "тихом" режиме (без взаимодействия с пользователем).
 * @returns Promise<boolean> который разрешается в `true` если обновление прошло успешно.
 */
async function trySilentSignIn(): Promise<boolean> {
  if (isAuthLoading.value || !tokenClient || isSignedIn.value) return false
  console.log('Попытка тихого входа / обновления токена...')
  isAuthLoading.value = true

  return new Promise((resolve) => {
    try {
      tokenClient.requestAccessToken({
        prompt: '', // `prompt: ''` означает "тихий" режим
        callback: (response: TokenResponse) => {
          if (response.error) {
            console.warn('Тихое обновление токена не удалось:', response.error)
            // Не вызываем signOut(). Просто очищаем локальное состояние.
            // Пользователь теперь "не авторизован" и может войти снова вручную.
            accessToken.value = null
            isSignedIn.value = false
            localStorage.removeItem(GOOGLE_AUTH_TOKEN_KEY)
            if (window.gapi?.client) {
              window.gapi.client.setToken(null)
            }
            isAuthLoading.value = false
            resolve(false)
          } else {
            // Успех! Используем стандартный обработчик.
            handleSuccessfulToken(response)
            isAuthLoading.value = false
            resolve(true)
          }
        },
      })
    } catch (e) {
      isAuthLoading.value = false
      error.value = { context: 'trySilentSignIn', details: e }
      resolve(false)
    }
  })
}

/**
 * Инициирует интерактивный вход в систему, запрашивая разрешение пользователя.
 * Вызывается по клику на кнопку "Войти".
 */
function signIn() {
  if (isAuthLoading.value || !tokenClient || isSignedIn.value) return
  console.log('Запрос на авторизацию...')
  isAuthLoading.value = true

  try {
    tokenClient.requestAccessToken({})
  } catch (e) {
    isAuthLoading.value = false
    error.value = { context: 'signIn', details: e }
    console.error('Ошибка при вызове requestAccessToken:', e)
  }
}

/**
 * Выход из системы. Очищает локальное состояние.
 * По умолчанию НЕ отзывает доступ приложению.
 */
async function signOut() {
  const token = accessToken.value
  if (token && window.google) {
    // Чтобы полностью отозвать токен (потребуется повторная авторизация
    // с экраном разрешений при следующем входе), раскомментируйте следующую строку.
    // window.google.accounts.oauth2.revoke(token, () => console.log('Доступ отозван.'));
  }

  accessToken.value = null
  isSignedIn.value = false
  isAuthLoading.value = false // Убедимся что флаг загрузки сброшен
  localStorage.removeItem(GOOGLE_AUTH_TOKEN_KEY)
  console.log('Выход выполнен, локальные данные очищены.')

  if (window.gapi?.client) {
    window.gapi.client.setToken(null)
  }
}

/**
 * Инициализирует GAPI и GIS клиенты.
 */
async function initClient() {
  if (!window.gapi || !window.google) {
    throw new Error('GAPI или GIS скрипты не загружены.')
  }

  await window.gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  })

  if (tokenClient) return

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'openid email profile https://www.googleapis.com/auth/spreadsheets',
    include_granted_scopes: true,
    callback: handleSuccessfulToken,
    error_callback: (err: any) => {
      isAuthLoading.value = false
      let details = err.type || 'Unknown error'

      // Превращаем технические ошибки в понятные сообщения
      if (details === 'popup_closed') {
        details = 'Вход был отменен. Пожалуйста, попробуйте еще раз.'
      } else if (details === 'popup_failed_to_open') {
        details =
          'Не удалось открыть окно входа. Проверьте, не блокирует ли ваш браузер всплывающие окна.'
      }

      error.value = { context: 'signInError', details: details }
      console.error('Ошибка входа:', err)
    },
  })
}

/**
 * Проверяет, валиден ли токен перед API вызовом, и обновляет его, если он скоро истечет.
 * @returns Promise<boolean> `true`, если токен валиден или был успешно обновлен.
 */
async function ensureValidToken(): Promise<boolean> {
  if (!isSignedIn.value) return false

  const storedTokenString = localStorage.getItem(GOOGLE_AUTH_TOKEN_KEY)
  if (!storedTokenString) {
    isSignedIn.value = false
    return false
  }

  const storedToken: StoredToken = JSON.parse(storedTokenString)
  // Проверяем, истекает ли токен в ближайшие 2 минуты (120,000 мс)
  const isTokenExpiringSoon = storedToken.expiry - Date.now() < 120000

  if (isTokenExpiringSoon) {
    console.log('Срок действия токена скоро истечет, пытаемся обновить...')
    return await trySilentSignIn()
  }

  return true
}

// --- Функции для работы с Google Sheets ---

/**
 * Получает данные из таблицы.
 */
async function getSheetData(spreadsheetId: string, range: string): Promise<any[][] | undefined> {
  const tokenValid = await ensureValidToken()
  if (!tokenValid) {
    error.value = { context: 'getSheetData', details: 'Сессия истекла. Пожалуйста, войдите снова.' }
    isSignedIn.value = false // Обновляем UI
    return
  }

  isDataLoading.value = true
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range,
    })
    return response.result.values
  } catch (e: any) {
    error.value = { context: 'getSheetData', details: e.result?.error || e }
  } finally {
    isDataLoading.value = false
  }
}

/**
 * Записывает данные в таблицу.
 */
async function writeSheetData(
  spreadsheetId: string,
  range: string,
  values: any[][],
): Promise<any | undefined> {
  const tokenValid = await ensureValidToken()
  if (!tokenValid) {
    error.value = {
      context: 'writeSheetData',
      details: 'Сессия истекла. Пожалуйста, войдите снова.',
    }
    isSignedIn.value = false // Обновляем UI
    return
  }

  isDataLoading.value = true
  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    })
    return response.result
  } catch (e: any) {
    error.value = { context: 'writeSheetData', details: e.result?.error || e }
  } finally {
    isDataLoading.value = false
  }
}

/**
 * Инициализирует модуль: загружает скрипты, клиенты и пытается восстановить сессию.
 */
async function initializeModule() {
  try {
    isAuthLoading.value = true
    await Promise.all([loadGisScript(), loadGapiScript()])
    await initClient()

    const storedTokenString = localStorage.getItem(GOOGLE_AUTH_TOKEN_KEY)
    if (storedTokenString) {
      const storedToken: StoredToken = JSON.parse(storedTokenString)
      // Проверяем, что токен не просто есть, а еще и валиден
      if (storedToken.token && storedToken.expiry > Date.now()) {
        console.log('Восстанавливаем сессию из localStorage.')
        handleSuccessfulToken({
          access_token: storedToken.token,
          expires_in: (storedToken.expiry - Date.now()) / 1000,
        })
      } else {
        // Токен в хранилище истек, пробуем обновить его тихо
        await trySilentSignIn()
      }
    } else {
      // Токена нет, пробуем войти тихо (для вернувшихся пользователей)
      await trySilentSignIn()
    }
  } catch (e) {
    isAuthLoading.value = false
    console.error('Критическая ошибка при инициализации модуля:', e)
    error.value = { context: 'initializeModule', details: e }
  } finally {
    // Убеждаемся, что isAuthLoading сброшен в любом случае
    if (!isSignedIn.value) {
      isAuthLoading.value = false
    }
  }
}

function clearError() {
  error.value = null
}

// --- Экспорт ---
export function useGoogleSheets() {
  return {
    // Состояния
    isSignedIn: readonly(isSignedIn),
    isAuthLoading: readonly(isAuthLoading),
    isDataLoading: readonly(isDataLoading),
    error: readonly(error),
    gapiClientLoaded: readonly(gapiClientLoaded),
    gisLoaded: readonly(gisLoaded),
    accessToken: readonly(accessToken),
    idToken: readonly(idToken),

    // Методы
    initializeModule,
    signIn,
    signOut,
    getSheetData,
    writeSheetData,
    clearError,
    trySilentSignIn,
  }
}
