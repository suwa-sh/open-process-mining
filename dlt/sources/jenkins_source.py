"""Jenkins data source for dlt.

Extracts Build data from Jenkins for CI/CD process mining.
"""

from typing import Any, Iterator, Optional

import dlt
import requests


@dlt.resource(write_disposition="append", primary_key="id")
def jenkins_builds(
    jenkins_url: str,
    job_name: str,
    username: str = dlt.secrets.value,
    api_token: str = dlt.secrets.value,
    min_build_number: Optional[int] = None,
) -> Iterator[dict[str, Any]]:
    """
    Extract Jenkins Build data via JSON API.

    Args:
        jenkins_url: Jenkins instance URL (e.g., "https://jenkins.example.com")
        job_name: Job name to extract builds from
        username: Jenkins username
        api_token: Jenkins API token
        min_build_number: Minimum build number for incremental loading

    Yields:
        dict: Build records with id, number, result, timestamp, duration
    """
    auth = (username, api_token)

    # Get all builds list
    job_api_url = f"{jenkins_url}/job/{job_name}/api/json"
    params = {"tree": "builds[number,url]"}

    response = requests.get(job_api_url, auth=auth, params=params, timeout=30)
    response.raise_for_status()

    builds_list = response.json().get("builds", [])

    for build_info in builds_list:
        build_number = build_info["number"]

        # Skip if below minimum build number (for incremental loading)
        if min_build_number and build_number < min_build_number:
            continue

        # Get detailed build information
        build_url = build_info["url"]
        build_api_url = f"{build_url}api/json"
        build_params = {
            "tree": "number,result,timestamp,duration,actions[causes[*],parameters[*]],"
            "changeSet[items[*]]"
        }

        build_response = requests.get(
            build_api_url, auth=auth, params=build_params, timeout=30
        )
        build_response.raise_for_status()

        build = build_response.json()

        # Extract commit info from changeSet
        commit_messages = []
        commit_authors = []
        for item in build.get("changeSet", {}).get("items", []):
            commit_messages.append(item.get("msg", ""))
            commit_authors.append(item.get("author", {}).get("fullName", ""))

        # Extract build parameters
        parameters = {}
        for action in build.get("actions", []):
            if action.get("_class") == "hudson.model.ParametersAction":
                for param in action.get("parameters", []):
                    parameters[param.get("name")] = param.get("value")

        # Extract trigger cause
        cause = None
        for action in build.get("actions", []):
            causes = action.get("causes", [])
            if causes and len(causes) > 0:
                cause = causes[0].get("shortDescription", "")
                break

        yield {
            "id": f"{job_name}-{build_number}",
            "job_name": job_name,
            "build_number": build_number,
            "result": build.get("result"),  # SUCCESS, FAILURE, UNSTABLE, ABORTED
            "timestamp": build.get("timestamp"),  # Unix timestamp in milliseconds
            "duration": build.get("duration"),  # Duration in milliseconds
            "cause": cause,
            "commit_messages": commit_messages,
            "commit_authors": commit_authors,
            "parameters": parameters,
            "build_url": build_url,
        }


if __name__ == "__main__":
    # Test run
    pipeline = dlt.pipeline(
        pipeline_name="jenkins_test",
        destination="duckdb",
        dataset_name="jenkins_test",
    )

    load_info = pipeline.run(
        jenkins_builds(
            jenkins_url=dlt.config["sources.jenkins.url"],
            job_name=dlt.config["sources.jenkins.job_name"],
        )
    )

    print(load_info)
