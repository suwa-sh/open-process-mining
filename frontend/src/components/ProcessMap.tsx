import React, { useEffect, useMemo } from "react";
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
import {
  Box,
  CircularProgress,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import "@xyflow/react/dist/style.css";

import ActionNode from "./ActionNode";
import StartNode from "./StartNode";
import EndNode from "./EndNode";
import BackEdge from "./BackEdge";
import Controls from "./Controls";
import { useAnalysisData } from "../hooks/useAnalysisData";
import { useLayout } from "../hooks/useLayout";
import { useEdgeStyling } from "../hooks/useEdgeStyling";
import { useStore } from "../store/useStore";
import { detectBackEdges } from "../utils/detectBackEdges";

const nodeTypes = {
  actionNode: ActionNode,
  startNode: StartNode,
  endNode: EndNode,
};

const edgeTypes = {
  backEdge: BackEdge,
};

interface ProcessMapProps {
  analysisId: string | null;
  onBack: () => void;
}

const ProcessMap: React.FC<ProcessMapProps> = ({ analysisId, onBack }) => {
  const { data, loading, error } = useAnalysisData(analysisId);
  const { displayMetric, pathThreshold, setGraphData } = useStore();

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  useEffect(() => {
    if (data) {
      setGraphData(data.nodes, data.edges);
    }
  }, [data, setGraphData]);

  const { layoutedNodes, isLayouting } = useLayout(
    data?.nodes || [],
    data?.edges || [],
  );

  // パスフィルタリング: 閾値以下のエッジを非表示
  const edgesWithVisibility = useMemo(() => {
    if (!data || data.edges.length === 0) return [];

    const maxFrequency = Math.max(...data.edges.map((e) => e.data.frequency));

    return data.edges.map((edge) => {
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
  }, [data, pathThreshold, displayMetric]);

  // エッジスタイリング: 太さ、色、矢印
  const styledEdges = useEdgeStyling(edgesWithVisibility, {
    maxStrokeWidthMultiplier: 3.5,
    excludeStartEndEdges: true,
  });

  // バックエッジを検出してタイプを設定
  const edgesWithBackEdgeType = useMemo(() => {
    if (!layoutedNodes || layoutedNodes.length === 0 || !styledEdges) {
      return styledEdges;
    }

    const backEdgeIds = detectBackEdges(layoutedNodes, styledEdges);
    const backEdgeIdSet = new Set(backEdgeIds);

    return styledEdges.map((edge) => {
      const isBackEdge = backEdgeIdSet.has(edge.id);
      return {
        ...edge,
        type: isBackEdge ? "backEdge" : undefined,
        // バックエッジの場合は右側のハンドルを使用
        sourceHandle: isBackEdge ? "right-source" : undefined,
        targetHandle: isBackEdge ? "right-target" : undefined,
      };
    });
  }, [layoutedNodes, styledEdges]);

  const filteredNodes = useMemo(() => {
    if (!layoutedNodes || layoutedNodes.length === 0) return [];

    // 表示されているエッジに接続されているノードIDを収集
    const visibleEdges = edgesWithBackEdgeType.filter((edge) => !edge.hidden);
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
  }, [layoutedNodes, edgesWithBackEdgeType]);

  // filteredNodesとfilteredEdgesが更新されたらReact Flowの状態を更新
  // ただし、既存のノード位置は保持する
  useEffect(() => {
    setNodes((currentNodes) => {
      // 現在のノードの位置情報を保存
      const positionMap = new Map(
        currentNodes.map((node) => [
          node.id,
          { x: node.position.x, y: node.position.y },
        ]),
      );

      // 新しいノードリストに既存の位置をマージ
      return filteredNodes.map((node) => {
        const savedPosition = positionMap.get(node.id);
        return {
          ...node,
          position: savedPosition || node.position || { x: 0, y: 0 }, // 既存の位置があれば使用
        };
      }) as any;
    });
  }, [filteredNodes, setNodes]);

  useEffect(() => {
    setEdges(edgesWithBackEdgeType as any);
  }, [edgesWithBackEdgeType, setEdges]);

  if (loading || isLayouting) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress size={60} />
          <Typography>プロセスマップを読み込んでいます...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Stack spacing={2} alignItems="center">
          <Typography color="error" fontSize="1.125rem">
            {error}
          </Typography>
          <Button onClick={onBack} variant="contained" color="primary">
            一覧に戻る
          </Button>
        </Stack>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Stack spacing={2} alignItems="center">
          <Typography>データがありません</Typography>
          <Button onClick={onBack} variant="contained" color="primary">
            一覧に戻る
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box p={2} borderBottom={1} borderColor="grey.300">
        <Button
          onClick={onBack}
          size="small"
          variant="outlined"
          color="primary"
        >
          ← 一覧に戻る
        </Button>
      </Box>
      <Box display="flex" flex={1}>
        <Box flex={1}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            nodesDraggable={true}
            fitView
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
          <Controls leadTimeStats={data.lead_time_stats} />
        </Box>
      </Box>
    </Box>
  );
};

export default ProcessMap;
