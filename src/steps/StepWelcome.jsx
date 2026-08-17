import React from 'react';
import Button from '../components/Button.jsx';
import { IconArrowRight, IconSparkleStar, WelcomeArt } from '../icon.jsx';

const SPARKLES = [
  { top: 78, left: 50, width: 14, height: 14, opacity: 0.9 },
  { top: 150, left: 8, width: 9, height: 9, opacity: 0.55 },
  { top: 230, left: 78, width: 10, height: 10, opacity: 0.45 },
  { top: 66, right: 40, width: 19, height: 19, opacity: 0.95 },
  { top: 150, right: 15, width: 6, height: 6, opacity: 0.6, circle: true },
  { top: 210, right: 38, width: 11, height: 11, opacity: 0.5 },
];

export default function StepWelcome({ onNext }) {
  return (
    <div className="main">
      <div className="illustration">
        <div className="blob" />

        {SPARKLES.map((s, i) => (
          <IconSparkleStar
            key={i}
            className="sparkle"
            size={s.width}
            circle={s.circle}
            style={{ top: s.top, left: s.left, right: s.right, opacity: s.opacity }}
          />
        ))}

        <WelcomeArt className="main-art" />
      </div>

      <h1 className="hero-title">Welcome to InkQ</h1>
      <p className="hero-sub">
        Scan or upload question papers and automatically detect and arrange questions.
      </p>

      <Button
        variant="primary"
        size="lg"
        iconRight={<IconArrowRight size={17} strokeWidth={2.2} />}
        onClick={onNext}
      >
        Get Started
      </Button>
    </div>
  );
}