import pytest
from datetime import datetime
import networkx as nx
from src.models.event_log import EventLog
from src.analysis.dfg_discovery import discover_dfg
from src.analysis.performance_metrics import calculate_performance_metrics, convert_dfg_to_react_flow


def test_calculate_performance_metrics():
    """Test performance metrics calculation."""
    event_log = [
        EventLog(case_id="C1", activity="A", timestamp=datetime(2025, 1, 1, 10, 0), resource="User1"),
        EventLog(case_id="C1", activity="B", timestamp=datetime(2025, 1, 1, 12, 0), resource="User1"),  # 2 hours later
        EventLog(case_id="C2", activity="A", timestamp=datetime(2025, 1, 2, 10, 0), resource="User1"),
        EventLog(case_id="C2", activity="B", timestamp=datetime(2025, 1, 2, 14, 0), resource="User1"),  # 4 hours later
    ]

    dfg = discover_dfg(event_log)
    dfg_with_metrics = calculate_performance_metrics(event_log, dfg)

    # Check that waiting time is calculated (average of 2h and 4h = 3h)
    assert "avg_waiting_time_hours" in dfg_with_metrics.edges["A", "B"]
    assert dfg_with_metrics.edges["A", "B"]["avg_waiting_time_hours"] == 3.0


def test_convert_dfg_to_react_flow():
    """Test conversion of DFG to React Flow format."""
    # Create simple DFG
    dfg = nx.DiGraph()
    dfg.add_node("A", frequency=10)
    dfg.add_node("B", frequency=8)
    dfg.add_edge("A", "B", frequency=8, avg_waiting_time_hours=2.5)

    result = convert_dfg_to_react_flow(dfg)

    # Check structure
    assert "nodes" in result
    assert "edges" in result

    # Check nodes
    assert len(result["nodes"]) == 2
    node_a = next(n for n in result["nodes"] if n["id"] == "A")
    assert node_a["type"] == "actionNode"
    assert node_a["data"]["label"] == "A"
    assert node_a["data"]["frequency"] == 10

    # Check edges
    assert len(result["edges"]) == 1
    edge = result["edges"][0]
    assert edge["source"] == "A"
    assert edge["target"] == "B"
    assert edge["data"]["frequency"] == 8
    assert edge["data"]["avg_waiting_time_hours"] == 2.5
