import { useEffect, useMemo, useState } from 'react';
import { addFoodLog, deleteFoodLog, getDailyLogs, updateFoodLog } from '../services/foodLogService';
import { searchFoods } from '../services/foodService';
import { getDietRecommendation } from '../services/nutritionService';
import { getErrorMessage } from '../utils/errorHandler';
import EditFoodLogModal from '../components/EditFoodLogModal';
import Spinner from '../components/Spinner';

const todayISO = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftISODate = (isoDate, daysDelta) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const next = new Date(year, month - 1, day);
  next.setDate(next.getDate() + daysDelta);
  const nYear = next.getFullYear();
  const nMonth = String(next.getMonth() + 1).padStart(2, '0');
  const nDay = String(next.getDate()).padStart(2, '0');
  return `${nYear}-${nMonth}-${nDay}`;
};

const formatLabel = (value) => {
  if (!value) return 'Uncategorized';
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const dedupeFoodsByName = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = String(item?.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const MEAL_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
];

const DIET_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'veg', label: 'Veg' },
  { value: 'non-veg', label: 'Non-Veg' },
];

const currentMealType = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snacks';
};

const normalizeMealBucket = (value = '') => {
  const text = String(value).toLowerCase();
  if (text.includes('breakfast')) return 'breakfast';
  if (text.includes('lunch')) return 'lunch';
  if (text.includes('dinner')) return 'dinner';
  if (text.includes('snack')) return 'snacks';
  return 'other';
};

