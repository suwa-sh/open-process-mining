import React, { useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls as FlowControls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Text, Spinner, Center, Flex } from '@chakra-ui/react';
import { HandoverAnalysis, Node, Edge } from '../types';
import { useLayout } from '../hooks/useLayout';
import { useStore } from '../store/useStore';
import OrganizationNode from './OrganizationNode';
import Controls from './Controls';

const nodeTypes = {
  organizationNode: OrganizationNode,
};

interface HandoverNetworkProps {
  data: HandoverAnalysis;
}

const HandoverNetwork: React.FC<HandoverNetworkProps> = ({ data }) => {
  const { displayMetric, pathThreshold } = useStore();

  // Convert handover data to our standard Node/Edge format
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = data.nodes.map((node) => ({
      id: node.id,
      type: 'organizationNode',
      data: {
        label: node.label,
        frequency: node.activity_count,
      },
      position: { x: 0, y: 0 },
    }));

    const edges: Edge[] = data.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.source,
      target: edge.target,
      data: {
        frequency: edge.handover_count,
        avg_waiting_time_hours: edge.avg_waiting_time_hours || 0,
      },
    }));

    return { initialNodes: nodes, initialEdges: edges };
  }, [data]);

  // Use layout hook to calculate positions
  const { layoutedNodes, isLayouting } = useLayout(initialNodes, initialEdges, 'DOWN');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Filter and style edges based on threshold and metric
  const filteredEdges = useMemo(() => {
    if (!initialEdges || initialEdges.length === 0) return [];

    const maxFrequency = Math.max(...initialEdges.map((e) => e.data.frequency));
    const maxWaitingTime = Math.max(...initialEdges.map((e) => e.data.avg_waiting_time_hours));

    return initialEdges.map((edge) => {
      const normalizedFreq = edge.data.frequency / maxFrequency;
      const normalizedWaitingTime = edge.data.avg_waiting_time_hours / maxWaitingTime;
      const isHidden = normalizedFreq < pathThreshold;

      const label =
        displayMetric === 'frequency'
          ? `${edge.data.frequency} 件`
          : `${edge.data.avg_waiting_time_hours.toFixed(1)}時間`;

      const strokeWidth = Math.max(2, normalizedFreq * 8);

      // Color based on waiting time and frequency (same logic as ProcessMap)
      let strokeColor = '#555'; // Default
      if (isHidden) {
        strokeColor = '#ccc';
      } else if (normalizedWaitingTime > 0.7) {
        strokeColor = '#e53e3e'; // Red for long waiting time
      } else if (normalizedFreq > 0.8) {
        strokeColor = '#3182ce'; // Blue for high-frequency paths
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
  }, [initialEdges, pathThreshold, displayMetric]);

  // Filter nodes to only show connected ones
  const filteredNodes = useMemo(() => {
    if (!layoutedNodes || layoutedNodes.length === 0) return [];

    const visibleEdges = filteredEdges.filter((edge) => !edge.hidden);
    const connectedNodeIds = new Set<string>();

    visibleEdges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    return layoutedNodes.map((node) => ({
      ...node,
      hidden: !connectedNodeIds.has(node.id),
    }));
  }, [layoutedNodes, filteredEdges]);

  // Update React Flow state
  useEffect(() => {
    setNodes(filteredNodes);
  }, [filteredNodes, setNodes]);

  useEffect(() => {
    setEdges(filteredEdges);
  }, [filteredEdges, setEdges]);

  if (isLayouting) {
    return (
      <Flex h="100%" direction="row">
        <Box flex={1}>
          <Center h="100%">
            <Spinner size="xl" color="blue.500" />
            <Text ml={4} color="gray.600">レイアウトを計算中...</Text>
          </Center>
        </Box>
        <Box w="300px" p={4} bg="white" borderLeft="1px" borderColor="gray.200">
          <Controls />
        </Box>
      </Flex>
    );
  }

  if (nodes.length === 0) {
    return (
      <Flex h="100%" direction="row">
        <Box flex={1}>
          <Center h="100%">
            <Text color="gray.500">データがありません</Text>
          </Center>
        </Box>
        <Box w="300px" p={4} bg="white" borderLeft="1px" borderColor="gray.200">
          <Controls />
        </Box>
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
          attributionPosition="bottom-right"
        >
          <Background />
          <FlowControls />
          <MiniMap />
        </ReactFlow>
      </Box>
      <Box w="300px" p={4} bg="white" borderLeft="1px" borderColor="gray.200">
        <Controls />
      </Box>
    </Flex>
  );
};

export default HandoverNetwork;
