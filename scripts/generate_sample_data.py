"""Generate 1 year of sample process mining data for various processes

This script simulates ETL processes from various source systems, generating
CSV files with source-specific schemas that are then transformed by dbt staging models.

Usage:
    python scripts/generate_sample_data.py

Output:
    - Raw event CSV files: dbt/seeds/raw_<process_type>_2024.csv
    - Outcome CSV files: dbt/seeds/outcome_<process_type>_2024.csv
"""

import csv
import random
from datetime import datetime, timedelta
from pathlib import Path

# Set random seed for reproducibility
random.seed(42)

# Output directory (relative to repository root)
OUTPUT_DIR = Path(__file__).parent.parent / "dbt" / "seeds"

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
        events.append(("itsm", incident_id, "サポート割当", current_time, "EMP-014"))

        # 3. Initial investigation
        current_time = add_hours(current_time, random.uniform(0.5, 3))
        events.append(("itsm", incident_id, "初期調査", current_time, "EMP-013"))

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
        events.append(("itsm", incident_id, "解決策適用", current_time, "EMP-013"))

        # 5. Verification
        current_time = add_hours(current_time, random.uniform(0.5, 2))
        events.append(("itsm", incident_id, "検証", current_time, "EMP-020"))

        # 6. Closed (10% reopen)
        if random.random() < 0.1:
            current_time = add_hours(current_time, random.uniform(1, 8))
            events.append(("itsm", incident_id, "再オープン", current_time, "SYSTEM"))
            current_time = add_hours(current_time, random.uniform(4, 16))
            events.append(("itsm", incident_id, "解決策適用", current_time, "EMP-013"))
            current_time = add_hours(current_time, random.uniform(0.5, 2))
            events.append(("itsm", incident_id, "検証", current_time, "EMP-020"))

        current_time = add_hours(current_time, random.uniform(0.5, 4))
        events.append(("itsm", incident_id, "クローズ", current_time, "SYSTEM"))

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
        events.append(("billing", bill_id, "請求書作成", current_time, "EMP-015"))

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
            events.append(("billing", bill_id, "差戻", current_time, "EMP-016"))
            current_time = add_hours(current_time, random.uniform(4, 16))
            events.append(("billing", bill_id, "修正", current_time, "EMP-015"))
            current_time = add_hours(current_time, random.uniform(2, 8))
            events.append(("billing", bill_id, "再申請", current_time, "EMP-015"))
            current_time = add_hours(current_time, random.uniform(8, 24))

        events.append(("billing", bill_id, "承認完了", current_time, "EMP-016"))

        # 4. Sent to customer
        current_time = add_hours(current_time, random.uniform(2, 8))
        events.append(("billing", bill_id, "送付", current_time, "EMP-015"))

        # 5. Payment received
        current_time = add_days(current_time, random.randint(10, 60))
        events.append(("billing", bill_id, "入金確認", current_time, "SYSTEM"))

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


# 3. Invoice Approval Process
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


