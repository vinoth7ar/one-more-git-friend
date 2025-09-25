import { useState, useEffect } from 'react';
import { WorkflowData } from '../../models/singleView/nodeTypes';

export const useWorkflowDataHttp = (fallbackWorkflowId: string) => {
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  useEffect(() => {
    // For now, return mock data - this would typically fetch from an API
    setWorkflowData(null); // Will use fallback data
  }, [fallbackWorkflowId]);
  
  return {
    data: workflowData,
    error,
    isError,
    isLoading,
    isFetching
  };
};