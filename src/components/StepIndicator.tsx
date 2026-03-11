import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  highestStepReached: number;
  onStepClick: (step: number) => void;
  labels: string[];
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  highestStepReached,
  onStepClick,
  labels,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-5">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const isActive = step === currentStep;
          const isCompleted = step < currentStep;
          const isReachable = step <= highestStepReached;
          const isClickable = isReachable && !isActive;

          return (
            <React.Fragment key={step}>
              {i > 0 && (
                <div className="flex-1 mx-1 sm:mx-2">
                  <div
                    className={`h-px transition-colors duration-300 ${
                      step <= currentStep ? 'bg-alencar-green' : 'bg-white/10'
                    }`}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => isClickable && onStepClick(step)}
                disabled={!isClickable}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-alencar-green text-white cursor-pointer group-hover:bg-alencar-hover'
                      : isActive
                        ? 'bg-alencar-green/20 text-alencar-green-light ring-2 ring-alencar-green'
                        : isReachable
                          ? 'bg-alencar-green text-white cursor-pointer group-hover:bg-alencar-hover'
                          : 'bg-white/10 text-white/30 cursor-default'
                  }`}
                >
                  {isCompleted || (isReachable && !isActive) ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={`text-xs truncate max-w-[70px] transition-colors duration-300 ${
                    isActive
                      ? 'text-white font-medium'
                      : isCompleted || isReachable
                        ? 'text-white/60'
                        : 'text-white/30'
                  }`}
                >
                  {labels[i]}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
