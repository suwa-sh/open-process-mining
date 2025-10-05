/**
 * Segment comparison view for outcome analysis
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Heading,
  HStack,
  VStack,
  Text,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { OutcomeAnalysisDetail } from "../../types/outcome";
import OutcomeProcessMap from "./OutcomeProcessMap";

interface SegmentComparisonProps {
  analysis: OutcomeAnalysisDetail;
}

const SegmentComparison: React.FC<SegmentComparisonProps> = ({ analysis }) => {
  const navigate = useNavigate();
  const { high_segment, low_segment, differences, summary } =
    analysis.result_data;
  const metricName = analysis.metric_name;

  const formatMetricValue = (value: number): string => {
    const roundedValue = Math.round(value * 100) / 100; // 小数点以下2桁で丸め
    const formattedNumber = roundedValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (metricName === "revenue" || metricName === "hiring_cost") {
      return `¥${formattedNumber}`;
    }
    if (metricName === "profit_margin") {
      return `${formattedNumber}%`;
    }
    return formattedNumber;
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Button
            variant="outline"
            colorScheme="green"
            onClick={() => navigate("/outcome")}
            mb={4}
          >
            ← 成果分析一覧に戻る
          </Button>

          <Heading size="lg" mb={2}>
            {analysis.analysis_name}
          </Heading>

          <HStack spacing={4} color="gray.600">
            <Text>プロセス: {analysis.process_type}</Text>
            <Text>メトリック: {metricName}</Text>
            <Text>分析タイプ: セグメント比較</Text>
            <Text>
              作成日時: {new Date(analysis.created_at).toLocaleString("ja-JP")}
            </Text>
          </HStack>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Card>
            <CardBody>
              <Heading size="sm" mb={4} color="green.600">
                {high_segment.label}
              </Heading>
              <SimpleGrid columns={3} spacing={4}>
                <Stat>
                  <StatLabel>ケース数</StatLabel>
                  <StatNumber>{high_segment.case_count.toLocaleString()}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>平均値</StatLabel>
                  <StatNumber>
                    {formatMetricValue(high_segment.outcome_stats.avg)}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>中央値</StatLabel>
                  <StatNumber>
                    {formatMetricValue(high_segment.outcome_stats.median)}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>合計値</StatLabel>
                  <StatNumber>
                    {formatMetricValue(high_segment.outcome_stats.total)}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>最小値</StatLabel>
                  <StatNumber>
                    {formatMetricValue(high_segment.outcome_stats.min)}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>最大値</StatLabel>
                  <StatNumber>
                    {formatMetricValue(high_segment.outcome_stats.max)}
                  </StatNumber>
                </Stat>
              </SimpleGrid>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Heading size="sm" mb={4} color="gray.600">
                {low_segment.label}
              </Heading>
              <SimpleGrid columns={3} spacing={4}>
                <Stat>
                  <StatLabel>ケース数</StatLabel>
                  <StatNumber>{low_segment.case_count.toLocaleString()}</StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>平均値</StatLabel>
                  <StatNumber>
                    {formatMetricValue(low_segment.outcome_stats.avg)}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>中央値</StatLabel>
                  <StatNumber>
                    {formatMetricValue(low_segment.outcome_stats.median)}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>合計値</StatLabel>
                  <StatNumber>
                    {formatMetricValue(low_segment.outcome_stats.total)}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>最小値</StatLabel>
                  <StatNumber>
                    {formatMetricValue(low_segment.outcome_stats.min)}
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel>最大値</StatLabel>
                  <StatNumber>
                    {formatMetricValue(low_segment.outcome_stats.max)}
                  </StatNumber>
                </Stat>
              </SimpleGrid>
            </CardBody>
          </Card>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Box>
            <Heading size="md" mb={4} color="green.600">
              {high_segment.label} のプロセス
            </Heading>
            <Box
              h="600px"
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
            >
              <OutcomeProcessMap
                analysis={{
                  ...analysis,
                  result_data: {
                    nodes: high_segment.nodes,
                    edges: high_segment.edges,
                    summary: {
                      overall_stats: high_segment.outcome_stats,
                      top_paths: [],
                    },
                  },
                }}
                displayMode="avg"
                onDisplayModeChange={() => {}}
                showControls={false}
                highlightDifferences={differences}
              />
            </Box>
          </Box>

          <Box>
            <Heading size="md" mb={4} color="gray.600">
              {low_segment.label} のプロセス
            </Heading>
            <Box
              h="600px"
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
            >
              <OutcomeProcessMap
                analysis={{
                  ...analysis,
                  result_data: {
                    nodes: low_segment.nodes,
                    edges: low_segment.edges,
                    summary: {
                      overall_stats: low_segment.outcome_stats,
                      top_paths: [],
                    },
                  },
                }}
                displayMode="avg"
                onDisplayModeChange={() => {}}
                showControls={false}
                highlightDifferences={differences}
              />
            </Box>
          </Box>
        </SimpleGrid>

        {differences && differences.length > 0 && (
          <Card>
            <CardBody>
              <Heading size="sm" mb={4}>
                主要な差分（パス出現率の差が10%以上）
              </Heading>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>パス</Th>
                      <Th isNumeric>高成果群</Th>
                      <Th isNumeric>低成果群</Th>
                      <Th isNumeric>差分</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {differences.map((diff, index) => (
                      <Tr key={index}>
                        <Td>
                          {diff.source} → {diff.target}
                        </Td>
                        <Td isNumeric>{diff.high_rate}%</Td>
                        <Td isNumeric>{diff.low_rate}%</Td>
                        <Td
                          isNumeric
                          fontWeight="bold"
                          color={diff.diff_rate > 0 ? "green.600" : "red.600"}
                        >
                          {diff.diff_rate > 0 ? "+" : ""}
                          {diff.diff_rate}%
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <Heading size="sm" mb={4}>
              サマリー
            </Heading>
            <VStack align="stretch" spacing={2}>
              <HStack>
                <Text fontWeight="bold">総ケース数:</Text>
                <Text>{summary.total_cases.toLocaleString()}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold">セグメント条件:</Text>
                <Text>{summary.segment_mode}</Text>
              </HStack>
              <HStack>
                <Text fontWeight="bold">閾値:</Text>
                <Text>{formatMetricValue(summary.threshold_value)}</Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

export default SegmentComparison;
