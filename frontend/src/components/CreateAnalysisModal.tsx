import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Radio,
  RadioGroup,
  FormControlLabel,
  Stack,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import AssessmentIcon from "@mui/icons-material/Assessment";
import StarIcon from "@mui/icons-material/Star";
import {
  createAnalysis,
  getAnalysisPreview,
  getProcessTypes,
  getLeadTimeStats,
} from "../api/client";
import { FilterMode, PreviewResponse, LeadTimeStats } from "../types";
import { useSnackbar } from "../hooks/useSnackbar";

interface CreateAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (analysisId: string) => void;
}

const CreateAnalysisModal: React.FC<CreateAnalysisModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [processTypes, setProcessTypes] = useState<string[]>([]);
  const [processType, setProcessType] = useState<string>("");
  const [analysisName, setAnalysisName] = useState<string>("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [leadTimeStats, setLeadTimeStats] = useState<LeadTimeStats | null>(
    null,
  );
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalysisNameManuallySet, setIsAnalysisNameManuallySet] =
    useState(false);
  const { showSnackbar } = useSnackbar();

  // プロセスタイプ一覧を取得
  useEffect(() => {
    const fetchProcessTypes = async () => {
      try {
        const types = await getProcessTypes();
        setProcessTypes(types);
        if (types.length > 0) {
          setProcessType(types[0]);
        }
      } catch (error) {
        console.error("Failed to fetch process types", error);
      }
    };

    if (isOpen) {
      fetchProcessTypes();
    }
  }, [isOpen]);

  // プロセスタイプ変更時に分析名を自動生成（手動入力されていない場合のみ）
  useEffect(() => {
    if (processType && !isAnalysisNameManuallySet) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      setAnalysisName(`${processType}_${dateStr}`);
    }
  }, [processType, isAnalysisNameManuallySet]);

  // プレビュー取得（デバウンス）
  useEffect(() => {
    if (!processType) return;

    const timer = setTimeout(async () => {
      try {
        setIsLoadingPreview(true);
        const [previewData, statsData] = await Promise.all([
          getAnalysisPreview(
            processType,
            filterMode,
            dateFrom || undefined,
            dateTo || undefined,
          ),
          getLeadTimeStats(
            processType,
            filterMode,
            dateFrom || undefined,
            dateTo || undefined,
          ),
        ]);
        setPreview(previewData);
        setLeadTimeStats(statsData);
      } catch (error) {
        console.error("Failed to fetch preview", error);
      } finally {
        setIsLoadingPreview(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [processType, filterMode, dateFrom, dateTo]);

  const handleSubmit = async () => {
    if (!analysisName || !processType) {
      showSnackbar("分析名とプロセスタイプを入力してください", "error");
      return;
    }

    if (filterMode !== "all" && (!dateFrom || !dateTo)) {
      showSnackbar("日付範囲を指定してください", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await createAnalysis({
        analysis_name: analysisName,
        process_type: processType,
        filter_mode: filterMode,
        date_from: filterMode !== "all" ? dateFrom : undefined,
        date_to: filterMode !== "all" ? dateTo : undefined,
      });

      showSnackbar(
        `分析を作成しました: ${result.event_count}件のイベント、${result.case_count}件のケース`,
        "success",
      );

      onSuccess(result.analysis_id);
      onClose();
    } catch (error: any) {
      showSnackbar(
        error.response?.data?.detail || "分析の実行に失敗しました",
        "error",
        5000,
      );
    } finally {
      setIsSubmitting(false);
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
      <DialogTitle>新規分析を作成</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            required
            label="分析名"
            value={analysisName}
            onChange={(e) => {
              setAnalysisName(e.target.value);
              setIsAnalysisNameManuallySet(true);
            }}
            placeholder="例: 受注から配送_2025-10"
            fullWidth
          />

          <FormControl required fullWidth>
            <FormLabel>プロセスタイプ</FormLabel>
            <Select
              id="process-type-select"
              value={processType}
              onChange={(e) => setProcessType(e.target.value)}
              SelectDisplayProps={{
                "data-testid": "process-type-select-trigger",
              }}
            >
              {processTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>分析対象期間の基準</FormLabel>
            <RadioGroup
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as FilterMode)}
            >
              <FormControlLabel
                value="all"
                control={<Radio />}
                label="すべての期間を含める"
              />
              <FormControlLabel
                value="case_start"
                control={<Radio />}
                label="ケース開始日で絞り込む（推奨）"
              />
              <FormControlLabel
                value="case_end"
                control={<Radio />}
                label="ケース完了日で絞り込む"
              />
            </RadioGroup>
          </FormControl>

          {filterMode !== "all" && (
            <FormControl fullWidth>
              <FormLabel>対象期間</FormLabel>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  fullWidth
                />
                <Typography>〜</Typography>
                <TextField
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
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
                  期間外のイベントもケースに含まれる場合があります。
                </Typography>
              </Stack>
            </FormControl>
          )}

          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              p: 2,
              bgcolor: "grey.50",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <AssessmentIcon fontSize="small" />
              <Typography fontWeight="bold">プレビュー</Typography>
            </Stack>
            {isLoadingPreview ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={20} />
                <Typography variant="body2">読み込み中...</Typography>
              </Stack>
            ) : preview ? (
              <Stack spacing={0.5}>
                <Typography variant="body2">
                  対象ケース数: {preview.case_count}件
                </Typography>
                <Typography variant="body2">
                  対象イベント数: {preview.event_count}件
                </Typography>
                {leadTimeStats &&
                  leadTimeStats.lead_time_hours.median !== null && (
                    <>
                      <Typography fontWeight="bold" variant="body2" mt={1}>
                        リードタイム（開始〜終了）:
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        最小: {leadTimeStats.lead_time_hours.min?.toFixed(1)}
                        時間
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        中央値:{" "}
                        {leadTimeStats.lead_time_hours.median?.toFixed(1)}時間
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 2 }}>
                        最大: {leadTimeStats.lead_time_hours.max?.toFixed(1)}
                        時間
                      </Typography>
                      {leadTimeStats.happy_path &&
                        leadTimeStats.happy_path.case_count > 0 && (
                          <>
                            <Stack
                              direction="row"
                              spacing={0.5}
                              alignItems="center"
                              mt={1}
                            >
                              <StarIcon fontSize="small" />
                              <Typography fontWeight="bold" variant="body2">
                                ハッピーパス:
                              </Typography>
                            </Stack>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ ml: 2 }}
                            >
                              {leadTimeStats.happy_path.path.join(" → ")}
                            </Typography>
                            <Typography variant="body2" sx={{ ml: 2 }}>
                              {leadTimeStats.happy_path.case_count}件のケース
                            </Typography>
                            <Typography variant="body2" sx={{ ml: 2 }}>
                              中央値:{" "}
                              {leadTimeStats.happy_path.lead_time_hours.median?.toFixed(
                                1,
                              )}
                              時間
                            </Typography>
                          </>
                        )}
                    </>
                  )}
                {filterMode !== "all" && (
                  <>
                    <Typography variant="body2" mt={1}>
                      ケース{filterMode === "case_start" ? "開始" : "完了"}
                      期間: {dateFrom} 〜 {dateTo}
                    </Typography>
                    {preview.date_range.min && preview.date_range.max && (
                      <Typography variant="body2">
                        実際のイベント期間:{" "}
                        {new Date(preview.date_range.min).toLocaleDateString(
                          "ja-JP",
                        )}{" "}
                        〜{" "}
                        {new Date(preview.date_range.max).toLocaleDateString(
                          "ja-JP",
                        )}
                      </Typography>
                    )}
                  </>
                )}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                プレビュー情報を取得中...
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          キャンセル
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : "分析を実行"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateAnalysisModal;
