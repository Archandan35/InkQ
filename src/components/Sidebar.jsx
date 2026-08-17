import React from 'react';
import { IconCheck } from '../icon.jsx';
import logo from '../assets/logo.png';

const WIZARD_STEPS = [
  { id: 1, title: 'Welcome', sub: 'Get started' },
  { id: 2, title: 'Scan & Detect', sub: 'Upload & scan pages' },
  { id: 3, title: 'Review & Print', sub: 'Preview & finalize' },
];

const PROGRESS = { 1: 'p33', 2: 'p66', 3: 'p100' };

export default function Sidebar({ currentStep = 1, maxReached = 3, onSelect, collapsed = false }) {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="brand-row">
        <img src={logo} alt="InkQ logo" className="logo" />
      </div>

      <div className="sidebar-head-divider" />

      <div className="steps">
        {WIZARD_STEPS.map((step, i) => {
          const isDone = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isLocked = step.id > maxReached;
          return (
            <React.Fragment key={step.id}>
              {i > 0 && (
                <div
                  className={`step-connector ${step.id <= currentStep ? 'on' : 'off'}`}
                />
              )}
              <div
                className={`step ${isCurrent ? 'active' : ''} ${isLocked ? 'locked' : ''}`}
                onClick={() => !isLocked && onSelect && onSelect(step.id)}
              >
                <div className={`step-circle ${isDone ? 'done' : isCurrent ? 'current' : 'todo'}`}>
                  {isDone ? <IconCheck size={22} strokeWidth={3} /> : step.id}
                </div>
                <div className="step-body">
                  <div className={`step-title ${isCurrent ? 'current' : ''}`}>{step.title}</div>
                  <div className="step-sub">{step.sub}</div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="sidebar-spacer" />

      <div className="sidebar-footer">
        <div className="footer-step-label">Step {currentStep} of 3</div>
        <div className="progress-track">
          <div className={`progress-fill ${PROGRESS[currentStep]}`} />
        </div>
      </div>
    </aside>
  );
}