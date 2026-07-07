from typing import Optional

from fastapi import FastAPI, HTTPException, Query

from data import EMPLOYEES, PROJECTS
from models import Employee, Project

app = FastAPI(
    title="Tender Data API",
    description="Static-data API for company projects and employees.",
    version="1.0.0",
)


# ---------- Projects ----------


@app.get("/projects", response_model=list[Project])
def list_projects(
    status: Optional[str] = Query(
        None, description="completed | in_progress | planned"
    ),
    technology: Optional[str] = Query(
        None, description="filter by a technology, case-insensitive"
    ),
    client: Optional[str] = Query(
        None, description="filter by client name, case-insensitive substring"
    ),
):
    results = PROJECTS
    if status:
        results = [p for p in results if p.status == status]
    if technology:
        results = [
            p
            for p in results
            if technology.lower() in [t.lower() for t in p.technologies]
        ]
    if client:
        results = [p for p in results if client.lower() in p.client.lower()]
    return results


@app.get("/projects/{project_id}", response_model=Project)
def get_project(project_id: str):
    for p in PROJECTS:
        if p.id == project_id:
            return p
    raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")


# ---------- Employees ----------


@app.get("/employees", response_model=list[Employee])
def list_employees(
    skill: Optional[str] = Query(
        None, description="filter by a skill, case-insensitive"
    ),
    department: Optional[str] = Query(
        None, description="filter by department, case-insensitive substring"
    ),
    is_active: Optional[bool] = Query(
        None, description="filter by active employment status"
    ),
):
    results = EMPLOYEES
    if skill:
        results = [e for e in results if skill.lower() in [s.lower() for s in e.skills]]
    if department:
        results = [e for e in results if department.lower() in e.department.lower()]
    if is_active is not None:
        results = [e for e in results if e.isActive == is_active]
    return results


@app.get("/employees/{employee_id}", response_model=Employee)
def get_employee(employee_id: str):
    for e in EMPLOYEES:
        if e.id == employee_id:
            return e
    raise HTTPException(status_code=404, detail=f"Employee '{employee_id}' not found")
