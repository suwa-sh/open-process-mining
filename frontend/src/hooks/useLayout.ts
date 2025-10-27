import { useEffect, useState } from "react";
import ELK from "elkjs/lib/elk.bundled.js";
import { Node, Edge } from "../types";
import { detectBackEdges } from "../utils/detectBackEdges";

const elk = new ELK();

/**
 * START node位置を調整する
 * @param node 対象ノード
 * @param nodes 全ノード
 * @param edges 全エッジ
 * @returns 調整後のノード、または調整不要の場合は元のノード
 */
const adjustStartNodePosition = (
  node: Node,
  nodes: Node[],
  edges: Edge[],
): Node => {
  const firstActivityEdge = edges.find((e) => e.source === "START");
  if (!firstActivityEdge) return node;

  const firstActivity = nodes.find((n) => n.id === firstActivityEdge.target);
  if (!firstActivity?.position || !node.position) return node;

  const activityWidth = 150;
  const startNodeWidth = 16;
  const centerOffset = (activityWidth - startNodeWidth) / 2;
  const yGap = firstActivity.position.y - node.position.y;
  const reducedYGap = yGap / 2;

  return {
    ...node,
    position: {
      x: firstActivity.position.x + centerOffset,
      y: firstActivity.position.y - reducedYGap,
    },
  };
};

/**
 * END node位置を調整する
 * @param node 対象ノード
 * @param nodes 全ノード
 * @param edges 全エッジ
 * @returns 調整後のノード、または調整不要の場合は元のノード
 */
const adjustEndNodePosition = (
  node: Node,
  nodes: Node[],
  edges: Edge[],
): Node => {
  const lastActivityEdge = edges.find((e) => e.target === "END");
  if (!lastActivityEdge) return node;

  const lastActivity = nodes.find((n) => n.id === lastActivityEdge.source);
  if (!lastActivity?.position || !node.position) return node;

  const activityWidth = 150;
  const endNodeWidth = 20;
  const centerOffset = (activityWidth - endNodeWidth) / 2;

  return {
    ...node,
    position: {
      x: lastActivity.position.x + centerOffset,
      y: node.position.y,
    },
  };
};

/**
 * START/END node位置を調整する
 * - START node: 最初のアクティビティとx座標を揃え、y座標のギャップを半分に
 * - END node: 最後のアクティビティとx座標を揃え、y座標はそのまま
 */
const adjustStartEndNodePositions = (nodes: Node[], edges: Edge[]): Node[] => {
  const startNode = nodes.find((n) => n.id === "START");
  const endNode = nodes.find((n) => n.id === "END");

  if (!startNode && !endNode) {
    return nodes;
  }

  return nodes.map((node) => {
    if (node.id === "START" && startNode) {
      return adjustStartNodePosition(node, nodes, edges);
    } else if (node.id === "END" && endNode) {
      return adjustEndNodePosition(node, nodes, edges);
    }
    return node;
  });
};

export const useLayout = (
  nodes: Node[],
  edges: Edge[],
  direction: "DOWN" | "RIGHT" = "DOWN",
) => {
  const [layoutedNodes, setLayoutedNodes] = useState<Node[]>([]);
  const [isLayouting, setIsLayouting] = useState(false);

  useEffect(() => {
    const runLayout = async () => {
      if (nodes.length === 0) {
        setLayoutedNodes([]);
        return;
      }

      setIsLayouting(true);

      // 1. Detect back edges (rework loops)
      const backEdges = detectBackEdges(nodes, edges);

      // 2. Prepare nodes with layer constraints
      // Use FIRST/LAST constraints for START/END nodes
      const elkNodes = nodes.map((node) => {
        const nodeConfig: any = {
          id: node.id,
          width: 150,
          height: 50,
        };

        // Assign layer constraints
        if (node.id === "START") {
          nodeConfig.layoutOptions = {
            "elk.layered.layering.layerConstraint": "FIRST",
          };
        } else if (node.id === "END") {
          nodeConfig.layoutOptions = {
            "elk.layered.layering.layerConstraint": "LAST",
          };
        }

        return nodeConfig;
      });

      // 4. Prepare edges with feedback flag for back edges
      const elkEdges = edges.map((edge) => {
        const edgeKey = `${edge.source}->${edge.target}`;
        const edgeConfig: any = {
          id: edge.id,
          sources: [edge.source],
          targets: [edge.target],
        };

        // Mark back edges as feedback edges
        if (backEdges.has(edgeKey)) {
          edgeConfig.layoutOptions = {
            "elk.layered.priority.direction": "10", // Lower priority for back edges
          };
        }

        return edgeConfig;
      });

      const elkGraph = {
        id: "root",
        layoutOptions: {
          "elk.algorithm": "layered",
          "elk.direction": direction,
          // Horizontal spacing between nodes in the same layer (increased for better branch visibility)
          "elk.spacing.nodeNode": "150",
          // Vertical spacing between layers
          "elk.layered.spacing.nodeNodeBetweenLayers": "100",
          // Use LONGEST_PATH strategy to arrange longest path vertically
          "elk.layered.layering.strategy": "LONGEST_PATH",
          // Thorough cycle breaking to handle back edges properly
          "elk.layered.cycleBreaking.strategy": "DEPTH_FIRST",
          // Wide layout: spread nodes horizontally
          "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
          "elk.layered.thoroughness": "7",
        },
        children: elkNodes,
        edges: elkEdges,
      };

      try {
        const layout = await elk.layout(elkGraph);

        const nodesWithPosition = nodes.map((node) => {
          const elkNode = layout.children?.find((n) => n.id === node.id);
          return {
            ...node,
            position: { x: elkNode?.x || 0, y: elkNode?.y || 0 },
          };
        });

        // Adjust START/END node x-coordinates to align with first activity
        const adjustedNodes = adjustStartEndNodePositions(
          nodesWithPosition,
          edges,
        );

        setLayoutedNodes(adjustedNodes);
      } catch (error) {
        console.error("Layout error:", error);
        setLayoutedNodes(nodes);
      } finally {
        setIsLayouting(false);
      }
    };

    runLayout();
  }, [nodes, edges, direction]);

  return { layoutedNodes, isLayouting };
};
