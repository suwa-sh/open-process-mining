import { useMemo } from "react";
import { MarkerType } from "@xyflow/react";
import { Edge } from "../types";

/**
 * エッジスタイリング設定
 */
export interface EdgeStylingOptions {
  /** 頻度ベースの太さ調整の最大乗数（デフォルト: 3.5） */
  maxStrokeWidthMultiplier?: number;
  /** 最小太さ（デフォルト: 2） */
  minStrokeWidth?: number;
  /** 高頻度パス閾値（デフォルト: 0.8） */
  highFrequencyThreshold?: number;
  /** 長待機時間パス閾値（デフォルト: 0.7） */
  longWaitingTimeThreshold?: number;
  /** 矢印を表示するか（デフォルト: true） */
  showArrows?: boolean;
  /** START/ENDエッジを除外するか（デフォルト: false） */
  excludeStartEndEdges?: boolean;
}

/**
 * 共通のエッジスタイリングロジックを提供するカスタムフック
 *
 * 機能:
 * - 頻度ベースの太さ調整（normalizedFreq * maxStrokeWidthMultiplier）
 * - 色分け（高頻度: 青、長待機時間: 赤、デフォルト: グレー）
 * - 矢印マーカー（ArrowClosed）
 * - START/ENDエッジの除外オプション
 */
export const useEdgeStyling = (
  edges: Edge[],
  options: EdgeStylingOptions = {},
) => {
  const {
    maxStrokeWidthMultiplier = 3.5,
    minStrokeWidth = 2,
    highFrequencyThreshold = 0.8,
    longWaitingTimeThreshold = 0.7,
    showArrows = true,
    excludeStartEndEdges = false,
  } = options;

  return useMemo(() => {
    if (!edges || edges.length === 0) return [];

    const maxFrequency = Math.max(...edges.map((e) => e.data.frequency));
    const maxWaitingTime = Math.max(
      ...edges.map((e) => e.data.avg_waiting_time_hours || 0),
    );

    return edges.map((edge) => {
      const normalizedFreq = edge.data.frequency / maxFrequency;
      const normalizedWaitingTime =
        (edge.data.avg_waiting_time_hours || 0) / maxWaitingTime;

      // START/ENDノードに接続するエッジかどうか判定
      const isStartOrEndEdge = edge.source === "START" || edge.target === "END";

      // エッジの太さ
      // START/ENDエッジを除外する場合は固定幅、それ以外は頻度ベース
      const strokeWidth =
        excludeStartEndEdges && isStartOrEndEdge
          ? minStrokeWidth
          : Math.max(minStrokeWidth, normalizedFreq * maxStrokeWidthMultiplier);

      // エッジの色
      let strokeColor = "#555"; // デフォルト
      if (edge.hidden) {
        strokeColor = "#ccc";
      } else if (excludeStartEndEdges && isStartOrEndEdge) {
        // START/ENDエッジは強調しない（デフォルト色を使用）
      } else if (normalizedWaitingTime > longWaitingTimeThreshold) {
        // 長待機時間パスは赤色で警告
        strokeColor = "#e53e3e";
      } else if (normalizedFreq > highFrequencyThreshold) {
        // 高頻度パスは青色
        strokeColor = "#3182ce";
      }

      // 矢印マーカー
      const markerEnd = showArrows
        ? {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
          }
        : undefined;

      return {
        ...edge,
        markerEnd,
        style: {
          stroke: strokeColor,
          strokeWidth,
        },
      };
    });
  }, [
    edges,
    maxStrokeWidthMultiplier,
    minStrokeWidth,
    highFrequencyThreshold,
    longWaitingTimeThreshold,
    showArrows,
    excludeStartEndEdges,
  ]);
};
