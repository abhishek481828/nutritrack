const QuickSuggestion = ({ suggestions, onSuggest }) => {
  return (
    <section className="coach-card">
      <div className="coach-section-head">
        <h3>Quick Suggestion</h3>
        <button type="button" className="btn" onClick={onSuggest}>What should I eat now?</button>
      </div>

      <div className="coach-quick-list">
        {suggestions.length === 0 ? (
          <p className="coach-empty">Tap the button to get instant food ideas.</p>
        ) : (
          suggestions.map((food) => (
            <div className="coach-quick-item" key={food.id || food._id || food.name}>
              <strong>{food.name}</strong>
              <span>
                {Math.round(Number(food.calories) || 0)} kcal • {Math.round(Number(food.protein) || 0)}g protein • {Math.round(Number(food.carbs) || 0)}g carbs
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
};

export default QuickSuggestion;
