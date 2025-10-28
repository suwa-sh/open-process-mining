"""GitHub data extraction pipeline.

This pipeline extracts Issues, Pull Requests, and Actions Runs from GitHub
and loads them into the bronze_raw schema in PostgreSQL.
"""

import dlt
from sources.github_source import (
    github_issues,
    github_pull_requests,
    github_actions_runs,
)


def load_github_data() -> None:
    """
    Load GitHub data into bronze_raw schema.

    Configuration is read from .dlt/config.toml and .dlt/secrets.toml
    """
    # Get configuration
    owner = dlt.config["sources.github.owner"]
    repositories = dlt.config["sources.github.repositories"]

    # Create pipeline
    pipeline = dlt.pipeline(
        pipeline_name="github_extraction",
        destination="postgres",
        dataset_name="bronze_raw",
    )

    # Load data from all sources for each repository
    sources = []
    for repo in repositories:
        sources.extend([
            github_issues(owner=owner, repo=repo),
            github_pull_requests(owner=owner, repo=repo),
            github_actions_runs(owner=owner, repo=repo),
        ])

    load_info = pipeline.run(sources)

    # Print results
    print(f"Pipeline run completed!")
    print(f"Loaded {len(load_info.loads_ids)} load packages")

    for package in load_info.load_packages:
        for table_name, table_metrics in package.schema_update.items():
            print(f"  - {table_name}: {table_metrics}")


if __name__ == "__main__":
    load_github_data()
