const express = require('express');
const router = express.Router();

const {
  searchFoods,
  getAllFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} = require('../controllers/foodController');

// /search must be declared BEFORE /:id so it isn't captured as an ObjectId
router.get('/search', searchFoods);

router.route('/').get(getAllFoods).post(createFood);
router.route('/:id').get(getFoodById).put(updateFood).delete(deleteFood);

module.exports = router;

