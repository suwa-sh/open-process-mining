import pytest
from datetime import datetime
from src.models.event_log import EventLog
from src.analysis.dfg_discovery import discover_dfg


def test_discover_dfg_basic():
    """Test basic DFG discovery with simple event log."""
    event_log = [
        EventLog(case_id="C1", activity="A", timestamp=datetime(2025, 1, 1, 10, 0), resource="User1"),
        EventLog(case_id="C1", activity="B", timestamp=datetime(2025, 1, 1, 11, 0), resource="User1"),
        EventLog(case_id="C1", activity="C", timestamp=datetime(2025, 1, 1, 12, 0), resource="User2"),
        EventLog(case_id="C2", activity="A", timestamp=datetime(2025, 1, 2, 10, 0), resource="User1"),
        EventLog(case_id="C2", activity="B", timestamp=datetime(2025, 1, 2, 11, 0), resource="User1"),
    ]

    dfg = discover_dfg(event_log)

    # Check nodes
    assert dfg.number_of_nodes() == 3
    assert "A" in dfg.nodes()
    assert "B" in dfg.nodes()
    assert "C" in dfg.nodes()

    # Check node frequencies
    assert dfg.nodes["A"]["frequency"] == 2
    assert dfg.nodes["B"]["frequency"] == 2
    assert dfg.nodes["C"]["frequency"] == 1

    # Check edges
    assert dfg.has_edge("A", "B")
    assert dfg.has_edge("B", "C")
    assert dfg.edges["A", "B"]["frequency"] == 2
    assert dfg.edges["B", "C"]["frequency"] == 1


def test_discover_dfg_empty():
    """Test DFG discovery with empty event log."""
    event_log = []
    dfg = discover_dfg(event_log)

    assert dfg.number_of_nodes() == 0
    assert dfg.number_of_edges() == 0


def test_discover_dfg_single_case():
    """Test DFG discovery with single case."""
    event_log = [
        EventLog(case_id="C1", activity="Start", timestamp=datetime(2025, 1, 1, 10, 0), resource="System"),
        EventLog(case_id="C1", activity="Process", timestamp=datetime(2025, 1, 1, 11, 0), resource="User"),
        EventLog(case_id="C1", activity="End", timestamp=datetime(2025, 1, 1, 12, 0), resource="System"),
    ]

    dfg = discover_dfg(event_log)

    assert dfg.number_of_nodes() == 3
    assert dfg.number_of_edges() == 2
    assert dfg.has_edge("Start", "Process")
    assert dfg.has_edge("Process", "End")
