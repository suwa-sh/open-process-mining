"""GitLab CI/CD data source for dlt."""

from typing import Any, Iterator, Optional

import dlt
import requests


@dlt.resource(write_disposition="append", primary_key="id")
def gitlab_pipelines(
    project_id: str,
    gitlab_url: str = "https://gitlab.com",
    access_token: str = dlt.secrets.value,
    updated_after: Optional[str] = None,
) -> Iterator[dict[str, Any]]:
    """Extract GitLab CI/CD Pipelines."""
    headers = {"PRIVATE-TOKEN": access_token}
    page = 1

    while True:
        params = {
            "per_page": 100,
            "page": page,
            "order_by": "updated_at",
            "sort": "asc",
        }
        if updated_after:
            params["updated_after"] = updated_after

        response = requests.get(
            f"{gitlab_url}/api/v4/projects/{requests.utils.quote(project_id, safe='')}/pipelines",
            headers=headers,
            params=params,
            timeout=30,
        )
        response.raise_for_status()

        pipelines = response.json()
        if not pipelines:
            break

        for pipeline in pipelines:
            yield {
                "id": pipeline["id"],
                "iid": pipeline.get("iid"),
                "ref": pipeline["ref"],
                "status": pipeline["status"],
                "created_at": pipeline.get("created_at"),
                "updated_at": pipeline.get("updated_at"),
                "started_at": pipeline.get("started_at"),
                "finished_at": pipeline.get("finished_at"),
                "duration": pipeline.get("duration"),
                "user": pipeline.get("user", {}).get("username"),
                "web_url": pipeline.get("web_url"),
            }

        if "x-next-page" not in response.headers or not response.headers["x-next-page"]:
            break
        page += 1


@dlt.resource(write_disposition="append", primary_key="id")
def gitlab_deployments(
    project_id: str,
    gitlab_url: str = "https://gitlab.com",
    access_token: str = dlt.secrets.value,
) -> Iterator[dict[str, Any]]:
    """Extract GitLab Deployments."""
    headers = {"PRIVATE-TOKEN": access_token}
    page = 1

    while True:
        params = {
            "per_page": 100,
            "page": page,
            "order_by": "created_at",
            "sort": "asc",
        }

        response = requests.get(
            f"{gitlab_url}/api/v4/projects/{requests.utils.quote(project_id, safe='')}/deployments",
            headers=headers,
            params=params,
            timeout=30,
        )
        response.raise_for_status()

        deployments = response.json()
        if not deployments:
            break

        for deployment in deployments:
            yield {
                "id": deployment["id"],
                "iid": deployment.get("iid"),
                "ref": deployment["ref"],
                "environment": deployment.get("environment", {}).get("name"),
                "status": deployment["status"],
                "created_at": deployment.get("created_at"),
                "updated_at": deployment.get("updated_at"),
                "finished_at": deployment.get("finished_at"),
                "user": deployment.get("user", {}).get("username"),
            }

        if "x-next-page" not in response.headers or not response.headers["x-next-page"]:
            break
        page += 1
