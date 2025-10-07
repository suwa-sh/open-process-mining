/**
 * メトリック値をフォーマットする
 * @param value メトリック値
 * @param metricName メトリック名（後方互換性のため保持）
 * @param metricUnit メトリック単位（推奨: JPY, percent, count, days, hours, points, score, weight）
 * @returns フォーマット済み文字列
 */
export function formatMetricValue(
  value: number,
  metricName: string,
  metricUnit?: string,
): string {
  // metric_unitベースのフォーマット（推奨）
  if (metricUnit) {
    switch (metricUnit) {
      case "JPY":
        // 金額（整数に丸めてカンマ区切り）
        return `¥${Math.round(value).toLocaleString()}`;

      case "percent":
        // パーセンテージ（0.27 → 27.0%）
        return `${(value * 100).toFixed(1)}%`;

      case "count":
      case "score":
      case "weight":
      case "points":
        // カウント系（小数点1桁）
        return value.toFixed(1);

      case "days":
      case "hours":
        // 時間系（小数点1桁）
        return value.toFixed(1);

      default: {
        // 未知の単位（2桁丸め + カンマ区切り）
        const roundedValue = Math.round(value * 100) / 100;
        return roundedValue.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
    }
  }

  // 後方互換性: metricNameベースのフォーマット（非推奨）
  // 金額系メトリック
  if (metricName === "revenue" || metricName === "hiring_cost") {
    return `¥${Math.round(value).toLocaleString()}`;
  }

  // パーセンテージメトリック（0.27 → 27%）
  if (metricName === "profit_margin") {
    return `${(value * 100).toFixed(1)}%`;
  }

  // 数値系メトリック（小数点1桁）
  if (
    metricName === "quantity" ||
    metricName === "time_to_hire" ||
    metricName === "candidate_score"
  ) {
    return value.toFixed(1);
  }

  // デフォルト（2桁丸め + カンマ区切り）
  const roundedValue = Math.round(value * 100) / 100;
  return roundedValue.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
