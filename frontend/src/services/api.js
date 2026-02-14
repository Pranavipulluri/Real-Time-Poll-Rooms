import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createPoll = async (question, options) => {
  const response = await api.post('/polls', { question, options });
  return response.data;
};

export const getPoll = async (id) => {
  const response = await api.get(`/polls/${id}`);
  return response.data;
};

export const votePoll = async (id, optionIndex) => {
  const response = await api.post(`/polls/${id}/vote`, { optionIndex });
  return response.data;
};

export default api;
