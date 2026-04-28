import api from './api';

// POST /api/chat  — message: string → reply: string
export const sendMessage = (message) =>
  api.post('/chat', { message });

// POST /api/chat/ai — message: string → reply: string
export const sendAIMessage = (message) =>
  api.post('/chat/ai', { message });
