"""Jira data extraction pipeline."""

import dlt

from sources.jira_source import jira_issues


def load_jira_data() -> None:
    """Load Jira issues (with changelog) to PostgreSQL."""
    jira_url = dlt.config["sources.jira.url"]
    jql = dlt.config.get("sources.jira.jql", "ORDER BY updated ASC")

    pipeline = dlt.pipeline(
        pipeline_name="jira_extraction",
        destination="postgres",
        dataset_name="bronze_raw",
    )

    load_info = pipeline.run(jira_issues(jira_url=jira_url, jql=jql))

    print(load_info)


if __name__ == "__main__":
    load_jira_data()
