from typing import List, Dict
from collections import defaultdict
import networkx as nx

from src.models.event_log import EventLog


def calculate_performance_metrics(
    event_log: List[EventLog], dfg: nx.DiGraph
) -> nx.DiGraph:
    """
    Calculate performance metrics and add them to the DFG.

    Args:
        event_log: List of event log entries
        dfg: Directly-Follows Graph

    Returns:
        DFG with performance metrics added
    """
    # Group events by case_id
    cases = defaultdict(list)
    for event in event_log:
        cases[event.case_id].append(event)

    # Sort events within each case by timestamp
    for case_id in cases:
        cases[case_id].sort(key=lambda e: e.timestamp)

    # Calculate average waiting time for each edge
    edge_waiting_times = defaultdict(list)

    for case_id, events in cases.items():
        for i in range(len(events) - 1):
            source = events[i].activity
            target = events[i + 1].activity

            # Calculate waiting time in hours
            time_diff = events[i + 1].timestamp - events[i].timestamp
            waiting_time_hours = time_diff.total_seconds() / 3600.0

            edge_waiting_times[(source, target)].append(waiting_time_hours)

    # Add average waiting time to edges
    for (source, target), times in edge_waiting_times.items():
        if dfg.has_edge(source, target):
            avg_waiting_time = sum(times) / len(times)
            dfg.edges[source, target]["avg_waiting_time_hours"] = round(
                avg_waiting_time, 2
            )

    return dfg


def convert_dfg_to_react_flow(dfg: nx.DiGraph) -> Dict:
    """
    Convert DFG to React Flow compatible JSON format.

    Args:
        dfg: Directly-Follows Graph with performance metrics

    Returns:
        Dictionary with 'nodes' and 'edges' arrays for React Flow
    """
    nodes = []
    edges = []

    # Convert nodes
    for node_id in dfg.nodes():
        node_data = dfg.nodes[node_id]
        nodes.append(
            {
                "id": node_id,
                "type": "actionNode",
                "data": {"label": node_id, "frequency": node_data.get("frequency", 0)},
            }
        )

    # Convert edges
    edge_counter = 0
    for source, target in dfg.edges():
        edge_data = dfg.edges[source, target]
        edge_counter += 1
        edges.append(
            {
                "id": f"edge-{edge_counter}",
                "source": source,
                "target": target,
                "data": {
                    "frequency": edge_data.get("frequency", 0),
                    "avg_waiting_time_hours": edge_data.get(
                        "avg_waiting_time_hours", 0.0
                    ),
                },
            }
        )

    return {"nodes": nodes, "edges": edges}
