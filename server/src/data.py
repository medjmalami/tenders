from models import Employee, Project

# NOTE: this is static sample data living in process memory.
# Swap PROJECTS / EMPLOYEES for a DB-backed repository later without
# touching main.py, since the routes only depend on these two lists.

PROJECTS: list[Project] = [
    Project(
        id="proj-001",
        name="Smart Water Monitoring Platform",
        description="IoT-based water quality monitoring with anomaly detection.",
        client="AquaTun",
        startDate="2025-02-01",
        endDate="2025-06-15",
        status="completed",
        technologies=["FastAPI", "RabbitMQ", "Redis", "LSTM", "Docker"],
        teamMembers=["emp-001", "emp-002"],
    ),
    Project(
        id="proj-002",
        name="Tender Automation Pipeline",
        description="LangGraph-based agent pipeline for tender eligibility and drafting.",
        client="ZetaBox Internal",
        startDate="2026-04-01",
        endDate=None,
        status="in_progress",
        technologies=["LangGraph", "Python", "MCP"],
        teamMembers=["emp-001"],
    ),
    Project(
        id="proj-003",
        name="Industrial Equipment Marketplace",
        description="B2B catalog and ordering platform for welding equipment.",
        client="Internal Venture",
        startDate="2024-09-01",
        endDate=None,
        status="planned",
        technologies=["Node.js", "PostgreSQL", "Express"],
        teamMembers=["emp-002"],
    ),
]

EMPLOYEES: list[Employee] = [
    Employee(
        id="emp-001",
        firstName="Amine",
        lastName="Jmal",
        position="AI Engineer Intern",
        department="AI Engineering",
        hireDate="2026-02-01",
        skills=["LangGraph", "Python", "RAG", "FastAPI"],
        isActive=True,
        yearsOfExperience=3,
        pastProjectIds=["proj-001", "proj-002"],
    ),
    Employee(
        id="emp-002",
        firstName="Sara",
        lastName="Trabelsi",
        position="Backend Engineer",
        department="Engineering",
        hireDate="2023-05-10",
        skills=["Node.js", "PostgreSQL", "Docker"],
        isActive=True,
        yearsOfExperience=5,
        pastProjectIds=["proj-001", "proj-003"],
    ),
]
