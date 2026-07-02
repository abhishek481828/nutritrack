const test = require('node:test');
const assert = require('node:assert');
const {
  getDerivedNutrition,
  toFoodLogEntryDTO,
  sumEntryTotals,
} = require('../utils/foodLogNutrition');

test('Food Log Nutrition - Derived Nutrition Calculations', (t) => {
  const mockLog = {
    quantity: 2,
    foodId: {
      calories: 150,
      protein: 10,
      carbs: 20,
      fat: 5,
    },
  };

  const derived = getDerivedNutrition(mockLog);
  assert.strictEqual(derived.calories, 300);
  assert.strictEqual(derived.protein, 20);
  assert.strictEqual(derived.carbs, 40);
  assert.strictEqual(derived.fat, 10);
});

test('Food Log Nutrition - DTO Conversion', (t) => {
  const mockLog = {
    _id: 'logId123',
    userId: 'userId123',
    quantity: 1.5,
    mealType: 'lunch',
    date: '2026-07-02',
    time: '12:30',
    foodId: {
      _id: 'foodId123',
      name: 'Chicken and Broc',
      calories: 200,
      protein: 30,
      carbs: 5,
      fat: 4,
    },
  };

  const dto = toFoodLogEntryDTO(mockLog);
  assert.strictEqual(dto._id, 'logId123');
  assert.strictEqual(dto.foodName, 'Chicken and Broc');
  assert.strictEqual(dto.calories, 300);
  assert.strictEqual(dto.protein, 45);
});

test('Food Log Nutrition - Total Summing', (t) => {
  const mockEntries = [
    { calories: 300, protein: 20, carbs: 10, fat: 5 },
    { calories: 500, protein: 35, carbs: 40, fat: 12 },
  ];

  const totals = sumEntryTotals(mockEntries);
  assert.strictEqual(totals.totalCalories, 800);
  assert.strictEqual(totals.totalProtein, 55);
  assert.strictEqual(totals.totalCarbs, 50);
  assert.strictEqual(totals.totalFat, 17);
});
