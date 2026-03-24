from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskOut, TaskUpdate
from app.services.auth import require_user

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


def get_current_user(db: Session, user_email: str) -> User:
    user = db.scalar(select(User).where(User.email == user_email))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


def get_user_active_task_or_404(db: Session, task_id: int, user_id: int) -> Task:
    task = db.scalar(
        select(Task).where(
            Task.id == task_id,
            Task.owner_id == user_id,
            Task.is_deleted == False,
        )
    )

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active task not found",
        )

    return task


@router.post("", response_model=TaskOut, status_code=201)
def create_task(
    data: TaskCreate,
    user_email: str = Depends(require_user),
    db: Session = Depends(get_db),
):
    user = get_current_user(db, user_email)

    allowed_priorities = {"LOW", "MEDIUM", "HIGH"}
    if data.priority not in allowed_priorities:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Priority must be LOW, MEDIUM or HIGH",
        )

    task = Task(
        title=data.title,
        description=data.description,
        priority=data.priority,
        due_date=data.due_date,
        owner_id=user.id,
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


@router.get("", response_model=list[TaskOut])
def get_my_active_tasks(
    user_email: str = Depends(require_user),
    db: Session = Depends(get_db),
):
    user = get_current_user(db, user_email)

    tasks = db.scalars(
        select(Task).where(
            Task.owner_id == user.id,
            Task.is_deleted == False,
            Task.completed_at.is_(None),
        )
    ).all()

    return tasks


@router.get("/deleted", response_model=list[TaskOut])
def get_my_deleted_tasks(
    user_email: str = Depends(require_user),
    db: Session = Depends(get_db),
):
    user = get_current_user(db, user_email)

    tasks = db.scalars(
        select(Task).where(
            Task.owner_id == user.id,
            Task.is_deleted == True,
        )
    ).all()

    return tasks


@router.put("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    data: TaskUpdate,
    user_email: str = Depends(require_user),
    db: Session = Depends(get_db),
):
    user = get_current_user(db, user_email)
    task = get_user_active_task_or_404(db, task_id, user.id)

    allowed_priorities = {"LOW", "MEDIUM", "HIGH"}
    if data.priority not in allowed_priorities:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Priority must be LOW, MEDIUM or HIGH",
        )

    task.title = data.title
    task.description = data.description
    task.priority = data.priority
    task.due_date = data.due_date
    task.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)

    return task


@router.delete("/{task_id}", response_model=TaskOut)
def soft_delete_task(
    task_id: int,
    user_email: str = Depends(require_user),
    db: Session = Depends(get_db),
):
    user = get_current_user(db, user_email)
    task = get_user_active_task_or_404(db, task_id, user.id)

    task.is_deleted = True
    task.deleted_at = datetime.now(timezone.utc)
    task.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)

    return task