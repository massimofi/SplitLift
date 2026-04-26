// Card — universal LEGO. Drives the v7 design system.
//
//   <Card variant="gradient" gradient="priority" size="md" interactive>
//     <Card.Header>
//       <Card.Eyebrow>WORKOUT</Card.Eyebrow>
//       <Card.Title>Push Day</Card.Title>
//       <Card.Sub>4 exercises</Card.Sub>
//     </Card.Header>
//     <Card.Body>...</Card.Body>
//   </Card>
//
// Variants: gradient | surface | subtle
// Gradient names map to --grad-* tokens in tokens.css.

import React from 'react';

// Map a 0–100 score to a semantic gradient name. Use as
//   <Card variant="gradient" gradient={gradFromScore(82)}>
export function gradFromScore(score) {
  if (score >= 85) return 'score-great';
  if (score >= 65) return 'score-good';
  if (score >= 40) return 'score-mid';
  return 'score-poor';
}

export function Card({
  variant = 'surface',
  gradient = 'priority',
  size = 'md',
  interactive = false,
  glow = false,
  // v10 Issue 5: optional Lucide icon component shown top-right at 24px /
  // opacity 0.6. Pass-through React component reference (e.g. icon={Heart}).
  icon: IconCmp = null,
  iconSize = 24,
  as,
  className = '',
  style,
  onClick,
  children,
  ...rest
}) {
  const Tag = as || (interactive || onClick ? 'button' : 'div');
  const isInteractive = interactive || !!onClick;
  const cls = ['sl-card', IconCmp && 'has-corner-icon', className].filter(Boolean).join(' ');
  // For <button>, reset only the bits that would clobber Card styling.
  // CRITICAL: never set `background: 'none'` here — it kills the gradient
  // background-image set by .sl-card[data-grad=...] in card.css.
  const buttonReset = Tag === 'button'
    ? { border: 0, font: 'inherit', textAlign: 'left', width: '100%', color: 'inherit', cursor: isInteractive ? 'pointer' : 'default' }
    : null;
  return (
    <Tag
      className={cls}
      data-variant={variant}
      data-grad={variant === 'gradient' ? gradient : undefined}
      data-size={size}
      data-interactive={isInteractive ? 'true' : undefined}
      data-glow={glow ? 'true' : undefined}
      onClick={onClick}
      style={{ ...buttonReset, ...style }}
      {...rest}
    >
      {IconCmp && (
        <span className="sl-card-corner-icon" aria-hidden="true">
          <IconCmp size={iconSize} strokeWidth={2.0}/>
        </span>
      )}
      {children}
    </Tag>
  );
}

function Header({ children, right, className = '', ...rest }) {
  if (right !== undefined) {
    return (
      <div className={`sl-card-header ${className}`} {...rest}>
        <div className="sl-card-header-l">{children}</div>
        <div className="sl-card-header-r">{right}</div>
      </div>
    );
  }
  return <div className={`sl-card-header ${className}`} {...rest}>{children}</div>;
}

function Eyebrow({ children, className = '', ...rest }) {
  return <div className={`sl-card-eyebrow ${className}`} {...rest}>{children}</div>;
}

function Title({ children, className = '', as: Tag = 'div', ...rest }) {
  return <Tag className={`sl-card-title ${className}`} {...rest}>{children}</Tag>;
}

function Sub({ children, className = '', ...rest }) {
  return <div className={`sl-card-sub ${className}`} {...rest}>{children}</div>;
}

function Body({ children, className = '', ...rest }) {
  return <div className={`sl-card-body ${className}`} {...rest}>{children}</div>;
}

function Value({ children, unit, className = '', ...rest }) {
  return (
    <div className={`sl-card-value ${className}`} {...rest}>
      {children}
      {unit && <span className="sl-card-value-unit">{unit}</span>}
    </div>
  );
}

Card.Header = Header;
Card.Eyebrow = Eyebrow;
Card.Title = Title;
Card.Sub = Sub;
Card.Body = Body;
Card.Value = Value;
