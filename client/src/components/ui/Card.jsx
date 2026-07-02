import React from 'react';

const Card = ({
  children,
  title,
  glow = false,
  className = '',
  as: Component = 'div',
  ...props
}) => {
  const cardClass = [
    'card',
    glow ? 'card-glow' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <Component className={cardClass} {...props}>
      {title && <h2>{title}</h2>}
      {children}
    </Component>
  );
};

export default Card;
