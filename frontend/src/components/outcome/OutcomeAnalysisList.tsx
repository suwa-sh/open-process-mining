/**
 * Outcome analysis list page
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Heading,
  List,
  ListItem,
  Select,
  HStack,
  VStack,
  Text,
  Spinner,
  Center,
  Badge,
  useDisclosure,
} from '@chakra-ui/react';
import { useOutcomeStore } from '../../stores/outcomeStore';
import { getProcessTypes } from '../../api/client';
import CreateOutcomeAnalysisModal from './CreateOutcomeAnalysisModal';

const OutcomeAnalysisList: React.FC = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [processTypeFilter, setProcessTypeFilter] = useState<string>('');
  const [metricNameFilter, setMetricNameFilter] = useState<string>('');
  const [processTypes, setProcessTypes] = useState<string[]>([]);
  const [metricNames, setMetricNames] = useState<string[]>([]);

  const { analyses, loading, error, fetchAnalyses } = useOutcomeStore();

  useEffect(() => {
    const fetchProcessTypes = async () => {
      try {
        const types = await getProcessTypes();
        setProcessTypes(types);
      } catch (error) {
        console.error('Failed to fetch process types', error);
      }
    };

    fetchProcessTypes();
  }, []);

  useEffect(() => {
    fetchAnalyses(processTypeFilter || undefined, metricNameFilter || undefined);
  }, [processTypeFilter, metricNameFilter, fetchAnalyses]);

  useEffect(() => {
    // 分析一覧から利用可能なメトリック名を抽出
    const uniqueMetrics = Array.from(new Set(analyses.map(a => a.metric_name)));
    setMetricNames(uniqueMetrics);
  }, [analyses]);

  const handleRowClick = (analysisId: string) => {
    navigate(`/outcome/${analysisId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  return (
    <Box p={8} maxW="800px" mx="auto">
      <HStack justify="space-between" align="center" mb={6}>
        <Heading size="lg">
          成果分析
        </Heading>
        <HStack>
          <Button colorScheme="blue" onClick={() => navigate('/')}>
            📈 プロセス分析
          </Button>
          <Button colorScheme="purple" onClick={() => navigate('/organization')}>
            🏢 組織分析
          </Button>
          <Button colorScheme="green" onClick={onOpen}>
            + 新規分析を作成
          </Button>
        </HStack>
      </HStack>

      <Box mb={6}>
        <Text fontSize="sm" mb={2} fontWeight="medium">フィルター:</Text>
        <HStack spacing={4}>
          <Select
            placeholder="すべてのプロセスタイプ"
            value={processTypeFilter}
            onChange={(e) => setProcessTypeFilter(e.target.value)}
          >
            {processTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>

          <Select
            placeholder="すべてのメトリック"
            value={metricNameFilter}
            onChange={(e) => setMetricNameFilter(e.target.value)}
          >
            {metricNames.map((metric) => (
              <option key={metric} value={metric}>
                {metric}
              </option>
            ))}
          </Select>
        </HStack>
      </Box>

      {loading ? (
        <Center py={8}>
          <VStack spacing={4}>
            <Spinner size="xl" color="green.500" />
            <Text>成果分析データを読み込んでいます...</Text>
          </VStack>
        </Center>
      ) : error ? (
        <Center py={8}>
          <VStack spacing={3}>
            <Text fontSize="md" color="gray.600">
              成果分析が見つかりません
            </Text>
            <Text fontSize="sm" color="gray.500">
              「新規分析を作成」ボタンから最初の分析を作成してください。
            </Text>
          </VStack>
        </Center>
      ) : analyses.length === 0 ? (
        <Center py={8}>
          <VStack spacing={3}>
            <Text fontSize="md" color="gray.600">
              成果分析が見つかりません
            </Text>
            <Text fontSize="sm" color="gray.500">
              「新規分析を作成」ボタンから最初の分析を作成してください。
            </Text>
          </VStack>
        </Center>
      ) : (
        <List spacing={3}>
          {analyses.map((analysis) => (
            <ListItem
              key={analysis.analysis_id}
              p={4}
              borderWidth={1}
              borderRadius="md"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ bg: 'green.50', borderColor: 'green.500', transform: 'translateY(-2px)' }}
              onClick={() => handleRowClick(analysis.analysis_id)}
            >
              <VStack align="start" spacing={1}>
                <HStack spacing={3}>
                  <Text fontWeight="bold" fontSize="lg">
                    {analysis.analysis_name}
                  </Text>
                  <Badge colorScheme="green">
                    {analysis.process_type}
                  </Badge>
                  <Badge colorScheme="orange">
                    {analysis.metric_name}
                  </Badge>
                  <Badge colorScheme="cyan">
                    {analysis.analysis_type === 'path-outcome' ? 'パス別成果' : 'セグメント比較'}
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  作成日時: {formatDate(analysis.created_at)}
                </Text>
              </VStack>
            </ListItem>
          ))}
        </List>
      )}

      <CreateOutcomeAnalysisModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};

export default OutcomeAnalysisList;
