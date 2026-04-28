import { useState, useEffect, useRef, useCallback } from 'react';
import { searchFoods } from '../services/foodService';

/**
 * FoodSearchInput
 *
 * A self-contained autocomplete input that:
 *  - Debounces keystrokes (300 ms) before hitting /api/foods/search
 *  - Shows a dropdown of up to 8 matches
 *  - Supports keyboard navigation (↑ ↓ Enter Escape)
 *  - Closes on click-outside
 *  - Calls onSelect(food) with the Food document on selection
 *
 * Props:
 *   value      {string}   – controlled value for the input
 *   onChange   {fn}       – called on every keystroke  (e) => void
 *   onSelect   {fn}       – called when user picks a suggestion (food) => void
 *   id         {string}
 *   placeholder {string}
 *   required   {bool}
 */
const FoodSearchInput = ({
  value,
  onChange,
  onSelect,
  id = 'foodName',
  placeholder = 'e.g. Grilled Chicken',
  required = false,
}) => {
  const [suggestions, setSuggestions]   = useState([]);
  const [open,        setOpen]          = useState(false);
  const [loading,     setLoading]       = useState(false);
  const [activeIdx,   setActiveIdx]     = useState(-1);   // keyboard cursor
  const wrapRef   = useRef(null);
  const timerRef  = useRef(null);

  // ── Debounced search ──────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(timerRef.current);

    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await searchFoods(value.trim());
        setSuggestions(res.data.data ?? []);
        setOpen(true);
        setActiveIdx(-1);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [value]);

  // ── Click-outside closes dropdown ─────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Select a suggestion ───────────────────────────────────────────
  const handleSelect = useCallback(
    (food) => {
      onSelect(food);
      setOpen(false);
      setSuggestions([]);
      setActiveIdx(-1);
    },
    [onSelect]
  );

  // ── Keyboard navigation ───────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();       // prevent form submit while navigating
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIdx(-1);
    }
  };

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="food-search-wrap" ref={wrapRef}>
      <div className="food-search-field">
        <input
          id={id}
          name={id}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          autoComplete="off"
          required={required}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="food-suggestions"
          aria-activedescendant={
            activeIdx >= 0 ? `food-suggestion-${activeIdx}` : undefined
          }
        />
        {loading && <span className="food-search-spinner" aria-hidden="true" />}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id="food-suggestions"
          className="food-suggestions"
          role="listbox"
          aria-label="Food suggestions"
        >
          {suggestions.map((food, idx) => (
            <li
              key={food._id}
              id={`food-suggestion-${idx}`}
              className={`food-suggestion-item${idx === activeIdx ? ' food-suggestion-item--active' : ''}`}
              role="option"
              aria-selected={idx === activeIdx}
              onMouseDown={(e) => {
                e.preventDefault();  // prevent blur before click fires
                handleSelect(food);
              }}
              onMouseEnter={() => setActiveIdx(idx)}
            >
              <span className="suggestion-name">{food.name}</span>
              <span className="suggestion-meta">
                {food.calories} kcal
                {food.servingSize ? ` · ${food.servingSize}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FoodSearchInput;
