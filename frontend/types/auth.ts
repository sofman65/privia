export interface UserProfile {
  id: string
  email?: string | null
  full_name?: string | null
  role?: string | null
  refresh_token?: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: UserProfile
}
