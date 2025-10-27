/**
 * Create outcome analysis modal
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  TextField,
  Select,
  MenuItem,
  Stack,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import { useOutcomeStore } from "../../stores/outcomeStore";
import { fetchProcessTypes } from "../../api/outcomeApi";
import { useSnackbar } from "../../hooks/useSnackbar";

interface CreateOutcomeAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateOutcomeAnalysisModal: React.FC<CreateOutcomeAnalysisModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { availableMetrics, fetchMetrics, createAnalysis, loading } =
    useOutcomeStore();

  const [processTypes, setProcessTypes] = useState<string[]>([]);
  const [analysisName, setAnalysisName] = useState("");
  const [processType, setProcessType] = useState("");
  const [metricName, setMetricName] = useState("");
  const [analysisType, setAnalysisType] = useState<
    "path-outcome" | "segment-comparison"
  >("path-outcome");
  const [segmentMode, setSegmentMode] = useState<
    "top25" | "bottom25" | "threshold"
  >("top25");
  const [threshold, setThreshold] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<
    "all" | "start_date" | "end_date"
  >("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [isAnalysisNameManuallySet, setIsAnalysisNameManuallySet] =
    useState(false);

  // プロセスタイプ一覧を取得
  useEffect(() => {
    const loadProcessTypes = async () => {
      try {
        const types = await fetchProcessTypes();
        setProcessTypes(types);
        if (types.length > 0 && !processType) {
          setProcessType(types[0]);
        }
      } catch (error) {
        console.error("Failed to fetch process types", error);
      }
    };

    if (isOpen) {
      loadProcessTypes();
    }
  }, [isOpen]);

  // プロセスタイプが変更されたらメトリックをフェッチ
  useEffect(() => {
    if (isOpen && processType) {
      fetchMetrics(processType);
    }
  }, [isOpen, processType, fetchMetrics]);

  // メトリック一覧が更新されたら最初のメトリックを選択
  useEffect(() => {
    if (availableMetrics.length > 0) {
      setMetricName(availableMetrics[0].metric_name);
    } else {
      setMetricName("");
    }
  }, [availableMetrics]);

  // 分析名のデフォルト値を生成（手動入力されていない場合のみ）
  useEffect(() => {
    if (
      processType &&
      metricName &&
      analysisType &&
      !isAnalysisNameManuallySet
    ) {
      const today = new Date().toISOString().split("T")[0];
      const typeLabel =
        analysisType === "path-outcome" ? "パス別成果" : "セグメント比較";
      setAnalysisName(`${processType}_${metricName}_${typeLabel}_${today}`);
    }
  }, [processType, metricName, analysisType, isAnalysisNameManuallySet]);

  const handleProcessTypeChange = (newProcessType: string) => {
    setProcessType(newProcessType);
  };

  const handleSubmit = async () => {
    if (!analysisName || !processType || !metricName) {
      showSnackbar("すべての項目を入力してください", "error");
      return;
    }

    if (
      analysisType === "segment-comparison" &&
      segmentMode === "threshold" &&
      threshold === 0
    ) {
      showSnackbar("閾値を設定してください", "error");
      return;
    }

    if (
      (filterMode === "start_date" || filterMode === "end_date") &&
      (!dateFrom || !dateTo)
    ) {
      showSnackbar("日付範囲を指定してください", "error");
      return;
    }

    try {
      const filterConfig: Record<string, unknown> = {};

      if (analysisType === "segment-comparison") {
        filterConfig.segment_mode = segmentMode;
        if (segmentMode === "threshold") {
          filterConfig.threshold = threshold;
        }
      }

      const analysisId = await createAnalysis({
        analysis_name: analysisName,
        process_type: processType,
        metric_name: metricName,
        analysis_type: analysisType,
        filter_config:
          Object.keys(filterConfig).length > 0 ? filterConfig : undefined,
        date_from:
          filterMode === "start_date" || filterMode === "end_date"
            ? dateFrom
            : undefined,
        date_to:
          filterMode === "start_date" || filterMode === "end_date"
            ? dateTo
            : undefined,
      });

      showSnackbar("成果分析を作成しました", "success");

      onClose();
      navigate(`/outcome/${analysisId}`);
    } catch (error) {
      showSnackbar(
        error instanceof Error ? error.message : "成果分析の作成に失敗しました",
        "error",
        5000,
      );
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableEnforceFocus
      disableAutoFocus
      disableRestoreFocus
    >
      <DialogTitle>
        新規成果分析作成
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl required>
            <FormLabel>分析名</FormLabel>
            <TextField
              fullWidth
              value={analysisName}
              onChange={(e) => {
                setAnalysisName(e.target.value);
                setIsAnalysisNameManuallySet(true);
              }}
              placeholder="例: 受注金額分析_2025-10"
              size="small"
            />
          </FormControl>

          <FormControl required>
            <FormLabel>プロセスタイプ</FormLabel>
            <Select
              id="process-type-select"
              fullWidth
              value={processType}
              onChange={(e) => handleProcessTypeChange(e.target.value)}
              size="small"
              SelectDisplayProps={
                {
                  "data-testid": "process-type-select-trigger",
                } as any
              }
            >
              {processTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl required>
            <FormLabel>メトリック</FormLabel>
            <Select
              id="metric-select"
              fullWidth
              value={metricName}
              onChange={(e) => setMetricName(e.target.value)}
              disabled={availableMetrics.length === 0}
              size="small"
              SelectDisplayProps={
                {
                  "data-testid": "metric-select-trigger",
                } as any
              }
            >
              {availableMetrics.map((metric) => (
                <MenuItem key={metric.metric_name} value={metric.metric_name}>
                  {metric.metric_name} ({metric.metric_unit})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl required>
            <FormLabel>分析タイプ</FormLabel>
            <Select
              id="analysis-type-select"
              fullWidth
              value={analysisType}
              onChange={(e) =>
                setAnalysisType(
                  e.target.value as "path-outcome" | "segment-comparison",
                )
              }
              size="small"
              SelectDisplayProps={
                {
                  "data-testid": "analysis-type-select-trigger",
                } as any
              }
            >
              <MenuItem value="path-outcome">パス別成果分析</MenuItem>
              <MenuItem value="segment-comparison">セグメント比較分析</MenuItem>
            </Select>
          </FormControl>

          {analysisType === "segment-comparison" && (
            <>
              <FormControl required>
                <FormLabel>セグメント条件</FormLabel>
                <Select
                  fullWidth
                  value={segmentMode}
                  onChange={(e) =>
                    setSegmentMode(
                      e.target.value as "top25" | "bottom25" | "threshold",
                    )
                  }
                  size="small"
                >
                  <MenuItem value="top25">上位25%</MenuItem>
                  <MenuItem value="bottom25">下位25%</MenuItem>
                  <MenuItem value="threshold">閾値指定</MenuItem>
                </Select>
              </FormControl>

              {segmentMode === "threshold" && (
                <FormControl required>
                  <FormLabel>閾値</FormLabel>
                  <TextField
                    fullWidth
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    placeholder="例: 1000000"
                    size="small"
                  />
                </FormControl>
              )}
            </>
          )}

          <FormControl>
            <FormLabel>分析対象期間の基準</FormLabel>
            <RadioGroup
              value={filterMode}
              onChange={(e) =>
                setFilterMode(
                  e.target.value as "all" | "start_date" | "end_date",
                )
              }
            >
              <Stack>
                <FormControlLabel
                  value="all"
                  control={<Radio />}
                  label="すべての期間を含める"
                />
                <FormControlLabel
                  value="start_date"
                  control={<Radio />}
                  label="ケース開始日で絞り込む（推奨）"
                />
                <FormControlLabel
                  value="end_date"
                  control={<Radio />}
                  label="ケース完了日で絞り込む"
                />
              </Stack>
            </RadioGroup>
          </FormControl>

          {(filterMode === "start_date" || filterMode === "end_date") && (
            <FormControl>
              <FormLabel>対象期間</FormLabel>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  size="small"
                  fullWidth
                />
                <Typography>〜</Typography>
                <TextField
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  size="small"
                  fullWidth
                />
              </Stack>
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="center"
                sx={{ mt: 1 }}
              >
                <InfoIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  指定期間のイベントのみを対象に分析します
                </Typography>
              </Stack>
            </FormControl>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          作成
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOutcomeAnalysisModal;
