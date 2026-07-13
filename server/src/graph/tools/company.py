from typing import Optional

from langchain_core.tools import tool

from src.graph import api_client


@tool
async def list_employees(
    skill: Optional[str] = None,
    position: Optional[str] = None,
    is_active: Optional[bool] = None,
) -> dict | list | str:
    """List ZetaBox employees, optionally filtered by skill, position, or active status.

    Use this to find candidate employees to staff a proposal (e.g. matching a
    required skill like "LangGraph" or a position like "Backend Engineer").
    Returns summaries only (id, position, skills, isActive) — use get_employee_details
    with the id to fetch full details for a specific employee.

    Args:
        skill: filter by a skill, case-insensitive (e.g. "Python")
        position: filter by position, case-insensitive substring (e.g. "engineer")
        is_active: filter by active employment status
    """
    return await api_client.get(
        "/employees",
        {"skill": skill, "position": position, "is_active": is_active},
    )


@tool
async def get_employee_details(employee_id: str) -> dict | list | str:
    """Fetch full details for a single employee by id.

    Use this after list_employees has identified a candidate, to pull complete
    info (e.g. bio, certifications, experience) needed to write them into a proposal.

    Args:
        employee_id: the employee's id, as returned by list_employees
    """
    return await api_client.get(f"/employees/{employee_id}")


@tool
async def list_projects(
    q: Optional[str] = None,
    technology: Optional[str] = None,
    client: Optional[str] = None,
) -> dict | list | str:
    """List past ZetaBox projects, optionally filtered by keyword, technology, or client.

    Use this to find relevant past project references to cite as proof of experience
    in a tender proposal. Returns summaries only (id, name, description) — use
    get_project_details with the id to fetch full details for a specific project.

    Args:
        q: word match in project name or description (e.g. "water monitoring")
        technology: filter by a technology, case-insensitive (e.g. "FastAPI")
        client: filter by client name, case-insensitive substring
    """
    return await api_client.get(
        "/projects",
        {"q": q, "technology": technology, "client": client},
    )


@tool
async def get_project_details(project_id: str) -> dict | list | str:
    """Fetch full details for a single past project by id.

    Use this after list_projects has identified a relevant reference, to pull
    complete info needed to describe it in a proposal.

    Args:
        project_id: the project's id, as returned by list_projects
    """
    return await api_client.get(f"/projects/{project_id}")
