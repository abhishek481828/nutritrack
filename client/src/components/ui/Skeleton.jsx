import React from 'react';

const Skeleton = ({
  width = '100%',
  height = '1rem',
  variant = 'text', // 'text', 'circle', 'rect'
  className = '',
  style = {},
}) => {
  const isCircle = variant === 'circle';
  const isText = variant === 'text';

  const skeletonStyle = {
    width,
    height,
    borderRadius: isCircle ? '50%' : isText ? '4px' : '8px',
    display: 'inline-block',
    ...style,
  };

  return (
    <div
      className={`shimmer ${className}`}
      style={skeletonStyle}
    />
  );
};

export const SkeletonCard = ({
  rows = 3,
  className = '',
}) => {
  return (
    <div className={`card skeleton-card ${className}`} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <Skeleton width="40%" height="1.25rem" variant="rect" />
      {Array.from({ length: rows }).map((_, idx) => (
        <Skeleton key={idx} width={idx === rows - 1 ? '60%' : '100%'} height="0.85rem" />
      ))}
    </div>
  );
};

export default Skeleton;
export { Skeleton };
