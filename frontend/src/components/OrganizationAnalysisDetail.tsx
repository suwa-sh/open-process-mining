import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Button,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Text,
  useToast,
  Badge,
  Center,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  getOrganizationAnalysisById,
  getHandoverAnalysis,
  getWorkloadAnalysis,
  getPerformanceAnalysis,
} from "../api/client";
import {
  HandoverAnalysis as HandoverAnalysisType,
  WorkloadAnalysis as WorkloadAnalysisType,
  PerformanceAnalysis as PerformanceAnalysisType,
  AggregationLevel,
  OrganizationAnalysisDetail as OrganizationAnalysisDetailType,
} from "../types";
import HandoverNetwork from "./HandoverNetwork";
import WorkloadChart from "./WorkloadChart";
import PerformanceChart from "./PerformanceChart";

interface OrganizationAnalysisDetailProps {
  analysisId: string;
  onBack: () => void;
}

const OrganizationAnalysisDetail: React.FC<OrganizationAnalysisDetailProps> = ({
  analysisId,
  onBack,
}) => {
  const toast = useToast();

  const [analysis, setAnalysis] =
    useState<OrganizationAnalysisDetailType | null>(null);
  const [aggregationLevel, setAggregationLevel] =
    useState<AggregationLevel>("employee");
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [handoverData, setHandoverData] = useState<HandoverAnalysisType | null>(
    null,
  );
  const [workloadData, setWorkloadData] = useState<WorkloadAnalysisType | null>(
    null,
  );
  const [performanceData, setPerformanceData] =
    useState<PerformanceAnalysisType | null>(null);

  // Load saved analysis on mount
  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        setLoading(true);
        const data = await getOrganizationAnalysisById(analysisId);
        setAnalysis(data);
        setAggregationLevel(data.aggregation_level);
        setHandoverData(data.handover_data);
        setWorkloadData(data.workload_data);
        setPerformanceData(data.performance_data);
        setIsInitialLoad(false);
      } catch (error) {
        toast({
          title: "エラー",
          description: "組織分析データの取得に失敗しました",
          status: "error",
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };
    loadAnalysis();
  }, [analysisId, toast]);

  // Reload analyses when aggregation level changes (after initial load)
  useEffect(() => {
    if (!isInitialLoad && analysis) {
      const loadData = async () => {
        setLoading(true);
        try {
          const [handover, workload, performance] = await Promise.all([
            getHandoverAnalysis(
              analysis.process_type,
              aggregationLevel,
              analysis.filter_mode,
              analysis.date_from || undefined,
              analysis.date_to || undefined,
            ),
            getWorkloadAnalysis(
              analysis.process_type,
              aggregationLevel,
              analysis.filter_mode,
              analysis.date_from || undefined,
              analysis.date_to || undefined,
            ),
            getPerformanceAnalysis(
              analysis.process_type,
              aggregationLevel,
              analysis.filter_mode,
              analysis.date_from || undefined,
              analysis.date_to || undefined,
            ),
          ]);

          setHandoverData(handover);
          setWorkloadData(workload);
          setPerformanceData(performance);
        } catch (error) {
          toast({
            title: "エラー",
            description: "組織分析の取得に失敗しました",
            status: "error",
            duration: 3000,
          });
        } finally {
          setLoading(false);
        }
      };

      loadData();
    }
  }, [aggregationLevel, isInitialLoad, analysis, toast]);

  if (loading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="purple.500" />
          <Text>組織分析データを読み込んでいます...</Text>
        </VStack>
      </Center>
    );
  }

  if (!analysis) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Text color="red.500">分析データが見つかりません</Text>
          <Button onClick={onBack} colorScheme="purple">
            組織分析一覧に戻る
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Container maxW="container.xl" py={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Heading size="lg">{analysis.analysis_name}</Heading>
            <HStack>
              <Badge colorScheme="purple">{analysis.process_type}</Badge>
              <Badge colorScheme="cyan">
                {analysis.aggregation_level === "employee"
                  ? "👤 社員別"
                  : "🏢 部署別"}
              </Badge>
              <Text fontSize="sm" color="gray.600">
                作成: {new Date(analysis.created_at).toLocaleString("ja-JP")}
              </Text>
            </HStack>
          </VStack>
          <Button onClick={onBack} variant="outline" colorScheme="purple">
            組織分析一覧に戻る
          </Button>
        </HStack>

        {/* Controls */}
        <Box p={4} borderWidth="1px" borderRadius="md" bg="purple.50">
          <HStack spacing={4}>
            <Box flex={1}>
              <Text
                mb={2}
                fontWeight="semibold"
                fontSize="sm"
                color="purple.900"
              >
                プロセスタイプ（固定）
              </Text>
              <Text fontSize="md" fontWeight="bold" color="purple.700">
                {analysis.process_type}
              </Text>
            </Box>

            <Box flex={1}>
              <Text
                mb={2}
                fontWeight="semibold"
                fontSize="sm"
                color="purple.900"
              >
                集計レベル
              </Text>
              <Select
                value={aggregationLevel}
                onChange={(e) =>
                  setAggregationLevel(e.target.value as AggregationLevel)
                }
                bg="white"
              >
                <option value="employee">👤 社員別</option>
                <option value="department">🏢 部署別</option>
              </Select>
            </Box>
          </HStack>
        </Box>

        {/* Analysis Tabs */}
        {!loading && handoverData && workloadData && performanceData && (
          <Tabs colorScheme="blue" variant="enclosed">
            <TabList>
              <Tab>
                🔄 ハンドオーバー分析
                <Badge ml={2} colorScheme="blue">
                  {handoverData.nodes.length} ノード
                </Badge>
              </Tab>
              <Tab>
                📊 作業負荷分析
                <Badge ml={2} colorScheme="green">
                  {workloadData.workload.length} 担当者
                </Badge>
              </Tab>
              <Tab>
                ⏱️ パフォーマンス分析
                <Badge ml={2} colorScheme="purple">
                  {performanceData.performance.length} 担当者
                </Badge>
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel p={0}>
                <VStack align="stretch" spacing={4} h="calc(100vh - 280px)">
                  <Box p={4} bg="blue.50" borderRadius="md">
                    <Text fontSize="sm" color="blue.900">
                      💡 <strong>ハンドオーバー分析:</strong>{" "}
                      誰と誰が連携して作業しているかを可視化します。矢印は作業の引き継ぎ（ハンドオーバー）を表します。
                    </Text>
                  </Box>
                  <Box flex={1}>
                    <HandoverNetwork data={handoverData} />
                  </Box>
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  <Box p={4} bg="green.50" borderRadius="md">
                    <Text fontSize="sm" color="green.900">
                      💡 <strong>作業負荷分析:</strong>{" "}
                      誰の作業量が多いかを可視化します。上位の担当者は作業が集中している可能性があります。
                    </Text>
                  </Box>
                  <WorkloadChart data={workloadData} />
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack align="stretch" spacing={4}>
                  <Box p={4} bg="purple.50" borderRadius="md">
                    <Text fontSize="sm" color="purple.900">
                      💡 <strong>パフォーマンス分析:</strong>{" "}
                      誰の処理時間が長いかを可視化します。上位の担当者はボトルネックになっている可能性があります。
                    </Text>
                  </Box>
                  <PerformanceChart data={performanceData} />
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </VStack>
    </Container>
  );
};

export default OrganizationAnalysisDetail;
