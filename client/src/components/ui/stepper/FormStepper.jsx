import { useEffect, useMemo, useState } from 'react';
import '../../../styling/stepper.css';

const normaliseValidators = (validate) => {
  if (!validate) {
    return [];
  }

  if (Array.isArray(validate)) {
    return validate.filter(Boolean);
  }

  return [validate];
};

const getFieldValue = (values, name, fallback = '') => {
  if (!values) {
    return fallback;
  }

  const value = values[name];
  return value == null ? fallback : value;
};

function StepperField({ field, value, error, onChange }) {
  const { name, label, type = 'text', placeholder, description, autoComplete, required } = field;

  const handleChange = (event) => {
    onChange(name, event.target.value);
  };

  const inputProps = {
    id: `stepper-${name}`,
    name,
    placeholder,
    value,
    onChange: handleChange,
    autoComplete,
    'aria-describedby': description ? `stepper-${name}-description` : undefined,
    'aria-invalid': Boolean(error),
    required,
  };

  return (
    <div className="form-stepper-field">
      <label className="form-stepper-label" htmlFor={inputProps.id}>
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea className="form-stepper-input form-stepper-input--textarea" rows={4} {...inputProps} />
      ) : (
        <input className="form-stepper-input" type={type} {...inputProps} />
      )}
      {description && (
        <p id={`stepper-${name}-description`} className="form-stepper-description">
          {description}
        </p>
      )}
      {error && (
        <p className="form-stepper-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function FormStepper({
  steps = [],
  initialValues = {},
  onSubmit,
  submitLabel = 'Submit',
  onCancel,
  isSubmitting = false,
  submissionError,
  resetSignal,
}) {
  const safeSteps = useMemo(() => (Array.isArray(steps) ? steps.filter(Boolean) : []), [steps]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [values, setValues] = useState(() => ({ ...initialValues }));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setValues({ ...initialValues });
    setErrors({});
    setCurrentStepIndex(0);
  }, [initialValues, resetSignal, safeSteps.length]);

  const totalSteps = safeSteps.length;
  const currentStep = safeSteps[currentStepIndex] ?? null;

  const handleFieldChange = (name, value) => {
    setValues((previous) => ({
      ...previous,
      [name]: value,
    }));
    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }));
  };

  const validateStep = (step) => {
    if (!step) {
      return { isValid: true, nextErrors: {} };
    }

    const stepErrors = {};
    const stepFields = Array.isArray(step.fields) ? step.fields : [];

    stepFields.forEach((field) => {
      const validators = normaliseValidators(field.validate);
      if (validators.length === 0) {
        return;
      }

      const fieldValue = getFieldValue(values, field.name, '');
      for (const validator of validators) {
        const result = validator(fieldValue, values);
        if (typeof result === 'string' && result.trim().length > 0) {
          stepErrors[field.name] = result.trim();
          break;
        }
      }
    });

    return { isValid: Object.keys(stepErrors).length === 0, nextErrors: stepErrors };
  };

  const goToStep = (index) => {
    setCurrentStepIndex(() => {
      if (index < 0) {
        return 0;
      }
      if (index >= totalSteps) {
        return totalSteps - 1;
      }
      return index;
    });
  };

  const handleNext = () => {
    const { isValid, nextErrors } = validateStep(currentStep);

    if (!isValid) {
      setErrors((previous) => ({
        ...previous,
        ...nextErrors,
      }));
      return;
    }

    if (currentStepIndex === totalSteps - 1) {
      onSubmit?.(values);
      return;
    }

    goToStep(currentStepIndex + 1);
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };

  const renderProgress = () => {
    if (totalSteps <= 1) {
      return null;
    }

    const progressFraction = totalSteps > 1 ? currentStepIndex / (totalSteps - 1) : 1;
    const progressPercentage = Math.min(100, Math.max(0, progressFraction * 100));

    return (
      <div className="form-stepper-progress">
        <div className="form-stepper-progress-bar" style={{ width: `${progressPercentage}%` }} />
        <div className="form-stepper-progress-steps">
          {safeSteps.map((step, index) => {
            const status = index === currentStepIndex ? 'current' : index < currentStepIndex ? 'complete' : 'upcoming';
            return (
              <div key={step.id ?? step.title ?? index} className={`form-stepper-progress-step form-stepper-progress-step--${status}`}>
                <span className="form-stepper-progress-index">{index + 1}</span>
                <span className="form-stepper-progress-label">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="form-stepper">
      {renderProgress()}
      {currentStep && (
        <div className="form-stepper-panel">
          <div className="form-stepper-header">
            <h2 className="form-stepper-title">{currentStep.title}</h2>
            {currentStep.subtitle && <p className="form-stepper-subtitle">{currentStep.subtitle}</p>}
          </div>
          <div className="form-stepper-fields">
            {Array.isArray(currentStep.fields) && currentStep.fields.length > 0 ? (
              currentStep.fields.map((field) => (
                <StepperField
                  key={field.name}
                  field={field}
                  value={getFieldValue(values, field.name, '')}
                  error={errors[field.name]}
                  onChange={handleFieldChange}
                />
              ))
            ) : (
              <p className="form-stepper-empty">Nothing to capture on this step.</p>
            )}
          </div>
        </div>
      )}

      {submissionError && (
        <div className="form-stepper-alert" role="alert">
          {submissionError}
        </div>
      )}

      <div className="form-stepper-footer">
        <button type="button" className="form-stepper-button form-stepper-button--ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </button>
        <div className="form-stepper-footer-actions">
          <button
            type="button"
            className="form-stepper-button form-stepper-button--secondary"
            onClick={handlePrevious}
            disabled={isSubmitting || currentStepIndex === 0}
          >
            Back
          </button>
          <button
            type="button"
            className="form-stepper-button form-stepper-button--primary"
            onClick={handleNext}
            disabled={isSubmitting}
          >
            {currentStepIndex === totalSteps - 1 ? (isSubmitting ? 'Submitting...' : submitLabel) : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
