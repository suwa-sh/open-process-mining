/**
 * Outcome analysis controls (right pane)
 */

import React from "react";
import {
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { formatMetricValue } from "../../utils/formatMetricValue";

interface OutcomeControlsProps {
  displayMode: "avg" | "median" | "total";
  onDisplayModeChange: (mode: "avg" | "median" | "total") => void;
  metricName: string;
  overallStats?: {
    avg: number;
    median: number;
    total: number;
    count: number;
    min: number;
    max: number;
  };
}

const OutcomeControls: React.FC<OutcomeControlsProps> = ({
  displayMode,
  onDisplayModeChange,
  metricName,
  overallStats,
}) => {
  return (
    <Box
      sx={{
        p: 2,
        bgcolor: "grey.50",
        borderRadius: 1,
        boxShadow: 1,
        minWidth: "250px",
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography fontWeight="bold" sx={{ mb: 1 }}>
            表示モード
          </Typography>
          <RadioGroup
            value={displayMode}
            onChange={(e) =>
              onDisplayModeChange(e.target.value as "avg" | "median" | "total")
            }
          >
            <Stack spacing={1}>
              <FormControlLabel
                value="avg"
                control={<Radio />}
                label="平均値"
              />
              <FormControlLabel
                value="median"
                control={<Radio />}
                label="中央値"
              />
              <FormControlLabel
                value="total"
                control={<Radio />}
                label="合計値"
              />
            </Stack>
          </RadioGroup>
        </Box>

        {overallStats && (
          <>
            <Divider />
            <Box>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <AssessmentIcon fontSize="small" />
                <Typography fontWeight="bold">統計情報</Typography>
              </Stack>
              <Stack spacing={0.5} sx={{ fontSize: "0.875rem" }}>
                <Typography>総ケース数: {overallStats.count}件</Typography>
                <Typography fontWeight="600" sx={{ mt: 1 }}>
                  平均値:
                </Typography>
                <Typography sx={{ ml: 1 }}>
                  {formatMetricValue(overallStats.avg, metricName)}
                </Typography>
                <Typography fontWeight="600" sx={{ mt: 1 }}>
                  中央値:
                </Typography>
                <Typography sx={{ ml: 1 }}>
                  {formatMetricValue(overallStats.median, metricName)}
                </Typography>
                <Typography fontWeight="600" sx={{ mt: 1 }}>
                  合計値:
                </Typography>
                <Typography sx={{ ml: 1 }}>
                  {formatMetricValue(overallStats.total, metricName)}
                </Typography>
                <Typography fontWeight="600" sx={{ mt: 1 }}>
                  範囲:
                </Typography>
                <Typography sx={{ ml: 1 }}>
                  {formatMetricValue(overallStats.min, metricName)} -{" "}
                  {formatMetricValue(overallStats.max, metricName)}
                </Typography>
              </Stack>
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default OutcomeControls;
