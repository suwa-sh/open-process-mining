/**
 * バックエッジコンポーネント
 *
 * サイクルを形成するエッジを横方向（曲線）で表示するカスタムエッジ
 * ノードの右側から接続し、完全なベジェ曲線で描画
 */

import React from "react";
import { BaseEdge, EdgeProps, getBezierPath, Position } from "@xyflow/react";

const BackEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
}) => {
  // ノードの右側から接続するように設定
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: Position.Right,
    targetX,
    targetY,
    targetPosition: Position.Right,
    // 横方向に大きく膨らませるため、curvatureを調整
    curvature: 0.25,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      {label && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-30}
            y={-10}
            width={60}
            height={20}
            fill={labelBgStyle?.fill || "white"}
            fillOpacity={labelBgStyle?.fillOpacity || 0.9}
            rx={3}
          />
          <text
            style={{
              fontSize: "10px",
              fill: labelStyle?.fill || "#000",
              ...labelStyle,
            }}
            textAnchor="middle"
            y={4}
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
};

export default BackEdge;
