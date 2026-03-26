import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export interface QueryRequest {
  question: string;
}

export interface BackendResponse {
  status: 'success' | 'empty' | 'error';
  message: string;
  data: any[];
}

export interface QueryResponse {
  result: any[];
  message?: string;
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
    status: response.data.status,
  };
};

export default api;
