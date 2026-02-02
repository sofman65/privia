const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "")

if (!apiUrl && process.env.NODE_ENV !== "development") {
  throw new Error("NEXT_PUBLIC_API_URL must be set for production")
}

export const API_URL = apiUrl
