"""Generate 1 year of sample process mining data for various processes"""

import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

# Set random seed for reproducibility
random.seed(42)

# Output directory
OUTPUT_DIR = Path("dbt/seeds")

# Date range: 2024-01-01 to 2024-12-31
START_DATE = datetime(2024, 1, 1)
END_DATE = datetime(2024, 12, 31)


def random_date(start, end):
    """Generate a random datetime between start and end"""
    delta = end - start
    random_days = random.randint(0, delta.days)
    random_hours = random.randint(0, 23)
    random_minutes = random.randint(0, 59)
    return start + timedelta(
        days=random_days, hours=random_hours, minutes=random_minutes
    )


def add_hours(dt, hours):
    """Add hours to a datetime"""
    return dt + timedelta(hours=hours)


def add_days(dt, days):
    """Add days to a datetime"""
    return dt + timedelta(days=days)


# 1. ITSM Process (IT Service Management - Incident Management)
def generate_itsm_data():
    """Generate ITSM incident management process data"""
    incidents = []
    outcomes = []

    for i in range(1, 151):  # 150 incidents over the year
        incident_id = f"INC-{i:04d}"
        start_time = random_date(START_DATE, END_DATE)

        # Define incident priority
        priority = random.choice(["Low", "Medium", "High", "Critical"])
        priority_weights = {"Low": 1.0, "Medium": 2.0, "High": 4.0, "Critical": 8.0}

        # Incident flow
        events = []
        current_time = start_time

        # 1. Incident reported
        events.append(
            (
                "itsm",
                incident_id,
                "インシデント報告",
                current_time,
                "SYSTEM",
            )
        )

        # 2. Assigned to support
        current_time = add_hours(current_time, random.uniform(0.1, 1))
        events.append(
            ("itsm", incident_id, "サポート割当", current_time, "EMP-014")
        )

        # 3. Initial investigation
        current_time = add_hours(current_time, random.uniform(0.5, 3))
        events.append(
            ("itsm", incident_id, "初期調査", current_time, "EMP-013")
        )

        #  Escalation path (30% of cases)
        if random.random() < 0.3:
            current_time = add_hours(current_time, random.uniform(1, 4))
            events.append(
                (
                    "itsm",
                    incident_id,
                    "エスカレーション",
                    current_time,
                    "EMP-014",
                )
            )

        # 4. Resolution
        current_time = add_hours(current_time, random.uniform(2, 24))
        events.append(
            ("itsm", incident_id, "解決策適用", current_time, "EMP-013")
        )

        # 5. Verification
        current_time = add_hours(current_time, random.uniform(0.5, 2))
        events.append(
            ("itsm", incident_id, "検証", current_time, "EMP-020")
        )

        # 6. Closed (10% reopen)
        if random.random() < 0.1:
            current_time = add_hours(current_time, random.uniform(1, 8))
            events.append(
                ("itsm", incident_id, "再オープン", current_time, "SYSTEM")
            )
            current_time = add_hours(current_time, random.uniform(4, 16))
            events.append(
                ("itsm", incident_id, "解決策適用", current_time, "EMP-013")
            )
            current_time = add_hours(current_time, random.uniform(0.5, 2))
            events.append(
                ("itsm", incident_id, "検証", current_time, "EMP-020")
            )

        current_time = add_hours(current_time, random.uniform(0.5, 4))
        events.append(
            ("itsm", incident_id, "クローズ", current_time, "SYSTEM")
        )

        incidents.extend(events)

        # Outcome: resolution time and priority
        resolution_hours = (current_time - start_time).total_seconds() / 3600
        outcomes.append(
            {
                "process_type": "itsm",
                "case_id": incident_id,
                "metric_name": "resolution_time_hours",
                "metric_value": round(resolution_hours, 2),
                "metric_unit": "hours",
            }
        )
        outcomes.append(
            {
                "process_type": "itsm",
                "case_id": incident_id,
                "metric_name": "priority_weight",
                "metric_value": priority_weights[priority],
                "metric_unit": "weight",
            }
        )

    return incidents, outcomes


