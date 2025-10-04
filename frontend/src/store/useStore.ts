import { create } from 'zustand';
import { Node, Edge, DisplayMetric } from '../types';

interface StoreState {
  nodes: Node[];
  edges: Edge[];
  displayMetric: DisplayMetric;
  pathThreshold: number;

  setGraphData: (nodes: Node[], edges: Edge[]) => void;
  setDisplayMetric: (metric: DisplayMetric) => void;
  setPathThreshold: (threshold: number) => void;
}

export const useStore = create<StoreState>((set) => ({
  nodes: [],
  edges: [],
  displayMetric: 'frequency',
  pathThreshold: 0,

  setGraphData: (nodes, edges) => set({ nodes, edges }),
  setDisplayMetric: (metric) => set({ displayMetric: metric }),
  setPathThreshold: (threshold) => set({ pathThreshold: threshold }),
}));
