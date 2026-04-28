import api from './api';

// ── Optimised: single call, all dashboard data ─────────────────────
export const getDashboardSummary = () => api.get('/dashboard/summary');

// ── Legacy calls (kept for any component that still uses them) ──────
export const getTodaySummary   = () => api.get('/dashboard/today');
export const getWeeklyTrend    = () => api.get('/dashboard/weekly');
export const getMacroBreakdown = () => api.get('/dashboard/macros');
