from typing import Optional

from data import PROJECTS


def list_projects(
    q: Optional[str] = None,
    technology: Optional[str] = None,
    client: Optional[str] = None,
):
    results = PROJECTS
    if q:
        words = q.lower().split()
        results = [
            p
            for p in results
            if any(
                word in p.name.lower() or word in p.description.lower()
                for word in words
            )
        ]
    if technology:
        results = [
            p
            for p in results
            if technology.lower() in [t.lower() for t in p.technologies]
        ]
    if client:
        results = [p for p in results if client.lower() in p.client.lower()]
    return results


def get_project(project_id: str):
    for p in PROJECTS:
        if p.id == project_id:
            return p
    return None
