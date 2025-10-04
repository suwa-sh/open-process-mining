"""Unit tests for outcome API endpoints"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from src.main import app

client = TestClient(app)


class TestOutcomeMetricsEndpoint:
    """Tests for /outcome/metrics endpoint"""

    @patch("src.services.outcome_service.get_available_metrics")
    def test_get_metrics_success(self, mock_get_metrics):
        """Test getting available metrics successfully"""
        # Mock service response
        mock_get_metrics.return_value = [
            {"metric_name": "revenue", "metric_unit": "JPY"},
            {"metric_name": "profit_margin", "metric_unit": "percent"},
        ]

        # Execute
        response = client.get("/outcome/metrics?process_type=order-delivery")

        # Verify
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["metric_name"] == "revenue"

    @patch("src.services.outcome_service.get_available_metrics")
    def test_get_metrics_empty(self, mock_get_metrics):
        """Test getting metrics with no results"""
        # Mock service response
        mock_get_metrics.return_value = []

        # Execute
        response = client.get("/outcome/metrics?process_type=non-existent")

        # Verify
        assert response.status_code == 200
        assert response.json() == []


class TestOutcomeAnalysesEndpoint:
    """Tests for /outcome/analyses endpoint"""

    @patch("src.services.outcome_service.get_outcome_analyses")
    def test_get_analyses_success(self, mock_get_analyses):
        """Test getting analyses list successfully"""
        # Mock service response
        mock_get_analyses.return_value = [
            {
                "analysis_id": "test-id-1",
                "analysis_name": "Test Analysis 1",
                "process_type": "order-delivery",
                "metric_name": "revenue",
                "analysis_type": "path-outcome",
                "created_at": "2025-10-05T00:00:00",
            }
        ]

        # Execute
        response = client.get("/outcome/analyses")

        # Verify
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["analysis_name"] == "Test Analysis 1"

    @patch("src.services.outcome_service.get_outcome_analyses")
    def test_get_analyses_with_filters(self, mock_get_analyses):
        """Test getting analyses with filters"""
        # Mock service response
        mock_get_analyses.return_value = []

        # Execute
        response = client.get(
            "/outcome/analyses?process_type=order-delivery&metric_name=revenue"
        )

        # Verify
        assert response.status_code == 200
        mock_get_analyses.assert_called_once()


class TestOutcomeAnalysisByIdEndpoint:
    """Tests for /outcome/analyses/{analysis_id} endpoint"""

    @patch("src.services.outcome_service.get_outcome_analysis_by_id")
    def test_get_analysis_by_id_success(self, mock_get_analysis):
        """Test getting specific analysis successfully"""
        # Mock service response
        mock_get_analysis.return_value = {
            "analysis_id": "test-id-1",
            "analysis_name": "Test Analysis",
            "process_type": "order-delivery",
            "metric_name": "revenue",
            "analysis_type": "path-outcome",
            "created_at": "2025-10-05T00:00:00",
            "result_data": {
                "nodes": [],
                "edges": [],
                "summary": {},
            },
        }

        # Execute
        response = client.get("/outcome/analyses/test-id-1")

        # Verify
        assert response.status_code == 200
        data = response.json()
        assert data["analysis_id"] == "test-id-1"
        assert "result_data" in data

    @patch("src.services.outcome_service.get_outcome_analysis_by_id")
    def test_get_analysis_by_id_not_found(self, mock_get_analysis):
        """Test getting non-existent analysis"""
        # Mock service response
        mock_get_analysis.return_value = None

        # Execute
        response = client.get("/outcome/analyses/non-existent-id")

        # Verify
        assert response.status_code == 404


class TestCreateOutcomeAnalysisEndpoint:
    """Tests for POST /outcome/analyze endpoint"""

    @patch("src.services.outcome_service.create_outcome_analysis")
    def test_create_analysis_success(self, mock_create):
        """Test creating analysis successfully"""
        # Mock service response
        mock_create.return_value = "new-analysis-id"

        # Execute
        response = client.post(
            "/outcome/analyze",
            json={
                "analysis_name": "New Analysis",
                "process_type": "order-delivery",
                "metric_name": "revenue",
                "analysis_type": "path-outcome",
            },
        )

        # Verify
        assert response.status_code == 200
        data = response.json()
        assert data["analysis_id"] == "new-analysis-id"
        mock_create.assert_called_once()

    @patch("src.services.outcome_service.create_outcome_analysis")
    def test_create_analysis_with_filters(self, mock_create):
        """Test creating analysis with date filters"""
        # Mock service response
        mock_create.return_value = "new-analysis-id"

        # Execute
        response = client.post(
            "/outcome/analyze",
            json={
                "analysis_name": "Filtered Analysis",
                "process_type": "order-delivery",
                "metric_name": "revenue",
                "analysis_type": "path-outcome",
                "date_from": "2025-01-01",
                "date_to": "2025-01-31",
            },
        )

        # Verify
        assert response.status_code == 200
        mock_create.assert_called_once()

    def test_create_analysis_missing_required_fields(self):
        """Test creating analysis with missing required fields"""
        # Execute with missing metric_name
        response = client.post(
            "/outcome/analyze",
            json={
                "analysis_name": "Invalid Analysis",
                "process_type": "order-delivery",
            },
        )

        # Verify
        assert response.status_code == 422  # Validation error


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
