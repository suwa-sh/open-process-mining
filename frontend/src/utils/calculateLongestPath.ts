import { Node, Edge } from "../types";

/**
 * バックエッジ（サイクルを形成するエッジ）をエッジキー形式で検出する
 *
 * DFSを使用してバックエッジを特定します。
 * バックエッジは、DFSツリーでノードからその祖先へ向かうエッジです。
 *
 * @param nodes ノードの配列
 * @param edges エッジの配列
 * @returns バックエッジのキー（"source->target"形式）のSet
 *
 * @internal この関数は内部実装用です。エッジIDでバックエッジを取得する場合は
 * `detectBackEdges.ts`の`detectBackEdges()`を使用してください。
 */
function detectBackEdgeKeys(nodes: Node[], edges: Edge[]): Set<string> {
  const adjacencyList = new Map<string, string[]>();
  nodes.forEach((node) => {
    adjacencyList.set(node.id, []);
  });
  edges.forEach((edge) => {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
  });

  const visited = new Set<string>();
  const inStack = new Set<string>();
  const backEdges = new Set<string>();

  function dfs(nodeId: string) {
    visited.add(nodeId);
    inStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    neighbors.forEach((neighbor) => {
      if (!visited.has(neighbor)) {
        dfs(neighbor);
      } else if (inStack.has(neighbor)) {
        // This is a back edge (creates a cycle)
        backEdges.add(`${nodeId}->${neighbor}`);
      }
    });

    inStack.delete(nodeId);
  }

  // Start DFS from nodes with in-degree 0
  const inDegree = new Map<string, number>();
  nodes.forEach((node) => inDegree.set(node.id, 0));
  edges.forEach((edge) => {
    const currentInDegree = inDegree.get(edge.target) || 0;
    inDegree.set(edge.target, currentInDegree + 1);
  });

  nodes.forEach((node) => {
    if (inDegree.get(node.id) === 0 && !visited.has(node.id)) {
      dfs(node.id);
    }
  });

  // Visit remaining unvisited nodes
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });

  return backEdges;
}

/**
 * 最長パスを計算する
 *
 * バックエッジを除外したDAGで、開始ノード（in-degree = 0）から
 * 各ノードまでの最長パス長を計算します。
 *
 * @param nodes ノードの配列
 * @param edges エッジの配列
 * @param backEdges バックエッジのキー（"source->target"形式）のSet
 * @returns ノードIDから最長パス長へのマッピング
 */
function calculateLongestPath(
  nodes: Node[],
  edges: Edge[],
  backEdges: Set<string>,
): Map<string, number> {
  // Filter out back edges
  const forwardEdges = edges.filter(
    (edge) => !backEdges.has(`${edge.source}->${edge.target}`),
  );

  // Build adjacency list with forward edges only
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach((node) => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  forwardEdges.forEach((edge) => {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);

    const currentInDegree = inDegree.get(edge.target) || 0;
    inDegree.set(edge.target, currentInDegree + 1);
  });

  // Topological sort + longest path calculation
  const longestPathLengths = new Map<string, number>();
  const queue: string[] = [];

  nodes.forEach((node) => {
    if (inDegree.get(node.id) === 0) {
      queue.push(node.id);
      longestPathLengths.set(node.id, 0);
    }
  });

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const currentPathLength = longestPathLengths.get(current) || 0;

    const neighbors = adjacencyList.get(current) || [];
    neighbors.forEach((neighbor) => {
      const newPathLength = currentPathLength + 1;
      const existingPathLength = longestPathLengths.get(neighbor) || 0;

      if (newPathLength > existingPathLength) {
        longestPathLengths.set(neighbor, newPathLength);
      }

      const currentInDegree = inDegree.get(neighbor);
      if (currentInDegree === undefined) return;

      inDegree.set(neighbor, currentInDegree - 1);

      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    });
  }

  return longestPathLengths;
}

/**
 * 最長パスに沿ったノードのリストを取得
 *
 * 最長パス長の順にノードIDをソートして返します。
 *
 * @param nodes ノードの配列
 * @param edges エッジの配列
 * @returns 最長パス長でソートされたノードIDの配列
 */
export function getLongestPathNodes(nodes: Node[], edges: Edge[]): string[] {
  const backEdges = detectBackEdgeKeys(nodes, edges);
  const pathLengths = calculateLongestPath(nodes, edges, backEdges);

  // Sort nodes by longest path length
  const sortedNodes = [...nodes].sort((a, b) => {
    const lengthA = pathLengths.get(a.id) || 0;
    const lengthB = pathLengths.get(b.id) || 0;
    return lengthA - lengthB;
  });

  return sortedNodes.map((n) => n.id);
}
