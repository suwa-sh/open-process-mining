import React from "react";
import {
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  Slider,
  Typography,
  Stack,
  Divider,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import StarIcon from "@mui/icons-material/Star";
import { useStore } from "../store/useStore";
import { LeadTimeStats } from "../types";

interface ControlsProps {
  leadTimeStats?: LeadTimeStats;
}

const Controls: React.FC<ControlsProps> = ({ leadTimeStats }) => {
  const { displayMetric, pathThreshold, setDisplayMetric, setPathThreshold } =
    useStore();

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
            表示メトリクス
          </Typography>
          <RadioGroup
            value={displayMetric}
            onChange={(e) =>
              setDisplayMetric(e.target.value as "frequency" | "performance")
            }
          >
            <Stack spacing={1}>
              <FormControlLabel
                value="frequency"
                control={<Radio />}
                label="頻度"
              />
              <FormControlLabel
                value="performance"
                control={<Radio />}
                label="平均待機時間"
              />
            </Stack>
          </RadioGroup>
        </Box>

        <Divider />

        <Box>
          <Typography fontWeight="bold" sx={{ mb: 1 }}>
            パスフィルター閾値
          </Typography>
          <Slider
            value={pathThreshold}
            onChange={(_, value) => setPathThreshold(value as number)}
            min={0}
            max={1}
            step={0.01}
            color="primary"
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            最大頻度の {(pathThreshold * 100).toFixed(0)}% 以上のパスを表示
          </Typography>
        </Box>

        {leadTimeStats && leadTimeStats.lead_time_hours.median !== null && (
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
                <Typography fontWeight="bold">リードタイム統計</Typography>
              </Stack>
              <Stack spacing={0.5} sx={{ fontSize: "0.875rem" }}>
                <Typography fontWeight="600">全ケース:</Typography>
                <Typography sx={{ ml: 1 }}>
                  ケース数: {leadTimeStats.case_count}件
                </Typography>
                <Typography sx={{ ml: 1 }}>
                  最小: {leadTimeStats.lead_time_hours.min?.toFixed(1)}時間
                </Typography>
                <Typography sx={{ ml: 1 }}>
                  中央値: {leadTimeStats.lead_time_hours.median?.toFixed(1)}
                  時間
                </Typography>
                <Typography sx={{ ml: 1 }}>
                  最大: {leadTimeStats.lead_time_hours.max?.toFixed(1)}時間
                </Typography>

                {leadTimeStats.happy_path &&
                  leadTimeStats.happy_path.case_count > 0 && (
                    <>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ mt: 1 }}
                      >
                        <StarIcon fontSize="small" />
                        <Typography fontWeight="600">ハッピーパス:</Typography>
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        ({leadTimeStats.happy_path.path.join(" → ")})
                      </Typography>
                      <Typography sx={{ ml: 1 }}>
                        ケース数: {leadTimeStats.happy_path.case_count}件
                      </Typography>
                      <Typography sx={{ ml: 1 }}>
                        最小:{" "}
                        {leadTimeStats.happy_path.lead_time_hours.min?.toFixed(
                          1,
                        )}
                        時間
                      </Typography>
                      <Typography sx={{ ml: 1 }}>
                        中央値:{" "}
                        {leadTimeStats.happy_path.lead_time_hours.median?.toFixed(
                          1,
                        )}
                        時間
                      </Typography>
                      <Typography sx={{ ml: 1 }}>
                        最大:{" "}
                        {leadTimeStats.happy_path.lead_time_hours.max?.toFixed(
                          1,
                        )}
                        時間
                      </Typography>
                    </>
                  )}
              </Stack>
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
};

export default Controls;
