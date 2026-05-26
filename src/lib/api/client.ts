// Client HTTP minimal pour l'API Buvard.
// Auth : Bearer JWT obtenu via Clerk getToken() (passé en argument par les hooks).

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/$/,
  '',
)

if (!API_URL) {
  throw new Error('Missing VITE_API_URL in .env.local')
}

// Format d'erreur backend : { error: { code, message, details? } }
export interface ApiErrorPayload {
  code?: string
  message: string
  details?: unknown
}

export class ApiError extends Error {
  status: number
  code?: string
  details?: unknown

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message)
    this.status = status
    this.code = payload.code
    this.details = payload.details
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  token?: string | null
  body?: unknown
  signal?: AbortSignal
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', token, body, signal }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (token) headers.Authorization = `Bearer ${token}`

  // FormData : pas de stringify et pas de Content-Type (le navigateur ajoute
  // le boundary multipart automatiquement). Sinon JSON par défaut.
  const isMultipart = body instanceof FormData
  if (body !== undefined && !isMultipart) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isMultipart
          ? (body as FormData)
          : JSON.stringify(body),
    signal,
  })

  if (res.status === 204) return undefined as T

  let payload: unknown
  const text = await res.text()
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!res.ok) {
    // Backend renvoie { error: { code, message, details? } }
    const errWrap =
      typeof payload === 'object' && payload !== null && 'error' in payload
        ? (payload as { error: ApiErrorPayload }).error
        : undefined
    throw new ApiError(res.status, {
      code: errWrap?.code,
      message: errWrap?.message ?? `Request failed (${res.status})`,
      details: errWrap?.details,
    })
  }

  return payload as T
}
