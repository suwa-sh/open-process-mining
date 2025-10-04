import React, { useEffect, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  Heading,
  Spinner,
  Text,
  VStack,
  Center,
  Select,
  HStack,
  Badge,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { getOrganizationAnalyses, getProcessTypes } from '../api/client';
import { OrganizationAnalysisListItem } from '../types';
import CreateOrganizationAnalysisModal from './CreateOrganizationAnalysisModal';

interface OrganizationAnalysisListProps {
  onSelect: (analysisId: string) => void;
}

const OrganizationAnalysisList: React.FC<OrganizationAnalysisListProps> = ({ onSelect }) => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<OrganizationAnalysisListItem[]>([]);
  const [processTypes, setProcessTypes] = useState<string[]>([]);
  const [selectedProcessType, setSelectedProcessType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

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

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const data = await getOrganizationAnalyses(selectedProcessType || undefined);
      setAnalyses(data);
    } catch (error) {
      console.error('Failed to fetch organization analyses', error);
      setError('Failed to load organization analyses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, [selectedProcessType]);

  if (loading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>組織分析データを読み込んでいます...</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Text color="red.500" fontSize="lg">
            {error}
          </Text>
          <Text fontSize="sm" color="gray.600">
            バックエンドが起動しており、データが利用可能であることを確認してください。
          </Text>
        </VStack>
      </Center>
    );
  }

  const handleAnalysisSuccess = (analysisId: string) => {
    // 分析成功後、リストを再読み込みして新しい分析を表示
    fetchAnalyses();
    // 作成した分析の詳細画面へ遷移
    onSelect(analysisId);
  };

  const aggregationLevelLabel = (level: string) => {
    return level === 'employee' ? '👤 社員別' : '🏢 部署別';
  };

  return (
    <>
      <Box p={8} maxW="800px" mx="auto">
        <VStack align="stretch" spacing={6}>
          <HStack justify="space-between" align="center">
            <Heading size="lg">
              組織分析
            </Heading>
            <HStack>
              <Button variant="outline" onClick={() => navigate('/')}>
                ← プロセス分析一覧に戻る
              </Button>
              <Button colorScheme="blue" onClick={onOpen}>
                + 新規組織分析を作成
              </Button>
            </HStack>
          </HStack>

          <Box>
            <Text fontSize="sm" mb={2} fontWeight="medium">プロセスタイプで絞り込み:</Text>
            <Select
              value={selectedProcessType}
              onChange={(e) => setSelectedProcessType(e.target.value)}
              placeholder="すべてのプロセス"
            >
              {processTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </Box>

          {analyses.length === 0 ? (
            <Center py={8}>
              <VStack spacing={3}>
                <Text fontSize="md" color="gray.600">
                  組織分析が見つかりません
                </Text>
                <Text fontSize="sm" color="gray.500">
                  「新規組織分析を作成」ボタンから最初の分析を作成してください。
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
                  _hover={{ bg: 'purple.50', borderColor: 'purple.500', transform: 'translateY(-2px)' }}
                  onClick={() => onSelect(analysis.analysis_id)}
                >
                  <VStack align="start" spacing={1}>
                    <HStack spacing={3}>
                      <Text fontWeight="bold" fontSize="lg">
                        {analysis.analysis_name}
                      </Text>
                      {analysis.process_type && (
                        <Badge colorScheme="purple">
                          {analysis.process_type}
                        </Badge>
                      )}
                      <Badge colorScheme="cyan">
                        {aggregationLevelLabel(analysis.aggregation_level)}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      作成日時: {new Date(analysis.created_at).toLocaleString('ja-JP')}
                    </Text>
                  </VStack>
                </ListItem>
              ))}
            </List>
          )}
        </VStack>
      </Box>

      <CreateOrganizationAnalysisModal
        isOpen={isOpen}
        onClose={onClose}
        onSuccess={handleAnalysisSuccess}
      />
    </>
  );
};

export default OrganizationAnalysisList;
