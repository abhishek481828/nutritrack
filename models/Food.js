const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
    },
    calories: {
      type: Number,
      required: [true, 'Calories value is required'],
      min: 0,
    },
    protein: {
      type: Number,
      default: 0,
      min: 0,
    },
    carbs: {
      type: Number,
      default: 0,
      min: 0,
    },
    fat: {
      type: Number,
      default: 0,
      min: 0,
    },
    servingSize: {
      type: String,
      default: '100g',
    },
    category: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner'],
      default: undefined,
    },
    type: {
      type: String,
      enum: ['veg', 'non-veg'],
      default: undefined,
    },
  },
  { timestamps: true }
);

foodSchema.index({ name: 1 });

module.exports = mongoose.model('Food', foodSchema);
