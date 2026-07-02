import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchFoods, createFood } from '../services/foodService';
import { addFoodLog, getDailyLogs } from '../services/foodLogService';
import { getErrorMessage } from '../utils/errorHandler';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import PageTransition from '../components/ui/PageTransition';

const EMPTY_FOOD = {
  name: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  servingSize: '1 bowl',
  category: '',
  type: '',
};

const CATEGORY_OPTIONS = [
  { value: '', label: 'No category' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'No type' },
  { value: 'veg', label: 'Veg' },
  { value: 'non-veg', label: 'Non-Veg' },
];

const parsePositiveNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0;
};

const normalizeFood = (food) => ({
  id: food.id,
  name: food.name || '',
  calories: food.calories ?? '',
  protein: food.protein ?? '',
  carbs: food.carbs ?? '',
  fat: food.fat ?? '',
  servingSize: food.servingSize || '1 bowl',
  category: food.category || '',
  type: food.type || '',
});

const getUniqueSuggestions = (items = []) => {
  const map = new Map();
  items.forEach((item) => {
    const key = (item.name || '').trim().toLowerCase();
    if (key && !map.has(key)) {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
};

const HighlightText = ({ text, query }) => {
  if (!query?.trim()) return <>{text}</>;
  const cleanQuery = query.trim();
  const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'ig');
  const parts = String(text || '').split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? <mark key={`${part}-${index}`}>{part}</mark> : <span key={`${part}-${index}`}>{part}</span>
      )}
    </>
  );
};

