const InsightBanner = ({ message, subMessage }) => {
  return (
    <section className="coach-banner">
      <p className="coach-banner-kicker">Nutrition Coach</p>
      <h2>{message}</h2>
      <p>{subMessage}</p>
    </section>
  );
};

export default InsightBanner;
