import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { analyzeFood } from '../services/uploadService';
import { addFoodLog }  from '../services/foodLogService';
import { createFood } from '../services/foodService';
import { getErrorMessage } from '../utils/errorHandler';
import Spinner         from '../components/Spinner';
import EmptyState      from '../components/ui/EmptyState';

// ─── Confidence bar ────────────────────────────────────────────────
const ConfidenceBar = ({ probability }) => {
  const pct   = Math.round((probability ?? 0) * 100);
  const color = pct >= 70 ? '#4ade80' : pct >= 40 ? '#facc15' : '#f87171';
  return (
    <div className="confidence-wrap">
      <span className="confidence-label">Detection confidence</span>
      <div className="confidence-track">
        <div className="confidence-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="confidence-pct">{pct}%</span>
    </div>
  );
};

// ─── Single macro pill ─────────────────────────────────────────────
const MacroPill = ({ emoji, label, value, unit, color }) => (
  <div className="macro-pill" style={{ borderColor: color }}>
    <span className="macro-pill-emoji">{emoji}</span>
    <span className="macro-pill-value" style={{ color }}>{value}{unit}</span>
    <span className="macro-pill-label">{label}</span>
  </div>
);

// ─── FoodUpload page ───────────────────────────────────────────────
const FoodUpload = () => {
  const fileInputRef = useRef(null);

  // Upload / analysis state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl,   setPreviewUrl]   = useState('');
  const [analyzing,    setAnalyzing]    = useState(false);
  const [result,       setResult]       = useState(null);   // Spoonacular response
  const [dragging,     setDragging]     = useState(false);

  // Save-to-log state
  const [logging,  setLogging]  = useState(false);
  const [logState, setLogState] = useState('idle'); // 'idle' | 'success' | 'error'
  const [logMsg,   setLogMsg]   = useState('');

  // Upload error
  const [error, setError] = useState('');

  // ── File selection ─────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are supported.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB.');
      return;
    }
    setError('');
    setResult(null);
    setLogState('idle');
    setLogMsg('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const onInputChange  = (e) => handleFile(e.target.files[0]);
  const onDrop         = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };
  const onDragOver     = (e) => { e.preventDefault(); setDragging(true);  };
  const onDragLeave    = ()  => setDragging(false);
  const openFilePicker = ()  => fileInputRef.current?.click();

  const resetUpload = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setResult(null);
    setError('');
    setLogState('idle');
    setLogMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Analyze ────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setError('');
    setResult(null);
    setLogState('idle');
    setLogMsg('');
    setAnalyzing(true);
    try {
      const res = await analyzeFood(selectedFile);
      setResult(res.data.data);
    } catch (err) {
      const message = getErrorMessage(err, 'food analysis');
      setError(message);
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Log This Food ──────────────────────────────────────────────
  const handleLogFood = async () => {
    if (!result || logging) return;
    setLogging(true);
    setLogState('idle');
    setLogMsg('');
    try {
      // Validate nutrition data
      const calories = Math.round(result.nutrition?.calories ?? 0);
      if (calories === 0) {
        setLogState('error');
        setLogMsg('Could not determine calories. Please enter manually in Dashboard.');
        setLogging(false);
        return;
      }

      await addFoodLog({
        foodId: (
          await createFood({
            name: result.detectedFood || 'Unknown Food',
            calories,
            protein: Math.round(result.nutrition?.protein ?? 0),
            carbs: Math.round(result.nutrition?.carbs ?? 0),
            fat: Math.round(result.nutrition?.fat ?? 0),
            servingSize: '1 serving',
          })
        ).data?.data?._id,
        quantity: 1,
      });
      setLogState('success');
      setLogMsg(`✓ "${result.detectedFood}" has been added to today's log!`);
    } catch (err) {
      setLogState('error');
      const message = getErrorMessage(err, 'food logging');
      setLogMsg(message);
    } finally {
      setLogging(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────
  const nutrition   = result?.nutrition ?? {};
  const calories    = Math.round(nutrition.calories ?? 0);
  const protein     = Math.round(nutrition.protein  ?? 0);
  const carbs       = Math.round(nutrition.carbs    ?? 0);
  const fat         = Math.round(nutrition.fat      ?? 0);
  const isLogged    = logState === 'success';
  const isNonFood   = Boolean(result?.isNonFood);
  const canLogFood  = !isNonFood && calories > 0;

  // ── Render ─────────────────────────────────────────────────────
  return (
    <PageTransition>
    <div className="upload-page">

      {/* Header */}
      <div className="upload-page-header">
        <h1>📸 Food Analyzer</h1>
        <p className="subtitle">
          Upload a photo of your meal — AI will detect the food and fill in the nutrition for you.
        </p>
      </div>

      {/* Drop zone / Empty state */}
      {!previewUrl && !result && (
        <div className="card">
          <div
            className={`drop-zone ${dragging ? 'drop-zone--active' : ''}`}
            onClick={openFilePicker}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openFilePicker()}
            aria-label="Upload food image"
          >
            <div className="drop-zone-icon">🖼️</div>
            <p className="drop-zone-text">Drag &amp; drop a food photo here</p>
            <p className="drop-zone-sub">or click to browse — JPEG, PNG, WebP · max 5 MB</p>
            <input
              ref={fileInputRef}
              id="food-image-input"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={onInputChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      )}

      {/* Upload error */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Preview + Analyze */}
      {previewUrl && !result && (
        <div className="card upload-preview-card">
          <div className="preview-layout">
            <div className="preview-image-wrap">
              <img src={previewUrl} alt="Food preview" className="preview-image" />
            </div>
            <div className="preview-actions">
              <p className="preview-filename">{selectedFile?.name}</p>
              <p className="preview-filesize">
                {selectedFile ? (selectedFile.size / 1024).toFixed(1) + ' KB' : ''}
              </p>
              <button
                id="analyze-btn"
                className="btn btn-primary btn-full"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing
                  ? <><Spinner size="sm" /> Analyzing…</>
                  : '🔍 Analyze Food'}
              </button>
              <button
                className="btn btn-outline btn-full"
                onClick={resetUpload}
                disabled={analyzing}
              >
                ✕ Remove Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Result Card ── */}
      {result && (
        <div className="card result-card">

          {/* ── Food name + confidence ── */}
          <div className="result-header">
            {result.imageUrl && (
              <img
                src={result.imageUrl}
                alt={result.detectedFood}
                className="result-thumb"
              />
            )}
            <div style={{ flex: 1 }}>
              <h2 className="result-food-name">
                {result.detectedFood || 'Unknown Food'}
              </h2>
              <ConfidenceBar probability={result.probability} />
            </div>
          </div>

          {/* ── Calorie highlight + macro pills ── */}
          <div className="nutrition-section">
            <p className="nutrition-title">Nutrition (per serving)</p>

            {/* Calorie spotlight */}
            <div className="calorie-spotlight">
              <span className="calorie-number">{calories}</span>
              <span className="calorie-unit">kcal</span>
            </div>

            {/* Macro pills row */}
            <div className="macro-pills-row">
              <MacroPill emoji="💪" label="Protein" value={protein} unit="g" color="#16a34a" />
              <MacroPill emoji="🌾" label="Carbs"   value={carbs}   unit="g" color="#2563eb" />
              <MacroPill emoji="🥑" label="Fat"     value={fat}     unit="g" color="#ea580c" />
            </div>
          </div>

          {/* ── Approximation notice ── */}
          {result.isApproximation && (
            <div className="alert alert-info">
              <strong>📝 Estimated Nutrition:</strong> {result.message || 'This is an estimate based on common food data. For AI-powered detection, add a Spoonacular API key to your .env file.'}
            </div>
          )}

          {/* ── Similar recipes ── */}
          {result.recipes?.length > 0 && (
            <div className="recipes-section">
              <p className="recipes-title">Similar Recipes</p>
              <ul className="recipes-list">
                {result.recipes.slice(0, 3).map((r, i) => (
                  <li key={i} className="recipe-item">
                    {r.title || r.name || `Recipe ${i + 1}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Log This Food CTA ── */}
          <div className="save-section">

            {/* Feedback message */}
            {logMsg && (
              <div className={`alert ${logState === 'success' ? 'alert-success' : 'alert-error'}`}>
                {logMsg}
              </div>
            )}

            {/* Primary action */}
            {!isLogged ? (
              <button
                id="log-food-btn"
                className="btn btn-primary btn-full btn-log-food"
                onClick={handleLogFood}
                disabled={logging || !canLogFood}
              >
                {logging
                  ? <><span className="spinner" /> Adding to log…</>
                  : canLogFood
                    ? '＋ Log This Food'
                    : '⚠ Upload a valid food image to log'}
              </button>
            ) : (
              /* Post-save actions */
              <div className="post-log-actions">
                <Link to="/dashboard" className="btn btn-primary btn-full">
                  📊 View Dashboard
                </Link>
                <button
                  className="btn btn-outline btn-full"
                  onClick={resetUpload}
                >
                  📸 Analyze Another Food
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
    </PageTransition>
  );
};

export default FoodUpload;
