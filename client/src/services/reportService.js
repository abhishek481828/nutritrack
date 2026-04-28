import api from './api';

/**
 * Trigger a browser download of the weekly PDF report.
 * Uses fetch (via axios responseType blob) then creates an <a> element.
 */
export const downloadWeeklyReport = async () => {
  const response = await api.get('/report/weekly', { responseType: 'blob' });

  // Extract filename from Content-Disposition header if present
  const disposition = response.headers['content-disposition'] || '';
  const match       = disposition.match(/filename="?([^"]+)"?/);
  const filename    = match ? match[1] : 'nutritrack-report.pdf';

  // Create a temporary URL and click it
  const url  = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  // Cleanup
  link.remove();
  window.URL.revokeObjectURL(url);
};
