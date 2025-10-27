import { useEffect, useState } from "react";
import ELK from "elkjs/lib/elk.bundled.js";
import { Node, Edge } from "../types";

const elk = new ELK();

/**
 * Adjust START/END node positions to align with connected activity nodes.
 * - START node: x-coordinate centered with first activity, y-coordinate gap reduced by half
 * - END node: x-coordinate centered with last activity, y-coordinate kept as-is
 */
const adjustStartEndNodePositions = (nodes: Node[], edges: Edge[]): Node[] => {
  const startNode = nodes.find((n) => n.id === "START");
  const endNode = nodes.find((n) => n.id === "END");

  if (!startNode && !endNode) {
    return nodes;
  }

  const adjustedNodes = nodes.map((node) => {
    if (node.id === "START" && startNode) {
      // Find the first activity that START connects to
      const firstActivityEdge = edges.find((e) => e.source === "START");
      if (firstActivityEdge) {
        const firstActivity = nodes.find(
          (n) => n.id === firstActivityEdge.target,
        );
        if (firstActivity) {
          // Center START node horizontally with first activity
          // Assuming activity node width is 150px and START node width is 16px
          const activityWidth = 150;
          const startNodeWidth = 16;
          const centerOffset = (activityWidth - startNodeWidth) / 2;

          // Reduce the y-coordinate gap by half
          const yGap = firstActivity.position.y - node.position.y;
          const reducedYGap = yGap / 2;

          return {
            ...node,
            position: {
              x: firstActivity.position.x + centerOffset,
              y: firstActivity.position.y - reducedYGap,
            },
          };
        }
      }
    } else if (node.id === "END" && endNode) {
      // Find the first activity that connects to END
      const lastActivityEdge = edges.find((e) => e.target === "END");
      if (lastActivityEdge) {
        const lastActivity = nodes.find(
          (n) => n.id === lastActivityEdge.source,
        );
        if (lastActivity) {
          // Center END node horizontally with last activity
          // Assuming activity node width is 150px and END node width is 20px
          const activityWidth = 150;
          const endNodeWidth = 20;
          const centerOffset = (activityWidth - endNodeWidth) / 2;

          // Keep END node y-coordinate as-is (gap is already good)
          return {
            ...node,
            position: {
              x: lastActivity.position.x + centerOffset,
              y: node.position.y,
            },
          };
        }
      }
    }
    return node;
  });

  return adjustedNodes;
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

      const elkGraph = {
        id: "root",
        layoutOptions: {
          "elk.algorithm": "layered",
          "elk.direction": direction,
          "elk.spacing.nodeNode": "80",
          "elk.layered.spacing.nodeNodeBetweenLayers": "100",
        },
        children: nodes.map((node) => ({
          id: node.id,
          width: 150,
          height: 50,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          sources: [edge.source],
          targets: [edge.target],
        })),
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
