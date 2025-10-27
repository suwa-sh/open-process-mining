"""GitLab data extraction pipeline."""

import dlt

from sources.gitlab_ci_source import gitlab_deployments, gitlab_pipelines
from sources.gitlab_issues_source import gitlab_issues
from sources.gitlab_mr_source import gitlab_merge_requests


def load_gitlab_data() -> None:
    """Load GitLab data (Issues, MRs, Pipelines, Deployments) to PostgreSQL."""
    project_id = dlt.config["sources.gitlab.project_id"]
    gitlab_url = dlt.config.get("sources.gitlab.url", "https://gitlab.com")

    pipeline = dlt.pipeline(
        pipeline_name="gitlab_extraction",
        destination="postgres",
        dataset_name="bronze_raw",
    )

    load_info = pipeline.run(
        [
            gitlab_issues(project_id=project_id, gitlab_url=gitlab_url),
            gitlab_merge_requests(project_id=project_id, gitlab_url=gitlab_url),
            gitlab_pipelines(project_id=project_id, gitlab_url=gitlab_url),
            gitlab_deployments(project_id=project_id, gitlab_url=gitlab_url),
        ]
    )

    print(load_info)


if __name__ == "__main__":
    load_gitlab_data()
