const test = require('node:test');
const assert = require('node:assert');
const {
  calculateBMR,
  calculateBMI,
  normalizeGoal,
  calculateNutritionTargets,
} = require('../utils/dietCalculator');

test('Diet Calculator - BMR Calculations', (t) => {
  // Male BMR: 10*w + 6.25*h - 5*a + 5
  const maleBmr = calculateBMR({ age: 25, weight: 70, height: 175, gender: 'male' });
  assert.strictEqual(maleBmr, Math.round(10 * 70 + 6.25 * 175 - 5 * 25 + 5));

  // Female BMR: 10*w + 6.25*h - 5*a - 161
  const femaleBmr = calculateBMR({ age: 30, weight: 60, height: 160, gender: 'female' });
  assert.strictEqual(femaleBmr, Math.round(10 * 60 + 6.25 * 160 - 5 * 30 - 161));

  // Genderless fallback
  const neutralBmr = calculateBMR({ age: 30, weight: 60, height: 160 });
  assert.strictEqual(neutralBmr, 10 * 60 + 6.25 * 160 - 5 * 30);
});

test('Diet Calculator - BMI Calculations', (t) => {
  // Normal weight range
  const normalBmi = calculateBMI(70, 175);
  assert.strictEqual(normalBmi.value, 22.9);
  assert.strictEqual(normalBmi.category, 'Normal');
  assert.strictEqual(normalBmi.color, 'green');

  // Overweight range
  const overweightBmi = calculateBMI(85, 175);
  assert.strictEqual(overweightBmi.value, 27.8);
  assert.strictEqual(overweightBmi.category, 'Overweight');
  assert.strictEqual(overweightBmi.color, 'yellow');
});

test('Diet Calculator - Goal Normalization', (t) => {
  assert.strictEqual(normalizeGoal('lose_weight'), 'weight_loss');
  assert.strictEqual(normalizeGoal('GAIN_MUSCLE'), 'muscle_gain');
  assert.strictEqual(normalizeGoal('maintain'), 'maintenance');
  assert.strictEqual(normalizeGoal('eat_healthy'), 'eat_healthy');
});
