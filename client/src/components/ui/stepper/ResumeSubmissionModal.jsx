import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Stepper, { Step } from './Stepper';
import useResumeModal from '../../../hooks/useResumeModal';
import { AuthContext } from '../../../context/AuthContext';
import { createClient } from '../../../services/clientService';
import '../../../styling/ResumeModal.css';

const INITIAL_VALUES = {
  fullName: '',
  email: '',
  phoneNumber: '',
  location: '',
  skills: '',
  preferredRole: '',
  education: '',
  linkedinUrl: '',
  experience: '',
};

const STEP_FIELDS = {
  1: ['fullName', 'email', 'phoneNumber', 'location'],
  2: ['skills', 'preferredRole', 'experience'],
  3: ['education', 'linkedinUrl'],
};

const STEP_TITLES = {
  1: 'Submit your resume',
  2: 'Professional snapshot',
  3: 'Education & links',
};

const validators = {
  fullName: value => {
    const trimmed = String(value ?? '').trim();
    if (trimmed.length < 2) {
      return 'Please provide your full name.';
    }
    if (!trimmed.includes(' ')) {
      return 'Include both your first and last name.';
    }
    return null;
  },
  email: value => {
    const trimmed = String(value ?? '').trim().toLowerCase();
    if (!trimmed) {
      return 'Email is required.';
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmed)) {
      return 'Enter a valid email address.';
    }
    return null;
  },
  phoneNumber: value => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) {
      return 'Phone number is required.';
    }
    const digits = trimmed.replace(/[^0-9]/g, '');
    if (digits.length < 7) {
      return 'Enter a valid phone number.';
    }
    return null;
  },
  location: value => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) {
      return 'Location is required.';
    }
    return null;
  },
  skills: value => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) {
      return 'Share at least one key skill.';
    }
    if (trimmed.length < 3) {
      return 'Skill details should be a bit longer.';
    }
    return null;
  },
  preferredRole: value => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) {
      return 'Let us know the role you are aiming for.';
    }
    return null;
  },
  education: value => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) {
      return 'Tell us about your education background.';
    }
    return null;
  },
  linkedinUrl: value => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) {
      return null;
    }
    try {
      const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      if (!url.hostname.includes('linkedin.')) {
        return 'Please share a valid LinkedIn profile URL.';
      }
    } catch (error) {
      return 'Please share a valid LinkedIn profile URL.';
    }
    return null;
  },
  experience: value => {
    const trimmed = String(value ?? '').trim();
    if (!trimmed) {
      return 'Summarise your experience.';
    }
    if (trimmed.length < 10) {
      return 'Add a few more details about your experience.';
    }
    return null;
  },
};

function validateFieldValue(field, value) {
  const validator = validators[field];
  if (!validator) {
    return null;
  }
  return validator(value);
}

function ResumeFormField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  type = 'text',
  placeholder,
  multiline = false,
  rows = 3,
  required = false,
  autoComplete,
}) {
  const fieldId = `resume-${name}`;
  const FieldComponent = multiline ? 'textarea' : 'input';

  return (
    <div className={`resume-form-field ${error ? 'resume-form-field--error' : ''}`}>
      <label className="resume-form-field__label" htmlFor={fieldId}>
        {label}
        {required && <span className="resume-form-field__required" aria-hidden="true">*</span>}
      </label>
      <FieldComponent
        id={fieldId}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        type={multiline ? undefined : type}
        rows={multiline ? rows : undefined}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        className="resume-form-field__control"
      />
      {error && <p className="resume-form-field__feedback">{error}</p>}
    </div>
  );
}

