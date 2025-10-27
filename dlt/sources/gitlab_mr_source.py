"""GitLab Merge Requests data source for dlt."""

from typing import Any, Iterator, Optional

import dlt
import requests


@dlt.resource(write_disposition="append", primary_key="id")
def gitlab_merge_requests(
    project_id: str,
    gitlab_url: str = "https://gitlab.com",
    access_token: str = dlt.secrets.value,
    updated_after: Optional[str] = None,
) -> Iterator[dict[str, Any]]:
    """Extract GitLab Merge Requests."""
    headers = {"PRIVATE-TOKEN": access_token}
    page = 1

    while True:
        params = {
            "state": "all",
            "per_page": 100,
            "page": page,
            "order_by": "updated_at",
            "sort": "asc",
        }
        if updated_after:
            params["updated_after"] = updated_after

        response = requests.get(
            f"{gitlab_url}/api/v4/projects/{requests.utils.quote(project_id, safe='')}/merge_requests",
            headers=headers,
            params=params,
            timeout=30,
        )
        response.raise_for_status()

        mrs = response.json()
        if not mrs:
            break

        for mr in mrs:
            yield {
                "id": mr["id"],
                "iid": mr["iid"],
                "title": mr["title"],
                "state": mr["state"],
                "created_at": mr["created_at"],
                "updated_at": mr["updated_at"],
                "merged_at": mr.get("merged_at"),
                "source_branch": mr["source_branch"],
                "target_branch": mr["target_branch"],
                "author": mr.get("author", {}).get("username"),
                "web_url": mr.get("web_url"),
            }

        if "x-next-page" not in response.headers or not response.headers["x-next-page"]:
            break
        page += 1
