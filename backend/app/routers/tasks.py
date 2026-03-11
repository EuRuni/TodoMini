from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.db.session import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskCreate, TaskOut
from app.services.auth import require_user

router = APIRouter(prefix="/api/v1/tasks", tags=["tasks"])


@router.post("", response_model=TaskOut, status_code=201)
def create_task(
    data: TaskCreate,
    user_email: str = Depends(require_user),
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.email == user_email))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

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
def get_my_tasks(
    user_email: str = Depends(require_user),
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.email == user_email))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    tasks = db.scalars(
        select(Task).where(Task.owner_id == user.id)
    ).all()

    return tasks