import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  Select,
  MenuItem,
  FormControl,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Alert,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TimerIcon from "@mui/icons-material/Timer";
import {
  getOrganizationAnalysisById,
  getHandoverAnalysis,
  getWorkloadAnalysis,
  getPerformanceAnalysis,
} from "../api/client";
import {
  HandoverAnalysis as HandoverAnalysisType,
  WorkloadAnalysis as WorkloadAnalysisType,
  PerformanceAnalysis as PerformanceAnalysisType,
  AggregationLevel,
  OrganizationAnalysisDetail as OrganizationAnalysisDetailType,
} from "../types";
import HandoverNetwork from "./HandoverNetwork";
import WorkloadChart from "./WorkloadChart";
import PerformanceChart from "./PerformanceChart";
import { useSnackbar } from "../hooks/useSnackbar";

interface OrganizationAnalysisDetailProps {
  analysisId: string;
  onBack: () => void;
}

const OrganizationAnalysisDetail: React.FC<OrganizationAnalysisDetailProps> = ({
  analysisId,
  onBack,
}) => {
  const { showSnackbar } = useSnackbar();
  const [tabValue, setTabValue] = useState(0);

  const [analysis, setAnalysis] =
    useState<OrganizationAnalysisDetailType | null>(null);
  const [aggregationLevel, setAggregationLevel] =
    useState<AggregationLevel>("employee");
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [handoverData, setHandoverData] = useState<HandoverAnalysisType | null>(
    null,
  );
  const [workloadData, setWorkloadData] = useState<WorkloadAnalysisType | null>(
    null,
  );
  const [performanceData, setPerformanceData] =
    useState<PerformanceAnalysisType | null>(null);

  // Load saved analysis on mount
  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        setLoading(true);
        const data = await getOrganizationAnalysisById(analysisId);
        setAnalysis(data);
        setAggregationLevel(data.aggregation_level);
        setHandoverData(data.handover_data);
        setWorkloadData(data.workload_data);
        setPerformanceData(data.performance_data);
        setIsInitialLoad(false);
      } catch (error) {
        showSnackbar("組織分析データの取得に失敗しました", "error", 3000);
      } finally {
        setLoading(false);
      }
    };
    loadAnalysis();
  }, [analysisId, showSnackbar]);

  // Reload analyses when aggregation level changes (after initial load)
  useEffect(() => {
    if (!isInitialLoad && analysis) {
      const loadData = async () => {
        setLoading(true);
        try {
          const [handover, workload, performance] = await Promise.all([
            getHandoverAnalysis(
              analysis.process_type,
              aggregationLevel,
              analysis.filter_mode,
              analysis.date_from || undefined,
              analysis.date_to || undefined,
            ),
            getWorkloadAnalysis(
              analysis.process_type,
              aggregationLevel,
              analysis.filter_mode,
              analysis.date_from || undefined,
              analysis.date_to || undefined,
            ),
            getPerformanceAnalysis(
              analysis.process_type,
              aggregationLevel,
              analysis.filter_mode,
              analysis.date_from || undefined,
              analysis.date_to || undefined,
            ),
          ]);

          setHandoverData(handover);
          setWorkloadData(workload);
          setPerformanceData(performance);
        } catch (error) {
          showSnackbar("組織分析の取得に失敗しました", "error", 3000);
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [aggregationLevel, isInitialLoad, analysis, showSnackbar]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={60} sx={{ color: "secondary.main" }} />
          <Typography>組織分析データを読み込んでいます...</Typography>
        </Stack>
      </Box>
    );
  }

  if (!analysis) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Stack spacing={2} alignItems="center">
          <Typography color="error">分析データが見つかりません</Typography>
          <Button onClick={onBack} variant="contained" color="secondary">
            組織分析一覧に戻る
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h4">{analysis.analysis_name}</Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={analysis.process_type}
                color="secondary"
                size="small"
              />
              <Chip
                icon={
                  analysis.aggregation_level === "employee" ? (
                    <PersonIcon />
                  ) : (
                    <BusinessIcon />
                  )
                }
                label={
                  analysis.aggregation_level === "employee"
                    ? "社員別"
                    : "部署別"
                }
                color="info"
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                作成: {new Date(analysis.created_at).toLocaleString("ja-JP")}
              </Typography>
            </Stack>
          </Stack>
          <Button onClick={onBack} variant="outlined" color="secondary">
            ← 組織分析一覧に戻る
          </Button>
        </Stack>

        {/* Controls */}
        <Box
          p={2}
          border={1}
          borderColor="grey.300"
          borderRadius={1}
          bgcolor="secondary.50"
        >
          <Stack direction="row" spacing={2}>
            <Box flex={1}>
              <Typography
                mb={1}
                fontWeight="600"
                variant="body2"
                color="text.primary"
              >
                プロセスタイプ（固定）
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {analysis.process_type}
              </Typography>
            </Box>

            <Box flex={1}>
              <Typography
                mb={1}
                fontWeight="600"
                variant="body2"
                color="text.primary"
              >
                集計レベル
              </Typography>
              <FormControl fullWidth>
                <Select
                  id="aggregation-level-select"
                  value={aggregationLevel}
                  onChange={(e) =>
                    setAggregationLevel(e.target.value as AggregationLevel)
                  }
                  SelectDisplayProps={{
                    "data-testid": "aggregation-level-select-trigger",
                  }}
                >
                  <MenuItem value="employee">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonIcon fontSize="small" />
                      <span>社員別</span>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="department">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BusinessIcon fontSize="small" />
                      <span>部署別</span>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </Box>

        {/* Analysis Tabs */}
        {!loading && handoverData && workloadData && performanceData && (
          <Box>
            <Tabs
              value={tabValue}
              onChange={(_e, newValue) => setTabValue(newValue)}
            >
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SyncAltIcon fontSize="medium" />
                    <span>ハンドオーバー分析</span>
                    <Chip
                      label={`${handoverData.nodes.length} ノード`}
                      color="primary"
                      size="small"
                    />
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AssessmentIcon fontSize="medium" />
                    <span>作業負荷分析</span>
                    <Chip
                      label={`${workloadData.workload.length} 担当者`}
                      color="success"
                      size="small"
                    />
                  </Stack>
                }
              />
              <Tab
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TimerIcon fontSize="medium" />
                    <span>パフォーマンス分析</span>
                    <Chip
                      label={`${performanceData.performance.length} 担当者`}
                      color="secondary"
                      size="small"
                    />
                  </Stack>
                }
              />
            </Tabs>

            {tabValue === 0 && (
              <Stack spacing={2} height="calc(100vh - 280px)">
                <Alert severity="info">
                  💡 <strong>ハンドオーバー分析:</strong>{" "}
                  誰と誰が連携して作業しているかを可視化します。矢印は作業の引き継ぎ（ハンドオーバー）を表します。
                </Alert>
                <Box flex={1}>
                  <HandoverNetwork data={handoverData} />
                </Box>
              </Stack>
            )}

            {tabValue === 1 && (
              <Stack spacing={2}>
                <Alert severity="success">
                  💡 <strong>作業負荷分析:</strong>{" "}
                  誰の作業量が多いかを可視化します。上位の担当者は作業が集中している可能性があります。
                </Alert>
                <WorkloadChart data={workloadData} />
              </Stack>
            )}

            {tabValue === 2 && (
              <Stack spacing={2}>
                <Alert severity="warning">
                  💡 <strong>パフォーマンス分析:</strong>{" "}
                  誰の処理時間が長いかを可視化します。上位の担当者はボトルネックになっている可能性があります。
                </Alert>
                <PerformanceChart data={performanceData} />
              </Stack>
            )}
          </Box>
        )}
      </Stack>
    </Container>
  );
};

export default OrganizationAnalysisDetail;
