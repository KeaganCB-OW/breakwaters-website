import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import '../../../styling/Stepper.css';

function buildStepContext({
  stepIndex,
  stepsLength,
  goToStep,
  handleNext,
  handleBack,
}) {
  return {
    stepIndex,
    stepNumber: stepIndex + 1,
    totalSteps: stepsLength,
    isFirstStep: stepIndex === 0,
    isLastStep: stepIndex === stepsLength - 1,
    goToStep,
    goToNextStep: handleNext,
    goToPreviousStep: handleBack,
  };
}

async function runStepCallback(callback, context) {
  if (typeof callback !== 'function') {
    return true;
  }

  try {
    const result = callback(context);
    if (result instanceof Promise) {
      const awaited = await result;
      if (awaited === false) {
        return false;
      }
      return awaited !== false;
    }

    if (result === false) {
      return false;
    }

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Stepper step handler failed', error);
    return false;
  }
}

const isFunction = (value) => typeof value === 'function';
const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(object, key);

function shouldMarkCompleted(result) {
  if (result === false) {
    return false;
  }

  if (result && typeof result === 'object' && hasOwn(result, 'completed')) {
    return Boolean(result.completed);
  }

  return true;
}

function Stepper({
  children,
  initialStep = 1,
  onStepChange,
  onFinalStepCompleted,
  backButtonText = 'Back',
  nextButtonText = 'Next',
  finishButtonText = 'Finish',
  headerContent = null,
  className = '',
  allowStepClick = false,
}) {
  const steps = useMemo(
    () =>
      React.Children.toArray(children).filter((child) =>
        React.isValidElement(child)
      ),
    [children]
  );

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (steps.length === 0) {
      return 0;
    }
    const zeroBasedInitial = Number.isFinite(initialStep)
      ? Math.min(Math.max(initialStep - 1, 0), steps.length - 1)
      : 0;

    return zeroBasedInitial;
  });

  const [isCompleted, setIsCompleted] = useState(false);
  const [pending, setPending] = useState(false);
  const handleNextRef = useRef(() => {});
  const handleBackRef = useRef(() => {});

  const goToStep = useCallback(
    (index) => {
      if (index < 0 || index >= steps.length) {
        return;
      }
      setIsCompleted(false);
      setCurrentIndex(index);
    },
    [steps.length]
  );

  const getStepContext = useCallback(
    (index = currentIndex) =>
      buildStepContext({
        stepIndex: index,
        stepsLength: steps.length,
        goToStep,
        handleNext: () => handleNextRef.current?.(),
        handleBack: () => handleBackRef.current?.(),
      }),
    [currentIndex, goToStep, steps.length]
  );

  const handleNext = useCallback(async () => {
    if (steps.length === 0 || pending) {
      return;
    }

    const currentStep = steps[currentIndex];
    const isNextDisabledProp = Boolean(currentStep?.props?.isNextDisabled);

    if (isNextDisabledProp) {
      return;
    }

    const context = getStepContext(currentIndex);

    const allowNavigation = await runStepCallback(
      currentStep?.props?.onNext,
      context
    );

    if (!allowNavigation) {
      return;
    }

    const isLastStep = currentIndex === steps.length - 1;

    if (isLastStep) {
      if (typeof onFinalStepCompleted !== 'function') {
        setIsCompleted(true);
        return;
      }

      setPending(true);
      try {
        const completionOutcome = await onFinalStepCompleted(context);
        if (!shouldMarkCompleted(completionOutcome)) {
          setIsCompleted(false);
          return;
        }
        setIsCompleted(true);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Stepper final step handler failed', error);
      } finally {
        setPending(false);
      }
      return;
    }

    setIsCompleted(false);
    setCurrentIndex((previous) => previous + 1);
  }, [currentIndex, getStepContext, onFinalStepCompleted, pending, steps]);

  const handleBack = useCallback(async () => {
    if (currentIndex === 0 || pending) {
      return;
    }

    const previousIndex = currentIndex - 1;
    const currentStep = steps[currentIndex];
    const context = getStepContext(currentIndex);

    const allowNavigation = await runStepCallback(
      currentStep?.props?.onPrevious,
      context
    );

    if (!allowNavigation) {
      return;
    }

    setIsCompleted(false);
    setCurrentIndex(previousIndex);
  }, [currentIndex, getStepContext, pending, steps]);

  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  useEffect(() => {
    handleBackRef.current = handleBack;
  }, [handleBack]);

  useEffect(() => {
    if (typeof onStepChange === 'function') {
      onStepChange(currentIndex + 1);
    }
  }, [currentIndex, onStepChange]);

  useEffect(() => {
    if (steps.length === 0) {
      return;
    }

    setCurrentIndex((previous) => {
      if (previous < 0) {
        return 0;
      }
      if (previous >= steps.length) {
        return steps.length - 1;
      }
      return previous;
    });
  }, [steps.length]);

  const currentStep = steps[currentIndex];
  const isLastStep = currentIndex === steps.length - 1;
  const stepBackText =
    currentStep?.props?.backButtonText ?? backButtonText ?? 'Back';
  const stepNextText =
    currentStep?.props?.nextButtonText ??
    (isLastStep ? finishButtonText : nextButtonText);
  const stepPendingText = currentStep?.props?.pendingText;
  const isNextDisabled = Boolean(currentStep?.props?.isNextDisabled) || pending;
  const hideBackButton =
    currentIndex === 0 || Boolean(currentStep?.props?.hideBackButton);
  const completionMessage = currentStep?.props?.completionMessage;

  const stepContent = currentStep
    ? React.cloneElement(currentStep, {
        isActive: true,
        stepIndex: currentIndex,
        stepNumber: currentIndex + 1,
        isFirstStep: currentIndex === 0,
        isLastStep,
        isCompleted,
        pending,
        goToStep,
        goToNextStep: handleNext,
        goToPreviousStep: handleBack,
      })
    : null;

  return (
    <div className={`stepper ${className}`.trim()}>
      {steps.length > 1 && (
        <ol className="stepper__indicators">
          {steps.map((step, index) => {
            const isActive = index === currentIndex;
            const isComplete = index < currentIndex || (isLastStep && isCompleted);
            const indicatorStateClass = isActive
              ? 'stepper__indicator--active'
              : isComplete
              ? 'stepper__indicator--completed'
              : 'stepper__indicator--upcoming';

            const label =
              step.props?.title || step.props?.label || `Step ${index + 1}`;
            const description = step.props?.description;
            const isClickable =
              allowStepClick && index <= currentIndex && !pending;

            return (
              <li
                key={step.key || index}
                className={`stepper__indicator ${indicatorStateClass}`.trim()}
              >
                <button
                  type="button"
                  className="stepper__indicator-button"
                  onClick={isClickable ? () => goToStep(index) : undefined}
                  disabled={!isClickable}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="stepper__indicator-index">
                    {index + 1}
                  </span>
                  <span className="stepper__indicator-copy">
                    <span className="stepper__indicator-label">{label}</span>
                    {description ? (
                      <span className="stepper__indicator-description">
                        {description}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {headerContent ? (
        <div className="stepper__header">{headerContent}</div>
      ) : null}

      <div className="stepper__content">{stepContent}</div>

      <div className="stepper__footer">
        <div className="stepper__actions">
          {!hideBackButton && (
            <button
              type="button"
              className="stepper__button stepper__button--secondary"
              onClick={handleBack}
              disabled={pending || currentIndex === 0}
            >
              {stepBackText}
            </button>
          )}
          <button
            type="button"
            className="stepper__button stepper__button--primary"
            onClick={handleNext}
            disabled={isNextDisabled || isCompleted}
          >
            {pending && stepPendingText ? stepPendingText : stepNextText}
          </button>
        </div>
        {isCompleted && completionMessage ? (
          <div className="stepper__completion-message">{completionMessage}</div>
        ) : null}
      </div>
    </div>
  );
}

Stepper.propTypes = {
  children: PropTypes.node.isRequired,
  initialStep: PropTypes.number,
  onStepChange: PropTypes.func,
  onFinalStepCompleted: PropTypes.func,
  backButtonText: PropTypes.string,
  nextButtonText: PropTypes.string,
  finishButtonText: PropTypes.string,
  headerContent: PropTypes.node,
  className: PropTypes.string,
  allowStepClick: PropTypes.bool,
};

Stepper.defaultProps = {
  initialStep: 1,
  onStepChange: undefined,
  onFinalStepCompleted: undefined,
  backButtonText: 'Back',
  nextButtonText: 'Next',
  finishButtonText: 'Finish',
  headerContent: null,
  className: '',
  allowStepClick: false,
};

export function Step({ children, isActive, ...rest }) {
  if (!isActive) {
    return null;
  }

  if (isFunction(children)) {
    return <>{children(rest)}</>;
  }

  return <>{children}</>;
}

Step.propTypes = {
  title: PropTypes.string,
  label: PropTypes.string,
  description: PropTypes.string,
  onNext: PropTypes.func,
  onPrevious: PropTypes.func,
  nextButtonText: PropTypes.string,
  backButtonText: PropTypes.string,
  pendingText: PropTypes.string,
  hideBackButton: PropTypes.bool,
  completionMessage: PropTypes.node,
  isNextDisabled: PropTypes.bool,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]).isRequired,
};

Step.defaultProps = {
  title: undefined,
  label: undefined,
  description: undefined,
  onNext: undefined,
  onPrevious: undefined,
  nextButtonText: undefined,
  backButtonText: undefined,
  pendingText: undefined,
  hideBackButton: false,
  completionMessage: undefined,
  isNextDisabled: false,
};

export default Stepper;
