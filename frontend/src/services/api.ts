import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export interface QueryRequest {
  question: string;
}

export interface QueryResponse {
  result: any[];
  cypher_query?: string;
  error?: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const queryDrugInteractions = async (question: string): Promise<QueryResponse> => {
  const response = await api.post<QueryResponse>('/api/query', { question });
  return response.data;
};

export default api;
