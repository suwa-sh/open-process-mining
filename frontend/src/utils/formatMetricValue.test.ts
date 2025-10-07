import { formatMetricValue } from "./formatMetricValue";

describe("formatMetricValue", () => {
  describe("formatMetricValue_金額系メトリックの場合_通貨記号付きで整数に丸めること", () => {
    it("revenueメトリックの場合", () => {
      // Given: 売上メトリックと金額値
      const value = 123456.789;
      const metricName = "revenue";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: 通貨記号付き、整数に丸め、カンマ区切りで表示
      expect(result).toBe("¥123,457");
    });

    it("hiring_costメトリックの場合", () => {
      // Given: 採用コストメトリックと金額値
      const value = 50000.5;
      const metricName = "hiring_cost";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: 通貨記号付き、整数に丸め、カンマ区切りで表示
      expect(result).toBe("¥50,001");
    });
  });

  describe("formatMetricValue_パーセンテージメトリックの場合_100倍してパーセント表示すること", () => {
    it("profit_marginが0.27の場合_27.0%と表示されること", () => {
      // Given: 利益率メトリックと小数値（0.27 = 27%）
      const value = 0.27;
      const metricName = "profit_margin";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: 100倍して小数点1桁、%記号付きで表示
      expect(result).toBe("27.0%");
    });

    it("profit_marginが0.12345の場合_12.3%と表示されること", () => {
      // Given: 利益率メトリックと小数値（0.12345 = 12.345%）
      const value = 0.12345;
      const metricName = "profit_margin";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: 100倍して小数点1桁、%記号付きで表示
      expect(result).toBe("12.3%");
    });

    it("profit_marginが1.0の場合_100.0%と表示されること", () => {
      // Given: 利益率メトリックと1.0（100%）
      const value = 1.0;
      const metricName = "profit_margin";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: 100倍して小数点1桁、%記号付きで表示
      expect(result).toBe("100.0%");
    });
  });

  describe("formatMetricValue_数値系メトリックの場合_小数点1桁で表示すること", () => {
    it("quantityメトリックの場合", () => {
      // Given: 数量メトリックと数値
      const value = 15.789;
      const metricName = "quantity";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: 小数点1桁で表示
      expect(result).toBe("15.8");
    });

    it("time_to_hireメトリックの場合", () => {
      // Given: 採用期間メトリックと数値
      const value = 30.123;
      const metricName = "time_to_hire";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: 小数点1桁で表示
      expect(result).toBe("30.1");
    });

    it("candidate_scoreメトリックの場合", () => {
      // Given: 候補者スコアメトリックと数値
      const value = 85.67;
      const metricName = "candidate_score";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: 小数点1桁で表示
      expect(result).toBe("85.7");
    });
  });

  describe("formatMetricValue_その他メトリックの場合_小数点2桁でカンマ区切り表示すること", () => {
    it("未知のメトリック名の場合", () => {
      // Given: 未定義のメトリック名と数値
      const value = 1234.567;
      const metricName = "unknown_metric";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: 小数点2桁、カンマ区切りで表示
      expect(result).toBe("1,234.57");
    });

    it("小数点以下が0の場合でも2桁表示すること", () => {
      // Given: 整数値
      const value = 1000;
      const metricName = "other_metric";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: 小数点2桁（.00付き）、カンマ区切りで表示
      expect(result).toBe("1,000.00");
    });
  });

  describe("formatMetricValue_境界値の場合_正しく処理すること", () => {
    it("0の場合", () => {
      // Given: ゼロ値
      const value = 0;
      const metricName = "revenue";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: ¥0と表示
      expect(result).toBe("¥0");
    });

    it("負の値の場合", () => {
      // Given: 負の値
      const value = -500.5;
      const metricName = "revenue";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: マイナス記号付きで表示（四捨五入）
      expect(result).toBe("¥-500");
    });

    it("非常に大きな値の場合", () => {
      // Given: 大きな値
      const value = 9999999.99;
      const metricName = "revenue";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName);

      // Then: カンマ区切りで表示
      expect(result).toBe("¥10,000,000");
    });
  });

  describe("formatMetricValue_metricUnitパラメータ指定の場合_単位に応じてフォーマットすること", () => {
    it("JPY単位の場合_通貨フォーマットで表示されること", () => {
      // Given: 金額値とJPY単位
      const value = 123456.789;
      const metricName = "amount"; // メトリック名は任意
      const metricUnit = "JPY";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName, metricUnit);

      // Then: 通貨記号付き、整数に丸め、カンマ区切りで表示
      expect(result).toBe("¥123,457");
    });

    it("percent単位の場合_100倍してパーセント表示されること", () => {
      // Given: パーセント値とpercent単位
      const value = 0.27;
      const metricName = "completion_rate"; // メトリック名は任意
      const metricUnit = "percent";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName, metricUnit);

      // Then: 100倍して小数点1桁、%記号付きで表示
      expect(result).toBe("27.0%");
    });

    it("count単位の場合_小数点1桁で表示されること", () => {
      // Given: カウント値とcount単位
      const value = 15.789;
      const metricName = "defect_count";
      const metricUnit = "count";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName, metricUnit);

      // Then: 小数点1桁で表示
      expect(result).toBe("15.8");
    });

    it("days単位の場合_小数点1桁で表示されること", () => {
      // Given: 日数値とdays単位
      const value = 7.345;
      const metricName = "cycle_time_days";
      const metricUnit = "days";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName, metricUnit);

      // Then: 小数点1桁で表示
      expect(result).toBe("7.3");
    });

    it("hours単位の場合_小数点1桁で表示されること", () => {
      // Given: 時間値とhours単位
      const value = 12.567;
      const metricName = "resolution_time_hours";
      const metricUnit = "hours";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName, metricUnit);

      // Then: 小数点1桁で表示
      expect(result).toBe("12.6");
    });

    it("score単位の場合_小数点1桁で表示されること", () => {
      // Given: スコア値とscore単位
      const value = 85.67;
      const metricName = "candidate_score";
      const metricUnit = "score";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName, metricUnit);

      // Then: 小数点1桁で表示
      expect(result).toBe("85.7");
    });

    it("points単位の場合_小数点1桁で表示されること", () => {
      // Given: ポイント値とpoints単位
      const value = 13.456;
      const metricName = "story_points";
      const metricUnit = "points";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName, metricUnit);

      // Then: 小数点1桁で表示
      expect(result).toBe("13.5");
    });

    it("weight単位の場合_小数点1桁で表示されること", () => {
      // Given: 重み値とweight単位
      const value = 2.789;
      const metricName = "priority_weight";
      const metricUnit = "weight";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName, metricUnit);

      // Then: 小数点1桁で表示
      expect(result).toBe("2.8");
    });

    it("未知の単位の場合_デフォルトフォーマットで表示されること", () => {
      // Given: 任意の値と未知の単位
      const value = 1234.567;
      const metricName = "custom_metric";
      const metricUnit = "unknown_unit";

      // When: フォーマット関数を実行
      const result = formatMetricValue(value, metricName, metricUnit);

      // Then: 小数点2桁、カンマ区切りで表示
      expect(result).toBe("1,234.57");
    });
  });
});
