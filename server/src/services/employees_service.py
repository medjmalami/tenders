from typing import Optional

from src.data import EMPLOYEES


def list_employees(
    skill: Optional[str] = None,
    position: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    results = EMPLOYEES
    if skill:
        results = [e for e in results if skill.lower() in [s.lower() for s in e.skills]]
    if position:
        results = [e for e in results if position.lower() in e.position.lower()]
    if is_active is not None:
        results = [e for e in results if e.isActive == is_active]
    return results


def get_employee(employee_id: str):
    for e in EMPLOYEES:
        if e.id == employee_id:
            return e
    return None
