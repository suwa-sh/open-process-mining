import React, { useEffect, useState } from "react";
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import { useNavigate } from "react-router-dom";
import { getOrganizationAnalyses, getProcessTypes } from "../api/client";
import { OrganizationAnalysisListItem } from "../types";
import CreateOrganizationAnalysisModal from "./CreateOrganizationAnalysisModal";

interface OrganizationAnalysisListProps {
  onSelect: (analysisId: string) => void;
}

const OrganizationAnalysisList: React.FC<OrganizationAnalysisListProps> = ({
  onSelect,
}) => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<OrganizationAnalysisListItem[]>([]);
  const [processTypes, setProcessTypes] = useState<string[]>([]);
  const [selectedProcessType, setSelectedProcessType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);

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

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const data = await getOrganizationAnalyses(
        selectedProcessType || undefined,
      );
      setAnalyses(data);
    } catch (error) {
      console.error("Failed to fetch organization analyses", error);
      setError("Failed to load organization analyses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [selectedProcessType]);

  const handleAnalysisSuccess = (analysisId: string) => {
    // 分析成功後、リストを再読み込みして新しい分析を表示
    fetchAnalyses();
    // 作成した分析の詳細画面へ遷移
    onSelect(analysisId);
  };

  const aggregationLevelLabel = (level: string) => {
    return level === "employee" ? (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <PersonIcon fontSize="small" />
        <span>社員別</span>
      </Stack>
    ) : (
      <Stack direction="row" spacing={0.5} alignItems="center">
        <BusinessIcon fontSize="small" />
        <span>部署別</span>
      </Stack>
    );
  };

  return (
    <>
      <Box p={4} maxWidth="800px" mx="auto">
        <Stack spacing={3}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h4">組織分析</Typography>
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
                color="success"
                onClick={() => navigate("/outcome")}
                startIcon={<AssessmentIcon />}
              >
                成果分析
              </Button>
              <Button variant="contained" color="secondary" onClick={onOpen}>
                + 新規組織分析を作成
              </Button>
            </Stack>
          </Stack>

          <FormControl fullWidth>
            <FormLabel>フィルター:</FormLabel>
            <Select
              value={selectedProcessType}
              onChange={(e) => setSelectedProcessType(e.target.value)}
              displayEmpty
            >
              <MenuItem value="">すべてのプロセス</MenuItem>
              {processTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <Stack spacing={2} alignItems="center">
                <CircularProgress size={60} sx={{ color: "secondary.main" }} />
                <Typography>組織分析データを読み込んでいます...</Typography>
              </Stack>
            </Box>
          ) : error ? (
            <Box display="flex" justifyContent="center" py={4}>
              <Stack spacing={1.5} alignItems="center">
                <Typography variant="body1" color="text.secondary">
                  組織分析が見つかりません
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  「新規組織分析を作成」ボタンから最初の分析を作成してください。
                </Typography>
              </Stack>
            </Box>
          ) : analyses.length === 0 ? (
            <Box display="flex" justifyContent="center" py={4}>
              <Stack spacing={1.5} alignItems="center">
                <Typography variant="body1" color="text.secondary">
                  組織分析が見つかりません
                </Typography>
                <Typography variant="body2" color="text.disabled">
                  「新規組織分析を作成」ボタンから最初の分析を作成してください。
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
                      bgcolor: "secondary.50",
                      borderColor: "secondary.main",
                      transform: "translateY(-2px)",
                    },
                  }}
                  onClick={() => onSelect(analysis.analysis_id)}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="h6" fontWeight="bold">
                          {analysis.analysis_name}
                        </Typography>
                        {analysis.process_type && (
                          <Chip
                            label={analysis.process_type}
                            color="secondary"
                            size="small"
                          />
                        )}
                        <Chip
                          label={aggregationLevelLabel(
                            analysis.aggregation_level,
                          )}
                          color="info"
                          size="small"
                        />
                      </Stack>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        作成日時:{" "}
                        {new Date(analysis.created_at).toLocaleString("ja-JP")}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </Box>

      <CreateOrganizationAnalysisModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={handleAnalysisSuccess}
      />
    </>
  );
};

export default OrganizationAnalysisList;
