import { useEffect, useState } from "react";
import ELK from "elkjs/lib/elk.bundled.js";
import { Node, Edge } from "../types";

const elk = new ELK();

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

        setLayoutedNodes(nodesWithPosition);
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
