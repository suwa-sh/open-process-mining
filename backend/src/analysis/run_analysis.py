#!/usr/bin/env python3
"""
CLI script to run process mining analysis.

Usage:
    python run_analysis.py --name "Analysis Name" --process-type "order-delivery"
"""

import argparse
import sys
import uuid
from datetime import datetime

import pandas as pd
from sqlalchemy.orm import Session

from src.db.connection import engine, SessionLocal
from src.models.event_log import EventLog
from src.models.analysis_result import AnalysisResultORM
from src.analysis.dfg_discovery import discover_dfg
from src.analysis.performance_metrics import calculate_performance_metrics, convert_dfg_to_react_flow


def load_event_log_from_db(process_type: str | None = None) -> list[EventLog]:
    """Load event log from fct_event_log table."""
    if process_type:
        query = f"SELECT case_id, activity, timestamp, resource FROM public.fct_event_log WHERE process_type = '{process_type}' ORDER BY case_id, timestamp"
    else:
        query = "SELECT case_id, activity, timestamp, resource FROM public.fct_event_log ORDER BY case_id, timestamp"

    df = pd.read_sql(query, engine)

    event_log = []
    for _, row in df.iterrows():
        event_log.append(EventLog(
            case_id=row['case_id'],
            activity=row['activity'],
            timestamp=row['timestamp'],
            resource=row['resource']
        ))

    return event_log


def save_analysis_result(session: Session, analysis_id: str, analysis_name: str, result_json: dict, process_type: str | None = None):
    """Save analysis result to database."""
    analysis_result = AnalysisResultORM(
        analysis_id=uuid.UUID(analysis_id),
        analysis_name=analysis_name,
        process_type=process_type,
        created_at=datetime.utcnow(),
        result_data=result_json
    )
    session.add(analysis_result)
    session.commit()


def main():
    """Main execution function."""
    parser = argparse.ArgumentParser(description='Run process mining analysis')
    parser.add_argument('--name', required=True, help='Name for this analysis')
    parser.add_argument('--process-type', required=True, help='Process type (e.g., order-delivery, employee-onboarding)')
    args = parser.parse_args()

    analysis_name = args.name
    process_type = args.process_type

    print(f"Starting analysis: {analysis_name} (Process Type: {process_type})")

    # 1. Load event log from database
    print("Loading event log from database...")
    try:
        event_log = load_event_log_from_db(process_type=process_type)
        print(f"Loaded {len(event_log)} events")
    except Exception as e:
        print(f"Error loading event log: {e}")
        sys.exit(1)

    if not event_log:
        print("No events found in fct_event_log table. Please run 'dbt seed' and 'dbt run' first.")
        sys.exit(1)

    # 2. Discover DFG
    print("Discovering Directly-Follows Graph...")
    dfg = discover_dfg(event_log)
    print(f"DFG: {dfg.number_of_nodes()} nodes, {dfg.number_of_edges()} edges")

    # 3. Calculate performance metrics
    print("Calculating performance metrics...")
    dfg_with_metrics = calculate_performance_metrics(event_log, dfg)

    # 4. Convert to React Flow format
    print("Converting to React Flow format...")
    result_json = convert_dfg_to_react_flow(dfg_with_metrics)

    # 5. Save to database
    analysis_id = str(uuid.uuid4())
    print(f"Saving analysis result (ID: {analysis_id})...")
    db = SessionLocal()
    try:
        save_analysis_result(db, analysis_id, analysis_name, result_json, process_type=process_type)
        print(f"✓ Analysis saved successfully!")
        print(f"  Analysis ID: {analysis_id}")
        print(f"  Analysis Name: {analysis_name}")
        print(f"  Process Type: {process_type}")
        print(f"  Nodes: {len(result_json['nodes'])}")
        print(f"  Edges: {len(result_json['edges'])}")
    except Exception as e:
        print(f"Error saving analysis: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
