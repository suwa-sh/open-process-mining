import React from "react";
import { Box, Typography, Stack, LinearProgress } from "@mui/material";
import { WorkloadAnalysis } from "../types";

interface WorkloadChartProps {
  data: WorkloadAnalysis;
}

const WorkloadChart: React.FC<WorkloadChartProps> = ({ data }) => {
  if (data.workload.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">データがありません</Typography>
      </Box>
    );
  }

  // Find max activity count for scaling
  const maxActivityCount = Math.max(
    ...data.workload.map((w) => w.activity_count),
  );

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        作業負荷分析
      </Typography>
      <Stack spacing={2}>
        {data.workload.map((item, index) => (
          <Box
            key={item.resource_id}
            sx={{
              p: 2,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              bgcolor: index === 0 ? "#fef3c7" : "background.paper",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Stack spacing={0}>
                <Typography fontWeight="bold" fontSize="1.125rem">
                  {index + 1}. {item.resource_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {item.resource_id}
                </Typography>
              </Stack>
              <Stack alignItems="flex-end" spacing={0}>
                <Typography
                  fontSize="1.5rem"
                  fontWeight="bold"
                  color="primary.main"
                >
                  {item.activity_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  activities
                </Typography>
              </Stack>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={(item.activity_count / maxActivityCount) * 100}
              sx={{
                height: 8,
                borderRadius: 1,
                mb: 1,
                bgcolor: "action.hover",
                "& .MuiLinearProgress-bar": {
                  bgcolor: "primary.main",
                },
              }}
            />
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                担当ケース数: {item.case_count}件
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {((item.activity_count / maxActivityCount) * 100).toFixed(0)}%
              </Typography>
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default WorkloadChart;
