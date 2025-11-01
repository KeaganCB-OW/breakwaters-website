import React, { Children, useLayoutEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import './Stepper.css';

const noop = () => true;

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  className = '',
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  renderStepIndicator,
  onNext = noop,
  onBack = noop,
  onComplete = noop,
  renderCompletion,
  ...rest
}) {
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const [currentStep, setCurrentStep] = useState(() => {
    const normalisedInitial = Number(initialStep);
    if (!Number.isFinite(normalisedInitial) || normalisedInitial < 1) {
      return 1;
    }
    if (normalisedInitial > totalSteps) {
      return totalSteps;
    }
    return normalisedInitial;
  });
  const [direction, setDirection] = useState(0);

  const isCompleted = currentStep > totalSteps;
  const isLastStep = currentStep === totalSteps;

  const updateStep = newStep => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) {
      onFinalStepCompleted();
    } else {
      onStepChange(newStep);
    }
  };

  const handleBack = async () => {
    if (currentStep <= 1) {
      return;
    }

    const canGoBack = await onBack(currentStep);
    if (canGoBack === false) {
      return;
    }

    setDirection(-1);
    updateStep(currentStep - 1);
  };

  const handleNext = async () => {
    if (isLastStep) {
      return handleComplete();
    }

    const canProceed = await onNext(currentStep);
    if (canProceed === false) {
      return;
    }

    setDirection(1);
    updateStep(currentStep + 1);
  };

  const handleComplete = async () => {
    const shouldComplete = await onComplete(currentStep);
    if (shouldComplete === false) {
      return;
    }

    setDirection(1);
    updateStep(totalSteps + 1);
  };

  const outerClassName = ['resume-stepper__outer', className].filter(Boolean).join(' ');

  return (
    <div className={outerClassName} {...rest}>
      <div className={`resume-stepper__container ${stepCircleContainerClassName}`}>
        <div className={`resume-stepper__indicator-row ${stepContainerClassName}`}>
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1;
            const isNotLastStep = index < totalSteps - 1;
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: clicked => {
                      if (disableStepIndicators) {
                        return;
                      }
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={clicked => {
                      setDirection(clicked > currentStep ? 1 : -1);
                      updateStep(clicked);
                    }}
                  />
                )}
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            );
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`resume-stepper__content ${contentClassName}`}
          renderCompletion={renderCompletion}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`resume-stepper__footer ${footerClassName}`}>
            <div className={`resume-stepper__footer-nav ${currentStep !== 1 ? 'spread' : 'end'}`}>
              {currentStep !== 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className={`resume-stepper__back ${currentStep === 1 ? 'inactive' : ''}`}
                  {...backButtonProps}
                >
                  {backButtonText}
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                className="resume-stepper__next"
                {...nextButtonProps}
              >
                {isLastStep ? 'Submit' : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepContentWrapper({ isCompleted, currentStep, direction, children, className, renderCompletion }) {
  const [parentHeight, setParentHeight] = useState(0);
  const contentKey = isCompleted ? 'completed' : currentStep;
  const content = isCompleted ? renderCompletion?.() ?? null : children;

  return (
    <motion.div
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
      animate={{ height: content ? parentHeight : 0 }}
      transition={{ type: 'spring', duration: 0.4 }}
    >
      <AnimatePresence initial={false} mode="wait" custom={direction}>
        {content && (
          <SlideTransition key={contentKey} direction={direction} onHeightReady={h => setParentHeight(h)}>
            {content}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SlideTransition({ children, direction, onHeightReady }) {
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight);
    }
  }, [children, onHeightReady]);

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4 }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  );
}

const stepVariants = {
  enter: dir => ({
    x: dir >= 0 ? '-100%' : '100%',
    opacity: 0
  }),
  center: {
    x: '0%',
    opacity: 1
  },
  exit: dir => ({
    x: dir >= 0 ? '50%' : '-50%',
    opacity: 0
  })
};

export function Step({ children }) {
  return <div className="resume-stepper__step">{children}</div>;
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators }) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete';

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step);
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      className="resume-stepper__indicator"
      animate={status}
      initial={false}
      whileTap={{ scale: disableStepIndicators ? 1 : 0.98 }}
      disabled={disableStepIndicators}
    >
      <motion.div
        variants={{
          inactive: { scale: 1, backgroundColor: '#222', color: '#a3a3a3' },
          active: { scale: 1, backgroundColor: '#5227FF', color: '#5227FF' },
          complete: { scale: 1, backgroundColor: '#5227FF', color: '#3b82f6' }
        }}
        transition={{ duration: 0.3 }}
        className="resume-stepper__indicator-inner"
      >
        {status === 'complete' ? (
          <CheckIcon className="resume-stepper__check-icon" />
        ) : status === 'active' ? (
          <div className="resume-stepper__active-dot" />
        ) : (
          <span className="resume-stepper__number">{step}</span>
        )}
      </motion.div>
    </motion.button>
  );
}

function StepConnector({ isComplete }) {
  const lineVariants = {
    incomplete: { width: 0, backgroundColor: 'transparent' },
    complete: { width: '100%', backgroundColor: '#5227FF' }
  };

  return (
    <div className="resume-stepper__connector">
      <motion.div
        className="resume-stepper__connector-inner"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}

function CheckIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.1, type: 'tween', ease: 'easeOut', duration: 0.3 }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
