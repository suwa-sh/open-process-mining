import React, { useEffect, useMemo, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls as FlowControls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import { Box, Flex, Spinner, Center, VStack, Text, Button } from '@chakra-ui/react';
import '@xyflow/react/dist/style.css';

import ActionNode from './ActionNode';
import Controls from './Controls';
import { useAnalysisData } from '../hooks/useAnalysisData';
import { useLayout } from '../hooks/useLayout';
import { useStore } from '../store/useStore';

const nodeTypes = {
  actionNode: ActionNode,
};

interface ProcessMapProps {
  analysisId: string | null;
  onBack: () => void;
}

const ProcessMap: React.FC<ProcessMapProps> = ({ analysisId, onBack }) => {
  const { data, loading, error } = useAnalysisData(analysisId);
  const { displayMetric, pathThreshold, setGraphData } = useStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (data) {
      setGraphData(data.nodes, data.edges);
    }
  }, [data, setGraphData]);

  const { layoutedNodes, isLayouting } = useLayout(data?.nodes || [], data?.edges || []);

  const filteredEdges = useMemo(() => {
    if (!data || data.edges.length === 0) return [];

    const maxFrequency = Math.max(...data.edges.map((e) => e.data.frequency));
    const maxWaitingTime = Math.max(...data.edges.map((e) => e.data.avg_waiting_time_hours));

    return data.edges.map((edge) => {
      const normalizedFreq = edge.data.frequency / maxFrequency;
      const normalizedWaitingTime = edge.data.avg_waiting_time_hours / maxWaitingTime;
      const isHidden = normalizedFreq < pathThreshold;

      const label =
        displayMetric === 'frequency'
          ? `${edge.data.frequency} 件`
          : `${edge.data.avg_waiting_time_hours.toFixed(1)}時間`;

      // ハッピーパス（頻度に基づいて線の太さを変える）
      const strokeWidth = Math.max(2, normalizedFreq * 8);

      // 処理時間が長いパスを赤色で強調
      let strokeColor = '#555'; // デフォルト
      if (isHidden) {
        strokeColor = '#ccc';
      } else if (normalizedWaitingTime > 0.7) {
        // 最大待機時間の70%以上は赤色で警告
        strokeColor = '#e53e3e'; // 赤色
      } else if (normalizedFreq > 0.8) {
        // 頻度が高いハッピーパスは青色
        strokeColor = '#3182ce'; // 青色
      }

      return {
        ...edge,
        hidden: isHidden,
        label,
        style: {
          stroke: strokeColor,
          strokeWidth,
        },
      };
    });
  }, [data, pathThreshold, displayMetric]);

  const filteredNodes = useMemo(() => {
    if (!layoutedNodes || layoutedNodes.length === 0) return [];

    // 表示されているエッジに接続されているノードIDを収集
    const visibleEdges = filteredEdges.filter((edge) => !edge.hidden);
    const connectedNodeIds = new Set<string>();

    visibleEdges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    // 接続されているノードのみを表示
    return layoutedNodes.map((node) => ({
      ...node,
      hidden: !connectedNodeIds.has(node.id),
      draggable: true, // ノードをドラッグ可能にする
    }));
  }, [layoutedNodes, filteredEdges]);

  // filteredNodesとfilteredEdgesが更新されたらReact Flowの状態を更新
  // ただし、既存のノード位置は保持する
  useEffect(() => {
    setNodes((currentNodes) => {
      // 現在のノードの位置情報を保存
      const positionMap = new Map(
        currentNodes.map((node) => [node.id, { x: node.position.x, y: node.position.y }])
      );

      // 新しいノードリストに既存の位置をマージ
      return filteredNodes.map((node) => {
        const savedPosition = positionMap.get(node.id);
        return {
          ...node,
          position: savedPosition || node.position, // 既存の位置があれば使用
        };
      });
    });
  }, [filteredNodes, setNodes]);

  useEffect(() => {
    setEdges(filteredEdges);
  }, [filteredEdges, setEdges]);

  if (loading || isLayouting) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>プロセスマップを読み込んでいます...</Text>
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
          <Button onClick={onBack} colorScheme="blue">
            一覧に戻る
          </Button>
        </VStack>
      </Center>
    );
  }

  if (!data) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Text>データがありません</Text>
          <Button onClick={onBack} colorScheme="blue">
            一覧に戻る
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Flex h="100vh" direction="column">
      <Box p={4} borderBottom="1px" borderColor="gray.200">
        <Button onClick={onBack} size="sm" colorScheme="blue" variant="outline">
          ← 一覧に戻る
        </Button>
      </Box>
      <Flex flex={1}>
        <Box flex={1}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            nodesDraggable={true}
            fitView
          >
            <Background />
            <FlowControls />
            <MiniMap />
          </ReactFlow>
        </Box>
        <Box w="300px" p={4} bg="white" borderLeft="1px" borderColor="gray.200">
          <Controls leadTimeStats={data.lead_time_stats} />
        </Box>
      </Flex>
    </Flex>
  );
};

export default ProcessMap;
