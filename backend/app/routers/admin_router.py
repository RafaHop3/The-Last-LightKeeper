import os
import uuid
import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy import select, func, text, inspect as sa_inspect
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, engine, Base
from app.models import User, UserRole, Job, Application, Plan, PlanTier, SiteSettings, UploadedFile
from app.schemas import (
    UserOut, AdminUserUpdate, AdminUserCreate, PlanOut, PlanUpdate,
    SiteSettingOut, SiteSettingUpdate, SiteSettingCreate,
    FileOut, DBTableInfo, DBQueryResult, AdminStats,
)
from app.auth import get_current_user, hash_password
from app.config import settings

router = APIRouter(prefix="/api/admin", tags=["admin"])

UPLOAD_DIR = str(settings.UPLOAD_DIR)
os.makedirs(UPLOAD_DIR, exist_ok=True)


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


# ==================== STATS ====================

@router.get("/stats", response_model=AdminStats)
async def admin_stats(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    total_users = (await db.execute(select(func.count()).select_from(User))).scalar() or 0
    total_candidates = (await db.execute(select(func.count()).where(User.role == UserRole.CANDIDATE))).scalar() or 0
    total_recruiters = (await db.execute(select(func.count()).where(User.role == UserRole.RECRUITER))).scalar() or 0
    total_jobs = (await db.execute(select(func.count()).select_from(Job))).scalar() or 0
    active_jobs = (await db.execute(select(func.count()).where(Job.is_active == 1))).scalar() or 0
    total_applications = (await db.execute(select(func.count()).select_from(Application))).scalar() or 0
    total_files = (await db.execute(select(func.count()).select_from(UploadedFile))).scalar() or 0
    users_today = (await db.execute(select(func.count()).where(User.created_at >= today))).scalar() or 0

    return AdminStats(
        total_users=total_users, total_candidates=total_candidates,
        total_recruiters=total_recruiters, total_jobs=total_jobs,
        total_applications=total_applications, total_files=total_files,
        active_jobs=active_jobs, users_today=users_today,
    )


# ==================== USER MANAGEMENT ====================

@router.get("/users", response_model=List[UserOut])
async def list_users(
    role: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = select(User).order_by(User.created_at.desc())
    if role:
        query = query.where(User.role == UserRole(role))
    if search:
        query = query.where(User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
    result = await db.execute(query)
    return [UserOut.model_validate(u) for u in result.scalars().all()]


@router.post("/users", response_model=UserOut)
async def create_user(data: AdminUserCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=data.name, email=data.email,
        hashed_password=hash_password(data.password),
        role=UserRole(data.role), company=data.company,
        phone=data.phone, plan=PlanTier(data.plan) if data.plan else PlanTier.FREE,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.get("/users/{user_id}", response_model=UserOut)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut.model_validate(user)


@router.put("/users/{user_id}", response_model=UserOut)
async def update_user(user_id: int, data: AdminUserUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updates = data.model_dump(exclude_unset=True)
    if "role" in updates:
        updates["role"] = UserRole(updates["role"])
    if "plan" in updates:
        updates["plan"] = PlanTier(updates["plan"])
    for field, value in updates.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    await db.delete(user)
    await db.commit()
    return {"detail": "User deleted"}


# ==================== PLANS ====================

@router.get("/plans", response_model=List[PlanOut])
async def list_plans(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(Plan).order_by(Plan.price))
    return [PlanOut.model_validate(p) for p in result.scalars().all()]


@router.put("/plans/{plan_id}", response_model=PlanOut)
async def update_plan(plan_id: int, data: PlanUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(Plan).where(Plan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    await db.commit()
    await db.refresh(plan)
    return PlanOut.model_validate(plan)


# ==================== SITE SETTINGS ====================

@router.get("/settings", response_model=List[SiteSettingOut])
async def list_settings(
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = select(SiteSettings).order_by(SiteSettings.category, SiteSettings.key)
    if category:
        query = query.where(SiteSettings.category == category)
    result = await db.execute(query)
    return [SiteSettingOut.model_validate(s) for s in result.scalars().all()]


@router.post("/settings", response_model=SiteSettingOut)
async def create_setting(data: SiteSettingCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    existing = await db.execute(select(SiteSettings).where(SiteSettings.key == data.key))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Setting key already exists")
    setting = SiteSettings(key=data.key, value=data.value, category=data.category)
    db.add(setting)
    await db.commit()
    await db.refresh(setting)
    return SiteSettingOut.model_validate(setting)


@router.put("/settings/{setting_id}", response_model=SiteSettingOut)
async def update_setting(setting_id: int, data: SiteSettingUpdate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(SiteSettings).where(SiteSettings.id == setting_id))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    setting.value = data.value
    await db.commit()
    await db.refresh(setting)
    return SiteSettingOut.model_validate(setting)


@router.delete("/settings/{setting_id}")
async def delete_setting(setting_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(SiteSettings).where(SiteSettings.id == setting_id))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    await db.delete(setting)
    await db.commit()
    return {"detail": "Setting deleted"}


# ==================== FILE MANAGER ====================

@router.get("/files", response_model=List[FileOut])
async def list_files(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(UploadedFile).order_by(UploadedFile.created_at.desc()))
    return [FileOut.model_validate(f) for f in result.scalars().all()]


@router.post("/files/upload", response_model=FileOut)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    ext = os.path.splitext(file.filename)[1] if file.filename else ""
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    uploaded = UploadedFile(
        filename=unique_name,
        original_name=file.filename or "unknown",
        content_type=file.content_type,
        size=len(content),
        path=f"/uploads/{unique_name}",
        uploaded_by=admin.id,
    )
    db.add(uploaded)
    await db.commit()
    await db.refresh(uploaded)
    return FileOut.model_validate(uploaded)


@router.delete("/files/{file_id}")
async def delete_file(file_id: int, db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    result = await db.execute(select(UploadedFile).where(UploadedFile.id == file_id))
    f = result.scalar_one_or_none()
    if not f:
        raise HTTPException(status_code=404, detail="File not found")

    full_path = os.path.join(UPLOAD_DIR, f.filename)
    if os.path.exists(full_path):
        os.remove(full_path)

    await db.delete(f)
    await db.commit()
    return {"detail": "File deleted"}


@router.post("/files/scan")
async def scan_files(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    """Scan uploads directory and add any untracked files to DB."""
    added = 0
    if os.path.exists(UPLOAD_DIR):
        existing = await db.execute(select(UploadedFile.filename))
        tracked = {row[0] for row in existing.fetchall()}
        for fname in os.listdir(UPLOAD_DIR):
            fpath = os.path.join(UPLOAD_DIR, fname)
            if os.path.isfile(fpath) and fname not in tracked:
                import mimetypes
                ct, _ = mimetypes.guess_type(fname)
                size = os.path.getsize(fpath)
                uploaded = UploadedFile(
                    filename=fname, original_name=fname,
                    content_type=ct or "application/octet-stream",
                    size=size, path=f"/uploads/{fname}",
                    uploaded_by=admin.id,
                )
                db.add(uploaded)
                added += 1
        if added:
            await db.commit()
    return {"detail": f"{added} files synced"}


# ==================== DB VIEWER ====================

@router.get("/db/tables", response_model=List[DBTableInfo])
async def list_tables(db: AsyncSession = Depends(get_db), admin: User = Depends(require_admin)):
    tables = []
    async with engine.connect() as conn:
        table_names = await conn.run_sync(lambda sync_conn: sa_inspect(sync_conn).get_table_names())
        for name in table_names:
            count_result = await conn.execute(text(f'SELECT COUNT(*) FROM "{name}"'))
            count = count_result.scalar() or 0
            cols_result = await conn.run_sync(
                lambda sync_conn, n=name: [c["name"] for c in sa_inspect(sync_conn).get_columns(n)]
            )
            tables.append(DBTableInfo(name=name, row_count=count, columns=cols_result))
    return tables


@router.get("/db/tables/{table_name}", response_model=DBQueryResult)
async def view_table(
    table_name: str,
    limit: int = Query(50, le=500),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    async with engine.connect() as conn:
        table_names = await conn.run_sync(lambda sync_conn: sa_inspect(sync_conn).get_table_names())
        if table_name not in table_names:
            raise HTTPException(status_code=404, detail="Table not found")

        cols_result = await conn.run_sync(
            lambda sync_conn: [c["name"] for c in sa_inspect(sync_conn).get_columns(table_name)]
        )
        count_result = await conn.execute(text(f'SELECT COUNT(*) FROM "{table_name}"'))
        total = count_result.scalar() or 0

        result = await conn.execute(text(f'SELECT * FROM "{table_name}" LIMIT :limit OFFSET :offset').bindparams(limit=limit, offset=offset))
        rows = [list(row) for row in result.fetchall()]

    return DBQueryResult(columns=cols_result, rows=rows, total=total)
