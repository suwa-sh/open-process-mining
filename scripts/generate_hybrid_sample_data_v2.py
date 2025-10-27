"""
Generate realistic Hybrid DevOps sample data with correct event ordering and rework patterns.

This script generates sample data for the hybrid-devops process (Jira + GitLab MR + Jenkins):
Basic flow: Issue Created → In Progress → MR Created → Code Merged → Build Started → Build Completed → Done

Rework patterns:
1. Build Failed → In Progress → new MR Created → Code Merged → Build Started → Build Completed → Done
2. Code review feedback → In Progress → new MR Created → Code Merged → Build Started → Build Completed → Done
"""

import csv
import json
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Configuration
START_DATE = datetime(2024, 1, 1, tzinfo=timezone.utc)
END_DATE = datetime(2024, 12, 31, tzinfo=timezone.utc)
OUTPUT_DIR = Path(__file__).parent.parent / "dbt" / "seeds"
NUM_CASES = 30


def random_hours(min_hours, max_hours):
    """Generate random hours as timedelta"""
    return timedelta(hours=random.uniform(min_hours, max_hours))


def generate_case_timeline(case_number, base_time):
    """
    Generate realistic timeline for a single case with possible rework.

    Returns timeline dict and list of events (MRs, builds) for this case.
    """
    timeline = {"status_transitions": []}
    mrs = []
    builds = []
    current_time = base_time

    # 1. Issue Created (baseline)
    timeline["issue_created"] = current_time

    # 2. In Progress (2-24 hours after issue created)
    current_time += random_hours(2, 24)
    timeline["status_transitions"].append(
        {"from": "Open", "to": "In Progress", "created": current_time}
    )

    # Determine case pattern
    case_pattern = random.choices(
        ["success", "build_failure_rework", "review_feedback_rework"],
        weights=[0.6, 0.25, 0.15],  # 60% success, 25% build fail, 15% review feedback
        k=1,
    )[0]

    mr_count = 0
    build_count = 0

    if case_pattern == "success":
        # Simple success path
        mr_count += 1
        build_count += 1

        # MR Created (1-48 hours after In Progress)
        current_time += random_hours(1, 48)
        mr_created_time = current_time

        # Code Merged (2-96 hours after MR created)
        current_time += random_hours(2, 96)
        mr_merged_time = current_time

        mrs.append(
            {
                "mr_number": mr_count,
                "created_at": mr_created_time,
                "merged_at": mr_merged_time,
                "state": "merged",
            }
        )

        # Build Started (5-30 minutes after code merged)
        current_time += random_hours(0.08, 0.5)
        build_started_time = current_time

        # Build Completed (10-60 minutes after build started)
        current_time += random_hours(0.17, 1.0)
        build_finished_time = current_time

        builds.append(
            {
                "build_number": build_count,
                "started_at": build_started_time,
                "finished_at": build_finished_time,
                "result": "SUCCESS",
            }
        )

        # Done (1-12 hours after build completed)
        current_time += random_hours(1, 12)
        timeline["status_transitions"].append(
            {"from": "In Progress", "to": "Done", "created": current_time}
        )

    elif case_pattern == "build_failure_rework":
        # First attempt: Build fails
        mr_count += 1
        build_count += 1

        # First MR
        current_time += random_hours(1, 48)
        mr1_created_time = current_time

        current_time += random_hours(2, 96)
        mr1_merged_time = current_time

        mrs.append(
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

        builds.append(
            {
                "build_number": build_count,
                "started_at": build1_started_time,
                "finished_at": build1_finished_time,
                "result": "FAILURE",
            }
        )

        # Back to In Progress (1-4 hours after build failed)
        current_time += random_hours(1, 4)
        timeline["status_transitions"].append(
            {"from": "In Review", "to": "In Progress", "created": current_time}
        )

        # Second attempt: Fix and retry
        mr_count += 1
        build_count += 1

        # Second MR (fix)
        current_time += random_hours(2, 24)
        mr2_created_time = current_time

        current_time += random_hours(1, 48)
        mr2_merged_time = current_time

        mrs.append(
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

        builds.append(
            {
                "build_number": build_count,
                "started_at": build2_started_time,
                "finished_at": build2_finished_time,
                "result": "SUCCESS",
            }
        )

        # Done
        current_time += random_hours(1, 12)
        timeline["status_transitions"].append(
            {"from": "In Progress", "to": "Done", "created": current_time}
        )

    elif case_pattern == "review_feedback_rework":
        # First MR: Code review feedback
        mr_count += 1

        current_time += random_hours(1, 48)
        mr1_created_time = current_time

        # MR closed without merge (2-72 hours after created)
        current_time += random_hours(2, 72)

        mrs.append(
            {
                "mr_number": mr_count,
                "created_at": mr1_created_time,
                "merged_at": None,
                "state": "closed",
            }
        )

        # Back to In Progress
        current_time += random_hours(0.5, 2)
        timeline["status_transitions"].append(
            {"from": "In Review", "to": "In Progress", "created": current_time}
        )

        # Second MR (revised)
        mr_count += 1
        build_count += 1

        current_time += random_hours(4, 48)
        mr2_created_time = current_time

        current_time += random_hours(2, 96)
        mr2_merged_time = current_time

        mrs.append(
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

        builds.append(
            {
                "build_number": build_count,
                "started_at": build_started_time,
                "finished_at": build_finished_time,
                "result": "SUCCESS",
            }
        )

        # Done
        current_time += random_hours(1, 12)
        timeline["status_transitions"].append(
            {"from": "In Progress", "to": "Done", "created": current_time}
        )

    timeline["done_at"] = current_time
    timeline["case_pattern"] = case_pattern

    return timeline, mrs, builds


def generate_hybrid_devops_data():
    """Generate all Hybrid DevOps data with proper event ordering and rework patterns"""

    jira_issues = []
    gitlab_mrs = []
    jenkins_builds = []
    loaded_at = datetime.now(timezone.utc).isoformat()

    print("Generating Hybrid DevOps sample data with rework patterns...")

    for i in range(1, NUM_CASES + 1):
        case_key = f"PROJ-{i}"
        jira_issue_id = 5000 + i

        # Generate base time distributed across the year
        base_time = START_DATE + timedelta(
            days=random.randint(0, (END_DATE - START_DATE).days - 90)
        )

        # Generate timeline for this case
        timeline, mrs, builds = generate_case_timeline(i, base_time)

        # 1. Jira Issue
        issue_type = random.choice(["Story", "Bug", "Task"])
        priority = random.choice(["High", "Medium", "Low"])
        reporter = random.choice(["alice", "bob", "charlie"])

        status_transitions_json = [
            {
                "from": trans["from"],
                "to": trans["to"],
                "created": trans["created"].isoformat(),
                "author": reporter,
            }
            for trans in timeline["status_transitions"]
        ]

        jira_issues.append(
            {
                "id": jira_issue_id,
                "key": case_key,
                "summary": f"[{issue_type}] Implement feature {i}",
                "issue_type": issue_type,
                "status": "Done",
                "priority": priority,
                "assignee": reporter,  # Use reporter as assignee for simplicity
                "reporter": reporter,
                "created": timeline["issue_created"].isoformat(),
                "resolutiondate": timeline["done_at"].isoformat(),
                "status_transitions": json.dumps(status_transitions_json),
                "loaded_at": loaded_at,
            }
        )

        # 2. GitLab Merge Requests
        for mr_idx, mr in enumerate(mrs, start=1):
            mr_id = 6000 + (i - 1) * 10 + mr_idx
            mr_iid = (i - 1) * 10 + mr_idx

            mr_record = {
                "id": mr_id,
                "iid": mr_iid,
                "title": f"[{case_key}] Feature implementation (attempt {mr_idx})",
                "state": mr["state"],
                "created_at": mr["created_at"].isoformat(),
                "merged_at": mr["merged_at"].isoformat() if mr["merged_at"] else None,
                "source_branch": f"feature/{case_key.lower()}-{mr_idx}",
                "loaded_at": loaded_at,
            }
            gitlab_mrs.append(mr_record)

        # 3. Jenkins Builds
        for build_idx, build in enumerate(builds, start=1):
            build_id = 7000 + (i - 1) * 10 + build_idx

            build_record = {
                "id": build_id,
                "job_name": "main-build",
                "build_number": build_id,
                "result": build["result"],
                "timestamp": int(build["started_at"].timestamp() * 1000),
                "duration": int(
                    (build["finished_at"] - build["started_at"]).total_seconds() * 1000
                ),
                "commit_messages": f'["{case_key}: implement feature"]',
                "loaded_at": loaded_at,
            }
            jenkins_builds.append(build_record)

    # Write Jira Issues CSV
    jira_path = OUTPUT_DIR / "bronze_jira_issues.csv"
    with open(jira_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "id",
                "key",
                "summary",
                "issue_type",
                "status",
                "priority",
                "assignee",
                "reporter",
                "created",
                "resolutiondate",
                "status_transitions",
                "loaded_at",
            ],
        )
        writer.writeheader()
        writer.writerows(jira_issues)
    print(f"  ✓ Created: {jira_path} ({len(jira_issues)} issues)")

    # Write GitLab MRs CSV (for hybrid-devops)
    mrs_path = OUTPUT_DIR / "bronze_gitlab_merge_requests.csv"
    # Read existing file and append
    existing_mrs = []
    if mrs_path.exists():
        with open(mrs_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            existing_mrs = [
                row
                for row in reader
                if not row["title"].startswith("[PROJ-")  # Keep non-hybrid MRs
            ]

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
        writer.writerows(existing_mrs + gitlab_mrs)
    print(
        f"  ✓ Updated: {mrs_path} ({len(existing_mrs)} existing + {len(gitlab_mrs)} new MRs)"
    )

    # Write Jenkins Builds CSV
    jenkins_path = OUTPUT_DIR / "bronze_jenkins_builds.csv"
    with open(jenkins_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "id",
                "job_name",
                "build_number",
                "result",
                "timestamp",
                "duration",
                "commit_messages",
                "loaded_at",
            ],
        )
        writer.writeheader()
        writer.writerows(jenkins_builds)
    print(f"  ✓ Created: {jenkins_path} ({len(jenkins_builds)} builds)")

    print(f"\nGenerated {NUM_CASES} Hybrid DevOps cases")
    print("  - 60% success (straight path)")
    print("  - 25% build failure → rework")
    print("  - 15% review feedback → rework")
    print(
        "Basic flow: Issue Created → In Progress → MR Created → Code Merged → Build Started → Build Completed → Done"
    )


if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    generate_hybrid_devops_data()
