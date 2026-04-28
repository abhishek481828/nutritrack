/**
 * PageLoader — full-page skeleton reflecting the new dark glass design.
 */
const Shimmer = ({ h = 20, w = '100%', radius = 8, mb = 0 }) => (
  <div
    className="shimmer"
    style={{ height: h, width: w, borderRadius: radius, marginBottom: mb }}
  />
);

const SkeletonCard = ({ children, style }) => (
  <div className="card skeleton-card" style={style}>{children}</div>
);

const PageLoader = () => (
  <div className="dashboard-page">

    {/* Header */}
    <div className="dashboard-header">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Shimmer h={36} w={280} radius={10} />
        <Shimmer h={14} w={200} radius={6}  />
      </div>
      <Shimmer h={38} w={160} radius={8} />
    </div>

    {/* Calorie ring card */}
    <SkeletonCard>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Shimmer h={130} w={130} radius={65} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shimmer h={40} w={100} radius={8} />
            <Shimmer h={14} w={120} radius={6} />
          </div>
          <Shimmer h={12} radius={99} />
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Shimmer h={24} w={60} radius={6} />
                <Shimmer h={10} w={70} radius={4} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SkeletonCard>

    {/* Chart skeleton */}
    <SkeletonCard style={{ height: 200 }}>
      <Shimmer h={20} w={160} radius={6} mb={16} />
      <Shimmer h={140} radius={10} />
    </SkeletonCard>

    {/* Macro skeleton */}
    <SkeletonCard>
      <Shimmer h={20} w={160} radius={6} mb={14} />
      <Shimmer h={8}  radius={99} mb={10} />
      <div style={{ display: 'flex', gap: 14, marginBottom: 18 }}>
        <Shimmer h={10} w={90} radius={99} />
        <Shimmer h={10} w={80} radius={99} />
        <Shimmer h={10} w={70} radius={99} />
      </div>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <Shimmer h={12} w={70} radius={6} />
            <Shimmer h={12} w={80} radius={6} />
          </div>
          <Shimmer h={7} radius={99} />
        </div>
      ))}
    </SkeletonCard>

    {/* Quick actions skeleton */}
    <SkeletonCard>
      <Shimmer h={20} w={140} radius={6} mb={16} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 12 }}>
        {[0,1,2,3,4,5].map(i => (
          <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '1rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Shimmer h={28} w={28} radius={8} />
            <Shimmer h={14} w="70%" radius={6} />
            <Shimmer h={10} radius={4} />
          </div>
        ))}
      </div>
    </SkeletonCard>

  </div>
);

export default PageLoader;
