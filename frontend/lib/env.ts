const fallbackApi =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "")

if (!fallbackApi && process.env.NODE_ENV !== "development") {
  throw new Error("NEXT_PUBLIC_API_URL must be set in production")
}

const fallbackWs =
  process.env.NEXT_PUBLIC_WS_URL ||
  (fallbackApi ? fallbackApi.replace(/^http/i, "ws") : "")

export const env = {
  apiUrl: fallbackApi,
  wsUrl: fallbackWs,
}
