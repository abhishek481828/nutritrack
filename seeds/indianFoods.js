require('dotenv').config();
const mongoose = require('mongoose');
const Food = require('../models/Food');
const logger = require('../utils/logger');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('✅ MongoDB connected for seeding');
  } catch (error) {
    logger.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const INDIAN_FOODS = [
  {
    name: 'Chicken Curry',
    calories: 260,
    protein: 27,
    carbs: 6,
    fat: 12,
    servingSize: '1 bowl',
    category: 'lunch',
    type: 'non-veg',
  },
  {
    name: 'Mutton Curry',
    calories: 350,
    protein: 22,
    carbs: 7,
    fat: 25,
    servingSize: '1 bowl',
    category: 'lunch',
    type: 'non-veg',
  },
  {
    name: 'Dal (Lentils)',
    calories: 185,
    protein: 10,
    carbs: 25,
    fat: 5,
    servingSize: '1 bowl',
    category: 'lunch',
    type: 'veg',
  },
  {
    name: 'Vegetable Curry',
    calories: 150,
    protein: 4,
    carbs: 20,
    fat: 7,
    servingSize: '1 bowl',
    category: 'lunch',
    type: 'veg',
  },
  {
    name: 'Rice',
    calories: 225,
    protein: 4,
    carbs: 50,
    fat: 0,
    servingSize: '1 bowl cooked',
    category: 'lunch',
    type: 'veg',
  },
  {
    name: 'Roti',
    calories: 110,
    protein: 3,
    carbs: 19,
    fat: 1,
    servingSize: '1 medium',
    category: 'lunch',
    type: 'veg',
  },
  {
    name: 'Egg Curry',
    calories: 215,
    protein: 13,
    carbs: 6,
    fat: 15,
    servingSize: '1 bowl (2 eggs)',
    category: 'lunch',
    type: 'non-veg',
  },
  {
    name: 'Paneer Curry',
    calories: 280,
    protein: 18,
    carbs: 8,
    fat: 18,
    servingSize: '1 bowl',
    category: 'lunch',
    type: 'veg',
  },
  {
    name: 'Biryani',
    calories: 400,
    protein: 20,
    carbs: 45,
    fat: 15,
    servingSize: '1 bowl',
    category: 'lunch',
    type: 'non-veg',
  },
  {
    name: 'Samosa',
    calories: 180,
    protein: 3,
    carbs: 18,
    fat: 10,
    servingSize: '1 piece',
    category: 'breakfast',
    type: 'veg',
  },
  {
    name: 'Dosa',
    calories: 200,
    protein: 4,
    carbs: 35,
    fat: 5,
    servingSize: '1 medium',
    category: 'breakfast',
    type: 'veg',
  },
  {
    name: 'Idli',
    calories: 120,
    protein: 3,
    carbs: 20,
    fat: 2,
    servingSize: '2 pieces',
    category: 'breakfast',
    type: 'veg',
  },
  {
    name: 'Poha',
    calories: 150,
    protein: 2,
    carbs: 32,
    fat: 2,
    servingSize: '1 bowl',
    category: 'breakfast',
    type: 'veg',
  },
  {
    name: 'Upma',
    calories: 180,
    protein: 4,
    carbs: 28,
    fat: 6,
    servingSize: '1 bowl',
    category: 'breakfast',
    type: 'veg',
  },
  {
    name: 'Chapati with Sabzi',
    calories: 200,
    protein: 5,
    carbs: 28,
    fat: 7,
    servingSize: '1 meal',
    category: 'lunch',
    type: 'veg',
  },
  {
    name: 'Chole Bhature',
    calories: 350,
    protein: 12,
    carbs: 50,
    fat: 12,
    servingSize: '1 serving',
    category: 'lunch',
    type: 'veg',
  },
  {
    name: 'Rajma Rice',
    calories: 280,
    protein: 10,
    carbs: 48,
    fat: 4,
    servingSize: '1 bowl',
    category: 'lunch',
    type: 'veg',
  },
  {
    name: 'Fish Curry',
    calories: 200,
    protein: 28,
    carbs: 4,
    fat: 8,
    servingSize: '1 bowl',
    category: 'lunch',
    type: 'non-veg',
  },
  {
    name: 'Bhindi Fry',
    calories: 120,
    protein: 3,
    carbs: 10,
    fat: 7,
    servingSize: '1 bowl',
    category: 'lunch',
    type: 'veg',
  },
  {
    name: 'Aloo Gobi',
    calories: 140,
    protein: 3,
    carbs: 16,
    fat: 7,
    servingSize: '1 bowl',
    category: 'lunch',
    type: 'veg',
  },
];

const seedFoods = async () => {
  try {
    await connectDB();

    logger.info('🌾 Starting to seed Indian foods...');

    let added = 0;
    let skipped = 0;

    // Upsert each food (insert if not exists, skip if exists)
    for (const food of INDIAN_FOODS) {
      const existing = await Food.findOne({ name: { $regex: `^${food.name}$`, $options: 'i' } });
      
      if (existing) {
        skipped++;
        logger.debug(`   ⏭️  Skipped: ${food.name} (already exists)`);
      } else {
        await Food.create(food);
        added++;
        logger.info(`   ✅ Added: ${food.name} (${food.calories} kcal)`);
      }
    }

    logger.info('📊 Seeding complete!');
    logger.info(`   • Added: ${added} new foods`);
    logger.info(`   • Skipped: ${skipped} existing foods`);

    mongoose.connection.close();
  } catch (error) {
    logger.error('❌ Error seeding foods:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedFoods();
