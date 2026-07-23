from typing import Optional

from fastapi import HTTPException, Query

from src.models.models import Employee, EmployeeSummary
from src.services import employees_service


def list_employees(
    skill: Optional[str] = Query(
        None, description="filter by a skill, case-insensitive"
    ),
    position: Optional[str] = Query(
        None, description="filter by position, case-insensitive substring"
    ),
    is_active: Optional[bool] = Query(
        None, description="filter by active employment status"
    ),
) -> list[EmployeeSummary]:
    employees = employees_service.list_employees(
        skill=skill, position=position, is_active=is_active
    )
    return [
        EmployeeSummary(
            id=e.id,
            position=e.position,
            skills=e.skills,
            isActive=e.isActive,
        )
        for e in employees
    ]


def get_employee(employee_id: str) -> Employee:
    employee = employees_service.get_employee(employee_id)
    if employee is None:
        raise HTTPException(
            status_code=404, detail=f"Employee '{employee_id}' not found"
        )
    return employee
