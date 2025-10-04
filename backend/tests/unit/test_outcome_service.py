"""Unit tests for outcome service"""
import pytest
from unittest.mock import Mock, MagicMock
from src.services.outcome_service import (
    get_available_metrics,
    analyze_path_outcome,
    analyze_segment_comparison,
)


class TestGetAvailableMetrics:
    """Tests for get_available_metrics function"""

    def test_get_available_metrics_with_data(self):
        """Test getting available metrics with existing data"""
        # Mock database session
        mock_db = Mock()
        mock_result = Mock()
        mock_result.fetchall.return_value = [
            ("revenue", "JPY"),
            ("profit_margin", "percent"),
            ("quantity", "count"),
        ]
        mock_db.execute.return_value = mock_result

        # Execute
        metrics = get_available_metrics(mock_db, "order-delivery")

        # Verify
        assert len(metrics) == 3
        assert metrics[0].metric_name == "revenue"
        assert metrics[0].metric_unit == "JPY"
        assert metrics[1].metric_name == "profit_margin"
        assert metrics[2].metric_name == "quantity"

    def test_get_available_metrics_empty(self):
        """Test getting available metrics with no data"""
        # Mock database session
        mock_db = Mock()
        mock_result = Mock()
        mock_result.fetchall.return_value = []
        mock_db.execute.return_value = mock_result

        # Execute
        metrics = get_available_metrics(mock_db, "non-existent-process")

        # Verify
        assert len(metrics) == 0


class TestAnalyzePathOutcome:
    """Tests for analyze_path_outcome function"""

    def test_analyze_path_outcome_basic(self):
        """Test basic path outcome analysis"""
        # Mock database session
        mock_db = Mock()

        # Mock event log query
        mock_event_result = Mock()
        mock_event_result.fetchall.return_value = [
            ("CASE-001", "A", "2025-01-01 10:00:00"),
            ("CASE-001", "B", "2025-01-01 11:00:00"),
            ("CASE-002", "A", "2025-01-01 12:00:00"),
            ("CASE-002", "B", "2025-01-01 13:00:00"),
        ]

        # Mock outcome query
        mock_outcome_result = Mock()
        mock_outcome_result.fetchall.return_value = [
            ("CASE-001", 1000.0),
            ("CASE-002", 2000.0),
        ]

        # Set up mock to return different results for different queries
        def execute_side_effect(query):
            if "fct_event_log" in str(query):
                return mock_event_result
            else:
                return mock_outcome_result

        mock_db.execute.side_effect = execute_side_effect

        # Execute
        result = analyze_path_outcome(
            mock_db, "order-delivery", "revenue", None
        )

        # Verify structure
        assert "nodes" in result
        assert "edges" in result
        assert "summary" in result
        assert len(result["nodes"]) > 0
        assert len(result["edges"]) > 0

    def test_analyze_path_outcome_with_date_filter(self):
        """Test path outcome analysis with date filter"""
        # Mock database session
        mock_db = Mock()
        mock_event_result = Mock()
        mock_event_result.fetchall.return_value = []
        mock_outcome_result = Mock()
        mock_outcome_result.fetchall.return_value = []

        def execute_side_effect(query):
            if "fct_event_log" in str(query):
                return mock_event_result
            else:
                return mock_outcome_result

        mock_db.execute.side_effect = execute_side_effect

        # Execute with date filter
        filter_config = {
            "date_from": "2025-01-01",
            "date_to": "2025-01-31",
        }
        result = analyze_path_outcome(
            mock_db, "order-delivery", "revenue", filter_config
        )

        # Verify result structure
        assert "nodes" in result
        assert "edges" in result
        assert "summary" in result


class TestAnalyzeSegmentComparison:
    """Tests for analyze_segment_comparison function"""

    def test_analyze_segment_comparison_top25(self):
        """Test segment comparison with top25 mode"""
        # Mock database session
        mock_db = Mock()

        # Mock event log query
        mock_event_result = Mock()
        mock_event_result.fetchall.return_value = [
            ("CASE-001", "A", "2025-01-01 10:00:00"),
            ("CASE-001", "B", "2025-01-01 11:00:00"),
            ("CASE-002", "A", "2025-01-01 12:00:00"),
            ("CASE-002", "B", "2025-01-01 13:00:00"),
        ]

        # Mock outcome query
        mock_outcome_result = Mock()
        mock_outcome_result.fetchall.return_value = [
            ("CASE-001", 1000.0),
            ("CASE-002", 2000.0),
        ]

        # Set up mock to return different results
        def execute_side_effect(query):
            if "fct_event_log" in str(query):
                return mock_event_result
            else:
                return mock_outcome_result

        mock_db.execute.side_effect = execute_side_effect

        # Execute
        result = analyze_segment_comparison(
            mock_db, "order-delivery", "revenue", "top25", None, None
        )

        # Verify structure
        assert "high_segment" in result
        assert "low_segment" in result
        assert "segment_definition" in result
        assert "outcome_stats" in result["high_segment"]
        assert "outcome_stats" in result["low_segment"]

    def test_analyze_segment_comparison_threshold(self):
        """Test segment comparison with threshold mode"""
        # Mock database session
        mock_db = Mock()
        mock_event_result = Mock()
        mock_event_result.fetchall.return_value = []
        mock_outcome_result = Mock()
        mock_outcome_result.fetchall.return_value = []

        def execute_side_effect(query):
            if "fct_event_log" in str(query):
                return mock_event_result
            else:
                return mock_outcome_result

        mock_db.execute.side_effect = execute_side_effect

        # Execute with threshold
        result = analyze_segment_comparison(
            mock_db, "order-delivery", "revenue", "threshold", 1500.0, None
        )

        # Verify structure
        assert "high_segment" in result
        assert "low_segment" in result
        assert "segment_definition" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
