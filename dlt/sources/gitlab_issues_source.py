"""GitLab Issues data source for dlt.

Extracts Issues from GitLab projects for process mining.
"""

from typing import Any, Iterator, Optional

import dlt
import requests


@dlt.resource(write_disposition="append", primary_key="id")
def gitlab_issues(
    project_id: str,
    gitlab_url: str = "https://gitlab.com",
    access_token: str = dlt.secrets.value,
    updated_after: Optional[str] = None,
) -> Iterator[dict[str, Any]]:
    """
    Extract GitLab Issues via REST API.

    Args:
        project_id: Project ID (e.g., "namespace/project" or numeric ID)
        gitlab_url: GitLab instance URL (default: https://gitlab.com)
        access_token: GitLab personal access token
        updated_after: ISO8601 timestamp for incremental loading

    Yields:
        dict: Issue records with id, iid, title, state, created_at, closed_at
    """
    headers = {"PRIVATE-TOKEN": access_token}
    page = 1
    per_page = 100

    while True:
        params = {
            "state": "all",
            "per_page": per_page,
            "page": page,
            "order_by": "updated_at",
            "sort": "asc",
        }

        if updated_after:
            params["updated_after"] = updated_after

        response = requests.get(
            f"{gitlab_url}/api/v4/projects/{requests.utils.quote(project_id, safe='')}/issues",
            headers=headers,
            params=params,
            timeout=30,
        )
        response.raise_for_status()

        issues = response.json()
        if not issues:
            break

        for issue in issues:
            yield {
                "id": issue["id"],
                "iid": issue["iid"],
                "title": issue["title"],
                "description": issue.get("description"),
                "state": issue["state"],
                "created_at": issue["created_at"],
                "updated_at": issue["updated_at"],
                "closed_at": issue.get("closed_at"),
                "closed_by": issue.get("closed_by", {}).get("username"),
                "labels": issue.get("labels", []),
                "assignees": [
                    assignee.get("username") for assignee in issue.get("assignees", [])
                ],
                "author": issue.get("author", {}).get("username"),
                "web_url": issue.get("web_url"),
            }

        # Check for next page
        if "x-next-page" not in response.headers or not response.headers["x-next-page"]:
            break

        page += 1


if __name__ == "__main__":
    # Test run
    pipeline = dlt.pipeline(
        pipeline_name="gitlab_issues_test",
        destination="duckdb",
        dataset_name="gitlab_test",
    )

    load_info = pipeline.run(
        gitlab_issues(
            project_id=dlt.config["sources.gitlab.project_id"],
            gitlab_url=dlt.config.get("sources.gitlab.url", "https://gitlab.com"),
        )
    )

    print(load_info)
