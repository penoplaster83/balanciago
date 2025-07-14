/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref, readonly } from 'vue'

// --- Interfaces ---
interface StoredToken {
  token: string
  expiry: number
}

interface TokenResponse {
  access_token: string
  expires_in: number // Lifetime in seconds
  error?: string
  id_token?: string
}

interface ApiError {
  context: string // In which function the error occurred
  details: any // Original error object
}

declare global {
  interface Window {
    gapi: any
    google: any
  }
}

// --- Constants ---
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const GOOGLE_AUTH_TOKEN_KEY = 'google_auth_token'
const DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4']
const SCOPES = 'openid email profile https://www.googleapis.com/auth/spreadsheets'

// --- Reactive State ---
const gapiClientLoaded = ref(false)
const gisLoaded = ref(false)
const isSignedIn = ref(false)
const accessToken = ref<string | null>(null)
const error = ref<ApiError | null>(null)
const isLoading = ref(false) // Combined loading state

let tokenClient: any = null

// --- Helper Functions ---
const withLoading = async <T>(promise: Promise<T>): Promise<T> => {
  isLoading.value = true
  try {
    return await promise
  } finally {
    isLoading.value = false
  }
}

const setError = (context: string, details: any) => {
  error.value = { context, details }
  console.error(`Error in ${context}:`, details)
}

const clearState = () => {
  accessToken.value = null
  isSignedIn.value = false
  localStorage.removeItem(GOOGLE_AUTH_TOKEN_KEY)
  if (window.gapi?.client) {
    window.gapi.client.setToken(null)
  }
}

// --- Script Loading ---
const loadScript = (src: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = (e) => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })

const loadGisScript = async () => {
  if (gisLoaded.value) return
  await loadScript('https://accounts.google.com/gsi/client')
  gisLoaded.value = true
}

const loadGapiScript = async () => {
  if (gapiClientLoaded.value) return
  await loadScript('https://apis.google.com/js/api.js')
  await new Promise<void>((resolve) => window.gapi.load('client', resolve))
  gapiClientLoaded.value = true
}

// --- Authentication Logic ---
const handleSuccessfulToken = (response: TokenResponse) => {
  if (response.error) {
    setError('handleSuccessfulToken', response)
    clearState()
    return
  }

  error.value = null
  accessToken.value = response.access_token
  isSignedIn.value = true
  window.gapi.client.setToken({ access_token: response.access_token })

  const expiryTimestamp = Date.now() + response.expires_in * 1000
  const tokenToStore: StoredToken = { token: response.access_token, expiry: expiryTimestamp }
  localStorage.setItem(GOOGLE_AUTH_TOKEN_KEY, JSON.stringify(tokenToStore))
}

const trySilentSignIn = async (): Promise<boolean> => {
  if (!tokenClient) return false

  return new Promise<boolean>((resolve) => {
    tokenClient.requestAccessToken({
      prompt: '', // Silent mode
      callback: (response: TokenResponse) => {
        if (response.error) {
          clearState()
          resolve(false)
        } else {
          handleSuccessfulToken(response)
          resolve(true)
        }
      },
    })
  })
}

const signIn = () => {
  if (!tokenClient || isSignedIn.value) return
  withLoading(
    new Promise<void>((resolve, reject) => {
      try {
        tokenClient.requestAccessToken({})
        resolve()
      } catch (e) {
        setError('signIn', e)
        reject(e)
      }
    }),
  )
}

const signOut = () => {
  const token = accessToken.value
  if (token && window.google) {
    window.google.accounts.oauth2.revoke(token, () => console.log('Access token revoked.'))
  }
  clearState()
}

const initClient = async () => {
  await window.gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  })

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (response: TokenResponse) => {
      isLoading.value = false
      handleSuccessfulToken(response)
    },
    error_callback: (err: any) => {
      isLoading.value = false
      const details =
        err.type === 'popup_closed'
          ? 'Login was canceled. Please try again.'
          : err.type === 'popup_failed_to_open'
            ? 'Failed to open login window. Please check your browser pop-up blocker.'
            : 'An unknown login error occurred.'
      setError('signInError', details)
    },
  })
}

const ensureValidToken = async (): Promise<boolean> => {
  if (!isSignedIn.value) return false

  const storedTokenString = localStorage.getItem(GOOGLE_AUTH_TOKEN_KEY)
  if (!storedTokenString) {
    clearState()
    return false
  }

  const storedToken: StoredToken = JSON.parse(storedTokenString)
  const isTokenExpiringSoon = storedToken.expiry - Date.now() < 120000 // 2 minutes

  if (isTokenExpiringSoon) {
    return await trySilentSignIn()
  }

  return true
}

// --- Google Sheets API Functions ---
const executeSheetRequest = async <T>(
  request: () => Promise<T>,
  context: string,
): Promise<T | undefined> => {
  if (!(await ensureValidToken())) {
    setError(context, 'Session expired. Please sign in again.')
    clearState()
    return undefined
  }

  try {
    return await withLoading(request())
  } catch (e: any) {
    setError(context, e.result?.error || e)
    return undefined
  }
}

const getSheetData = async (
  spreadsheetId: string,
  range: string,
): Promise<any[][] | undefined> => {
  const request = async () => {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    })
    return response.result.values
  }
  return executeSheetRequest(request, 'getSheetData')
}

const writeSheetData = async (
  spreadsheetId: string,
  range: string,
  values: any[][],
): Promise<any | undefined> => {
  const request = async () => {
    const response = await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: { values },
    })
    return response.result
  }
  return executeSheetRequest(request, 'writeSheetData')
}

// --- Initialization ---
const initializeModule = async () => {
  await withLoading(
    (async () => {
      try {
        await Promise.all([loadGisScript(), loadGapiScript()])
        await initClient()

        const storedTokenString = localStorage.getItem(GOOGLE_AUTH_TOKEN_KEY)
        if (storedTokenString) {
          const storedToken: StoredToken = JSON.parse(storedTokenString)
          if (storedToken.expiry > Date.now()) {
            handleSuccessfulToken({
              access_token: storedToken.token,
              expires_in: (storedToken.expiry - Date.now()) / 1000,
            })
          } else {
            await trySilentSignIn()
          }
        }
      } catch (e) {
        setError('initializeModule', e)
        clearState()
      }
    })(),
  )
}

const clearError = () => {
  error.value = null
}

// --- Export ---
export function useGoogleSheets() {
  return {
    // State
    isSignedIn: readonly(isSignedIn),
    isLoading: readonly(isLoading),
    error: readonly(error),
    gapiClientLoaded: readonly(gapiClientLoaded),
    gisLoaded: readonly(gisLoaded),

    // Methods
    initializeModule,
    signIn,
    signOut,
    getSheetData,
    writeSheetData,
    clearError,
  }
}
