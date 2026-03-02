import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select

from app.database import init_db, async_session
from app.models import User, UserRole, Plan, PlanTier, SiteSettings
from app.auth import hash_password
from app.routers import auth_router, jobs_router, applications_router, admin_router

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def seed_defaults():
    async with async_session() as db:
        # Seed admin user
        result = await db.execute(select(User).where(User.email == "admin@apliquei.com"))
        if not result.scalar_one_or_none():
            admin = User(
                name="Administrador",
                email="admin@apliquei.com",
                hashed_password=hash_password("admin123"),
                role=UserRole.ADMIN,
                company="Apliquei",
            )
            db.add(admin)

        # Seed plans
        default_plans = [
            {"name": "Grátis", "tier": PlanTier.FREE, "price": 0, "max_jobs": 1, "max_applications_view": 5, "featured_jobs": 0, "description": "Para começar a recrutar"},
            {"name": "Básico", "tier": PlanTier.BASIC, "price": 9900, "max_jobs": 5, "max_applications_view": 50, "featured_jobs": 1, "description": "Para pequenas empresas"},
            {"name": "Profissional", "tier": PlanTier.PRO, "price": 19900, "max_jobs": 20, "max_applications_view": 500, "featured_jobs": 5, "description": "Para empresas em crescimento"},
            {"name": "Enterprise", "tier": PlanTier.ENTERPRISE, "price": 49900, "max_jobs": 9999, "max_applications_view": 9999, "featured_jobs": 50, "description": "Vagas ilimitadas para grandes empresas"},
        ]
        for p in default_plans:
            existing = await db.execute(select(Plan).where(Plan.tier == p["tier"]))
            if not existing.scalar_one_or_none():
                db.add(Plan(**p))

        # Seed default site settings
        default_settings = [
            {"key": "site_name", "value": "Apliquei", "category": "theme"},
            {"key": "primary_color", "value": "#4f46e5", "category": "theme"},
            {"key": "accent_color", "value": "#d946ef", "category": "theme"},
            {"key": "logo_url", "value": "", "category": "theme"},
            {"key": "hero_title", "value": "Encontre seu emprego dos sonhos", "category": "content"},
            {"key": "hero_subtitle", "value": "Conectamos os melhores talentos com as melhores empresas.", "category": "content"},
            {"key": "footer_text", "value": "© 2025 Apliquei. Todos os direitos reservados.", "category": "content"},
        ]
        for s in default_settings:
            existing = await db.execute(select(SiteSettings).where(SiteSettings.key == s["key"]))
            if not existing.scalar_one_or_none():
                db.add(SiteSettings(**s))

        await db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_defaults()
    yield


app = FastAPI(title="Apliquei API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth_router.router)
app.include_router(jobs_router.router)
app.include_router(applications_router.router)
app.include_router(admin_router.router)


# Public plans endpoint (no auth needed)
@app.get("/api/plans")
async def public_plans():
    from app.database import async_session
    from app.models import Plan
    from app.schemas import PlanOut
    async with async_session() as db:
        result = await db.execute(select(Plan).where(Plan.is_active == 1).order_by(Plan.price))
        return [PlanOut.model_validate(p) for p in result.scalars().all()]


@app.get("/")
async def root():
    return {"message": "Apliquei API is running!"}
