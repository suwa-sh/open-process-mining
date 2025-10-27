from datetime import datetime
from src.models.event_log import EventLog
from src.analysis.dfg_discovery import discover_dfg


def test_discover_dfg_basic():
    """Test basic DFG discovery with simple event log."""
    event_log = [
        EventLog(
            case_id="C1",
            activity="A",
            timestamp=datetime(2025, 1, 1, 10, 0),
            resource="User1",
        ),
        EventLog(
            case_id="C1",
            activity="B",
            timestamp=datetime(2025, 1, 1, 11, 0),
            resource="User1",
        ),
        EventLog(
            case_id="C1",
            activity="C",
            timestamp=datetime(2025, 1, 1, 12, 0),
            resource="User2",
        ),
        EventLog(
            case_id="C2",
            activity="A",
            timestamp=datetime(2025, 1, 2, 10, 0),
            resource="User1",
        ),
        EventLog(
            case_id="C2",
            activity="B",
            timestamp=datetime(2025, 1, 2, 11, 0),
            resource="User1",
        ),
    ]

    dfg = discover_dfg(event_log)

    # Check nodes (including START and END)
    assert dfg.number_of_nodes() == 5  # A, B, C, START, END
    assert "A" in dfg.nodes()
    assert "B" in dfg.nodes()
    assert "C" in dfg.nodes()
    assert "START" in dfg.nodes()
    assert "END" in dfg.nodes()

    # Check node types
    assert dfg.nodes["START"]["node_type"] == "start"
    assert dfg.nodes["END"]["node_type"] == "end"
    assert dfg.nodes["A"]["node_type"] == "action"

    # Check node frequencies
    assert dfg.nodes["A"]["frequency"] == 2
    assert dfg.nodes["B"]["frequency"] == 2
    assert dfg.nodes["C"]["frequency"] == 1
    assert dfg.nodes["START"]["frequency"] == 2  # 2 cases
    assert dfg.nodes["END"]["frequency"] == 2

    # Check edges (including START->A and C->END, B->END)
    assert dfg.has_edge("START", "A")
    assert dfg.has_edge("A", "B")
    assert dfg.has_edge("B", "C")
    assert dfg.has_edge("C", "END")
    assert dfg.has_edge("B", "END")
    assert dfg.edges["A", "B"]["frequency"] == 2
    assert dfg.edges["B", "C"]["frequency"] == 1
    assert dfg.edges["START", "A"]["frequency"] == 2
    assert dfg.edges["B", "END"]["frequency"] == 1


def test_discover_dfg_empty():
    """Test DFG discovery with empty event log."""
    event_log = []
    dfg = discover_dfg(event_log)

    # Even with empty log, START and END nodes are created (0 cases)
    assert dfg.number_of_nodes() == 2
    assert dfg.number_of_edges() == 0
    assert "START" in dfg.nodes()
    assert "END" in dfg.nodes()
    assert dfg.nodes["START"]["frequency"] == 0
    assert dfg.nodes["END"]["frequency"] == 0


def test_discover_dfg_single_case():
    """Test DFG discovery with single case."""
    event_log = [
        EventLog(
            case_id="C1",
            activity="Start",
            timestamp=datetime(2025, 1, 1, 10, 0),
            resource="System",
        ),
        EventLog(
            case_id="C1",
            activity="Process",
            timestamp=datetime(2025, 1, 1, 11, 0),
            resource="User",
        ),
        EventLog(
            case_id="C1",
            activity="End",
            timestamp=datetime(2025, 1, 1, 12, 0),
            resource="System",
        ),
    ]

    dfg = discover_dfg(event_log)

    # Includes START, Start, Process, End, END
    assert dfg.number_of_nodes() == 5
    # START->Start, Start->Process, Process->End, End->END
    assert dfg.number_of_edges() == 4
    assert dfg.has_edge("START", "Start")
    assert dfg.has_edge("Start", "Process")
    assert dfg.has_edge("Process", "End")
    assert dfg.has_edge("End", "END")
