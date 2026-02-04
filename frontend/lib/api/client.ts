import { env } from "@/lib/env"

export class ApiError extends Error {
  status?: number
  details?: unknown
}

type FetchOptions = RequestInit & { skipJson?: boolean }

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipJson, headers, body, ...rest } = options
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData
  const res = await fetch(`${env.apiUrl}${path}`, {
    ...rest,
    body,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(headers || {}),
    },
  })

  if (!res.ok) {
    const err = new ApiError(`Request failed with ${res.status}`)
    err.status = res.status
    try {
      err.details = await res.json()
    } catch {
      // ignore json parse errors
    }
    throw err
  }

  if (skipJson) return undefined as unknown as T

  return (await res.json()) as T
}
