"""
Generate realistic GitLab DevOps sample data with correct event ordering.

This script generates sample data for the gitlab-devops process with proper time sequence:
Issue Created → MR Created → Code Merged → Build Started → Build Completed → Issue Closed
"""

import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

# Configuration
START_DATE = datetime(2024, 1, 1)
END_DATE = datetime(2024, 12, 31)
OUTPUT_DIR = Path(__file__).parent.parent / "dbt" / "seeds"
NUM_CASES = 20


def random_hours(min_hours, max_hours):
    """Generate random hours as timedelta"""
    return timedelta(hours=random.uniform(min_hours, max_hours))


def generate_case_timeline(issue_iid, base_time):
    """
    Generate realistic timeline for a single case with rework patterns.

    Returns timeline dict and lists of MRs and pipelines for this case.
    Patterns:
    - Success: Issue → MR → Code Merged → Build → Issue Closed
    - Build failure rework: Issue → MR → Build Failed → new MR → Build Success → Issue Closed
    - Review rework: Issue → MR closed → new MR → Build → Issue Closed
    """
    timeline = {"mrs": [], "pipelines": []}
    current_time = base_time

    # 1. Issue Created (baseline)
    timeline["issue_created"] = current_time

    # Determine case pattern
    case_pattern = random.choices(
        ["success", "build_failure_rework", "review_rework"],
        weights=[0.65, 0.25, 0.10],  # 65% success, 25% build fail, 10% review rework
        k=1,
    )[0]

    mr_count = 0
    pipeline_count = 0

    if case_pattern == "success":
        # Simple success path
        mr_count += 1
        pipeline_count += 1

        # MR Created
        current_time += random_hours(1, 48)
        mr_created_time = current_time

        # Code Merged
        current_time += random_hours(2, 96)
        mr_merged_time = current_time

        timeline["mrs"].append(
            {
                "mr_number": mr_count,
                "created_at": mr_created_time,
                "merged_at": mr_merged_time,
                "state": "merged",
            }
        )

        # Build Started
        current_time += random_hours(0.08, 0.5)
        build_started_time = current_time

        # Build Completed
        current_time += random_hours(0.17, 1.0)
        build_finished_time = current_time

        timeline["pipelines"].append(
            {
                "pipeline_number": pipeline_count,
                "started_at": build_started_time,
                "finished_at": build_finished_time,
                "status": "success",
            }
        )

        # Issue Closed
        current_time += random_hours(1, 24)
        timeline["issue_closed"] = current_time

    elif case_pattern == "build_failure_rework":
        # First attempt: Build fails
        mr_count += 1
        pipeline_count += 1

        # First MR
        current_time += random_hours(1, 48)
        mr1_created_time = current_time

        current_time += random_hours(2, 96)
        mr1_merged_time = current_time

        timeline["mrs"].append(
            {
                "mr_number": mr_count,
                "created_at": mr1_created_time,
                "merged_at": mr1_merged_time,
                "state": "merged",
            }
        )

        # First Build (fails)
        current_time += random_hours(0.08, 0.5)
        build1_started_time = current_time

        current_time += random_hours(0.17, 1.0)
        build1_finished_time = current_time

        timeline["pipelines"].append(
            {
                "pipeline_number": pipeline_count,
                "started_at": build1_started_time,
                "finished_at": build1_finished_time,
                "status": "failed",
            }
        )

        # Second attempt: Fix and retry
        mr_count += 1
        pipeline_count += 1

        # Second MR (fix)
        current_time += random_hours(2, 24)
        mr2_created_time = current_time

        current_time += random_hours(1, 48)
        mr2_merged_time = current_time

        timeline["mrs"].append(
            {
                "mr_number": mr_count,
                "created_at": mr2_created_time,
                "merged_at": mr2_merged_time,
                "state": "merged",
            }
        )

        # Second Build (success)
        current_time += random_hours(0.08, 0.5)
        build2_started_time = current_time

        current_time += random_hours(0.17, 1.0)
        build2_finished_time = current_time

        timeline["pipelines"].append(
            {
                "pipeline_number": pipeline_count,
                "started_at": build2_started_time,
                "finished_at": build2_finished_time,
                "status": "success",
            }
        )

        # Issue Closed
        current_time += random_hours(1, 24)
        timeline["issue_closed"] = current_time

    elif case_pattern == "review_rework":
        # First MR: Closed without merge (review feedback)
        mr_count += 1

        current_time += random_hours(1, 48)
        mr1_created_time = current_time

        # MR closed (no merge)
        current_time += random_hours(2, 72)

        timeline["mrs"].append(
            {
                "mr_number": mr_count,
                "created_at": mr1_created_time,
                "merged_at": None,
                "state": "closed",
            }
        )

        # Second MR (revised)
        mr_count += 1
        pipeline_count += 1

        current_time += random_hours(4, 48)
        mr2_created_time = current_time

        current_time += random_hours(2, 96)
        mr2_merged_time = current_time

        timeline["mrs"].append(
            {
                "mr_number": mr_count,
                "created_at": mr2_created_time,
                "merged_at": mr2_merged_time,
                "state": "merged",
            }
        )

        # Build (success)
        current_time += random_hours(0.08, 0.5)
        build_started_time = current_time

        current_time += random_hours(0.17, 1.0)
        build_finished_time = current_time

        timeline["pipelines"].append(
            {
                "pipeline_number": pipeline_count,
                "started_at": build_started_time,
                "finished_at": build_finished_time,
                "status": "success",
            }
        )

        # Issue Closed
        current_time += random_hours(1, 24)
        timeline["issue_closed"] = current_time

    timeline["case_pattern"] = case_pattern
    return timeline


