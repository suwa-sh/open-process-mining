"""Unit tests for outcome service"""

import pytest
import pandas as pd
from unittest.mock import Mock, patch
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
            ("revenue", "JPY", 10),
            ("profit_margin", "percent", 10),
            ("quantity", "count", 10),
        ]
        mock_db.execute.return_value = mock_result

        # Execute
        metrics = get_available_metrics(mock_db, "order-delivery")

        # Verify
        assert len(metrics) == 3
        assert metrics[0].metric_name == "revenue"
        assert metrics[0].metric_unit == "JPY"
        assert metrics[0].sample_count == 10
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

    @patch("src.services.outcome_service.pd.read_sql")
    def test_analyze_path_outcome_basic(self, mock_read_sql):
        """Test basic path outcome analysis"""
        # Mock database session
        mock_db = Mock()
        mock_db.bind = Mock()

        # Mock DataFrames
        events_df = pd.DataFrame(
            {
                "case_id": ["CASE-001", "CASE-001", "CASE-002", "CASE-002"],
                "activity": ["A", "B", "A", "B"],
                "timestamp": pd.to_datetime(
                    [
                        "2025-01-01 10:00:00",
                        "2025-01-01 11:00:00",
                        "2025-01-01 12:00:00",
                        "2025-01-01 13:00:00",
                    ]
                ),
            }
        )

        outcomes_df = pd.DataFrame(
            {"case_id": ["CASE-001", "CASE-002"], "metric_value": [1000.0, 2000.0]}
        )

        # Set up mock to return different DataFrames
        def read_sql_side_effect(query, *args, **kwargs):
            if "fct_event_log" in str(query):
                return events_df
            else:
                return outcomes_df

        mock_read_sql.side_effect = read_sql_side_effect

        # Execute
        result = analyze_path_outcome(mock_db, "order-delivery", "revenue", None)

        # Verify structure
        assert "nodes" in result
        assert "edges" in result
        assert "summary" in result
        assert len(result["nodes"]) > 0
        assert len(result["edges"]) > 0

    @patch("src.services.outcome_service.pd.read_sql")
    def test_analyze_path_outcome_with_date_filter(self, mock_read_sql):
        """Test path outcome analysis with date filter"""
        # Mock database session
        mock_db = Mock()
        mock_db.bind = Mock()

        # Mock empty DataFrames
        events_df = pd.DataFrame(columns=["case_id", "activity", "timestamp"])
        outcomes_df = pd.DataFrame(columns=["case_id", "metric_value"])

        def read_sql_side_effect(query, *args, **kwargs):
            if "fct_event_log" in str(query):
                return events_df
            else:
                return outcomes_df

        mock_read_sql.side_effect = read_sql_side_effect

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

    @patch("src.services.outcome_service.pd.read_sql")
    def test_analyze_segment_comparison_top25(self, mock_read_sql):
        """Test segment comparison with top25 mode"""
        # Mock database session
        mock_db = Mock()
        mock_db.bind = Mock()

        # Mock DataFrames
        events_df = pd.DataFrame(
            {
                "case_id": ["CASE-001", "CASE-001", "CASE-002", "CASE-002"],
                "activity": ["A", "B", "A", "B"],
                "timestamp": pd.to_datetime(
                    [
                        "2025-01-01 10:00:00",
                        "2025-01-01 11:00:00",
                        "2025-01-01 12:00:00",
                        "2025-01-01 13:00:00",
                    ]
                ),
            }
        )

        outcomes_df = pd.DataFrame(
            {"case_id": ["CASE-001", "CASE-002"], "metric_value": [1000.0, 2000.0]}
        )

        # Set up mock to return different DataFrames
        def read_sql_side_effect(query, *args, **kwargs):
            if "fct_event_log" in str(query):
                return events_df
            else:
                return outcomes_df

        mock_read_sql.side_effect = read_sql_side_effect

        # Execute
        result = analyze_segment_comparison(
            mock_db, "order-delivery", "revenue", "top25", None, None
        )

        # Verify structure
        assert "high_segment" in result
        assert "low_segment" in result
        assert "summary" in result
        assert "differences" in result
        assert "outcome_stats" in result["high_segment"]
        assert "outcome_stats" in result["low_segment"]

    @patch("src.services.outcome_service.pd.read_sql")
    def test_analyze_segment_comparison_threshold(self, mock_read_sql):
        """Test segment comparison with threshold mode"""
        # Mock database session
        mock_db = Mock()
        mock_db.bind = Mock()

        # Mock empty DataFrames
        outcomes_df = pd.DataFrame(columns=["case_id", "metric_value"])
        events_df = pd.DataFrame(columns=["case_id", "activity", "timestamp"])

        def read_sql_side_effect(query, *args, **kwargs):
            if "fct_event_log" in str(query):
                return events_df
            else:
                return outcomes_df

        mock_read_sql.side_effect = read_sql_side_effect

        # Execute with threshold
        result = analyze_segment_comparison(
            mock_db, "order-delivery", "revenue", "threshold", 1500.0, None
        )

        # Verify structure
        assert "high_segment" in result
        assert "low_segment" in result
        assert "summary" in result
        assert "differences" in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
