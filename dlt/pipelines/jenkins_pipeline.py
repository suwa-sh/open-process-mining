"""Jenkins data extraction pipeline."""

import dlt

from sources.jenkins_source import jenkins_builds


def load_jenkins_data() -> None:
    """Load Jenkins build data to PostgreSQL."""
    jenkins_url = dlt.config["sources.jenkins.url"]
    job_name = dlt.config["sources.jenkins.job_name"]

    pipeline = dlt.pipeline(
        pipeline_name="jenkins_extraction",
        destination="postgres",
        dataset_name="bronze_raw",
    )

    load_info = pipeline.run(jenkins_builds(jenkins_url=jenkins_url, job_name=job_name))

    print(load_info)


if __name__ == "__main__":
    load_jenkins_data()
