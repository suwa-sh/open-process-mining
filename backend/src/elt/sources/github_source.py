"""GitHub data source for dlt.

Extracts Issues, Pull Requests, and Actions Runs from GitHub repositories.
"""

import os
from typing import Any, Iterator, Optional

import dlt
import requests


@dlt.resource(write_disposition="append", primary_key="id")
def github_issues(
    owner: str,
    repo: str,
    since: Optional[str] = None,
    access_token: str = dlt.secrets.value,
) -> Iterator[dict[str, Any]]:
    """
    Extract GitHub Issues via REST API.

    Args:
        owner: Repository owner
        repo: Repository name
        since: ISO8601 timestamp for incremental loading
        access_token: GitHub personal access token

    Yields:
        dict: Issue records with id, number, title, state, created_at, closed_at, labels, assignees
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/issues"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    params = {
        "state": "all",
        "per_page": 100,
        "sort": "created",
        "direction": "desc",
    }
    if since:
        params["since"] = since

    page = 1
    while True:
        params["page"] = page
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()

        issues = response.json()
        if not issues:
            break

        for issue in issues:
            # Skip pull requests (they have 'pull_request' key)
            if "pull_request" not in issue:
                yield {
                    "id": issue["id"],
                    "number": issue["number"],
                    "title": issue["title"],
                    "state": issue["state"],
                    "created_at": issue["created_at"],
                    "closed_at": issue.get("closed_at"),
                    "labels": [label["name"] for label in issue.get("labels", [])],
                    "assignees": [
                        assignee["login"] for assignee in issue.get("assignees", [])
                    ],
                }

        # Check if there are more pages
        if "next" not in response.links:
            break
        page += 1


@dlt.resource(write_disposition="append", primary_key="id")
def github_pull_requests(
    owner: str,
    repo: str,
    since: Optional[str] = None,
    access_token: str = dlt.secrets.value,
) -> Iterator[dict[str, Any]]:
    """
    Extract GitHub Pull Requests via REST API.

    Args:
        owner: Repository owner
        repo: Repository name
        since: ISO8601 timestamp for incremental loading
        access_token: GitHub personal access token

    Yields:
        dict: PR records with id, number, title, state, created_at, merged_at, head_ref
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    params = {
        "state": "all",
        "per_page": 100,
        "sort": "created",
        "direction": "desc",
    }

    page = 1
    while True:
        params["page"] = page
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()

        prs = response.json()
        if not prs:
            break

        for pr in prs:
            # Skip if since filter is specified and PR is older
            if since and pr["created_at"] < since:
                return

            yield {
                "id": pr["id"],
                "number": pr["number"],
                "title": pr["title"],
                "state": pr["state"],
                "created_at": pr["created_at"],
                "updated_at": pr["updated_at"],
                "merged_at": pr.get("merged_at"),
                "closed_at": pr.get("closed_at"),
                "head_ref": pr["head"]["ref"],
                "base_ref": pr["base"]["ref"],
            }

        # Check if there are more pages
        if "next" not in response.links:
            break
        page += 1


@dlt.resource(write_disposition="append", primary_key="id")
def github_actions_runs(
    owner: str,
    repo: str,
    since: Optional[str] = None,
    access_token: str = dlt.secrets.value,
) -> Iterator[dict[str, Any]]:
    """
    Extract GitHub Actions workflow runs via REST API.

    Args:
        owner: Repository owner
        repo: Repository name
        since: ISO8601 timestamp for incremental loading
        access_token: GitHub personal access token

    Yields:
        dict: Actions run records with id, name, status, conclusion, created_at, updated_at, head_branch
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/actions/runs"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    params = {
        "per_page": 100,
    }

    page = 1
    while True:
        params["page"] = page
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()
        runs = data.get("workflow_runs", [])
        if not runs:
            break

        for run in runs:
            # Skip if since filter is specified and run is older
            if since and run["created_at"] < since:
                return

            yield {
                "id": run["id"],
                "name": run["name"],
                "status": run["status"],
                "conclusion": run.get("conclusion"),
                "created_at": run["created_at"],
                "updated_at": run["updated_at"],
                "head_branch": run["head_branch"],
                "head_sha": run["head_sha"],
                "event": run["event"],
            }

        # Check if there are more pages
        if "next" not in response.links:
            break
        page += 1


@dlt.source
def github_source(
    owner: str = dlt.config.value,
    repositories: list[str] = dlt.config.value,
    since: Optional[str] = None,
) -> list[dlt.Resource]:
    """
    GitHub source combining Issues, Pull Requests, and Actions Runs.

    Args:
        owner: Repository owner
        repositories: List of repository names
        since: ISO8601 timestamp for incremental loading

    Returns:
        list[dlt.Resource]: List of dlt resources
    """
    resources = []
    for repo in repositories:
        resources.extend(
            [
                github_issues(owner, repo, since),
                github_pull_requests(owner, repo, since),
                github_actions_runs(owner, repo, since),
            ]
        )
    return resources
