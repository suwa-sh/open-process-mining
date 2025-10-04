import { useState, useEffect } from "react";
import { getAnalysisById } from "../api/client";
import { AnalysisResult } from "../types";

export const useAnalysisData = (analysisId: string | null) => {
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getAnalysisById(analysisId);
        setData(result);
      } catch (err) {
        setError("Failed to fetch analysis data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [analysisId]);

  return { data, loading, error };
};
