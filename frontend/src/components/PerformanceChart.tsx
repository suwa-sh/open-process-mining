import React from "react";
import { Box, Typography, Stack, Chip } from "@mui/material";
import { PerformanceAnalysis } from "../types";

interface PerformanceChartProps {
  data: PerformanceAnalysis;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  if (data.performance.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">データがありません</Typography>
      </Box>
    );
  }

  // Helper function to get color based on performance ranking
  const getColorScheme = (index: number) => {
    if (index === 0) return "error"; // Slowest (bottleneck)
    if (index === 1) return "warning";
    if (index === 2) return "warning";
    return "success";
  };

  return (
    <Box sx={{ width: "100%", p: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        パフォーマンス分析（処理時間）
      </Typography>
      <Stack spacing={2}>
        {data.performance.map((item, index) => (
          <Box
            key={item.resource_id}
            sx={{
              p: 2,
              border: 1,
              borderColor: index === 0 ? "error.light" : "divider",
              borderRadius: 1,
              bgcolor: index === 0 ? "#fef2f2" : "background.paper",
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Stack spacing={0}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography fontWeight="bold" fontSize="1.125rem">
                    {index + 1}. {item.resource_name}
                  </Typography>
                  {index === 0 && (
                    <Chip
                      label="要注意"
                      color="error"
                      size="small"
                      sx={{ height: 20, fontSize: "0.75rem" }}
                    />
                  )}
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  ID: {item.resource_id}
                </Typography>
              </Stack>
              <Stack alignItems="flex-end" spacing={0}>
                <Typography
                  fontSize="1.5rem"
                  fontWeight="bold"
                  color={`${getColorScheme(index)}.main`}
                >
                  {item.avg_duration_hours.toFixed(1)}h
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  平均処理時間
                </Typography>
              </Stack>
            </Stack>

            <Stack spacing={1} sx={{ mt: 1.5 }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ fontSize: "0.875rem" }}
              >
                <Typography color="text.secondary">中央値:</Typography>
                <Typography fontWeight="600">
                  {item.median_duration_hours.toFixed(1)} 時間
                </Typography>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ fontSize: "0.875rem" }}
              >
                <Typography color="text.secondary">合計処理時間:</Typography>
                <Typography fontWeight="600">
                  {item.total_duration_hours.toFixed(1)} 時間
                </Typography>
              </Stack>
              <Stack
                direction="row"
                justifyContent="space-between"
                sx={{ fontSize: "0.875rem" }}
              >
                <Typography color="text.secondary">処理件数:</Typography>
                <Typography fontWeight="600">
                  {item.activity_count} 件
                </Typography>
              </Stack>
            </Stack>

            {index === 0 && (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1,
                  bgcolor: "#fee2e2",
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" sx={{ color: "#991b1b" }}>
                  ⚠️
                  この担当者/部署の処理時間が最も長くなっています。ボトルネックの可能性があります。
                </Typography>
              </Box>
            )}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default PerformanceChart;
