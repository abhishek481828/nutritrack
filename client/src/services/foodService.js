import api from './api';

// Search foods by name for autocomplete
// GET /api/foods/search?q=<query>
export const searchFoods = (q) => api.get('/foods/search', { params: { q } });

// GET /api/foods
export const getFoods = () => api.get('/foods');

// POST /api/foods
export const createFood = (data) => api.post('/foods', data);