const FoodLogs = () => {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [entries, setEntries] = useState([]);
  const [totals, setTotals] = useState({ totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [editingLog, setEditingLog] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [toast, setToast] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchingFoods, setSearchingFoods] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState(currentMealType());
  const [dietType, setDietType] = useState('');
  const [autoAddingMeal, setAutoAddingMeal] = useState(false);

  const parsedQuantity = Number(quantity);
  const hasValidQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0;
  const canSubmit = Boolean((selectedFood?._id || selectedFood?.id) && hasValidQuantity) && !submitting;

  const nutritionPreview = useMemo(() => {
    if (!selectedFood || !hasValidQuantity) return null;
    const calories = (Number(selectedFood.calories) || 0) * parsedQuantity;
    const protein = (Number(selectedFood.protein) || 0) * parsedQuantity;
    const carbs = (Number(selectedFood.carbs) || 0) * parsedQuantity;
    const fat = (Number(selectedFood.fat) || 0) * parsedQuantity;

    return {
      calories: Math.round(calories * 100) / 100,
      protein: Math.round(protein * 100) / 100,
      carbs: Math.round(carbs * 100) / 100,
      fat: Math.round(fat * 100) / 100,
    };
  }, [selectedFood, hasValidQuantity, parsedQuantity]);

  const loadLogs = async (dateValue) => {
    setLoading(true);
    try {
      const res = await getDailyLogs(dateValue);
      setEntries(res.data.entries || []);
      setTotals(res.data.totals || { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });
    } catch (error) {
      setToast({ type: 'error', message: getErrorMessage(error, 'food logs') });
      setEntries([]);
      setTotals({ totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (!trimmed || (selectedFood && trimmed.toLowerCase() === selectedFood.name.toLowerCase())) {
      setSearchResults([]);
      return undefined;
    }

    const timer = setTimeout(async () => {
      setSearchingFoods(true);
      try {
        const res = await searchFoods(trimmed);
        setSearchResults(dedupeFoodsByName(res.data?.data || []));
      } catch (error) {
        setToast({ type: 'error', message: getErrorMessage(error, 'food search') });
        setSearchResults([]);
      } finally {
        setSearchingFoods(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedFood]);

  const groupedEntries = useMemo(() => {
    return entries.reduce((acc, entry) => {
      const key = entry.mealType || entry.category || 'other';
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    }, {});
  }, [entries]);

  const groupedEntriesList = useMemo(() => {
    const order = ['breakfast', 'lunch', 'dinner', 'snacks', 'other'];
    return order
      .filter((key) => Array.isArray(groupedEntries[key]) && groupedEntries[key].length > 0)
      .map((key) => [key, groupedEntries[key]]);
  }, [groupedEntries]);

  const isTodaySelected = selectedDate === todayISO();

  const chooseFood = (food) => {
    setSelectedFood(food);
    setSearchQuery(food.name);
    setSearchResults([]);
  };

  const resetForm = () => {
    setSelectedFood(null);
    setSearchQuery('');
    setQuantity('1');
    setSearchResults([]);
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!selectedFood?._id && !selectedFood?.id) {
      setToast({ type: 'error', message: 'Please select a food from the library.' });
      return;
    }

    if (!(parsedQuantity > 0)) {
      setToast({ type: 'error', message: 'Quantity must be greater than zero.' });
      return;
    }

    setSubmitting(true);
    try {
      await addFoodLog({
        foodId: selectedFood._id || selectedFood.id,
        quantity: parsedQuantity,
        mealType,
        date: selectedDate,
      });
      resetForm();
      setToast({ type: 'success', message: "Added to today's log" });
      await loadLogs(selectedDate);
    } catch (error) {
      setToast({ type: 'error', message: getErrorMessage(error, 'adding food log') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoAddForMeal = async () => {
    setAutoAddingMeal(true);
    try {
      const recommendationRes = await getDietRecommendation(dietType || undefined);
      const payload = recommendationRes.data?.data || {};
      const recommendedMeals = Array.isArray(payload.recommendedMeals) ? payload.recommendedMeals : [];

      const selectedMeal = recommendedMeals.find((meal) => normalizeMealBucket(meal?.meal || meal?.name) === mealType);
      const mealFoods = Array.isArray(selectedMeal?.foods) ? selectedMeal.foods : [];
      const alreadyLogged = new Set(entries.map((entry) => String(entry.foodName || '').toLowerCase()));

      let candidate = mealFoods.find((item) => !alreadyLogged.has(String(item?.name || '').toLowerCase())) || mealFoods[0];

      if (!candidate) {
        const suggestedFoods = Array.isArray(payload.suggestedFoods) ? payload.suggestedFoods : [];
        candidate = suggestedFoods.find((item) => !alreadyLogged.has(String(item?.name || '').toLowerCase())) || suggestedFoods[0];
      }

      if (!candidate?.id && !candidate?._id) {
        setToast({ type: 'error', message: `No suggested ${formatLabel(mealType)} item available right now.` });
        return;
      }

      await addFoodLog({
        foodId: candidate.id || candidate._id,
        quantity: 1,
        mealType,
        date: selectedDate,
      });

      setToast({ type: 'success', message: `${candidate.name} added for ${formatLabel(mealType)}.` });
      await loadLogs(selectedDate);
    } catch (error) {
      setToast({ type: 'error', message: getErrorMessage(error, 'auto meal add') });
    } finally {
      setAutoAddingMeal(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteFoodLog(id);
      setToast({ type: 'success', message: 'Food entry deleted.' });
      await loadLogs(selectedDate);
    } catch (error) {
      setToast({ type: 'error', message: getErrorMessage(error, 'deleting food log') });
    } finally {
      setDeletingId('');
    }
  };

  const handleSaveEdit = async (payload) => {
    if (!editingLog?._id) return;
    setSavingEdit(true);
    try {
      await updateFoodLog(editingLog._id, { quantity: payload.quantity });
      setEditingLog(null);
      setToast({ type: 'success', message: 'Food entry updated.' });
      await loadLogs(selectedDate);
    } catch (error) {
      setToast({ type: 'error', message: getErrorMessage(error, 'updating food log') });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="page-shell">
      {toast && <div className={`save-toast save-toast--${toast.type}`}>{toast.message}</div>}

      <section className="card page-header">
        <p className="page-kicker">Daily Journal</p>
        <h1>Food Logs</h1>
        <p className="page-subtitle">Select foods from your library and log quantity. Daily totals are computed dynamically.</p>
      </section>

      <section className="card page-card">
        <form className="page-form" onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-group form-group--search">
              <label htmlFor="food-search">Food From Library</label>
              <input
                id="food-search"
                className={selectedFood ? 'input-autofilled' : ''}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedFood(null);
                }}
                placeholder="Search food..."
                required
              />
              {selectedFood && (
                <small className="autofill-badge">Selected: {selectedFood.name}</small>
              )}
              {(searchingFoods || searchResults.length > 0) && (
                <div className="suggestion-dropdown">
                  {searchingFoods && <div className="suggestion-meta">Searching...</div>}
                  {!searchingFoods && searchResults.map((food) => (
                    <button type="button" key={food.id || food._id} className="suggestion-item" onClick={() => chooseFood(food)}>
                      <strong>{food.name}</strong>
                      <span>{food.calories} kcal, P {food.protein}g, C {food.carbs}g, F {food.fat}g</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input id="quantity" type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="meal-type">Meal Slot</label>
              <select id="meal-type" value={mealType} onChange={(e) => setMealType(e.target.value)}>
                {MEAL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="diet-type">Suggested Diet Type</label>
              <select id="diet-type" value={dietType} onChange={(e) => setDietType(e.target.value)}>
                {DIET_OPTIONS.map((option) => (
                  <option key={option.value || 'any'} value={option.value}>{option.label}</option>
                ))}
              </select>
              <small className="field-hint">Select meal slot, then auto-add a recommended item.</small>
            </div>
          </div>

          {nutritionPreview && (
            <div className="preview-summary">
              <div><span>Calories</span><strong>{nutritionPreview.calories}</strong></div>
              <div><span>Protein</span><strong>{nutritionPreview.protein}g</strong></div>
              <div><span>Carbs</span><strong>{nutritionPreview.carbs}g</strong></div>
              <div><span>Fat</span><strong>{nutritionPreview.fat}g</strong></div>
            </div>
          )}

          <div className="page-actions page-actions--left">
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {submitting ? <><Spinner size="sm" /> Saving...</> : 'Add Food Entry'}
            </button>
            <button type="button" className="btn btn-outline" disabled={autoAddingMeal} onClick={handleAutoAddForMeal}>
              {autoAddingMeal ? <><Spinner size="sm" /> Auto Adding...</> : `Auto Add for ${formatLabel(mealType)}`}
            </button>
          </div>
        </form>
      </section>

      <section className="card page-card">
        <div className="today-summary-head">
          <div>
            <h2>
              Selected Day Summary {isTodaySelected ? <span className="autofill-badge">Today</span> : null}
            </h2>
          </div>
          <div className="page-header-aside">
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => setSelectedDate((prev) => shiftISODate(prev, -1))}
            >
              Previous Day
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="log-date-input"
            />
            <button
              type="button"
              className="btn btn-xs btn-outline"
              onClick={() => setSelectedDate((prev) => shiftISODate(prev, 1))}
            >
              Next Day
            </button>
          </div>
        </div>

        <div className="today-summary-grid">
          <div><span>Total Calories</span><strong>{totals.totalCalories || 0}</strong></div>
          <div><span>Total Protein</span><strong>{totals.totalProtein || 0}g</strong></div>
          <div><span>Total Carbs</span><strong>{totals.totalCarbs || 0}g</strong></div>
          <div><span>Total Fat</span><strong>{totals.totalFat || 0}g</strong></div>
        </div>
      </section>

      <section className="card page-card">
        {loading ? (
          <div className="page-loading-row"><Spinner /></div>
        ) : entries.length === 0 ? (
          <div className="empty-state">No food logs for this date</div>
        ) : (
          <div className="meal-group-list">
            {groupedEntriesList.map(([group, logs]) => (
              <div key={group} className="meal-group-card">
                <div className="meal-group-head">
                  <h3>{formatLabel(group)}</h3>
                  <span>{logs.length} item(s)</span>
                </div>
                <div className="table-wrapper">
                  <table className="log-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Food</th>
                        <th>Qty</th>
                        <th>Calories</th>
                        <th>Protein</th>
                        <th>Carbs</th>
                        <th>Fat</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id}>
                          <td>{log.time || '--:--'}</td>
                          <td>{log.foodName}</td>
                          <td>{log.quantity}</td>
                          <td>{log.calories}</td>
                          <td>{log.protein}g</td>
                          <td>{log.carbs}g</td>
                          <td>{log.fat}g</td>
                          <td>
                            <div className="log-actions">
                              <button type="button" className="btn btn-xs btn-outline" onClick={() => setEditingLog(log)}>
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-xs btn-danger"
                                onClick={() => handleDelete(log._id)}
                                disabled={deletingId === log._id}
                              >
                                {deletingId === log._id ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <EditFoodLogModal
        open={Boolean(editingLog)}
        log={editingLog}
        saving={savingEdit}
        onClose={() => setEditingLog(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};

export default FoodLogs;
