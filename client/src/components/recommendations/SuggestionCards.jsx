const SuggestionCards = ({ cards, onSelectFood }) => {
  return (
    <section className="coach-card">
      <h3>Smart Suggestion Cards</h3>
      <div className="coach-suggestion-grid">
        {cards.map((card) => (
          <article className="coach-suggestion-card" key={card.key}>
            <header>
              <h4>{card.title}</h4>
              <span>{card.subtitle}</span>
            </header>
            <div className="coach-food-list">
              {(card.items || []).slice(0, 3).map((food) => (
                <button key={food.id || food._id || food.name} type="button" onClick={() => onSelectFood(food)}>
                  <strong>{food.name}</strong>
                  <small>{Math.round(Number(food.calories) || 0)} kcal • {Math.round(Number(food.protein) || 0)}g protein</small>
                </button>
              ))}
              {(card.items || []).length === 0 ? <p className="coach-empty">No foods available yet.</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default SuggestionCards;
