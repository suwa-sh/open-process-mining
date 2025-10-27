import { detectBackEdges } from "./detectBackEdges";
import { Node, Edge } from "../types";

describe("detectBackEdges", () => {
  describe("detectBackEdges_サイクルがない場合_空Setを返すこと", () => {
    test("線形フローの場合", () => {
      // Given: A → B → C
      const nodes: Node[] = [
        {
          id: "A",
          type: "actionNode",
          data: { label: "A" },
          position: { x: 0, y: 0 },
        },
        {
          id: "B",
          type: "actionNode",
          data: { label: "B" },
          position: { x: 0, y: 100 },
        },
        {
          id: "C",
          type: "actionNode",
          data: { label: "C" },
          position: { x: 0, y: 200 },
        },
      ];
      const edges: Edge[] = [
        { id: "e1", source: "A", target: "B", data: { frequency: 10 } },
        { id: "e2", source: "B", target: "C", data: { frequency: 10 } },
      ];

      // When
      const backEdges = detectBackEdges(nodes, edges);

      // Then
      expect(backEdges).toEqual(new Set());
    });

    test("分岐があるが戻りがない場合", () => {
      // Given: A → B → D
      //            ↘ C ↗
      const nodes: Node[] = [
        {
          id: "A",
          type: "actionNode",
          data: { label: "A" },
          position: { x: 0, y: 0 },
        },
        {
          id: "B",
          type: "actionNode",
          data: { label: "B" },
          position: { x: 0, y: 100 },
        },
        {
          id: "C",
          type: "actionNode",
          data: { label: "C" },
          position: { x: 100, y: 100 },
        },
        {
          id: "D",
          type: "actionNode",
          data: { label: "D" },
          position: { x: 0, y: 200 },
        },
      ];
      const edges: Edge[] = [
        { id: "e1", source: "A", target: "B", data: { frequency: 10 } },
        { id: "e2", source: "A", target: "C", data: { frequency: 5 } },
        { id: "e3", source: "B", target: "D", data: { frequency: 10 } },
        { id: "e4", source: "C", target: "D", data: { frequency: 5 } },
      ];

      // When
      const backEdges = detectBackEdges(nodes, edges);

      // Then
      expect(backEdges).toEqual(new Set());
    });
  });

  describe("detectBackEdges_単純なサイクルの場合_バックエッジを検出すること", () => {
    test("2ノードのサイクル: A → B → A", () => {
      // Given
      const nodes: Node[] = [
        {
          id: "A",
          type: "actionNode",
          data: { label: "A" },
          position: { x: 0, y: 0 },
        },
        {
          id: "B",
          type: "actionNode",
          data: { label: "B" },
          position: { x: 0, y: 100 },
        },
      ];
      const edges: Edge[] = [
        { id: "e1", source: "A", target: "B", data: { frequency: 10 } },
        { id: "e2", source: "B", target: "A", data: { frequency: 3 } }, // バックエッジ
      ];

      // When
      const backEdges = detectBackEdges(nodes, edges);

      // Then
      expect(backEdges).toEqual(new Set(["B->A"]));
    });

    test("3ノードのサイクル: A → B → C → A", () => {
      // Given
      const nodes: Node[] = [
        {
          id: "A",
          type: "actionNode",
          data: { label: "A" },
          position: { x: 0, y: 0 },
        },
        {
          id: "B",
          type: "actionNode",
          data: { label: "B" },
          position: { x: 0, y: 100 },
        },
        {
          id: "C",
          type: "actionNode",
          data: { label: "C" },
          position: { x: 0, y: 200 },
        },
      ];
      const edges: Edge[] = [
        { id: "e1", source: "A", target: "B", data: { frequency: 10 } },
        { id: "e2", source: "B", target: "C", data: { frequency: 10 } },
        { id: "e3", source: "C", target: "A", data: { frequency: 3 } }, // バックエッジ
      ];

      // When
      const backEdges = detectBackEdges(nodes, edges);

      // Then
      expect(backEdges).toEqual(new Set(["C->A"]));
    });
  });

  describe("detectBackEdges_複雑なサイクルの場合_すべてのバックエッジを検出すること", () => {
    test("複数のサイクル", () => {
      // Given: A → B → C → D
      //            ↑_____↓
      const nodes: Node[] = [
        {
          id: "A",
          type: "actionNode",
          data: { label: "A" },
          position: { x: 0, y: 0 },
        },
        {
          id: "B",
          type: "actionNode",
          data: { label: "B" },
          position: { x: 0, y: 100 },
        },
        {
          id: "C",
          type: "actionNode",
          data: { label: "C" },
          position: { x: 0, y: 200 },
        },
        {
          id: "D",
          type: "actionNode",
          data: { label: "D" },
          position: { x: 0, y: 300 },
        },
      ];
      const edges: Edge[] = [
        { id: "e1", source: "A", target: "B", data: { frequency: 10 } },
        { id: "e2", source: "B", target: "C", data: { frequency: 10 } },
        { id: "e3", source: "C", target: "D", data: { frequency: 7 } },
        { id: "e4", source: "D", target: "B", data: { frequency: 3 } }, // バックエッジ
      ];

      // When
      const backEdges = detectBackEdges(nodes, edges);

      // Then
      expect(backEdges).toEqual(new Set(["D->B"]));
    });

    test("実際の請求プロセス: 承認申請 → 差戻 → 修正 → 再申請 → 承認申請", () => {
      // Given
      const nodes: Node[] = [
        {
          id: "請求書作成",
          type: "actionNode",
          data: { label: "請求書作成" },
          position: { x: 0, y: 0 },
        },
        {
          id: "承認申請",
          type: "actionNode",
          data: { label: "承認申請" },
          position: { x: 0, y: 100 },
        },
        {
          id: "差戻",
          type: "actionNode",
          data: { label: "差戻" },
          position: { x: 0, y: 200 },
        },
        {
          id: "修正",
          type: "actionNode",
          data: { label: "修正" },
          position: { x: 0, y: 300 },
        },
        {
          id: "再申請",
          type: "actionNode",
          data: { label: "再申請" },
          position: { x: 0, y: 400 },
        },
        {
          id: "承認完了",
          type: "actionNode",
          data: { label: "承認完了" },
          position: { x: 0, y: 500 },
        },
      ];
      const edges: Edge[] = [
        {
          id: "e1",
          source: "請求書作成",
          target: "承認申請",
          data: { frequency: 180 },
        },
        {
          id: "e2",
          source: "承認申請",
          target: "差戻",
          data: { frequency: 43 },
        },
        { id: "e3", source: "差戻", target: "修正", data: { frequency: 43 } },
        { id: "e4", source: "修正", target: "再申請", data: { frequency: 43 } },
        {
          id: "e5",
          source: "再申請",
          target: "承認申請",
          data: { frequency: 43 },
        }, // バックエッジ
        {
          id: "e6",
          source: "承認申請",
          target: "承認完了",
          data: { frequency: 180 },
        },
      ];

      // When
      const backEdges = detectBackEdges(nodes, edges);

      // Then
      expect(backEdges).toEqual(new Set(["再申請->承認申請"]));
    });
  });

  describe("detectBackEdges_START/ENDノードを含む場合_正しく動作すること", () => {
    test("START/ENDノードがあってもバックエッジを検出できる", () => {
      // Given: START → A → B → A → END
      const nodes: Node[] = [
        {
          id: "START",
          type: "startNode",
          data: { label: "START" },
          position: { x: 0, y: 0 },
        },
        {
          id: "A",
          type: "actionNode",
          data: { label: "A" },
          position: { x: 0, y: 100 },
        },
        {
          id: "B",
          type: "actionNode",
          data: { label: "B" },
          position: { x: 0, y: 200 },
        },
        {
          id: "END",
          type: "endNode",
          data: { label: "END" },
          position: { x: 0, y: 300 },
        },
      ];
      const edges: Edge[] = [
        { id: "e1", source: "START", target: "A", data: { frequency: 10 } },
        { id: "e2", source: "A", target: "B", data: { frequency: 10 } },
        { id: "e3", source: "B", target: "A", data: { frequency: 3 } }, // バックエッジ
        { id: "e4", source: "A", target: "END", data: { frequency: 10 } },
      ];

      // When
      const backEdges = detectBackEdges(nodes, edges);

      // Then
      expect(backEdges).toEqual(new Set(["B->A"]));
    });
  });

  describe("detectBackEdges_エッジがない場合_空Setを返すこと", () => {
    test("ノードのみでエッジが0個", () => {
      // Given
      const nodes: Node[] = [
        {
          id: "A",
          type: "actionNode",
          data: { label: "A" },
          position: { x: 0, y: 0 },
        },
      ];
      const edges: Edge[] = [];

      // When
      const backEdges = detectBackEdges(nodes, edges);

      // Then
      expect(backEdges).toEqual(new Set());
    });
  });
});
