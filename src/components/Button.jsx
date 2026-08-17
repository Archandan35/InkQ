import React from 'react';

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  iconRight,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  block = false,
  style,
}) {
  const cls = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    block ? 'btn-block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled}
      onClick={onClick}
      style={style}
    >
      {icon}
      {children != null && <span className="btn-label">{children}</span>}
      {iconRight}
    </button>
  );
}