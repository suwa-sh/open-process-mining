/**
 * Outcome analysis state management
 */

import { create } from 'zustand';
import type {
  MetricInfo,
  OutcomeAnalysisSummary,
  OutcomeAnalysisDetail,
  CreateOutcomeAnalysisParams,
} from '../types/outcome';
import {
  fetchAvailableMetrics,
  fetchOutcomeAnalyses,
  fetchOutcomeAnalysisById,
  createOutcomeAnalysis,
} from '../api/outcomeApi';

interface OutcomeState {
  analyses: OutcomeAnalysisSummary[];
  currentAnalysis: OutcomeAnalysisDetail | null;
  availableMetrics: MetricInfo[];
  selectedMetric: string;
  displayMode: 'avg' | 'median' | 'total';
  loading: boolean;
  error: string | null;

  fetchAnalyses: (processType?: string, metricName?: string) => Promise<void>;
  fetchAnalysisById: (analysisId: string) => Promise<void>;
  fetchMetrics: (processType: string) => Promise<void>;
  setSelectedMetric: (metricName: string) => void;
  setDisplayMode: (mode: 'avg' | 'median' | 'total') => void;
  createAnalysis: (params: CreateOutcomeAnalysisParams) => Promise<string>;
  clearError: () => void;
}

export const useOutcomeStore = create<OutcomeState>((set, get) => ({
  analyses: [],
  currentAnalysis: null,
  availableMetrics: [],
  selectedMetric: '',
  displayMode: 'avg',
  loading: false,
  error: null,

  fetchAnalyses: async (processType?: string, metricName?: string) => {
    set({ loading: true, error: null });
    try {
      const analyses = await fetchOutcomeAnalyses(processType, metricName);
      set({ analyses, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch analyses', loading: false });
    }
  },

  fetchAnalysisById: async (analysisId: string) => {
    set({ loading: true, error: null });
    try {
      const analysis = await fetchOutcomeAnalysisById(analysisId);
      set({
        currentAnalysis: analysis,
        selectedMetric: analysis.metric_name,
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch analysis', loading: false });
    }
  },

  fetchMetrics: async (processType: string) => {
    set({ loading: true, error: null });
    try {
      const metrics = await fetchAvailableMetrics(processType);
      set({ availableMetrics: metrics, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch metrics', loading: false });
    }
  },

  setSelectedMetric: (metricName: string) => {
    set({ selectedMetric: metricName });
  },

  setDisplayMode: (mode: 'avg' | 'median' | 'total') => {
    set({ displayMode: mode });
  },

  createAnalysis: async (params: CreateOutcomeAnalysisParams) => {
    set({ loading: true, error: null });
    try {
      const result = await createOutcomeAnalysis(params);
      set({ loading: false });
      return result.analysis_id;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create analysis', loading: false });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
