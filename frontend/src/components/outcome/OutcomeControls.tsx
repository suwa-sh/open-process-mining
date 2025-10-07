/**
 * Outcome analysis controls (right pane)
 */

import React from "react";
import {
  Box,
  Radio,
  RadioGroup,
  Stack,
  Text,
  VStack,
  Divider,
} from "@chakra-ui/react";
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
    <Box p={4} bg="gray.50" borderRadius="md" shadow="md" minW="250px">
      <VStack spacing={4} align="stretch">
        <Box>
          <Text fontWeight="bold" mb={2}>
            表示モード
          </Text>
          <RadioGroup
            value={displayMode}
            onChange={(value) =>
              onDisplayModeChange(value as "avg" | "median" | "total")
            }
          >
            <Stack direction="column" spacing={2}>
              <Radio value="avg">平均値</Radio>
              <Radio value="median">中央値</Radio>
              <Radio value="total">合計値</Radio>
            </Stack>
          </RadioGroup>
        </Box>

        {overallStats && (
          <>
            <Divider />
            <Box>
              <Text fontWeight="bold" mb={2}>
                📊 統計情報
              </Text>
              <VStack align="start" spacing={1} fontSize="sm">
                <Text>総ケース数: {overallStats.count}件</Text>
                <Text mt={2} fontWeight="semibold">
                  平均値:
                </Text>
                <Text ml={2}>
                  {formatMetricValue(overallStats.avg, metricName)}
                </Text>
                <Text mt={2} fontWeight="semibold">
                  中央値:
                </Text>
                <Text ml={2}>
                  {formatMetricValue(overallStats.median, metricName)}
                </Text>
                <Text mt={2} fontWeight="semibold">
                  合計値:
                </Text>
                <Text ml={2}>
                  {formatMetricValue(overallStats.total, metricName)}
                </Text>
                <Text mt={2} fontWeight="semibold">
                  範囲:
                </Text>
                <Text ml={2}>
                  {formatMetricValue(overallStats.min, metricName)} -{" "}
                  {formatMetricValue(overallStats.max, metricName)}
                </Text>
              </VStack>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default OutcomeControls;
