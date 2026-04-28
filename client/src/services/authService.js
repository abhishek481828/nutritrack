import api from './api';

// POST /api/auth/register
export const register = (data) => api.post('/auth/register', data);

// POST /api/auth/login
export const login = (data) => api.post('/auth/login', data);

// GET /api/auth/profile — returns full user profile (requires JWT)
export const getMe = () => api.get('/auth/profile');

// PUT /api/auth/profile — update name / age / weight / height / goal
export const updateProfile = (data) => api.put('/auth/profile', data);

// GET /api/auth/bmi — calculate BMI from user's profile weight & height
export const getBMI = () => api.get('/auth/bmi');
