import api from './api';

/**
 * Analyze a food image via the backend.
 * Sends multipart/form-data — DO NOT set Content-Type manually;
 * axios will add the correct boundary automatically.
 *
 * @param {File} imageFile - The File object from an <input type="file">
 * @returns {Promise} Axios response with { detectedFood, probability, nutrition, imageUrl, recipes }
 */
export const analyzeFood = (imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile); // field name must match backend: "image"

  return api.post('/upload/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
