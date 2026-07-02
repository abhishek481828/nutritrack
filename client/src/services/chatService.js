import api from './api';

// POST /api/chat/ai — message: string → reply: string
export const sendAIMessage = (message) =>
  api.post('/chat/ai', { message });