# 2. Billing Process (請求プロセス)
def generate_billing_data():
    """Generate billing process data"""
    bills = []
    outcomes = []

    for i in range(1, 181):  # 180 bills over the year
        bill_id = f"BILL-{i:04d}"
        start_time = random_date(START_DATE, END_DATE)

        events = []
        current_time = start_time

        # 1. Invoice created
        events.append(
            ("billing", bill_id, "請求書作成", current_time, "EMP-015")
        )

        # 2. Approval required
        current_time = add_hours(current_time, random.uniform(4, 24))
        events.append(
            (
                "billing",
                bill_id,
                "承認申請",
                current_time,
                "EMP-015",
            )
        )

        # 3. Manager approval (20% rejection)
        current_time = add_hours(current_time, random.uniform(8, 48))
        if random.random() < 0.2:
            events.append(
                ("billing", bill_id, "差戻", current_time, "EMP-016")
            )
            current_time = add_hours(current_time, random.uniform(4, 16))
            events.append(
                ("billing", bill_id, "修正", current_time, "EMP-015")
            )
            current_time = add_hours(current_time, random.uniform(2, 8))
            events.append(
                ("billing", bill_id, "再申請", current_time, "EMP-015")
            )
            current_time = add_hours(current_time, random.uniform(8, 24))

        events.append(
            ("billing", bill_id, "承認完了", current_time, "EMP-016")
        )

        # 4. Sent to customer
        current_time = add_hours(current_time, random.uniform(2, 8))
        events.append(
            ("billing", bill_id, "送付", current_time, "EMP-015")
        )

        # 5. Payment received
        current_time = add_days(current_time, random.randint(10, 60))
        events.append(
            ("billing", bill_id, "入金確認", current_time, "SYSTEM")
        )

        bills.extend(events)

        # Outcome: cycle time and amount
        cycle_days = (current_time - start_time).days
        amount = random.randint(10000, 5000000)
        outcomes.append(
            {
                "process_type": "billing",
                "case_id": bill_id,
                "metric_name": "cycle_time_days",
                "metric_value": cycle_days,
                "metric_unit": "days",
            }
        )
        outcomes.append(
            {
                "process_type": "billing",
                "case_id": bill_id,
                "metric_name": "amount",
                "metric_value": amount,
                "metric_unit": "JPY",
            }
        )

    return bills, outcomes


# 3. Onboarding Process (already exists, but generate more data)
def generate_onboarding_data():
    """Generate employee onboarding process data"""
    onboardings = []
    outcomes = []

    for i in range(1, 61):  # 60 new employees over the year
        case_id = f"ON-{i:04d}"
        start_time = random_date(START_DATE, END_DATE)

        events = []
        current_time = start_time

        # 1. Application received
        events.append(
            (
                "employee-onboarding",
                case_id,
                "応募受付",
                current_time,
                "SYSTEM",
            )
        )

        # 2. Resume screening
        current_time = add_days(current_time, random.randint(1, 3))
        events.append(
            (
                "employee-onboarding",
                case_id,
                "書類選考",
                current_time,
                "EMP-007",
            )
        )

        # 50% pass screening
        if random.random() > 0.5:
            current_time = add_days(current_time, 1)
            events.append(
                (
                    "employee-onboarding",
                    case_id,
                    "不合格通知",
                    current_time,
                    "SYSTEM",
                )
            )
            onboardings.extend(events)
            continue

        # 3. First interview
        current_time = add_days(current_time, random.randint(3, 7))
        events.append(
            (
                "employee-onboarding",
                case_id,
                "一次面接",
                current_time,
                "EMP-008",
            )
        )

        # 70% pass first interview
        if random.random() > 0.7:
            current_time = add_days(current_time, 1)
            events.append(
                (
                    "employee-onboarding",
                    case_id,
                    "不合格通知",
                    current_time,
                    "SYSTEM",
                )
            )
            onboardings.extend(events)
            continue

        # 4. Second interview
        current_time = add_days(current_time, random.randint(5, 10))
        events.append(
            (
                "employee-onboarding",
                case_id,
                "最終面接",
                current_time,
                "EMP-009",
            )
        )

        # 80% pass final interview
        if random.random() > 0.8:
            current_time = add_days(current_time, 1)
            events.append(
                (
                    "employee-onboarding",
                    case_id,
                    "不合格通知",
                    current_time,
                    "SYSTEM",
                )
            )
            onboardings.extend(events)
            continue

        # 5. Offer
        current_time = add_days(current_time, random.randint(2, 5))
        events.append(
            (
                "employee-onboarding",
                case_id,
                "内定通知",
                current_time,
                "EMP-007",
            )
        )

        # 6. Onboarding
        current_time = add_days(current_time, random.randint(14, 30))
        events.append(
            (
                "employee-onboarding",
                case_id,
                "入社手続",
                current_time,
                "EMP-010",
            )
        )

        # 7. Orientation
        current_time = add_days(current_time, random.randint(1, 3))
        events.append(
            (
                "employee-onboarding",
                case_id,
                "オリエンテーション",
                current_time,
                "EMP-012",
            )
        )

        onboardings.extend(events)

        # Outcome: time to hire and satisfaction score
        time_to_hire = (current_time - start_time).days
        satisfaction = round(random.uniform(3.0, 5.0), 1)
        outcomes.append(
            {
                "process_type": "employee-onboarding",
                "case_id": case_id,
                "metric_name": "time_to_hire_days",
                "metric_value": time_to_hire,
                "metric_unit": "days",
            }
        )
        outcomes.append(
            {
                "process_type": "employee-onboarding",
                "case_id": case_id,
                "metric_name": "satisfaction_score",
                "metric_value": satisfaction,
                "metric_unit": "score",
            }
        )

    return onboardings, outcomes


