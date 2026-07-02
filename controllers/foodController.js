const Food = require('../models/Food');
const axios = require('axios');

const formatFoodSuggestion = (item, source = 'db') => ({
  id: item.id || item._id,
  name: item.name,
  calories: Number(item.calories ?? 0),
  protein: Number(item.protein ?? 0),
  carbs: Number(item.carbs ?? 0),
  fat: Number(item.fat ?? 0),
  servingSize: item.servingSize || '100g',
  category: item.category,
  type: item.type,
  source,
});

// @desc  Search foods by name (for autocomplete)
// @route GET /api/foods/search?q=chicken
const searchFoods = async (req, res) => {
  try {
    const query  = (req.query.q || '').trim();

    if (!query || query.length < 1) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Escape special regex characters from user input
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const foods = await Food
      .find({ name: { $regex: escaped, $options: 'i' } })
      .select('name calories protein carbs fat servingSize')
      .limit(8)
      .lean();

    if (foods.length > 0) {
      return res.status(200).json({
        success: true,
        data: foods.map((food) => formatFoodSuggestion(food, 'db')),
      });
    }

    if (process.env.SPOONACULAR_API_KEY && !process.env.SPOONACULAR_API_KEY.includes('your_')) {
      try {
        const spoonacularSearch = await axios.get('https://api.spoonacular.com/food/ingredients/search', {
          params: {
            query,
            number: 5,
            metaInformation: true,
          },
          headers: {
            'x-api-key': process.env.SPOONACULAR_API_KEY,
          },
        });

        const ingredients = spoonacularSearch.data?.results || [];
        const enriched = await Promise.all(
          ingredients.slice(0, 5).map(async (item) => {
            try {
              const info = await axios.get(`https://api.spoonacular.com/food/ingredients/${item.id}/information`, {
                params: {
                  amount: 100,
                  unit: 'g',
                },
                headers: {
                  'x-api-key': process.env.SPOONACULAR_API_KEY,
                },
              });

              const nutrition = info.data?.nutrition?.nutrients || [];
              const getValue = (name) => nutrition.find((n) => n.name === name)?.amount || 0;

              return formatFoodSuggestion({
                id: item.id,
                name: item.name,
                calories: Math.round(getValue('Calories')),
                protein: Math.round(Number(getValue('Protein')) || 0),
                carbs: Math.round(Number(getValue('Carbohydrates')) || 0),
                fat: Math.round(Number(getValue('Fat')) || 0),
                servingSize: '100g',
              }, 'spoonacular');
            } catch {
              return formatFoodSuggestion({ id: item.id, name: item.name }, 'spoonacular');
            }
          })
        );

        return res.status(200).json({ success: true, data: enriched });
      } catch {
        return res.status(200).json({ success: true, data: [] });
      }
    }

    return res.status(200).json({ success: true, data: [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get all foods
// @route GET /api/foods
const getAllFoods = async (req, res) => {
  try {
    const foods = await Food.find().lean();
    return res.status(200).json({
      success: true,
      data: {
        foods,
        count: foods.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get single food by ID
// @route GET /api/foods/:id
const getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id).lean();
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }
    return res.status(200).json({ success: true, data: food });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Create a new food entry
// @route POST /api/foods
const createFood = async (req, res) => {
  try {
    const { name, calories, protein, carbs, fat, servingSize, category, type } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Food name is required.' });
    }

    if (!(Number(calories) > 0)) {
      return res.status(400).json({ success: false, message: 'Calories must be a positive number.' });
    }

    if (![protein, carbs, fat].every((value) => Number(value) >= 0)) {
      return res.status(400).json({ success: false, message: 'Protein, carbs, and fat must be zero or positive numbers.' });
    }

    const normalizedCategory = category ? String(category).toLowerCase() : undefined;
    const normalizedType = type ? String(type).toLowerCase() : undefined;

    if (normalizedCategory && !['breakfast', 'lunch', 'dinner'].includes(normalizedCategory)) {
      return res.status(400).json({ success: false, message: 'Category must be breakfast, lunch, or dinner.' });
    }

    if (normalizedType && !['veg', 'non-veg'].includes(normalizedType)) {
      return res.status(400).json({ success: false, message: 'Type must be veg or non-veg.' });
    }

    const food = await Food.create({
      name: String(name).trim(),
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      servingSize,
      category: normalizedCategory,
      type: normalizedType,
    });

    return res.status(201).json({ success: true, data: food, message: 'Food saved successfully.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc  Update a food entry
// @route PUT /api/foods/:id
const updateFood = async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }
    res.status(200).json({ success: true, data: food });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc  Delete a food entry
// @route DELETE /api/foods/:id
const deleteFood = async (req, res) => {
  try {
    const food = await Food.findByIdAndDelete(req.params.id);
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found' });
    }
    return res.status(200).json({ success: true, message: 'Food deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { searchFoods, getAllFoods, getFoodById, createFood, updateFood, deleteFood };
