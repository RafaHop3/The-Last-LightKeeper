from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


# --- Auth ---
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str  # "recruiter" or "candidate"
    company: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    company: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[int] = 1
    plan: Optional[str] = "free"
    plan_expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# --- Profile ---
class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    company: Optional[str] = None


# --- Admin User Management ---
class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    company: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[int] = None
    plan: Optional[str] = None


class AdminUserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str
    company: Optional[str] = None
    phone: Optional[str] = None
    plan: Optional[str] = "free"


# --- Plans ---
class PlanOut(BaseModel):
    id: int
    name: str
    tier: str
    price: int
    max_jobs: int
    max_applications_view: int
    featured_jobs: int
    description: Optional[str] = None
    is_active: int = 1

    class Config:
        from_attributes = True


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[int] = None
    max_jobs: Optional[int] = None
    max_applications_view: Optional[int] = None
    featured_jobs: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[int] = None


# --- Site Settings ---
class SiteSettingOut(BaseModel):
    id: int
    key: str
    value: Optional[str] = None
    category: str = "general"

    class Config:
        from_attributes = True


class SiteSettingUpdate(BaseModel):
    value: str


class SiteSettingCreate(BaseModel):
    key: str
    value: str
    category: str = "general"


# --- Uploaded Files ---
class FileOut(BaseModel):
    id: int
    filename: str
    original_name: str
    content_type: Optional[str] = None
    size: int = 0
    path: str
    uploaded_by: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- DB Viewer ---
class DBTableInfo(BaseModel):
    name: str
    row_count: int
    columns: List[str]


class DBQueryResult(BaseModel):
    columns: List[str]
    rows: List[List[Any]]
    total: int


# --- Admin Stats ---
class AdminStats(BaseModel):
    total_users: int
    total_candidates: int
    total_recruiters: int
    total_jobs: int
    total_applications: int
    total_files: int
    active_jobs: int
    users_today: int


# --- Jobs ---
class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    job_type: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    description: str
    requirements: Optional[str] = None
    benefits: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    is_active: Optional[int] = None


class JobOut(BaseModel):
    id: int
    title: str
    company: str
    location: str
    job_type: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    description: str
    requirements: Optional[str] = None
    benefits: Optional[str] = None
    recruiter_id: int
    created_at: Optional[datetime] = None
    is_active: int = 1
    application_count: Optional[int] = 0
    recruiter_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Applications ---
class ApplicationCreate(BaseModel):
    job_id: int
    cover_letter: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str  # pending, reviewed, accepted, rejected


class ApplicationOut(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    cover_letter: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    job_title: Optional[str] = None
    job_company: Optional[str] = None
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None

    class Config:
        from_attributes = True
