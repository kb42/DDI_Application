import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export interface QueryRequest {
  question: string;
}

export interface BackendResponse {
  status: 'success' | 'empty' | 'error';
  message: string;
  summary: string;
  data: any[];
}

export interface QueryResponse {
  result: any[];
  message?: string;
  summary?: string;
  status?: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const queryDrugInteractions = async (question: string): Promise<QueryResponse> => {
  const response = await api.post<BackendResponse>('/api/query', { question });

  // Transform backend response to frontend format
  return {
    result: response.data.data || [],
    message: response.data.message,
    summary: response.data.summary,
    status: response.data.status,
  };
};

export const fetchInitialGraph = async (): Promise<any[]> => {
  const response = await api.get('/api/graph/init');
  return response.data.data || [];
};

export const expandNode = async (nodeName: string): Promise<any[]> => {
  const response = await api.post('/api/graph/expand', { node_name: nodeName });
  return response.data.data || [];
};

export default api;
