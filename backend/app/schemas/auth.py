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


class UserProfile(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None = None
