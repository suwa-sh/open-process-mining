import React from "react";
import { Box, Heading, VStack, HStack, Text, Badge } from "@chakra-ui/react";
import { PerformanceAnalysis } from "../types";

interface PerformanceChartProps {
  data: PerformanceAnalysis;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data }) => {
  if (data.performance.length === 0) {
    return (
      <Box p={4}>
        <Text color="gray.500">データがありません</Text>
      </Box>
    );
  }

  // Helper function to get color based on performance ranking
  const getColorScheme = (index: number) => {
    if (index === 0) return "red"; // Slowest (bottleneck)
    if (index === 1) return "orange";
    if (index === 2) return "yellow";
    return "green";
  };

  return (
    <Box width="100%" p={4}>
      <Heading size="md" mb={4}>
        パフォーマンス分析（処理時間）
      </Heading>
      <VStack spacing={4} align="stretch">
        {data.performance.map((item, index) => (
          <Box
            key={item.resource_id}
            p={4}
            borderWidth="1px"
            borderRadius="md"
            bg={index === 0 ? "red.50" : "white"}
            borderColor={index === 0 ? "red.300" : "gray.200"}
          >
            <HStack justify="space-between" mb={2}>
              <VStack align="start" spacing={0}>
                <HStack>
                  <Text fontWeight="bold" fontSize="lg">
                    {index + 1}. {item.resource_name}
                  </Text>
                  {index === 0 && (
                    <Badge colorScheme="red" fontSize="xs">
                      要注意
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  ID: {item.resource_id}
                </Text>
              </VStack>
              <VStack align="end" spacing={0}>
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  color={`${getColorScheme(index)}.600`}
                >
                  {item.avg_duration_hours.toFixed(1)}h
                </Text>
                <Text fontSize="sm" color="gray.600">
                  平均処理時間
                </Text>
              </VStack>
            </HStack>

            <VStack align="stretch" spacing={2} mt={3}>
              <HStack justify="space-between" fontSize="sm">
                <Text color="gray.600">中央値:</Text>
                <Text fontWeight="semibold">
                  {item.median_duration_hours.toFixed(1)} 時間
                </Text>
              </HStack>
              <HStack justify="space-between" fontSize="sm">
                <Text color="gray.600">合計処理時間:</Text>
                <Text fontWeight="semibold">
                  {item.total_duration_hours.toFixed(1)} 時間
                </Text>
              </HStack>
              <HStack justify="space-between" fontSize="sm">
                <Text color="gray.600">処理件数:</Text>
                <Text fontWeight="semibold">{item.activity_count} 件</Text>
              </HStack>
            </VStack>

            {index === 0 && (
              <Box mt={3} p={2} bg="red.100" borderRadius="md">
                <Text fontSize="xs" color="red.800">
                  ⚠️
                  この担当者/部署の処理時間が最も長くなっています。ボトルネックの可能性があります。
                </Text>
              </Box>
            )}
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default PerformanceChart;
