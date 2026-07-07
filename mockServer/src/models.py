from typing import Literal, Optional

from pydantic import BaseModel


class Project(BaseModel):
    id: str
    name: str
    description: str
    client: str
    startDate: str  # ISO 8601
    endDate: Optional[str] = None
    status: Literal["completed", "in_progress", "planned"]
    technologies: list[str]
    teamMembers: list[str]  # Employee IDs


class Employee(BaseModel):
    id: str
    firstName: str
    lastName: str
    position: str
    department: str
    hireDate: str  # ISO 8601
    skills: list[str]
    isActive: bool
    yearsOfExperience: int
    pastProjectIds: list[str]
