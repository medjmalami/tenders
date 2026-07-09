from typing import Optional

from fastapi import HTTPException, Query

from models import Project, ProjectSummary
from services import projects_service


def list_projects(
    q: Optional[str] = Query(
        None, description="word match in project name or description"
    ),
    technology: Optional[str] = Query(
        None, description="filter by a technology, case-insensitive"
    ),
    client: Optional[str] = Query(
        None, description="filter by client name, case-insensitive substring"
    ),
) -> list[ProjectSummary]:
    projects = projects_service.list_projects(q=q, technology=technology, client=client)
    return [
        ProjectSummary(
            id=p.id,
            name=p.name,
            description=p.description,
        )
        for p in projects
    ]


def get_project(project_id: str) -> Project:
    project = projects_service.get_project(project_id)
    if project is None:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    return project
