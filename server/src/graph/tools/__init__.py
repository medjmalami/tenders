from src.graph.tools.company import (
    get_employee_details,
    get_project_details,
    list_employees,
    list_projects,
)
from src.graph.tools.web import fetch_webpage, web_search

tools = [
    list_employees,
    get_employee_details,
    list_projects,
    get_project_details,
    web_search,
    fetch_webpage,
]

__all__ = [
    "tools",
    "list_employees",
    "get_employee_details",
    "list_projects",
    "get_project_details",
    "web_search",
    "fetch_webpage",
]