def write_process_data(process_name, events, outcomes, event_schema):
    """Write events and outcomes for a single process type to separate CSV files

    Args:
        process_name: Process type name (e.g., 'itsm', 'billing')
        events: List of event tuples
        outcomes: List of outcome dicts
        event_schema: Dict mapping column names to their position in event tuple
                     e.g., {'incident_id': 1, 'status': 2, 'reported_at': 3, 'assigned_to': 4}
    """
    # Write events CSV with source-system specific columns
    events_file = OUTPUT_DIR / f"raw_{process_name}_2024.csv"
    with open(events_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        # Write header from schema
        writer.writerow(event_schema.keys())
        for event in events:
            row = []
            for col_idx in event_schema.values():
                value = event[col_idx]
                # Format datetime if needed
                if isinstance(value, datetime):
                    value = value.strftime("%Y-%m-%d %H:%M:%S")
                row.append(value)
            writer.writerow(row)

    print(f"  ✓ {len(events)} events -> {events_file}")

    # Write outcomes CSV
    outcomes_file = OUTPUT_DIR / f"outcome_{process_name}_2024.csv"
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
        writer.writerows(outcomes)

    print(f"  ✓ {len(outcomes)} outcome records -> {outcomes_file}")


# 6. Order to Cash Process
def generate_order_to_cash_data():
    """Generate order to cash process data"""
    orders = []
    outcomes = []

    for i in range(1, 51):  # 50 orders
        order_id = f"ORD-{i:04d}"
        start_time = random_date(START_DATE, END_DATE)

        events = []
        current_time = start_time

        # 1. Quotation created
        events.append(("order-to-cash", order_id, "見積作成", current_time, "EMP-001"))

        # 2. Order registration
        current_time = add_days(current_time, random.randint(1, 5))
        events.append(("order-to-cash", order_id, "受注登録", current_time, "EMP-001"))

        # 3. Credit check (85% pass, 15% fail requiring prepayment)
        current_time = add_hours(current_time, random.uniform(2, 8))
        if random.random() < 0.15:
            events.append(
                ("order-to-cash", order_id, "与信NG", current_time, "EMP-002")
            )
            current_time = add_hours(current_time, random.uniform(4, 24))
            events.append(
                ("order-to-cash", order_id, "前払い要請", current_time, "EMP-002")
            )
            current_time = add_days(current_time, random.randint(1, 7))
            events.append(
                ("order-to-cash", order_id, "前払い確認", current_time, "SYSTEM")
            )
        else:
            events.append(
                ("order-to-cash", order_id, "与信審査完了", current_time, "EMP-002")
            )

        # 4. Shipment instruction
        current_time = add_hours(current_time, random.uniform(1, 4))
        events.append(
            ("order-to-cash", order_id, "出荷指示", current_time, "EMP-001")
        )

        # 5. Inventory check (92% in stock, 8% out of stock)
        current_time = add_hours(current_time, random.uniform(0.5, 2))
        if random.random() < 0.08:
            events.append(
                ("order-to-cash", order_id, "在庫不足", current_time, "EMP-003")
            )
            # Wait for restocking
            current_time = add_days(current_time, random.randint(3, 10))
            events.append(
                ("order-to-cash", order_id, "入荷待ち", current_time, "EMP-003")
            )

        # 6. Picking
        current_time = add_hours(current_time, random.uniform(1, 4))
        events.append(
            ("order-to-cash", order_id, "ピッキング", current_time, "EMP-003")
        )

        # 7. Packing
        current_time = add_hours(current_time, random.uniform(0.5, 2))
        events.append(("order-to-cash", order_id, "梱包", current_time, "EMP-003"))

        # 8. Shipment
        current_time = add_hours(current_time, random.uniform(0.5, 1))
        events.append(("order-to-cash", order_id, "出荷完了", current_time, "EMP-004"))

        # 9. Invoice issued
        current_time = add_hours(current_time, random.uniform(2, 8))
        events.append(
            ("order-to-cash", order_id, "請求書発行", current_time, "EMP-001")
        )

        # 10. Payment received (10% have payment delays)
        payment_days = random.randint(15, 45)
        if random.random() < 0.1:
            # Payment delayed
            current_time = add_days(current_time, payment_days + random.randint(5, 15))
            events.append(
                ("order-to-cash", order_id, "入金遅延", current_time, "SYSTEM")
            )
            current_time = add_days(current_time, random.randint(1, 3))
            events.append(("order-to-cash", order_id, "督促", current_time, "EMP-002"))
            current_time = add_days(current_time, random.randint(2, 10))
        else:
            current_time = add_days(current_time, payment_days)

        events.append(("order-to-cash", order_id, "入金確認", current_time, "SYSTEM"))

        # 11. Account receivable cleared
        current_time = add_hours(current_time, random.uniform(1, 8))
        events.append(
            ("order-to-cash", order_id, "売掛金消込", current_time, "EMP-002")
        )

        orders.extend(events)

        # Outcomes: revenue, profit_margin, quantity
        revenue = random.randint(50000, 2000000)
        profit_margin = random.uniform(0.1, 0.35)
        quantity = random.randint(1, 100)

        outcomes.extend(
            [
                {
                    "process_type": "order-to-cash",
                    "case_id": order_id,
                    "metric_name": "revenue",
                    "metric_value": revenue,
                    "metric_unit": "JPY",
                },
                {
                    "process_type": "order-to-cash",
                    "case_id": order_id,
                    "metric_name": "profit_margin",
                    "metric_value": round(profit_margin, 3),
                    "metric_unit": "percent",
                },
                {
                    "process_type": "order-to-cash",
                    "case_id": order_id,
                    "metric_name": "quantity",
                    "metric_value": quantity,
                    "metric_unit": "count",
                },
            ]
        )

    return orders, outcomes


# 7. Employee Onboarding Process
def generate_employee_onboarding_data():
    """Generate employee onboarding/recruitment process data"""
    candidates = []
    outcomes = []

    for i in range(1, 41):  # 40 candidates
        candidate_id = f"CAND-{i:04d}"
        start_time = random_date(START_DATE, END_DATE)

        events = []
        current_time = start_time

        # 1. Application received
        events.append(
            ("employee-onboarding", candidate_id, "応募受付", current_time, "SYSTEM")
        )

        # 2. Document screening
        current_time = add_days(current_time, 1)
        events.append(
            ("employee-onboarding", candidate_id, "書類選考", current_time, "EMP-007")
        )

        # 60% pass document screening
        if random.random() > 0.6:
            current_time = add_days(current_time, 1)
            events.append(
                (
                    "employee-onboarding",
                    candidate_id,
                    "不合格通知",
                    current_time,
                    "SYSTEM",
                )
            )
            candidates.extend(events)

            # Outcome for failed candidates
            total_days = (current_time - start_time).days
            outcomes.append(
                {
                    "process_type": "employee-onboarding",
                    "case_id": candidate_id,
                    "metric_name": "recruitment_days",
                    "metric_value": total_days,
                    "metric_unit": "days",
                }
            )
            continue

        # 3. First interview
        current_time = add_days(current_time, random.randint(3, 7))
        events.append(
            ("employee-onboarding", candidate_id, "一次面接", current_time, "EMP-008")
        )

        # 70% pass first interview
        if random.random() > 0.7:
            current_time = add_days(current_time, 1)
            events.append(
                (
                    "employee-onboarding",
                    candidate_id,
                    "不合格通知",
                    current_time,
                    "SYSTEM",
                )
            )
            candidates.extend(events)

            total_days = (current_time - start_time).days
            outcomes.append(
                {
                    "process_type": "employee-onboarding",
                    "case_id": candidate_id,
                    "metric_name": "recruitment_days",
                    "metric_value": total_days,
                    "metric_unit": "days",
                }
            )
            continue

        # 4. Final interview
        current_time = add_days(current_time, random.randint(5, 10))
        events.append(
            ("employee-onboarding", candidate_id, "最終面接", current_time, "EMP-009")
        )

        # 50% pass final interview
        if random.random() > 0.5:
            current_time = add_days(current_time, random.randint(1, 3))
            events.append(
                (
                    "employee-onboarding",
                    candidate_id,
                    "不合格通知",
                    current_time,
                    "SYSTEM",
                )
            )
            candidates.extend(events)

            total_days = (current_time - start_time).days
            outcomes.append(
                {
                    "process_type": "employee-onboarding",
                    "case_id": candidate_id,
                    "metric_name": "recruitment_days",
                    "metric_value": total_days,
                    "metric_unit": "days",
                }
            )
            continue

        # 5. Offer
        current_time = add_days(current_time, random.randint(2, 5))
        events.append(
            ("employee-onboarding", candidate_id, "内定", current_time, "EMP-009")
        )

        # 6. Onboarding
        current_time = add_days(current_time, random.randint(7, 21))
        events.append(
            ("employee-onboarding", candidate_id, "入社手続", current_time, "EMP-010")
        )

        candidates.extend(events)

        # Outcomes for successful hires
        total_days = (current_time - start_time).days
        candidate_score = random.randint(60, 95)
        recruitment_cost = random.randint(50000, 300000)

        outcomes.extend(
            [
                {
                    "process_type": "employee-onboarding",
                    "case_id": candidate_id,
                    "metric_name": "recruitment_days",
                    "metric_value": total_days,
                    "metric_unit": "days",
                },
                {
                    "process_type": "employee-onboarding",
                    "case_id": candidate_id,
                    "metric_name": "candidate_score",
                    "metric_value": candidate_score,
                    "metric_unit": "score",
                },
                {
                    "process_type": "employee-onboarding",
                    "case_id": candidate_id,
                    "metric_name": "recruitment_cost",
                    "metric_value": recruitment_cost,
                    "metric_unit": "JPY",
                },
            ]
        )

    return candidates, outcomes


# Generate all data
def main():
    print("Generating sample data for 2024...")
    print(
        "Each process type will be saved to separate CSV files with source-specific schemas.\n"
    )

    # Order to Cash - Source system columns
    print("- Order to Cash (50 orders)")
    order_events, order_outcomes = generate_order_to_cash_data()
    order_schema = {
        "order_id": 1,
        "order_status": 2,
        "status_changed_at": 3,
        "employee_id": 4,
    }
    write_process_data("order_to_cash", order_events, order_outcomes, order_schema)

    # Employee Onboarding - Source system columns
    print("\n- Employee Onboarding (40 candidates)")
    onboarding_events, onboarding_outcomes = generate_employee_onboarding_data()
    onboarding_schema = {
        "candidate_id": 1,
        "recruitment_status": 2,
        "status_changed_at": 3,
        "responsible_person": 4,
    }
    write_process_data(
        "employee_onboarding", onboarding_events, onboarding_outcomes, onboarding_schema
    )

    # ITSM - Source system columns
    print("\n- ITSM (150 incidents)")
    itsm_events, itsm_outcomes = generate_itsm_data()
    itsm_schema = {
        "incident_id": 1,  # case_id in tuple
        "status": 2,  # activity in tuple
        "reported_at": 3,  # event_time in tuple
        "assigned_to": 4,  # employee_id in tuple
    }
    write_process_data("itsm", itsm_events, itsm_outcomes, itsm_schema)

    # Billing - Source system columns
    print("\n- Billing (180 bills)")
    billing_events, billing_outcomes = generate_billing_data()
    billing_schema = {
        "bill_id": 1,
        "bill_status": 2,
        "status_changed_at": 3,
        "employee_id": 4,
    }
    write_process_data("billing", billing_events, billing_outcomes, billing_schema)

    # Invoice Approval - Source system columns
    print("\n- Invoice Approval (200 invoices)")
    invoice_events, invoice_outcomes = generate_invoice_approval_data()
    invoice_schema = {
        "invoice_id": 1,
        "approval_status": 2,
        "status_time": 3,
        "processor_id": 4,
    }
    write_process_data(
        "invoice_approval", invoice_events, invoice_outcomes, invoice_schema
    )

    # System Development - Source system columns
    print("\n- System Development (30 projects)")
    dev_events, dev_outcomes = generate_development_data()
    dev_schema = {
        "project_id": 1,
        "phase": 2,
        "phase_changed_at": 3,
        "developer_id": 4,
    }
    write_process_data("system_development", dev_events, dev_outcomes, dev_schema)

    print("\nDone! Generated 6 process types with source-specific CSV schemas.")
    print("\nSource schemas:")
    print("  - Order to Cash: order_id, order_status, status_changed_at, employee_id")
    print(
        "  - Employee Onboarding: candidate_id, recruitment_status, status_changed_at, responsible_person"
    )
    print("  - ITSM: incident_id, status, reported_at, assigned_to")
    print("  - Billing: bill_id, bill_status, status_changed_at, employee_id")
    print(
        "  - Invoice Approval: invoice_id, approval_status, status_time, processor_id"
    )
    print("  - System Development: project_id, phase, phase_changed_at, developer_id")


if __name__ == "__main__":
    main()
