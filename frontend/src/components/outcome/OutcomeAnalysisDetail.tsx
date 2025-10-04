/**
 * Outcome analysis detail page
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  HStack,
  VStack,
  Text,
  Button,
  Select,
  Spinner,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { useOutcomeStore } from '../../stores/outcomeStore';
import OutcomeProcessMap from './OutcomeProcessMap';
import SegmentComparison from './SegmentComparison';

const OutcomeAnalysisDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentAnalysis, displayMode, loading, error, fetchAnalysisById, setDisplayMode } =
    useOutcomeStore();

  useEffect(() => {
    if (id) {
      fetchAnalysisById(id);
    }
  }, [id, fetchAnalysisById]);

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={8}>
          <Spinner size="xl" />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  if (!currentAnalysis) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>分析結果が見つかりません</Text>
      </Container>
    );
  }

  // セグメント比較分析の場合は専用コンポーネントを表示
  if (currentAnalysis.analysis_type === 'segment-comparison') {
    return <SegmentComparison analysis={currentAnalysis} />;
  }

  const overallStats = currentAnalysis.result_data.summary.overall_stats;
  const metricName = currentAnalysis.metric_name;

  const formatMetricValue = (value: number): string => {
    if (metricName === 'revenue' || metricName === 'hiring_cost') {
      return `¥${Math.round(value).toLocaleString()}`;
    }
    if (metricName === 'profit_margin') {
      return `${(value * 100).toFixed(1)}%`;
    }
    if (metricName === 'quantity' || metricName === 'time_to_hire' || metricName === 'candidate_score') {
      return value.toFixed(1);
    }
    return value.toString();
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Button
            variant="outline"
            colorScheme="green"
            onClick={() => navigate('/outcome')}
            mb={4}
          >
            ← 成果分析一覧に戻る
          </Button>

          <Heading size="lg" mb={2}>
            {currentAnalysis.analysis_name}
          </Heading>

          <HStack spacing={4} color="gray.600">
            <Text>プロセス: {currentAnalysis.process_type}</Text>
            <Text>メトリック: {metricName}</Text>
            <Text>
              作成日時: {new Date(currentAnalysis.created_at).toLocaleString('ja-JP')}
            </Text>
          </HStack>
        </Box>

        <VStack align="stretch" spacing={4} h="calc(100vh - 280px)">
          <Box p={4} bg="green.50" borderRadius="md">
            <Text fontSize="sm" color="green.900">
              💡{' '}
              <strong>成果分析:</strong>{' '}
              各パスでの成果メトリックを可視化します。緑色のパスは高成果、赤色のパスは低成果を示します。
            </Text>
          </Box>
          <Box flex={1}>
            <OutcomeProcessMap
              analysis={currentAnalysis}
              displayMode={displayMode}
              onDisplayModeChange={setDisplayMode}
            />
          </Box>
        </VStack>

        {currentAnalysis.result_data.summary.top_paths.length > 0 && (
          <Card>
            <CardBody>
              <Heading size="sm" mb={4}>
                高成果パス（平均値が全体平均の1.2倍以上）
              </Heading>
              <VStack align="stretch" spacing={2}>
                {currentAnalysis.result_data.summary.top_paths.map((path, index) => (
                  <Box
                    key={index}
                    p={3}
                    bg="green.50"
                    borderRadius="md"
                    borderLeft="4px solid"
                    borderColor="green.500"
                  >
                    <HStack justify="space-between">
                      <Text>
                        {path.source} → {path.target}
                      </Text>
                      <Text fontWeight="bold" color="green.700">
                        {formatMetricValue(path.avg_outcome)}
                      </Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  );
};

export default OutcomeAnalysisDetail;
