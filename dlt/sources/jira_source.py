"""Jira data source for dlt.

Extracts Issues and changelog from Jira for process mining.
"""

from typing import Any, Iterator, Optional

import dlt
import requests


@dlt.resource(write_disposition="append", primary_key="id")
def jira_issues(
    jira_url: str,
    jql: str = "ORDER BY updated ASC",
    access_token: str = dlt.secrets.value,
    start_at: int = 0,
) -> Iterator[dict[str, Any]]:
    """
    Extract Jira Issues via REST API v3.

    Args:
        jira_url: Jira instance URL (e.g., "https://your-domain.atlassian.net")
        jql: JQL query (default: ORDER BY updated ASC)
        access_token: Jira API token or Personal Access Token
        start_at: Starting index for pagination (for incremental loading)

    Yields:
        dict: Issue records with key, fields, changelog
    """
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }

    max_results = 100
    current_start = start_at

    while True:
        params = {
            "jql": jql,
            "startAt": current_start,
            "maxResults": max_results,
            "expand": "changelog",
            "fields": "created,resolutiondate,status,assignee,reporter,summary,issuetype,priority",
        }

        response = requests.get(
            f"{jira_url}/rest/api/3/search",
            headers=headers,
            params=params,
            timeout=30,
        )
        response.raise_for_status()

        data = response.json()
        issues = data.get("issues", [])

        if not issues:
            break

        for issue in issues:
            # Extract status transitions from changelog
            status_transitions = []
            changelog = issue.get("changelog", {})
            for history in changelog.get("histories", []):
                for item in history.get("items", []):
                    if item.get("field") == "status":
                        status_transitions.append(
                            {
                                "created": history.get("created"),
                                "from": item.get("fromString"),
                                "to": item.get("toString"),
                                "author": history.get("author", {}).get("displayName"),
                            }
                        )

            fields = issue.get("fields", {})
            yield {
                "id": issue["id"],
                "key": issue["key"],
                "summary": fields.get("summary"),
                "issue_type": fields.get("issuetype", {}).get("name"),
                "status": fields.get("status", {}).get("name"),
                "priority": fields.get("priority", {}).get("name"),
                "created": fields.get("created"),
                "updated": fields.get("updated"),
                "resolutiondate": fields.get("resolutiondate"),
                "assignee": fields.get("assignee", {}).get("displayName"),
                "reporter": fields.get("reporter", {}).get("displayName"),
                "status_transitions": status_transitions,
            }

        # Check if there are more results
        if current_start + max_results >= data.get("total", 0):
            break

        current_start += max_results


if __name__ == "__main__":
    # Test run
    pipeline = dlt.pipeline(
        pipeline_name="jira_test",
        destination="duckdb",
        dataset_name="jira_test",
    )

    load_info = pipeline.run(
        jira_issues(
            jira_url=dlt.config["sources.jira.url"],
            jql=dlt.config.get("sources.jira.jql", "ORDER BY updated ASC"),
        )
    )

    print(load_info)