# 4. Invoice Approval Process
def generate_invoice_approval_data():
    """Generate invoice approval process data"""
    invoices = []
    outcomes = []

    for i in range(1, 201):  # 200 invoices over the year
        invoice_id = f"INV-{i:04d}"
        start_time = random_date(START_DATE, END_DATE)

        events = []
        current_time = start_time

        # 1. Invoice received
        events.append(
            (
                "invoice-approval",
                invoice_id,
                "請求書受領",
                current_time,
                "SYSTEM",
            )
        )

        # 2. Assigned for verification
        current_time = add_hours(current_time, random.uniform(1, 8))
        events.append(
            (
                "invoice-approval",
                invoice_id,
                "検証割当",
                current_time,
                "EMP-015",
            )
        )

        # 3. Verification (15% have errors)
        current_time = add_hours(current_time, random.uniform(2, 16))
        if random.random() < 0.15:
            events.append(
                (
                    "invoice-approval",
                    invoice_id,
                    "エラー検出",
                    current_time,
                    "EMP-015",
                )
            )
            current_time = add_hours(current_time, random.uniform(4, 24))
            events.append(
                (
                    "invoice-approval",
                    invoice_id,
                    "ベンダー問合せ",
                    current_time,
                    "EMP-015",
                )
            )
            current_time = add_days(current_time, random.randint(1, 5))
            events.append(
                (
                    "invoice-approval",
                    invoice_id,
                    "修正受領",
                    current_time,
                    "SYSTEM",
                )
            )

        events.append(
            (
                "invoice-approval",
                invoice_id,
                "検証完了",
                current_time,
                "EMP-015",
            )
        )

        # 4. Manager approval
        current_time = add_hours(current_time, random.uniform(4, 48))
        events.append(
            (
                "invoice-approval",
                invoice_id,
                "承認",
                current_time,
                "EMP-016",
            )
        )

        # 5. Payment scheduled
        current_time = add_hours(current_time, random.uniform(2, 8))
        events.append(
            (
                "invoice-approval",
                invoice_id,
                "支払予定登録",
                current_time,
                "EMP-015",
            )
        )

        # 6. Payment executed
        current_time = add_days(current_time, random.randint(5, 30))
        events.append(
            (
                "invoice-approval",
                invoice_id,
                "支払実行",
                current_time,
                "SYSTEM",
            )
        )

        invoices.extend(events)

        # Outcome: processing time and amount
        processing_days = (current_time - start_time).days
        amount = random.randint(5000, 2000000)
        outcomes.append(
            {
                "process_type": "invoice-approval",
                "case_id": invoice_id,
                "metric_name": "processing_days",
                "metric_value": processing_days,
                "metric_unit": "days",
            }
        )
        outcomes.append(
            {
                "process_type": "invoice-approval",
                "case_id": invoice_id,
                "metric_name": "amount",
                "metric_value": amount,
                "metric_unit": "JPY",
            }
        )

    return invoices, outcomes


