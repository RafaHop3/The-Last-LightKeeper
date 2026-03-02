from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database import get_db
from app.models import Application, Job, User, UserRole, ApplicationStatus
from app.schemas import ApplicationCreate, ApplicationOut, ApplicationStatusUpdate
from app.auth import get_current_user

router = APIRouter(prefix="/api/applications", tags=["applications"])


def _app_to_out(app: Application, job: Job = None, candidate: User = None) -> ApplicationOut:
    return ApplicationOut(
        id=app.id,
        job_id=app.job_id,
        candidate_id=app.candidate_id,
        cover_letter=app.cover_letter,
        status=app.status.value if hasattr(app.status, "value") else app.status,
        created_at=app.created_at,
        job_title=job.title if job else None,
        job_company=job.company if job else None,
        candidate_name=candidate.name if candidate else None,
        candidate_email=candidate.email if candidate else None,
    )


@router.post("", response_model=ApplicationOut)
async def apply(
    data: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates can apply")

    # check job exists
    job_result = await db.execute(select(Job).where(Job.id == data.job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # check duplicate
    dup = await db.execute(
        select(Application).where(
            Application.job_id == data.job_id,
            Application.candidate_id == current_user.id,
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already applied to this job")

    app = Application(
        job_id=data.job_id,
        candidate_id=current_user.id,
        cover_letter=data.cover_letter,
    )
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return _app_to_out(app, job, current_user)


@router.get("/my", response_model=List[ApplicationOut])
async def my_applications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.CANDIDATE:
        raise HTTPException(status_code=403, detail="Only candidates")

    result = await db.execute(
        select(Application).where(Application.candidate_id == current_user.id).order_by(Application.created_at.desc())
    )
    apps = result.scalars().all()

    out = []
    for a in apps:
        job_r = await db.execute(select(Job).where(Job.id == a.job_id))
        job = job_r.scalar_one_or_none()
        out.append(_app_to_out(a, job, current_user))
    return out


@router.get("/job/{job_id}", response_model=List[ApplicationOut])
async def job_applications(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Only recruiters")

    # verify ownership
    job_r = await db.execute(select(Job).where(Job.id == job_id))
    job = job_r.scalar_one_or_none()
    if not job or job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    result = await db.execute(
        select(Application).where(Application.job_id == job_id).order_by(Application.created_at.desc())
    )
    apps = result.scalars().all()

    out = []
    for a in apps:
        cand_r = await db.execute(select(User).where(User.id == a.candidate_id))
        cand = cand_r.scalar_one_or_none()
        out.append(_app_to_out(a, job, cand))
    return out


@router.put("/{app_id}/status", response_model=ApplicationOut)
async def update_status(
    app_id: int,
    data: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Only recruiters")

    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # verify ownership
    job_r = await db.execute(select(Job).where(Job.id == app.job_id))
    job = job_r.scalar_one_or_none()
    if not job or job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    app.status = ApplicationStatus(data.status)
    await db.commit()
    await db.refresh(app)

    cand_r = await db.execute(select(User).where(User.id == app.candidate_id))
    cand = cand_r.scalar_one_or_none()
    return _app_to_out(app, job, cand)
