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
import BusinessIcon from "@mui/icons-material/Business";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { useNavigate } from "react-router-dom";
import { getAnalyses, getProcessTypes } from "../api/client";
import { Analysis } from "../types";
import CreateAnalysisModal from "./CreateAnalysisModal";

interface AnalysisListProps {
  onSelect: (analysisId: string) => void;
}

const AnalysisList: React.FC<AnalysisListProps> = ({ onSelect }) => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
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
      const data = await getAnalyses(selectedProcessType || undefined);
      setAnalyses(data);
    } catch (error) {
      console.error("Failed to fetch analyses", error);
      setError("Failed to load analyses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [selectedProcessType]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={60} />
          <Typography>分析データを読み込んでいます...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Stack spacing={2} alignItems="center">
          <Typography color="error" fontSize="1.125rem">
            {error}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            バックエンドが起動しており、データが利用可能であることを確認してください。
          </Typography>
        </Stack>
      </Box>
    );
  }

  const handleAnalysisSuccess = (analysisId: string) => {
    // 分析成功後、リストを再読み込みして新しい分析を表示
    fetchAnalyses();
    // 作成した分析の詳細画面へ遷移
    onSelect(analysisId);
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
            <Typography variant="h4">プロセス分析</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate("/organization")}
                startIcon={<BusinessIcon />}
              >
                組織分析
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => navigate("/outcome")}
                startIcon={<AssessmentIcon />}
              >
                成果分析
              </Button>
              <Button variant="contained" color="primary" onClick={onOpen}>
                + 新規分析を作成
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

          {analyses.length === 0 ? (
            <Box display="flex" justifyContent="center" py={4}>
              <Stack spacing={1.5} alignItems="center">
                <Typography variant="body1" color="text.secondary">
                  分析が見つかりません
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
                      bgcolor: "primary.50",
                      borderColor: "primary.main",
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
                            color="primary"
                            size="small"
                          />
                        )}
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

      <CreateAnalysisModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={handleAnalysisSuccess}
      />
    </>
  );
};

export default AnalysisList;
