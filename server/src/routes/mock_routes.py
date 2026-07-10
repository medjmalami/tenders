from fastapi import APIRouter

from controllers import employees_controller, projects_controller
from models import Employee, EmployeeSummary, Project, ProjectSummary

router = APIRouter()

# ---------- Projects ----------
router.add_api_route(
    "/projects",
    projects_controller.list_projects,
    methods=["GET"],
    response_model=list[ProjectSummary],
)
router.add_api_route(
    "/projects/{project_id}",
    projects_controller.get_project,
    methods=["GET"],
    response_model=Project,
)

# ---------- Employees ----------
router.add_api_route(
    "/employees",
    employees_controller.list_employees,
    methods=["GET"],
    response_model=list[EmployeeSummary],
)
router.add_api_route(
    "/employees/{employee_id}",
    employees_controller.get_employee,
    methods=["GET"],
    response_model=Employee,
)
