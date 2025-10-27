import React, { useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls as FlowControls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node as FlowNode,
  Edge as FlowEdge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Box, Typography, CircularProgress } from "@mui/material";
import { HandoverAnalysis, Node, Edge } from "../types";
import { useLayout } from "../hooks/useLayout";
import { useEdgeStyling } from "../hooks/useEdgeStyling";
import { useStore } from "../store/useStore";
import ActionNode from "./ActionNode";
import BackEdge from "./BackEdge";
import { detectBackEdges } from "../utils/detectBackEdges";
import Controls from "./Controls";

const nodeTypes = {
  actionNode: ActionNode,
};

const edgeTypes = {
  backEdge: BackEdge,
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
      type: "actionNode",
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
  const { layoutedNodes, isLayouting } = useLayout(
    initialNodes,
    initialEdges,
    "DOWN",
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  // エッジにラベルとhiddenフラグを設定
  const edgesWithVisibility = useMemo(() => {
    if (!initialEdges || initialEdges.length === 0) return [];

    const maxFrequency = Math.max(...initialEdges.map((e) => e.data.frequency));

    return initialEdges.map((edge) => {
      const normalizedFreq = edge.data.frequency / maxFrequency;
      const isHidden = normalizedFreq < pathThreshold;

      const label =
        displayMetric === "frequency"
          ? `${edge.data.frequency} 件`
          : `${edge.data.avg_waiting_time_hours.toFixed(1)}時間`;

      return {
        ...edge,
        hidden: isHidden,
        label,
      };
    });
  }, [initialEdges, pathThreshold, displayMetric]);

  // useEdgeStylingでプロセス分析と統一されたスタイルを適用
  const styledEdges = useEdgeStyling(edgesWithVisibility, {
    maxStrokeWidthMultiplier: 3.5,
    excludeStartEndEdges: false, // 組織分析にはSTART/ENDノードがない
  });

  // バックエッジを検出してタイプを設定
  const edgesWithBackEdgeType = useMemo(() => {
    if (!layoutedNodes || layoutedNodes.length === 0 || !styledEdges) {
      return styledEdges;
    }

    const backEdgeIds = detectBackEdges(layoutedNodes, styledEdges);
    const backEdgeIdSet = new Set(backEdgeIds);

    return styledEdges.map((edge) => {
      // エッジキーを "source->target" 形式で作成して比較
      const edgeKey = `${edge.source}->${edge.target}`;
      const isBackEdge = backEdgeIdSet.has(edgeKey);
      return {
        ...edge,
        type: isBackEdge ? "backEdge" : undefined,
        // バックエッジの場合は右側のハンドルを使用
        sourceHandle: isBackEdge ? "right-source" : undefined,
        targetHandle: isBackEdge ? "right-target" : undefined,
      };
    });
  }, [layoutedNodes, styledEdges]);

  // Filter nodes to only show connected ones
  const filteredNodes = useMemo(() => {
    if (!layoutedNodes || layoutedNodes.length === 0) return [];

    const visibleEdges = edgesWithBackEdgeType.filter((edge) => !edge.hidden);
    const connectedNodeIds = new Set<string>();

    visibleEdges.forEach((edge) => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });

    return layoutedNodes.map((node) => ({
      ...node,
      hidden: !connectedNodeIds.has(node.id),
    }));
  }, [layoutedNodes, edgesWithBackEdgeType]);

  // Update React Flow state
  useEffect(() => {
    setNodes(filteredNodes as any);
  }, [filteredNodes, setNodes]);

  useEffect(() => {
    setEdges(edgesWithBackEdgeType as any);
  }, [edgesWithBackEdgeType, setEdges]);

  if (isLayouting) {
    return (
      <Box display="flex" height="100%" flexDirection="row">
        <Box flex={1}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <CircularProgress size={60} />
            <Typography ml={2} color="text.secondary">
              レイアウトを計算中...
            </Typography>
          </Box>
        </Box>
        <Box
          width="300px"
          p={2}
          bgcolor="white"
          borderLeft={1}
          borderColor="grey.300"
        >
          <Controls />
        </Box>
      </Box>
    );
  }

  if (nodes.length === 0) {
    return (
      <Box display="flex" height="100%" flexDirection="row">
        <Box flex={1}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Typography color="text.secondary">データがありません</Typography>
          </Box>
        </Box>
        <Box
          width="300px"
          p={2}
          bgcolor="white"
          borderLeft={1}
          borderColor="grey.300"
        >
          <Controls />
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" height="100%" flexDirection="row">
      <Box flex={1}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-right"
        >
          <Background />
          <FlowControls />
          <MiniMap />
        </ReactFlow>
      </Box>
      <Box
        width="300px"
        p={2}
        bgcolor="white"
        borderLeft={1}
        borderColor="grey.300"
      >
        <Controls />
      </Box>
    </Box>
  );
};

export default HandoverNetwork;
