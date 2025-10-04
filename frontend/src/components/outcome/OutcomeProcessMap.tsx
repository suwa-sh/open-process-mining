/**
 * Outcome analysis process map
 */

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls as FlowControls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import { Box, Spinner, Center, Text, Flex } from '@chakra-ui/react';
import '@xyflow/react/dist/style.css';

import ActionNode from '../ActionNode';
import { useLayout } from '../../hooks/useLayout';
import OutcomeControls from './OutcomeControls';
import type { OutcomeAnalysisDetail, OutcomeStats } from '../../types/outcome';

const nodeTypes = {
  actionNode: ActionNode,
};

interface OutcomeProcessMapProps {
  analysis: OutcomeAnalysisDetail;
  displayMode: 'avg' | 'median' | 'total';
  onDisplayModeChange: (mode: 'avg' | 'median' | 'total') => void;
  showControls?: boolean;
}

const OutcomeProcessMap: React.FC<OutcomeProcessMapProps> = ({
  analysis,
  displayMode,
  onDisplayModeChange,
  showControls = true
}) => {
  const { layoutedNodes, isLayouting } = useLayout(
    analysis.result_data.nodes,
    analysis.result_data.edges
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // エッジに成果メトリックを表示
  const processedEdges = useMemo(() => {
    if (!analysis.result_data.edges) return [];

    const metricName = analysis.metric_name;
    const allStats: OutcomeStats[] = analysis.result_data.edges
      .map((e) => e.data.outcome_stats?.[metricName])
      .filter((s): s is OutcomeStats => s !== undefined);

    if (allStats.length === 0) return analysis.result_data.edges;

    // 正規化のため最大値と最小値を計算
    const values = allStats.map((s) => s[displayMode]);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    return analysis.result_data.edges.map((edge) => {
      const outcomeStats = edge.data.outcome_stats?.[metricName];

      if (!outcomeStats) {
        return {
          ...edge,
          label: `${edge.data.frequency} 件`,
          style: {
            stroke: '#ccc',
            strokeWidth: 2,
          },
        };
      }

      const value = outcomeStats[displayMode];
      const normalized = (value - minValue) / range;

      // 値に応じてエッジの色と太さを設定
      let strokeColor = '#718096'; // デフォルト: グレー
      if (normalized > 0.75) {
        strokeColor = '#38a169'; // 高成果: 緑
      } else if (normalized < 0.25) {
        strokeColor = '#e53e3e'; // 低成果: 赤
      }

      const strokeWidth = Math.max(2, normalized * 8);

      // メトリック単位に応じたラベル表示
      const unit = analysis.result_data.edges[0]?.data.outcome_stats?.[metricName]
        ? getMetricUnit(metricName)
        : '';
      const formattedValue = formatMetricValue(value, metricName);
      const label = `${formattedValue}${unit} (${edge.data.frequency}件)`;

      return {
        ...edge,
        label,
        style: {
          stroke: strokeColor,
          strokeWidth,
        },
      };
    });
  }, [analysis, displayMode]);

  React.useEffect(() => {
    if (layoutedNodes && layoutedNodes.length > 0) {
      setNodes(layoutedNodes);
    }
  }, [layoutedNodes, setNodes]);

  React.useEffect(() => {
    if (processedEdges && processedEdges.length > 0) {
      setEdges(processedEdges);
    }
  }, [processedEdges, setEdges]);

  if (isLayouting) {
    return (
      <Flex h="100%" direction="row">
        <Box flex={1}>
          <Center h="100%">
            <Spinner size="xl" color="green.500" />
            <Text ml={4} color="gray.600">レイアウトを計算中...</Text>
          </Center>
        </Box>
        {showControls && (
          <Box w="300px" p={4} bg="white" borderLeft="1px" borderColor="gray.200">
            <OutcomeControls
              displayMode={displayMode}
              onDisplayModeChange={onDisplayModeChange}
              metricName={analysis.metric_name}
              overallStats={analysis.result_data.summary.overall_stats}
            />
          </Box>
        )}
      </Flex>
    );
  }

  if (!nodes.length || !edges.length) {
    return (
      <Flex h="100%" direction="row">
        <Box flex={1}>
          <Center h="100%">
            <Text color="gray.500">データがありません</Text>
          </Center>
        </Box>
        {showControls && (
          <Box w="300px" p={4} bg="white" borderLeft="1px" borderColor="gray.200">
            <OutcomeControls
              displayMode={displayMode}
              onDisplayModeChange={onDisplayModeChange}
              metricName={analysis.metric_name}
              overallStats={analysis.result_data.summary.overall_stats}
            />
          </Box>
        )}
      </Flex>
    );
  }

  return (
    <Flex h="100%" direction="row">
      <Box flex={1}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          attributionPosition="bottom-right"
        >
          <Background />
          <FlowControls />
          <MiniMap />
        </ReactFlow>
      </Box>
      {showControls && (
        <Box w="300px" p={4} bg="white" borderLeft="1px" borderColor="gray.200">
          <OutcomeControls
            displayMode={displayMode}
            onDisplayModeChange={onDisplayModeChange}
            metricName={analysis.metric_name}
            overallStats={analysis.result_data.summary.overall_stats}
          />
        </Box>
      )}
    </Flex>
  );
};

// ヘルパー関数
function getMetricUnit(metricName: string): string {
  const units: Record<string, string> = {
    revenue: '円',
    profit_margin: '%',
    quantity: '個',
    hiring_cost: '円',
    time_to_hire: '日',
    candidate_score: '点',
  };
  return units[metricName] || '';
}

function formatMetricValue(value: number, metricName: string): string {
  if (metricName === 'revenue' || metricName === 'hiring_cost') {
    return Math.round(value).toLocaleString();
  }
  if (metricName === 'profit_margin') {
    return (value * 100).toFixed(1);
  }
  return value.toFixed(1);
}

export default OutcomeProcessMap;
