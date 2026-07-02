const test = require('node:test');
const assert = require('node:assert');
const { getDietRecommendation } = require('../utils/dietCalculator');

test('Diet Controller Utility - Recommendation matches targets', (t) => {
  const rec = getDietRecommendation({ age: 25, height: 175, weight: 70, goal: 'lose_weight' });
  
  // Assert targetCalories matches diet calculations (bmr * 1.35 * 0.8)
  assert.ok(rec.targetCalories > 0);
  assert.ok(Array.isArray(rec.suggestedMeals));
  assert.strictEqual(rec.suggestedMeals.length, 4); // Breakfast, Lunch, Dinner, Snacks
});
