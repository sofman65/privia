from pydantic import BaseModel, EmailStr


# --------------------
# Schemas
# --------------------


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None


class OAuthExchangeRequest(BaseModel):
    """Payload the frontend sends after NextAuth completes OAuth."""

    provider: str  # "google" | "github"
    provider_account_id: str  # unique id from the provider
    email: EmailStr
    full_name: str | None = None
    avatar_url: str | None = None


class UserProfile(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None = None
    role: str | None = None
