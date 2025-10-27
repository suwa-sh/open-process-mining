import { Node, Edge } from "../types";

/**
 * バックエッジ（サイクルを形成するエッジ）を検出する
 *
 * DFS（深さ優先探索）を使用してグラフのサイクルを検出し、
 * サイクルを形成するバックエッジをエッジキー形式（"source->target"）で返す。
 *
 * @param nodes ノードの配列
 * @param edges エッジの配列
 * @returns バックエッジのキー（"source->target"形式）のSet
 */
export function detectBackEdges(nodes: Node[], edges: Edge[]): Set<string> {
  const backEdgeKeys = new Set<string>();

  // ノードIDからエッジのリストへのマッピング
  const adjacencyList = new Map<string, Edge[]>();
  nodes.forEach((node) => adjacencyList.set(node.id, []));
  edges.forEach((edge) => {
    const list = adjacencyList.get(edge.source);
    if (list) {
      list.push(edge);
    }
  });

  // DFSの状態管理
  const visited = new Set<string>();
  const visiting = new Set<string>(); // 現在のDFSパス上にあるノード

  function dfs(nodeId: string) {
    visited.add(nodeId);
    visiting.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const edge of neighbors) {
      const targetId = edge.target;

      if (visiting.has(targetId)) {
        // 訪問中のノードへの接続 = バックエッジ（サイクル形成）
        backEdgeKeys.add(`${edge.source}->${edge.target}`);
      } else if (!visited.has(targetId)) {
        // 未訪問のノードを探索
        dfs(targetId);
      }
    }

    visiting.delete(nodeId);
  }

  // すべてのノードからDFSを開始（非連結グラフに対応）
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });

  return backEdgeKeys;
}
