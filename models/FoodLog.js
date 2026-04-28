const mongoose = require('mongoose');

const foodLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
      default: 1,
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
      default: 'lunch',
      lowercase: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    time: {
      type: String,
      required: true,
      match: /^\d{2}:\d{2}$/,
    },
  },
  { timestamps: true }
);

// Index for fast daily queries per user
foodLogSchema.index({ userId: 1, date: 1 });
foodLogSchema.index({ userId: 1, date: 1, time: 1 });
foodLogSchema.index({ userId: 1, date: 1, mealType: 1 });

module.exports = mongoose.model('FoodLog', foodLogSchema);
