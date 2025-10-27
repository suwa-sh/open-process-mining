from typing import List
import networkx as nx
from collections import defaultdict

from src.models.event_log import EventLog


def discover_dfg(event_log: List[EventLog]) -> nx.DiGraph:
    """
    Discover Directly-Follows Graph from event log.

    Args:
        event_log: List of event log entries

    Returns:
        NetworkX DiGraph with nodes (activities) and edges (transitions)
        Includes START and END nodes for UML activity diagram notation
    """
    # Initialize graph
    dfg = nx.DiGraph()

    # Group events by case_id
    cases = defaultdict(list)
    for event in event_log:
        cases[event.case_id].append(event)

    # Sort events within each case by timestamp
    for case_id in cases:
        cases[case_id].sort(key=lambda e: e.timestamp)

    # Count activity frequencies (for nodes)
    activity_frequency = defaultdict(int)
    for event in event_log:
        activity_frequency[event.activity] += 1

    # Add nodes with frequency attribute
    for activity, frequency in activity_frequency.items():
        dfg.add_node(activity, frequency=frequency, node_type="action")

    # Detect start and end activities
    start_activities = defaultdict(int)
    end_activities = defaultdict(int)

    for case_id, events in cases.items():
        if events:
            start_activities[events[0].activity] += 1
            end_activities[events[-1].activity] += 1

    # Add START node
    total_cases = len(cases)
    dfg.add_node("START", frequency=total_cases, node_type="start")
    for activity, frequency in start_activities.items():
        dfg.add_edge("START", activity, frequency=frequency)

    # Add END node
    dfg.add_node("END", frequency=total_cases, node_type="end")
    for activity, frequency in end_activities.items():
        dfg.add_edge(activity, "END", frequency=frequency)

    # Count direct succession frequencies (for edges)
    edge_frequency = defaultdict(int)
    for case_id, events in cases.items():
        for i in range(len(events) - 1):
            source = events[i].activity
            target = events[i + 1].activity
            edge_frequency[(source, target)] += 1

    # Add edges with frequency attribute
    for (source, target), frequency in edge_frequency.items():
        dfg.add_edge(source, target, frequency=frequency)

    return dfg
