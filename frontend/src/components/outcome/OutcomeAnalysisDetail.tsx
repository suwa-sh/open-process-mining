/**
 * Outcome analysis detail page
 */

import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import { useOutcomeStore } from "../../stores/outcomeStore";
import OutcomeProcessMap from "./OutcomeProcessMap";
import SegmentComparison from "./SegmentComparison";
import { formatMetricValue } from "../../utils/formatMetricValue";

const OutcomeAnalysisDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentAnalysis,
    displayMode,
    loading,
    error,
    fetchAnalysisById,
    setDisplayMode,
  } = useOutcomeStore();

  useEffect(() => {
    if (id) {
      fetchAnalysisById(id);
    }
  }, [id, fetchAnalysisById]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!currentAnalysis) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>分析結果が見つかりません</Typography>
      </Container>
    );
  }

  // セグメント比較分析の場合は専用コンポーネントを表示
  if (currentAnalysis.analysis_type === "segment-comparison") {
    return <SegmentComparison analysis={currentAnalysis} />;
  }

  const metricName = currentAnalysis.metric_name;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box>
          <Button
            variant="outlined"
            color="success"
            onClick={() => navigate("/outcome")}
            sx={{ mb: 2 }}
          >
            ← 成果分析一覧に戻る
          </Button>

          <Typography variant="h4" mb={1}>
            {currentAnalysis.analysis_name}
          </Typography>

          <Stack direction="row" spacing={2} color="text.secondary">
            <Typography variant="body2">
              プロセス: {currentAnalysis.process_type}
            </Typography>
            <Typography variant="body2">メトリック: {metricName}</Typography>
            <Typography variant="body2">
              作成日時:{" "}
              {new Date(currentAnalysis.created_at).toLocaleString("ja-JP")}
            </Typography>
          </Stack>
        </Box>

        <Stack spacing={2} height="calc(100vh - 280px)">
          <Alert severity="success">
            💡 <strong>成果分析:</strong>{" "}
            各パスでの成果メトリックを可視化します。緑色のパスは高成果、赤色のパスは低成果を示します。
          </Alert>
          <Box flex={1}>
            <OutcomeProcessMap
              analysis={currentAnalysis}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
            />
          </Box>
        </Stack>

        {currentAnalysis.result_data.summary.top_paths &&
          currentAnalysis.result_data.summary.top_paths.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  高成果パス（平均値が全体平均の1.2倍以上）
                </Typography>
                <Stack spacing={1}>
                  {currentAnalysis.result_data.summary.top_paths.map(
                    (path, index) => (
                      <Box
                        key={index}
                        p={1.5}
                        bgcolor="success.50"
                        borderRadius={1}
                        borderLeft={4}
                        borderColor="success.main"
                      >
                        <Stack direction="row" justifyContent="space-between">
                          <Typography>
                            {path.source} → {path.target}
                          </Typography>
                          <Typography fontWeight="bold" color="success.dark">
                            {formatMetricValue(path.avg_outcome, metricName)}
                          </Typography>
                        </Stack>
                      </Box>
                    ),
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}
      </Stack>
    </Container>
  );
};

export default OutcomeAnalysisDetail;
