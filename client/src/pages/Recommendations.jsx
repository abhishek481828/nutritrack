import PageTransition from '../components/ui/PageTransition';
import NutritionCoachDashboard from '../components/recommendations/NutritionCoachDashboard';

const Recommendations = () => {
  return (
    <PageTransition>
      <div className="page-shell recommendations-page-shell">
        <NutritionCoachDashboard />
      </div>
    </PageTransition>
  );
};

export default Recommendations;
