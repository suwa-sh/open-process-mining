/**
 * バックエッジコンポーネント
 *
 * サイクルを形成するエッジを横方向（直角コネクタ、角丸あり）で表示するカスタムエッジ
 * ノードの右側から接続し、直角の折れ線（角を丸める）で描画
 */

import React from "react";
import { BaseEdge, EdgeProps } from "@xyflow/react";

const BackEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  label,
  labelStyle,
  labelBgStyle,
}) => {
  // 直角コネクタのパラメータ
  const offset = 80; // 横方向のオフセット（ピクセル）
  const cornerRadius = 10; // 角の丸め半径（ピクセル）

  // 制御点を計算
  const rightX = Math.max(sourceX, targetX) + offset;
  const midY = (sourceY + targetY) / 2;

  // 直角コネクタのパス生成（角丸あり）
  // sourceから右へ → 下/上へ → 左へtargetへ
  const edgePath = `
    M ${sourceX},${sourceY}
    L ${rightX - cornerRadius},${sourceY}
    Q ${rightX},${sourceY} ${rightX},${sourceY + (sourceY < targetY ? cornerRadius : -cornerRadius)}
    L ${rightX},${targetY + (sourceY < targetY ? -cornerRadius : cornerRadius)}
    Q ${rightX},${targetY} ${rightX - cornerRadius},${targetY}
    L ${targetX},${targetY}
  `;

  // ラベルの位置を右側の中央に配置
  const labelX = rightX;
  const labelY = midY;

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
