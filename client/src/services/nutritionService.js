import api from './api';

export const calculateNutrition = (data) => api.post('/diet/calculate', data);

export const getNutritionSummary = () => api.get('/diet/calculate');

export const getDietRecommendation = (type) =>
	api.get('/diet/recommend', { params: type ? { type } : {} });