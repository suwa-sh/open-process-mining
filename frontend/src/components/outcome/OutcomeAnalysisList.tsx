/**
 * Outcome analysis list page
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  Stack,
  CircularProgress,
  Chip,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import BusinessIcon from "@mui/icons-material/Business";
import { useOutcomeStore } from "../../stores/outcomeStore";
import { getProcessTypes } from "../../api/client";
import CreateOutcomeAnalysisModal from "./CreateOutcomeAnalysisModal";

const OutcomeAnalysisList: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const [processTypeFilter, setProcessTypeFilter] = useState<string>("");
  const [metricNameFilter, setMetricNameFilter] = useState<string>("");
  const [processTypes, setProcessTypes] = useState<string[]>([]);
  const [metricNames, setMetricNames] = useState<string[]>([]);

  const { analyses, loading, error, fetchAnalyses } = useOutcomeStore();

  useEffect(() => {
    const fetchProcessTypes = async () => {
      try {
        const types = await getProcessTypes();
        setProcessTypes(types);
      } catch (error) {
        console.error("Failed to fetch process types", error);
      }
    };

    fetchProcessTypes();
  }, []);

  useEffect(() => {
    fetchAnalyses(
      processTypeFilter || undefined,
      metricNameFilter || undefined,
    );
  }, [processTypeFilter, metricNameFilter, fetchAnalyses]);

  useEffect(() => {
    // 分析一覧から利用可能なメトリック名を抽出
    const uniqueMetrics = Array.from(
      new Set(analyses.map((a) => a.metric_name)),
    );
    setMetricNames(uniqueMetrics);
  }, [analyses]);

  const handleRowClick = (analysisId: string) => {
    navigate(`/outcome/${analysisId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ja-JP");
  };

  return (
    <Box p={4} maxWidth="800px" mx="auto">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">成果分析</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate("/")}
            startIcon={<TrendingUpIcon />}
          >
            プロセス分析
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate("/organization")}
            startIcon={<BusinessIcon />}
          >
            組織分析
          </Button>
          <Button variant="contained" color="success" onClick={onOpen}>
            + 新規分析を作成
          </Button>
        </Stack>
      </Stack>

      <Box mb={3}>
        <FormLabel>フィルター:</FormLabel>
        <Stack direction="row" spacing={2}>
          <FormControl fullWidth>
            <Select
              value={processTypeFilter}
              onChange={(e) => setProcessTypeFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">すべてのプロセスタイプ</MenuItem>
              {processTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <Select
              value={metricNameFilter}
              onChange={(e) => setMetricNameFilter(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">すべてのメトリック</MenuItem>
              {metricNames.map((metric) => (
                <MenuItem key={metric} value={metric}>
                  {metric}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={60} sx={{ color: "success.main" }} />
            <Typography>成果分析データを読み込んでいます...</Typography>
          </Stack>
        </Box>
      ) : error ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Stack spacing={1.5} alignItems="center">
            <Typography variant="body1" color="text.secondary">
              成果分析が見つかりません
            </Typography>
            <Typography variant="body2" color="text.disabled">
              「新規分析を作成」ボタンから最初の分析を作成してください。
            </Typography>
          </Stack>
        </Box>
      ) : analyses.length === 0 ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Stack spacing={1.5} alignItems="center">
            <Typography variant="body1" color="text.secondary">
              成果分析が見つかりません
            </Typography>
            <Typography variant="body2" color="text.disabled">
              「新規分析を作成」ボタンから最初の分析を作成してください。
            </Typography>
          </Stack>
        </Box>
      ) : (
        <List>
          {analyses.map((analysis) => (
            <ListItem
              key={analysis.analysis_id}
              sx={{
                p: 2,
                mb: 1.5,
                border: 1,
                borderColor: "grey.300",
                borderRadius: 1,
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "success.50",
                  borderColor: "success.main",
                  transform: "translateY(-2px)",
                },
              }}
              onClick={() => handleRowClick(analysis.analysis_id)}
            >
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="h6" fontWeight="bold">
                      {analysis.analysis_name}
                    </Typography>
                    <Chip
                      label={analysis.process_type}
                      color="success"
                      size="small"
                    />
                    <Chip
                      label={analysis.metric_name}
                      color="warning"
                      size="small"
                    />
                    <Chip
                      label={
                        analysis.analysis_type === "path-outcome"
                          ? "パス別成果"
                          : "セグメント比較"
                      }
                      color="info"
                      size="small"
                    />
                  </Stack>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    作成日時: {formatDate(analysis.created_at)}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      <CreateOutcomeAnalysisModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};

export default OutcomeAnalysisList;
