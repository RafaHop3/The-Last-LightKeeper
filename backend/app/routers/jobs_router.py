from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from app.database import get_db
from app.models import Job, User, UserRole, Application
from app.schemas import JobCreate, JobUpdate, JobOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


def _job_to_out(job: Job, app_count: int = 0) -> JobOut:
    return JobOut(
        id=job.id,
        title=job.title,
        company=job.company,
        location=job.location,
        job_type=job.job_type,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        description=job.description,
        requirements=job.requirements,
        benefits=job.benefits,
        recruiter_id=job.recruiter_id,
        created_at=job.created_at,
        is_active=job.is_active,
        application_count=app_count,
        recruiter_name=job.recruiter.name if job.recruiter else None,
    )


@router.get("", response_model=List[JobOut])
async def list_jobs(
    search: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    job_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(Job).where(Job.is_active == 1)

    if search:
        query = query.where(
            Job.title.ilike(f"%{search}%") | Job.company.ilike(f"%{search}%") | Job.description.ilike(f"%{search}%")
        )
    if location:
        query = query.where(Job.location.ilike(f"%{location}%"))
    if job_type:
        query = query.where(Job.job_type == job_type)

    query = query.order_by(Job.created_at.desc())
    result = await db.execute(query)
    jobs = result.scalars().all()

    out = []
    for job in jobs:
        count_result = await db.execute(select(func.count()).where(Application.job_id == job.id))
        count = count_result.scalar() or 0
        # load recruiter
        await db.refresh(job, ["recruiter"])
        out.append(_job_to_out(job, count))
    return out


@router.get("/recruiter/my-jobs", response_model=List[JobOut])
async def my_jobs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Only recruiters")

    result = await db.execute(
        select(Job).where(Job.recruiter_id == current_user.id).order_by(Job.created_at.desc())
    )
    jobs = result.scalars().all()

    out = []
    for job in jobs:
        count_result = await db.execute(select(func.count()).where(Application.job_id == job.id))
        count = count_result.scalar() or 0
        await db.refresh(job, ["recruiter"])
        out.append(_job_to_out(job, count))
    return out


@router.get("/{job_id}", response_model=JobOut)
async def get_job(job_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    count_result = await db.execute(select(func.count()).where(Application.job_id == job.id))
    count = count_result.scalar() or 0
    await db.refresh(job, ["recruiter"])
    return _job_to_out(job, count)


@router.post("", response_model=JobOut)
async def create_job(
    data: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != UserRole.RECRUITER:
        raise HTTPException(status_code=403, detail="Only recruiters can create jobs")

    job = Job(
        title=data.title,
        company=data.company,
        location=data.location,
        job_type=data.job_type,
        salary_min=data.salary_min,
        salary_max=data.salary_max,
        description=data.description,
        requirements=data.requirements,
        benefits=data.benefits,
        recruiter_id=current_user.id,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)
    await db.refresh(job, ["recruiter"])
    return _job_to_out(job, 0)


@router.put("/{job_id}", response_model=JobOut)
async def update_job(
    job_id: int,
    data: JobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(job, field, value)

    await db.commit()
    await db.refresh(job)
    await db.refresh(job, ["recruiter"])
    count_result = await db.execute(select(func.count()).where(Application.job_id == job.id))
    count = count_result.scalar() or 0
    return _job_to_out(job, count)


@router.delete("/{job_id}")
async def delete_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.recruiter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.delete(job)
    await db.commit()
    return {"detail": "Job deleted"}