# 5. System Development Process
def generate_development_data():
    """Generate system development process data"""
    projects = []
    outcomes = []

    for i in range(1, 31):  # 30 development projects over the year
        project_id = f"DEV-{i:04d}"
        start_time = random_date(START_DATE, END_DATE - timedelta(days=90))

        events = []
        current_time = start_time

        # 1. Requirements gathering
        events.append(
            (
                "system-development",
                project_id,
                "要件定義",
                current_time,
                "EMP-019",
            )
        )

        # 2. Design
        current_time = add_days(current_time, random.randint(5, 15))
        events.append(
            (
                "system-development",
                project_id,
                "設計",
                current_time,
                "EMP-018",
            )
        )

        # 3. Design review (20% need revision)
        current_time = add_days(current_time, random.randint(3, 10))
        if random.random() < 0.2:
            events.append(
                (
                    "system-development",
                    project_id,
                    "設計レビュー指摘",
                    current_time,
                    "EMP-019",
                )
            )
            current_time = add_days(current_time, random.randint(2, 7))
            events.append(
                (
                    "system-development",
                    project_id,
                    "設計修正",
                    current_time,
                    "EMP-018",
                )
            )

        events.append(
            (
                "system-development",
                project_id,
                "設計承認",
                current_time,
                "EMP-019",
            )
        )

        # 4. Development
        current_time = add_days(current_time, random.randint(15, 45))
        events.append(
            (
                "system-development",
                project_id,
                "実装",
                current_time,
                "EMP-017",
            )
        )

        # 5. Code review (30% need rework)
        current_time = add_days(current_time, random.randint(1, 5))
        if random.random() < 0.3:
            events.append(
                (
                    "system-development",
                    project_id,
                    "コードレビュー指摘",
                    current_time,
                    "EMP-018",
                )
            )
            current_time = add_days(current_time, random.randint(2, 7))
            events.append(
                (
                    "system-development",
                    project_id,
                    "修正",
                    current_time,
                    "EMP-017",
                )
            )

        events.append(
            (
                "system-development",
                project_id,
                "コードレビュー承認",
                current_time,
                "EMP-018",
            )
        )

        # 6. Testing
        current_time = add_days(current_time, random.randint(5, 15))
        events.append(
            (
                "system-development",
                project_id,
                "テスト",
                current_time,
                "EMP-017",
            )
        )

        # 7. Bug fixes (40% have bugs)
        if random.random() < 0.4:
            current_time = add_days(current_time, random.randint(1, 3))
            events.append(
                (
                    "system-development",
                    project_id,
                    "バグ発見",
                    current_time,
                    "EMP-017",
                )
            )
            current_time = add_days(current_time, random.randint(2, 10))
            events.append(
                (
                    "system-development",
                    project_id,
                    "バグ修正",
                    current_time,
                    "EMP-017",
                )
            )
            current_time = add_days(current_time, random.randint(1, 3))
            events.append(
                (
                    "system-development",
                    project_id,
                    "再テスト",
                    current_time,
                    "EMP-017",
                )
            )

        # 8. Deployment
        current_time = add_days(current_time, random.randint(1, 5))
        events.append(
            (
                "system-development",
                project_id,
                "デプロイ",
                current_time,
                "EMP-019",
            )
        )

        projects.extend(events)

        # Outcome: lead time, story points, defect count
        lead_time = (current_time - start_time).days
        story_points = random.randint(5, 50)
        defect_count = random.randint(0, 10)
        outcomes.append(
            {
                "process_type": "system-development",
                "case_id": project_id,
                "metric_name": "lead_time_days",
                "metric_value": lead_time,
                "metric_unit": "days",
            }
        )
        outcomes.append(
            {
                "process_type": "system-development",
                "case_id": project_id,
                "metric_name": "story_points",
                "metric_value": story_points,
                "metric_unit": "points",
            }
        )
        outcomes.append(
            {
                "process_type": "system-development",
                "case_id": project_id,
                "metric_name": "defect_count",
                "metric_value": defect_count,
                "metric_unit": "count",
            }
        )

    return projects, outcomes


# Generate all data
def main():
    print("Generating sample data for 2024...")

    all_events = []
    all_outcomes = []

    # ITSM
    print("- ITSM (150 incidents)")
    itsm_events, itsm_outcomes = generate_itsm_data()
    all_events.extend(itsm_events)
    all_outcomes.extend(itsm_outcomes)

    # Billing
    print("- Billing (180 bills)")
    billing_events, billing_outcomes = generate_billing_data()
    all_events.extend(billing_events)
    all_outcomes.extend(billing_outcomes)

    # Onboarding
    print("- Employee Onboarding (60 candidates)")
    onboarding_events, onboarding_outcomes = generate_onboarding_data()
    all_events.extend(onboarding_events)
    all_outcomes.extend(onboarding_outcomes)

    # Invoice Approval
    print("- Invoice Approval (200 invoices)")
    invoice_events, invoice_outcomes = generate_invoice_approval_data()
    all_events.extend(invoice_events)
    all_outcomes.extend(invoice_outcomes)

    # System Development
    print("- System Development (30 projects)")
    dev_events, dev_outcomes = generate_development_data()
    all_events.extend(dev_events)
    all_outcomes.extend(dev_outcomes)

    # Write events CSV
    events_file = OUTPUT_DIR / "raw_process_events_2024.csv"
    with open(events_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["process_type", "case_id", "activity", "event_time", "employee_id"])
        for event in all_events:
            writer.writerow([
                event[0],
                event[1],
                event[2],
                event[3].strftime("%Y-%m-%d %H:%M:%S"),
                event[4],
            ])

    print(f"\n✓ Generated {len(all_events)} events -> {events_file}")

    # Write outcomes CSV
    outcomes_file = OUTPUT_DIR / "outcome_processes_2024.csv"
    with open(outcomes_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "process_type",
                "case_id",
                "metric_name",
                "metric_value",
                "metric_unit",
            ],
        )
        writer.writeheader()
        writer.writerows(all_outcomes)

    print(f"✓ Generated {len(all_outcomes)} outcome records -> {outcomes_file}")
    print("\nDone!")


if __name__ == "__main__":
    main()
