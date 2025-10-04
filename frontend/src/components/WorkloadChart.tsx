import React from "react";
import { Box, Heading, VStack, HStack, Text, Progress } from "@chakra-ui/react";
import { WorkloadAnalysis } from "../types";

interface WorkloadChartProps {
  data: WorkloadAnalysis;
}

const WorkloadChart: React.FC<WorkloadChartProps> = ({ data }) => {
  if (data.workload.length === 0) {
    return (
      <Box p={4}>
        <Text color="gray.500">データがありません</Text>
      </Box>
    );
  }

  // Find max activity count for scaling
  const maxActivityCount = Math.max(
    ...data.workload.map((w) => w.activity_count),
  );

  return (
    <Box width="100%" p={4}>
      <Heading size="md" mb={4}>
        作業負荷分析
      </Heading>
      <VStack spacing={4} align="stretch">
        {data.workload.map((item, index) => (
          <Box
            key={item.resource_id}
            p={4}
            borderWidth="1px"
            borderRadius="md"
            bg={index === 0 ? "yellow.50" : "white"}
          >
            <HStack justify="space-between" mb={2}>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="lg">
                  {index + 1}. {item.resource_name}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  ID: {item.resource_id}
                </Text>
              </VStack>
              <VStack align="end" spacing={0}>
                <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                  {item.activity_count}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  activities
                </Text>
              </VStack>
            </HStack>
            <Progress
              value={(item.activity_count / maxActivityCount) * 100}
              colorScheme="blue"
              size="lg"
              borderRadius="md"
              mb={2}
            />
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">
                担当ケース数: {item.case_count}件
              </Text>
              <Text fontSize="sm" color="gray.600">
                {((item.activity_count / maxActivityCount) * 100).toFixed(0)}%
              </Text>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default WorkloadChart;
