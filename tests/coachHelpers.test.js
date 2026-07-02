const test = require('node:test');
const assert = require('node:assert');
const {
  completionRatio,
  balanceRatio,
  calculateScore,
  profileIsComplete,
} = require('../client/src/components/recommendations/coachHelpers');

test('Coach Helpers - Ratios', (t) => {
  assert.strictEqual(completionRatio(50, 100), 0.5);
  assert.strictEqual(completionRatio(120, 100), 1); // Caps at 1
  assert.strictEqual(completionRatio(0, 0), 0);

  // Balance ratio returns 1 minus absolute deviation
  assert.strictEqual(balanceRatio(100, 100), 1);
  assert.strictEqual(balanceRatio(80, 100), 0.8);
  assert.strictEqual(balanceRatio(120, 100), 0.8);
});

test('Coach Helpers - Health score calculation', (t) => {
  const mockProgress = {
    calories: { consumed: 1800, target: 2000 }, // 0.9 * 40 = 36
    protein: { consumed: 120, target: 150 },    // 0.8 * 30 = 24
    carbs: { consumed: 200, target: 200 },      // 1 * 15 = 15
    fat: { consumed: 60, target: 70 },          // 0.857 * 15 = 12.85
  };
  const score = calculateScore(mockProgress);
  assert.ok(score >= 80 && score <= 90);
});

test('Coach Helpers - Profile Completion', (t) => {
  assert.strictEqual(profileIsComplete({ age: 25, height: 178, weight: 70, goal: 'maintain' }), true);
  assert.strictEqual(profileIsComplete({ age: 0, height: 178, weight: 70, goal: 'maintain' }), false);
});
