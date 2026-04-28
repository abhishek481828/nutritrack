const formatLastUpdated = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const MealGenerator = ({ mealPlan, loading, onGenerate, generatedCount = 0, lastUpdated = null }) => {
  const lastUpdatedText = formatLastUpdated(lastUpdated);

  return (
    <section className="coach-card">
      <div className="coach-section-head">
        <h3>Meal Generator</h3>
        <button type="button" className="btn btn-primary" onClick={onGenerate} disabled={loading}>
          {loading ? 'Generating...' : 'Generate Meal Plan'}
        </button>
      </div>

      {lastUpdatedText ? (
        <p className="coach-empty">
          Updated at {lastUpdatedText}{generatedCount > 0 ? ` • Regenerated ${generatedCount} time${generatedCount > 1 ? 's' : ''}` : ''}
        </p>
      ) : null}

      <div className="coach-meal-grid">
        {mealPlan.map((meal) => (
          <article className="coach-meal-card" key={meal.meal || meal.name}>
            <h4>{meal.meal || meal.name}</h4>
            <p>{Math.round(Number(meal.calories) || 0)} kcal</p>
            <ul>
              {(meal.ideas || []).slice(0, 4).map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
            {(!meal.ideas || meal.ideas.length === 0) ? <span className="coach-empty">No ideas yet</span> : null}
          </article>
        ))}
      </div>
    </section>
  );
};

export default MealGenerator;