def generate_gitlab_devops_data():
    """Generate all GitLab DevOps data with proper event ordering"""

    issues = []
    merge_requests = []
    pipelines = []
    loaded_at = datetime.now().isoformat()

    print("Generating GitLab DevOps sample data...")

    for i in range(1, NUM_CASES + 1):
        issue_iid = i
        issue_id = 2000 + i

        # Generate base time distributed across the year
        base_time = START_DATE + timedelta(
            days=random.randint(0, (END_DATE - START_DATE).days - 60)
        )

        # Generate timeline for this case
        timeline = generate_case_timeline(issue_iid, base_time)

        # 1. GitLab Issue
        title_type = random.choice(["Feature", "Bug", "Enhancement"])
        issues.append(
            {
                "id": issue_id,
                "iid": issue_iid,
                "title": f"[GL-{issue_iid}] {title_type}: Implement module {i}",
                "state": "closed",  # All complete cases
                "created_at": timeline["issue_created"].isoformat(),
                "closed_at": timeline["issue_closed"].isoformat(),
                "labels": f'["{title_type.lower()}"]',
                "loaded_at": loaded_at,
            }
        )

        # 2. GitLab Merge Requests (may have multiple MRs per case)
        for mr_idx, mr in enumerate(timeline["mrs"], start=1):
            mr_id = 3000 + (i - 1) * 10 + mr_idx
            mr_iid = (i - 1) * 10 + mr_idx

            mr_record = {
                "id": mr_id,
                "iid": mr_iid,
                "title": f"[GL-{issue_iid}] Resolve issue #{issue_iid} (attempt {mr_idx})",
                "state": mr["state"],
                "created_at": mr["created_at"].isoformat(),
                "merged_at": mr["merged_at"].isoformat() if mr["merged_at"] else None,
                "source_branch": f"feature/gl-{issue_iid}-{mr_idx}",
                "loaded_at": loaded_at,
            }
            merge_requests.append(mr_record)

        # 3. GitLab CI Pipelines (may have multiple pipelines per case)
        for pipeline_idx, pipeline in enumerate(timeline["pipelines"], start=1):
            pipeline_id = 4000 + (i - 1) * 10 + pipeline_idx

            pipeline_record = {
                "id": pipeline_id,
                "ref": f"feature/gl-{issue_iid}-{pipeline_idx}",
                "status": pipeline["status"],
                "created_at": pipeline["started_at"].isoformat(),
                "started_at": pipeline["started_at"].isoformat(),
                "finished_at": pipeline["finished_at"].isoformat(),
                "duration": int(
                    (pipeline["finished_at"] - pipeline["started_at"]).total_seconds()
                ),
                "loaded_at": loaded_at,
            }
            pipelines.append(pipeline_record)

    # Write Issues CSV
    issues_path = OUTPUT_DIR / "bronze_gitlab_issues.csv"
    with open(issues_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "id",
                "iid",
                "title",
                "state",
                "created_at",
                "closed_at",
                "labels",
                "loaded_at",
            ],
        )
        writer.writeheader()
        writer.writerows(issues)
    print(f"  ✓ Created: {issues_path} ({len(issues)} issues)")

    # Write Merge Requests CSV
    mrs_path = OUTPUT_DIR / "bronze_gitlab_merge_requests.csv"
    with open(mrs_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "id",
                "iid",
                "title",
                "state",
                "created_at",
                "merged_at",
                "source_branch",
                "loaded_at",
            ],
        )
        writer.writeheader()
        writer.writerows(merge_requests)
    print(f"  ✓ Created: {mrs_path} ({len(merge_requests)} MRs)")

    # Write Pipelines CSV
    pipelines_path = OUTPUT_DIR / "bronze_gitlab_pipelines.csv"
    with open(pipelines_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "id",
                "ref",
                "status",
                "created_at",
                "started_at",
                "finished_at",
                "duration",
                "loaded_at",
            ],
        )
        writer.writeheader()
        writer.writerows(pipelines)
    print(f"  ✓ Created: {pipelines_path} ({len(pipelines)} pipelines)")

    print(f"\nGenerated {NUM_CASES} complete GitLab DevOps cases with rework patterns")
    print("  - 65% success (straight path)")
    print("  - 25% build failure → rework (new MR + rebuild)")
    print("  - 10% review rework (MR closed → new MR)")
    print(
        "Basic flow: Issue Created → MR Created → Code Merged → Build Started → Build Completed → Issue Closed"
    )


if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    generate_gitlab_devops_data()
