const DailyScoreCard = ({ score }) => {
  const boundedScore = Math.min(100, Math.max(0, Math.round(Number(score) || 0)));

  return (
    <section className="coach-card coach-score-card">
      <h3>Daily Nutrition Score</h3>
      <div className="coach-score-ring" style={{ '--score-angle': `${(boundedScore / 100) * 360}deg` }}>
        <div className="coach-score-inner">
          <strong>{boundedScore}</strong>
          <span>/100</span>
        </div>
      </div>
      <p>{boundedScore >= 80 ? 'Excellent balance today.' : boundedScore >= 60 ? 'Good progress, keep refining macros.' : 'Focus on macros to improve your score.'}</p>
    </section>
  );
};

export default DailyScoreCard;
