/**
 * Segment comparison view for outcome analysis
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
} from "@mui/material";
import { OutcomeAnalysisDetail } from "../../types/outcome";
import OutcomeProcessMap from "./OutcomeProcessMap";
import { formatMetricValue } from "../../utils/formatMetricValue";

interface SegmentComparisonProps {
  analysis: OutcomeAnalysisDetail;
}

const SegmentComparison: React.FC<SegmentComparisonProps> = ({ analysis }) => {
  const navigate = useNavigate();
  const { high_segment, low_segment, differences, summary } =
    analysis.result_data;
  const metricName = analysis.metric_name;

  // Check for required data
  if (!high_segment || !low_segment) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography color="error">セグメントデータが見つかりません</Typography>
      </Container>
    );
  }

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
            {analysis.analysis_name}
          </Typography>

          <Stack direction="row" spacing={2} color="text.secondary">
            <Typography variant="body2">
              プロセス: {analysis.process_type}
            </Typography>
            <Typography variant="body2">メトリック: {metricName}</Typography>
            <Typography variant="body2">分析タイプ: セグメント比較</Typography>
            <Typography variant="body2">
              作成日時: {new Date(analysis.created_at).toLocaleString("ja-JP")}
            </Typography>
          </Stack>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2} color="success.main">
                  {high_segment.label}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      ケース数
                    </Typography>
                    <Typography variant="h6">
                      {high_segment.case_count.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      平均値
                    </Typography>
                    <Typography variant="h6">
                      {formatMetricValue(
                        high_segment.outcome_stats.avg,
                        metricName,
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      中央値
                    </Typography>
                    <Typography variant="h6">
                      {formatMetricValue(
                        high_segment.outcome_stats.median,
                        metricName,
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      合計値
                    </Typography>
                    <Typography variant="h6">
                      {formatMetricValue(
                        high_segment.outcome_stats.total,
                        metricName,
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      最小値
                    </Typography>
                    <Typography variant="h6">
                      {formatMetricValue(
                        high_segment.outcome_stats.min,
                        metricName,
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      最大値
                    </Typography>
                    <Typography variant="h6">
                      {formatMetricValue(
                        high_segment.outcome_stats.max,
                        metricName,
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2} color="text.secondary">
                  {low_segment.label}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      ケース数
                    </Typography>
                    <Typography variant="h6">
                      {low_segment.case_count.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      平均値
                    </Typography>
                    <Typography variant="h6">
                      {formatMetricValue(
                        low_segment.outcome_stats.avg,
                        metricName,
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      中央値
                    </Typography>
                    <Typography variant="h6">
                      {formatMetricValue(
                        low_segment.outcome_stats.median,
                        metricName,
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      合計値
                    </Typography>
                    <Typography variant="h6">
                      {formatMetricValue(
                        low_segment.outcome_stats.total,
                        metricName,
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      最小値
                    </Typography>
                    <Typography variant="h6">
                      {formatMetricValue(
                        low_segment.outcome_stats.min,
                        metricName,
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={4}>
                    <Typography variant="caption" color="text.secondary">
                      最大値
                    </Typography>
                    <Typography variant="h6">
                      {formatMetricValue(
                        low_segment.outcome_stats.max,
                        metricName,
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Box>
              <Typography variant="h6" mb={2} color="success.main">
                {high_segment.label} のプロセス
              </Typography>
              <Box
                height="600px"
                border={1}
                borderColor="grey.300"
                borderRadius={1}
              >
                <OutcomeProcessMap
                  analysis={{
                    ...analysis,
                    result_data: {
                      nodes: high_segment.nodes,
                      edges: high_segment.edges,
                      summary: {
                        total_cases: high_segment.case_count,
                        overall_stats: high_segment.outcome_stats,
                        top_paths: [],
                      },
                    },
                  }}
                  displayMode="avg"
                  onDisplayModeChange={() => {}}
                  showControls={false}
                  highlightDifferences={differences}
                />
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Box>
              <Typography variant="h6" mb={2} color="text.secondary">
                {low_segment.label} のプロセス
              </Typography>
              <Box
                height="600px"
                border={1}
                borderColor="grey.300"
                borderRadius={1}
              >
                <OutcomeProcessMap
                  analysis={{
                    ...analysis,
                    result_data: {
                      nodes: low_segment.nodes,
                      edges: low_segment.edges,
                      summary: {
                        total_cases: low_segment.case_count,
                        overall_stats: low_segment.outcome_stats,
                        top_paths: [],
                      },
                    },
                  }}
                  displayMode="avg"
                  onDisplayModeChange={() => {}}
                  showControls={false}
                  highlightDifferences={differences}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>

        {differences && differences.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                主要な差分（パス出現率の差が10%以上）
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>パス</TableCell>
                      <TableCell align="right">高成果群</TableCell>
                      <TableCell align="right">低成果群</TableCell>
                      <TableCell align="right">差分</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {differences.map((diff, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {diff.source} → {diff.target}
                        </TableCell>
                        <TableCell align="right">{diff.high_rate}%</TableCell>
                        <TableCell align="right">{diff.low_rate}%</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            fontWeight: "bold",
                            color:
                              diff.diff_rate > 0
                                ? "success.main"
                                : "error.main",
                          }}
                        >
                          {diff.diff_rate > 0 ? "+" : ""}
                          {diff.diff_rate}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              サマリー
            </Typography>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1}>
                <Typography fontWeight="bold">総ケース数:</Typography>
                <Typography>{summary.total_cases.toLocaleString()}</Typography>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Typography fontWeight="bold">セグメント条件:</Typography>
                <Typography>{summary.segment_mode}</Typography>
              </Stack>
              {summary.threshold_value !== undefined && (
                <Stack direction="row" spacing={1}>
                  <Typography fontWeight="bold">閾値:</Typography>
                  <Typography>
                    {formatMetricValue(summary.threshold_value, metricName)}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default SegmentComparison;
