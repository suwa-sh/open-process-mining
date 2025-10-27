import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  Stack,
  Box,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoIcon from "@mui/icons-material/Info";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { createOrganizationAnalysis, getProcessTypes } from "../api/client";
import { FilterMode } from "../types";
import { useSnackbar } from "../hooks/useSnackbar";

interface CreateOrganizationAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (analysisId: string) => void;
}

const CreateOrganizationAnalysisModal: React.FC<
  CreateOrganizationAnalysisModalProps
> = ({ isOpen, onClose, onSuccess }) => {
  const [processTypes, setProcessTypes] = useState<string[]>([]);
  const [processType, setProcessType] = useState<string>("");
  const [analysisName, setAnalysisName] = useState<string>("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
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
      const today = new Date().toISOString().split("T")[0];
      setAnalysisName(`${processType}_${today}`);
    }
  }, [processType, isAnalysisNameManuallySet]);

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
      const result = await createOrganizationAnalysis({
        analysis_name: analysisName,
        process_type: processType,
        aggregation_level: "employee", // デフォルトは社員別（詳細画面で切り替え可能）
        filter_mode: filterMode,
        date_from: filterMode !== "all" ? dateFrom : undefined,
        date_to: filterMode !== "all" ? dateTo : undefined,
      });

      showSnackbar(
        `${result.node_count}ノード、${result.resource_count}リソースの分析を作成しました`,
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
      <DialogTitle>
        新規組織分析を作成
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
              placeholder="例: employee-onboarding_組織分析_2025-10-04"
              size="small"
            />
          </FormControl>

          <FormControl required>
            <FormLabel>プロセスタイプ</FormLabel>
            <Select
              id="process-type-select"
              fullWidth
              value={processType}
              onChange={(e) => setProcessType(e.target.value)}
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

          <FormControl>
            <FormLabel>分析対象期間の基準</FormLabel>
            <RadioGroup
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as FilterMode)}
            >
              <Stack>
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
              </Stack>
            </RadioGroup>
          </FormControl>

          {filterMode !== "all" && (
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
              bgcolor: "#f3e8ff",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <AssessmentIcon fontSize="small" sx={{ color: "#6b21a8" }} />
              <Typography fontWeight="bold" sx={{ color: "#6b21a8" }}>
                組織分析について
              </Typography>
            </Stack>
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ color: "#7c3aed" }}>
                • ハンドオーバー分析: 誰と誰が連携しているか
              </Typography>
              <Typography variant="body2" sx={{ color: "#7c3aed" }}>
                • 作業負荷分析: 誰の作業量が多いか
              </Typography>
              <Typography variant="body2" sx={{ color: "#7c3aed" }}>
                • パフォーマンス分析: 誰の処理時間が長いか
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          キャンセル
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="secondary"
          disabled={isSubmitting}
        >
          分析を実行
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOrganizationAnalysisModal;