function StepperBody({ children, className = '', role }) {
  const innerProps = role ? { role } : {};
  return (
    <div className="outer-container resume-modal__shell">
      <div className="step-circle-container">
        <div className="step-content-default">
          <div className={["step-default", className].filter(Boolean).join(' ')} {...innerProps}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResumeSubmissionModal() {
  const { token } = useContext(AuthContext);
  const {
    isOpen,
    close,
    hasSubmitted,
    clientRecord,
    isCheckingStatus,
    statusError,
    markSubmitted,
  } = useResumeModal();
  const [currentStep, setCurrentStep] = useState(1);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submissionError, setSubmissionError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successRecord, setSuccessRecord] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setValues(INITIAL_VALUES);
      setErrors({});
      setTouched({});
      setSubmissionError(null);
      setIsSubmitting(false);
      setShowSuccess(false);
      setSuccessRecord(null);
      setCurrentStep(1);
      return;
    }

    if (hasSubmitted) {
      setShowSuccess(false);
      setSuccessRecord(null);
    }
  }, [hasSubmitted, isOpen]);

  const handleClose = useCallback(() => {
    if (isSubmitting) {
      return;
    }
    setShowSuccess(false);
    setSuccessRecord(null);
    close();
  }, [close, isSubmitting]);

  const handleInputChange = useCallback((field) => event => {
    const nextValue = event.target.value;
    setValues(prev => ({ ...prev, [field]: nextValue }));
    setTouched(prev => ({ ...prev, [field]: true }));

    setErrors(prev => ({
      ...prev,
      [field]: validateFieldValue(field, nextValue),
    }));
  }, []);

  const handleInputBlur = useCallback(field => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({
      ...prev,
      [field]: validateFieldValue(field, values[field]),
    }));
  }, [values]);

  const validateStepFields = useCallback((stepNumber) => {
    const fields = STEP_FIELDS[stepNumber] ?? [];
    if (fields.length === 0) {
      return true;
    }

    const nextErrors = {};
    let hasError = false;

    fields.forEach(field => {
      const message = validateFieldValue(field, values[field]);
      nextErrors[field] = message;
      if (message) {
        hasError = true;
      }
    });

    setTouched(prev => {
      const next = { ...prev };
      fields.forEach(field => {
        next[field] = true;
      });
      return next;
    });

    setErrors(prev => ({ ...prev, ...nextErrors }));

    return !hasError;
  }, [values]);

  const isCurrentStepValid = useMemo(() => {
    const fields = STEP_FIELDS[currentStep] ?? [];
    return fields.every(field => !validateFieldValue(field, values[field]));
  }, [currentStep, values]);

  const handleBack = useCallback(() => {
    if (isSubmitting) {
      return false;
    }
    setSubmissionError(null);
    return true;
  }, [isSubmitting]);

  const handleNext = useCallback((stepNumber) => {
    if (isSubmitting) {
      return false;
    }

    const valid = validateStepFields(stepNumber);
    if (!valid) {
      return false;
    }

    setSubmissionError(null);
    return true;
  }, [isSubmitting, validateStepFields]);

  const handleSubmitStepper = useCallback(async (stepNumber) => {
    if (!token) {
      setSubmissionError('Please log in to submit your resume.');
      return false;
    }

    if (isSubmitting) {
      return false;
    }

    const valid = validateStepFields(stepNumber);
    if (!valid) {
      return false;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const payload = {
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phoneNumber: values.phoneNumber.trim(),
        location: values.location.trim(),
        skills: values.skills.trim(),
        preferredRole: values.preferredRole.trim(),
        education: values.education.trim(),
        linkedinUrl: values.linkedinUrl.trim() || null,
        experience: values.experience.trim(),
      };

      const record = await createClient(payload, token);
      markSubmitted(record);
      setSuccessRecord(record);
      setShowSuccess(true);
      return false;
    } catch (error) {
      const message = error?.message || 'We could not submit your details. Please try again.';
      setSubmissionError(message);

      const field = error?.details?.field;
      if (field) {
        setTouched(prev => ({ ...prev, [field]: true }));
        setErrors(prev => ({
          ...prev,
          [field]: error.details?.message || validateFieldValue(field, values[field]),
        }));
      }

      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [markSubmitted, token, validateStepFields, values, isSubmitting]);

  const handleStepChange = useCallback(step => {
    setCurrentStep(step);
  }, []);

  const dialogTitle = useMemo(() => {
    if (isCheckingStatus) {
      return 'Checking your submission status';
    }

    if (statusError) {
      return 'Something went wrong';
    }

    if (showSuccess || hasSubmitted) {
      return 'Thank you for submitting!';
    }

    return STEP_TITLES[currentStep] || STEP_TITLES[1];
  }, [currentStep, hasSubmitted, isCheckingStatus, showSuccess, statusError]);

  if (!isOpen) {
    return null;
  }

  let bodyContent;

  if (isCheckingStatus) {
    bodyContent = (
      <StepperBody className="resume-modal__status" role="status">
        <h2 className="resume-modal__heading">Checking your submission status</h2>
        <p className="resume-modal__status-text">Hang tight while we load your details.</p>
      </StepperBody>
    );
  } else if (statusError) {
    bodyContent = (
      <StepperBody className="resume-modal__message">
        <h2 className="resume-modal__heading">Something went wrong</h2>
        <p>{statusError}</p>
        <button type="button" className="resume-modal__primary" onClick={handleClose}>
          Close
        </button>
      </StepperBody>
    );
  } else if (showSuccess || hasSubmitted) {
    const record = showSuccess ? successRecord : clientRecord;
    bodyContent = (
      <StepperBody className="resume-modal__message">
        <h2 className="resume-modal__heading">Thank you for submitting!</h2>
        {record ? (
          <p>
            We have received your details{record.fullName ? `, ${record.fullName}` : ''}. Our team will reach out if a role matches
            your profile.
          </p>
        ) : (
          <p>We have received your details. Our team will reach out if a role matches your profile.</p>
        )}
        {hasSubmitted && !showSuccess && record && (
          <div className="resume-modal__summary">
            <dl>
              <div>
                <dt>Email</dt>
                <dd>{record.email}</dd>
              </div>
              <div>
                <dt>Preferred Role</dt>
                <dd>{record.preferredRole || '—'}</dd>
              </div>
            </dl>
          </div>
        )}
        <button type="button" className="resume-modal__primary" onClick={handleClose}>
          Close
        </button>
      </StepperBody>
    );
  } else {
    bodyContent = (
      <Stepper
        initialStep={1}
        onStepChange={handleStepChange}
        onNext={handleNext}
        onBack={handleBack}
        onComplete={handleSubmitStepper}
        backButtonProps={{ disabled: isSubmitting }}
        nextButtonProps={{ disabled: isSubmitting || !isCurrentStepValid }}
        disableStepIndicators={isSubmitting}
        nextButtonText="Next"
        completeButtonText="Submit"
        aria-labelledby="resume-modal-title"
      >
        <Step>
          <div className="resume-step">
            <h2 className="resume-step__title">Submit your resume</h2>
            <p className="resume-step__subtitle">Tell us how we can reach you.</p>
            <div className="resume-form-grid">
              <ResumeFormField
                label="Full name"
                name="fullName"
                value={values.fullName}
                onChange={handleInputChange('fullName')}
                onBlur={() => handleInputBlur('fullName')}
                error={touched.fullName ? errors.fullName : null}
                required
                autoComplete="name"
                placeholder="Jane Doe"
              />
              <ResumeFormField
                label="Email"
                name="email"
                type="email"
                value={values.email}
                onChange={handleInputChange('email')}
                onBlur={() => handleInputBlur('email')}
                error={touched.email ? errors.email : null}
                required
                autoComplete="email"
                placeholder="jane@example.com"
              />
              <ResumeFormField
                label="Phone number"
                name="phoneNumber"
                value={values.phoneNumber}
                onChange={handleInputChange('phoneNumber')}
                onBlur={() => handleInputBlur('phoneNumber')}
                error={touched.phoneNumber ? errors.phoneNumber : null}
                required
                autoComplete="tel"
                placeholder="e.g. +27 82 123 4567"
              />
              <ResumeFormField
                label="Location"
                name="location"
                value={values.location}
                onChange={handleInputChange('location')}
                onBlur={() => handleInputBlur('location')}
                error={touched.location ? errors.location : null}
                required
                autoComplete="address-level2"
                placeholder="Cape Town, South Africa"
              />
            </div>
          </div>
        </Step>
        <Step>
          <div className="resume-step">
            <h2 className="resume-step__title">Professional snapshot</h2>
            <p className="resume-step__subtitle">Highlight what you do best.</p>
            <div className="resume-form-grid">
              <ResumeFormField
                label="Key skills"
                name="skills"
                value={values.skills}
                onChange={handleInputChange('skills')}
                onBlur={() => handleInputBlur('skills')}
                error={touched.skills ? errors.skills : null}
                required
                multiline
                rows={3}
                placeholder="React, Node.js, UI Design"
              />
              <ResumeFormField
                label="Preferred role"
                name="preferredRole"
                value={values.preferredRole}
                onChange={handleInputChange('preferredRole')}
                onBlur={() => handleInputBlur('preferredRole')}
                error={touched.preferredRole ? errors.preferredRole : null}
                required
                placeholder="Frontend Engineer"
              />
              <ResumeFormField
                label="Experience summary"
                name="experience"
                value={values.experience}
                onChange={handleInputChange('experience')}
                onBlur={() => handleInputBlur('experience')}
                error={touched.experience ? errors.experience : null}
                required
                multiline
                rows={4}
                placeholder="3 years building responsive web applications..."
              />
            </div>
          </div>
        </Step>
        <Step>
          <div className="resume-step">
            <h2 className="resume-step__title">Education & links</h2>
            <p className="resume-step__subtitle">Share your background and where we can learn more.</p>
            <div className="resume-form-grid">
              <ResumeFormField
                label="Education"
                name="education"
                value={values.education}
                onChange={handleInputChange('education')}
                onBlur={() => handleInputBlur('education')}
                error={touched.education ? errors.education : null}
                required
                multiline
                rows={3}
                placeholder="BSc Computer Science, University of..."
              />
              <ResumeFormField
                label="LinkedIn URL"
                name="linkedinUrl"
                value={values.linkedinUrl}
                onChange={handleInputChange('linkedinUrl')}
                onBlur={() => handleInputBlur('linkedinUrl')}
                error={touched.linkedinUrl ? errors.linkedinUrl : null}
                placeholder="https://www.linkedin.com/in/username"
              />
            </div>
          </div>
        </Step>
      </Stepper>
    );
  }

  return (
    <div className="resume-modal" role="dialog" aria-modal="true" aria-labelledby="resume-modal-title">
      <div className="resume-modal__backdrop" onClick={handleClose} />
      <div className="resume-modal__stage">
        <span id="resume-modal-title" className="resume-modal__sr-only">
          {dialogTitle}
        </span>
        <button
          type="button"
          className="resume-modal__close"
          onClick={handleClose}
          disabled={isSubmitting}
          aria-label="Close resume submission"
        >
          ×
        </button>
        {bodyContent}
        {submissionError && !isCheckingStatus && !showSuccess && !hasSubmitted && (
          <p className="resume-modal__error">{submissionError}</p>
        )}
      </div>
    </div>
  );
}
