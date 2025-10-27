/**
 * Outcome analysis process map
 */

import React, { useMemo } from "react";
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
import { Box, CircularProgress, Typography } from "@mui/material";
import "@xyflow/react/dist/style.css";

import ActionNode from "../ActionNode";
import StartNode from "../StartNode";
import EndNode from "../EndNode";
import BackEdge from "../BackEdge";
import { useLayout } from "../../hooks/useLayout";
import { useEdgeStyling } from "../../hooks/useEdgeStyling";
import OutcomeControls from "./OutcomeControls";
import { detectBackEdges } from "../../utils/detectBackEdges";
import type {
  OutcomeAnalysisDetail,
  PathDifference,
} from "../../types/outcome";

const nodeTypes = {
  actionNode: ActionNode,
  startNode: StartNode,
  endNode: EndNode,
};

const edgeTypes = {
  backEdge: BackEdge,
};

interface OutcomeProcessMapProps {
  analysis: OutcomeAnalysisDetail;
  displayMode: "avg" | "median" | "total";
  onDisplayModeChange: (mode: "avg" | "median" | "total") => void;
  showControls?: boolean;
  highlightDifferences?: PathDifference[];
}

const OutcomeProcessMap: React.FC<OutcomeProcessMapProps> = ({
  analysis,
  displayMode,
  onDisplayModeChange,
  showControls = true,
  highlightDifferences,
}) => {
  const { layoutedNodes, isLayouting } = useLayout(
    analysis.result_data.nodes || [],
    analysis.result_data.edges || [],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

  // エッジにラベルを設定（成果メトリック or 頻度）
  const edgesWithLabels = useMemo(() => {
    if (!analysis.result_data.edges) return [];

    const metricName = analysis.metric_name;

    // セグメント比較の場合
    if (highlightDifferences && highlightDifferences.length > 0) {
      return analysis.result_data.edges.map((edge) => {
        const waitingTime =
          edge.data.avg_waiting_time_hours?.toFixed(1) || "0.0";
        const label = `${edge.data.frequency} 件 (${waitingTime}h)`;
        return { ...edge, label };
      });
    }

    // 以下はパス別成果分析の場合
    return analysis.result_data.edges.map((edge) => {
      const outcomeStats = edge.data.outcome_stats?.[metricName];

      if (!outcomeStats) {
        return {
          ...edge,
          label: `${edge.data.frequency} 件`,
        };
      }

      const value = outcomeStats[displayMode];

      // メトリック単位に応じたラベル表示
      const unit = analysis.result_data.edges?.[0]?.data.outcome_stats?.[
        metricName
      ]
        ? getMetricUnit(metricName)
        : "";
      const formattedValue = formatMetricValue(value, metricName);
      const label = `${formattedValue}${unit} (${edge.data.frequency}件)`;

      return {
        ...edge,
        label,
      };
    });
  }, [analysis, displayMode, highlightDifferences]);

  // useEdgeStylingでプロセス分析と統一されたスタイルを適用
  // セグメント比較でもプロセス分析と同じ色ルール（頻度80%以上: 青、待機時間70%以上: 赤）
  const styledEdges = useEdgeStyling(edgesWithLabels, {
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

  React.useEffect(() => {
    if (layoutedNodes && layoutedNodes.length > 0) {
      setNodes(layoutedNodes as any);
    }
  }, [layoutedNodes, setNodes]);

  React.useEffect(() => {
    if (edgesWithBackEdgeType && edgesWithBackEdgeType.length > 0) {
      setEdges(edgesWithBackEdgeType as any);
    }
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
            <CircularProgress size={60} sx={{ color: "success.main" }} />
            <Typography ml={2} color="text.secondary">
              レイアウトを計算中...
            </Typography>
          </Box>
        </Box>
        {showControls && (
          <Box
            width="300px"
            p={2}
            bgcolor="white"
            borderLeft={1}
            borderColor="grey.300"
          >
            <OutcomeControls
              displayMode={displayMode}
              onDisplayModeChange={onDisplayModeChange}
              metricName={analysis.metric_name}
              overallStats={analysis.result_data.summary.overall_stats}
            />
          </Box>
        )}
      </Box>
    );
  }

  if (!nodes.length || !edges.length) {
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
        {showControls && (
          <Box
            width="300px"
            p={2}
            bgcolor="white"
            borderLeft={1}
            borderColor="grey.300"
          >
            <OutcomeControls
              displayMode={displayMode}
              onDisplayModeChange={onDisplayModeChange}
              metricName={analysis.metric_name}
              overallStats={analysis.result_data.summary.overall_stats}
            />
          </Box>
        )}
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
        <Box
          width="300px"
          p={2}
          bgcolor="white"
          borderLeft={1}
          borderColor="grey.300"
        >
          <OutcomeControls
            displayMode={displayMode}
            onDisplayModeChange={onDisplayModeChange}
            metricName={analysis.metric_name}
            overallStats={analysis.result_data.summary.overall_stats}
          />
        </Box>
      )}
    </Box>
  );
};

// ヘルパー関数
function getMetricUnit(metricName: string): string {
  const units: Record<string, string> = {
    revenue: "円",
    profit_margin: "%",
    quantity: "個",
    hiring_cost: "円",
    time_to_hire: "日",
    candidate_score: "点",
  };
  return units[metricName] || "";
}

function formatMetricValue(value: number, metricName: string): string {
  if (metricName === "revenue" || metricName === "hiring_cost") {
    return Math.round(value).toLocaleString();
  }
  if (metricName === "profit_margin") {
    return (value * 100).toFixed(1);
  }
  return value.toFixed(1);
}

export default OutcomeProcessMap;