const AddFood = () => {
  const navigate = useNavigate();
  const searchTimerRef = useRef(null);
  const searchWrapRef = useRef(null);
  const skipSearchRef = useRef(false);
  const autofillResetRef = useRef(null);
  const fieldFlashResetRef = useRef(null);
  const toastResetRef = useRef(null);
  const [form, setForm] = useState(EMPTY_FOOD);
  const [touched, setTouched] = useState({});
  const [searching, setSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [autoFilled, setAutoFilled] = useState(false);
  const [flashFields, setFlashFields] = useState({});
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveAction, setSaveAction] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [todaySummary, setTodaySummary] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0, count: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const validate = (draft = form) => {
    const nextErrors = {};

    if (!draft.name.trim()) nextErrors.name = 'Food name is required.';
    if (!parsePositiveNumber(draft.calories)) nextErrors.calories = 'Calories must be a positive number.';
    if (!parsePositiveNumber(draft.protein)) nextErrors.protein = 'Protein must be a positive number.';
    if (!parsePositiveNumber(draft.carbs)) nextErrors.carbs = 'Carbs must be a positive number.';
    if (!parsePositiveNumber(draft.fat)) nextErrors.fat = 'Fat must be a positive number.';
    if (!draft.servingSize.trim()) nextErrors.servingSize = 'Serving size is required.';

    return nextErrors;
  };

  const errors = useMemo(() => validate(form), [form]);
  const isValid = Object.keys(errors).length === 0;

  const shouldShowError = (field) => touched[field] && errors[field];

  const preview = {
    calories: Number(form.calories) || 0,
    protein: Number(form.protein) || 0,
    carbs: Number(form.carbs) || 0,
    fat: Number(form.fat) || 0,
  };

  const previewCalorieIntensity = preview.calories > 500 ? 'high' : preview.calories > 250 ? 'medium' : 'low';

  const fetchTodaySummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await getDailyLogs();
      const totals = res.data?.totals || { calories: 0, protein: 0, carbs: 0, fats: 0 };
      setTodaySummary({
        calories: Number(totals.calories) || 0,
        protein: Number(totals.protein) || 0,
        carbs: Number(totals.carbs) || 0,
        fats: Number(totals.fats) || 0,
        count: Number(res.data?.count) || 0,
      });
    } catch {
      setTodaySummary({ calories: 0, protein: 0, carbs: 0, fats: 0, count: 0 });
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    const query = form.name.trim();

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return undefined;
    }

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSearching(false);
      setSearchAttempted(false);
      setActiveSuggestionIndex(-1);
      return undefined;
    }

    setSearching(true);
    setSearchAttempted(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchFoods(query);
        const unique = getUniqueSuggestions(res.data.data || []).slice(0, 6);
        setSuggestions(unique);
        setActiveSuggestionIndex(unique.length ? 0 : -1);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
        setActiveSuggestionIndex(-1);
        setShowSuggestions(false);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(searchTimerRef.current);
  }, [form.name]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchTodaySummary();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
    setTouched((current) => ({ ...current, [name]: true }));
    if (name === 'name') {
      setError('');
      setAutoFilled(false);
    }
  };

  const handleBlur = (name) => {
    setTouched((current) => ({ ...current, [name]: true }));
  };

  const handleSelectSuggestion = (food) => {
    skipSearchRef.current = true;
    setForm((current) => ({
      ...current,
      name: food.name || current.name,
      calories: food.calories ?? current.calories,
      protein: food.protein ?? current.protein,
      carbs: food.carbs ?? current.carbs,
      fat: food.fat ?? current.fat,
      servingSize: food.servingSize || current.servingSize,
      category: food.category || current.category,
      type: food.type || current.type,
    }));

    setAutoFilled(true);
    if (autofillResetRef.current) clearTimeout(autofillResetRef.current);
    autofillResetRef.current = setTimeout(() => setAutoFilled(false), 1800);

    setFlashFields({ calories: true, protein: true, carbs: true, fat: true });
    if (fieldFlashResetRef.current) clearTimeout(fieldFlashResetRef.current);
    fieldFlashResetRef.current = setTimeout(() => setFlashFields({}), 1200);

    setShowSuggestions(false);
    setSuggestions([]);
    setActiveSuggestionIndex(-1);
  };

  const handleFoodNameKeyDown = (e) => {
    if (!showSuggestions) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setShowSuggestions(true);
        setActiveSuggestionIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === 'Enter' && activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
      e.preventDefault();
      handleSelectSuggestion(normalizeFood(suggestions[activeSuggestionIndex]));
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const submitFood = async (action) => {
    const nextErrors = validate(form);
    setTouched({
      name: true,
      calories: true,
      protein: true,
      carbs: true,
      fat: true,
      servingSize: true,
    });

    if (Object.keys(nextErrors).length > 0) {
      setError('Please fix the highlighted fields.');
      return;
    }

    setSaving(true);
    setSaveAction(action);
    setError('');
    setSuccess('');

    try {
      const foodPayload = {
        name: form.name.trim(),
        calories: Number(form.calories),
        protein: Number(form.protein),
        carbs: Number(form.carbs),
        fat: Number(form.fat),
        servingSize: form.servingSize.trim(),
        category: form.category || undefined,
        type: form.type || undefined,
      };

      const foodRes = await createFood(foodPayload);
      const savedFood = foodRes.data.data;

      if (action === 'save-log') {
        await addFoodLog({
          foodId: savedFood._id,
          quantity: 1,
        });

        await fetchTodaySummary();
      }

      setForm(EMPTY_FOOD);
      setTouched({});
      setSuggestions([]);
      setShowSuggestions(false);
      setSuccess(action === 'save-log'
        ? 'Food saved and added to today\'s log.'
        : 'Food saved to the database.'
      );

      setToast({
        type: 'success',
        message: action === 'save-log' ? 'Food added to today\'s log' : 'Food saved successfully',
      });
      if (toastResetRef.current) clearTimeout(toastResetRef.current);
      toastResetRef.current = setTimeout(() => setToast(null), 2200);

      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      const message = getErrorMessage(err, 'add food');
      setError(message);
      setToast({ type: 'error', message });
      if (toastResetRef.current) clearTimeout(toastResetRef.current);
      toastResetRef.current = setTimeout(() => setToast(null), 2600);
    } finally {
      setSaving(false);
      setSaveAction('');
    }
  };

  return (
    <PageTransition>
    <div className="page-shell">
      {toast?.message && (
        <div className={`save-toast ${toast.type === 'error' ? 'save-toast--error' : 'save-toast--success'}`} role="status">
          {toast.message}
        </div>
      )}
      <div className="page-header card">
        <div>
          <p className="page-kicker">Food Library</p>
          <h1>Add Food</h1>
          <p className="page-subtitle">Create a food record manually or auto-fill nutrition from suggestions.</p>
        </div>
      </div>

      <Alert type="error" message={error} onDismiss={() => setError('')} />
      <Alert type="success" message={success} onDismiss={() => setSuccess('')} />

      <div className="card page-card today-summary-card">
        <div className="today-summary-head">
          <h2>Today's Intake</h2>
          {summaryLoading && <Spinner size="sm" />}
        </div>
        <div className="today-summary-grid">
          <div><span>Calories</span><strong>{todaySummary.calories} kcal</strong></div>
          <div><span>Protein</span><strong>{todaySummary.protein}g</strong></div>
          <div><span>Carbs</span><strong>{todaySummary.carbs}g</strong></div>
          <div><span>Fat</span><strong>{todaySummary.fats}g</strong></div>
        </div>
        <small className="field-hint">{todaySummary.count} log entries today</small>
      </div>

      <div className="page-two-column">
        <div className="card page-card">
          <form className="page-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group form-group--search" ref={searchWrapRef}>
              <label htmlFor="food-name">Food Name</label>
              <div className="input-shell">
                <input
                  id="food-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('name')}
                  placeholder="Paneer, Dal, Chicken"
                  autoComplete="off"
                  className={shouldShowError('name') ? 'input-error' : ''}
                  onKeyDown={handleFoodNameKeyDown}
                  aria-expanded={showSuggestions}
                  aria-autocomplete="list"
                />
                {searching && (
                  <span className="input-spinner" aria-label="Searching foods">
                    <Spinner size="sm" />
                  </span>
                )}
              </div>
              <small className="field-hint">Start typing to see suggestions</small>
              {autoFilled && <span className="autofill-badge">Auto-filled</span>}
              {shouldShowError('name') && <small className="field-error">{errors.name}</small>}

              {showSuggestions && (
                <div className="suggestion-dropdown" role="listbox" aria-label="Food suggestions">
                  {searching && <div className="suggestion-meta">Searching...</div>}

                  {!searching && suggestions.length > 0 && suggestions.map((food, index) => (
                    <button
                      key={`${food.source || 'db'}-${food.id}-${food.name}`}
                      type="button"
                      className={`suggestion-item ${activeSuggestionIndex === index ? 'suggestion-item--active' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                      onClick={() => handleSelectSuggestion(normalizeFood(food))}
                    >
                      <strong>
                        <HighlightText text={food.name} query={form.name} />
                      </strong>
                      <span>
                        {Number(food.calories || 0)} kcal · {food.source === 'spoonacular' ? 'Spoonacular' : 'Saved food'}
                      </span>
                    </button>
                  ))}

                  {!searching && searchAttempted && suggestions.length === 0 && (
                    <div className="suggestion-meta">No foods found</div>
                  )}
                </div>
              )}

              {searching && <small className="field-hint">Searching foods…</small>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="serving-size">Serving Size</label>
                <input
                  id="serving-size"
                  name="servingSize"
                  value={form.servingSize}
                  onChange={handleChange}
                  onBlur={() => handleBlur('servingSize')}
                  placeholder="1 bowl"
                  className={shouldShowError('servingSize') ? 'input-error' : ''}
                />
                {shouldShowError('servingSize') && <small className="field-error">{errors.servingSize}</small>}
              </div>
              <div className="form-group">
                <label htmlFor="food-category">Category</label>
                <select id="food-category" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value || 'none'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="food-type">Type</label>
                <select id="food-type" name="type" value={form.type} onChange={handleChange}>
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value || 'none'} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group form-group--inline-note">
                <label>Status</label>
                <div className="inline-pill">
                  {isValid ? 'Ready to save' : 'Please fill all required fields'}
                </div>
              </div>
            </div>

            <div className="form-row-4">
              <div className="form-group">
                <label htmlFor="food-calories">Calories</label>
                <input id="food-calories" name="calories" type="number" min="1" value={form.calories} onChange={handleChange} onBlur={() => handleBlur('calories')} placeholder="180" className={shouldShowError('calories') ? 'input-error' : ''} />
                {shouldShowError('calories') && <small className="field-error">{errors.calories}</small>}
              </div>
              <div className="form-group">
                <label htmlFor="food-protein">Protein (g)</label>
                <input id="food-protein" name="protein" type="number" min="1" value={form.protein} onChange={handleChange} onBlur={() => handleBlur('protein')} placeholder="10" className={`${shouldShowError('protein') ? 'input-error' : ''} ${flashFields.protein ? 'input-autofilled' : ''}`.trim()} />
                {shouldShowError('protein') && <small className="field-error">{errors.protein}</small>}
              </div>
              <div className="form-group">
                <label htmlFor="food-carbs">Carbs (g)</label>
                <input id="food-carbs" name="carbs" type="number" min="1" value={form.carbs} onChange={handleChange} onBlur={() => handleBlur('carbs')} placeholder="24" className={`${shouldShowError('carbs') ? 'input-error' : ''} ${flashFields.carbs ? 'input-autofilled' : ''}`.trim()} />
                {shouldShowError('carbs') && <small className="field-error">{errors.carbs}</small>}
              </div>
              <div className="form-group">
                <label htmlFor="food-fat">Fat (g)</label>
                <input id="food-fat" name="fat" type="number" min="1" value={form.fat} onChange={handleChange} onBlur={() => handleBlur('fat')} placeholder="4" className={`${shouldShowError('fat') ? 'input-error' : ''} ${flashFields.fat ? 'input-autofilled' : ''}`.trim()} />
                {shouldShowError('fat') && <small className="field-error">{errors.fat}</small>}
              </div>
            </div>

            <div className="page-actions page-actions--left">
              <button
                type="button"
                className="btn btn-outline"
                disabled={saving || !isValid}
                onClick={() => submitFood('save')}
              >
                {saving && saveAction === 'save' ? <><Spinner size="sm" /> Saving...</> : 'Save Food'}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving || !isValid}
                onClick={() => submitFood('save-log')}
              >
                {saving && saveAction === 'save-log' ? <><Spinner size="sm" /> Adding...</> : 'Save & Add to Today\'s Log'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => navigate('/logs')}>
                Go to Food Logs
              </button>
            </div>
          </form>
        </div>

        <div className="card page-card page-preview-card">
          <div className="preview-header">
            <span className="preview-emoji">🥗</span>
            <div>
              <h2>Live Preview</h2>
              <p className="page-subtitle">This updates instantly as you type.</p>
            </div>
          </div>
          <div className="preview-summary">
            <div>
              <span>Name</span>
              <strong>{form.name || 'Food name'}</strong>
            </div>
            <div>
              <span>Serving</span>
              <strong>{form.servingSize || '1 bowl'}</strong>
            </div>
            <div>
              <span>Calories</span>
              <strong className={`preview-calories preview-calories--${previewCalorieIntensity}`}>{preview.calories}</strong>
            </div>
            <div>
              <span>Protein</span>
              <strong className="preview-macro preview-macro--protein">{preview.protein}g</strong>
            </div>
            <div>
              <span>Carbs</span>
              <strong className="preview-macro preview-macro--carbs">{preview.carbs}g</strong>
            </div>
            <div>
              <span>Fat</span>
              <strong className="preview-macro preview-macro--fat">{preview.fat}g</strong>
            </div>
            <div>
              <span>Category</span>
              <strong>{form.category || 'Optional'}</strong>
            </div>
            <div>
              <span>Type</span>
              <strong>{form.type || 'Optional'}</strong>
            </div>
          </div>
          <div className="preview-note">
            Use the suggestion dropdown to auto-fill nutrition when a food exists in the database or Spoonacular.
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default AddFood;
