import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Stepper, { Step } from '../auth/Stepper';
import '../../../styling/ClientIntakeStepper.css';
import { createClient } from '../../../services/clientService';

const INITIAL_FORM_DATA = {
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

const STEP_FIELDS = [
  ['fullName', 'email', 'phoneNumber', 'location'],
  ['skills', 'preferredRole', 'experience'],
  ['education', 'linkedinUrl'],
];

const FIELD_LABELS = {
  fullName: 'Full name',
  email: 'Email address',
  phoneNumber: 'Phone number',
  location: 'Location',
  skills: 'Skills & tools',
  preferredRole: 'Preferred role',
  education: 'Education',
  linkedinUrl: 'LinkedIn URL',
  experience: 'Experience',
};

const FIELD_PLACEHOLDERS = {
  fullName: 'e.g. Jordan Smith',
  email: 'you@example.com',
  phoneNumber: '+1 (555) 123-4567',
  location: 'City, Country or remote',
  skills: 'List the skills you want us to highlight',
  preferredRole: 'Product Designer, Full-stack Engineer, etc.',
  education: 'Highest level or relevant certification',
  linkedinUrl: 'https://www.linkedin.com/in/your-profile',
  experience: 'Share your most recent experience and highlights',
};

const TEXTAREA_FIELDS = new Set(['skills', 'experience']);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const linkedinPattern = /^(https?:\/\/)?([\w]+\.)?linkedin\.com\/.*$/i;

const fieldValidators = {
  fullName: (value) =>
    value.trim() ? '' : 'Please tell us your full name.',
  email: (value) =>
    emailPattern.test(value.trim())
      ? ''
      : 'Enter a valid email address.',
  phoneNumber: (value) =>
    value.trim() ? '' : 'Phone number is required.',
  location: (value) =>
    value.trim() ? '' : 'Let us know where you are based.',
  skills: (value) =>
    value.trim() ? '' : 'Highlight a few skills or tools you use.',
  preferredRole: (value) =>
    value.trim() ? '' : 'Tell us the role you are aiming for.',
  education: (value) =>
    value.trim() ? '' : 'Education or certification is required.',
  experience: (value) =>
    value.trim()
      ? ''
      : 'Share a short overview of your recent experience.',
  linkedinUrl: (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }
    return linkedinPattern.test(trimmed)
      ? ''
      : 'Please enter a valid LinkedIn profile URL.';
  },
};

const buildEmptyErrors = () =>
  Object.keys(INITIAL_FORM_DATA).reduce(
    (accumulator, field) => ({ ...accumulator, [field]: '' }),
    {}
  );

const sanitizePayload = (data) => ({
  fullName: data.fullName.trim(),
  email: data.email.trim(),
  phoneNumber: data.phoneNumber.trim(),
  location: data.location.trim(),
  skills: data.skills.trim(),
  preferredRole: data.preferredRole.trim(),
  education: data.education.trim(),
  linkedinUrl: data.linkedinUrl.trim(),
  experience: data.experience.trim(),
});

function ClientIntakeStepper({ onSuccess }) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState(() => buildEmptyErrors());
  const [submissionState, setSubmissionState] = useState({
    status: 'idle',
    message: '',
  });
  const [activeStep, setActiveStep] = useState(1);

  const summaryItems = useMemo(
    () => [
      { key: 'fullName', label: FIELD_LABELS.fullName, value: formData.fullName },
      { key: 'email', label: FIELD_LABELS.email, value: formData.email },
      { key: 'phoneNumber', label: FIELD_LABELS.phoneNumber, value: formData.phoneNumber },
      { key: 'location', label: FIELD_LABELS.location, value: formData.location },
      { key: 'preferredRole', label: FIELD_LABELS.preferredRole, value: formData.preferredRole },
      { key: 'skills', label: FIELD_LABELS.skills, value: formData.skills },
      { key: 'education', label: FIELD_LABELS.education, value: formData.education },
      { key: 'linkedinUrl', label: FIELD_LABELS.linkedinUrl, value: formData.linkedinUrl || 'Not provided' },
      { key: 'experience', label: FIELD_LABELS.experience, value: formData.experience },
    ],
    [formData]
  );

  const resetSubmissionState = () => {
    if (submissionState.status !== 'idle') {
      setSubmissionState({ status: 'idle', message: '' });
    }
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }));

    resetSubmissionState();
  };

  const validateFields = (fields) => {
    const nextErrors = {};

    fields.forEach((field) => {
      const validator = fieldValidators[field];
      if (!validator) {
        return;
      }
      const message = validator(formData[field] || '');
      if (message) {
        nextErrors[field] = message;
      }
    });

    const hasErrors = Object.keys(nextErrors).length > 0;

    setErrors((previous) => {
      const updated = { ...previous };
      fields.forEach((field) => {
        updated[field] = nextErrors[field] || '';
      });
      return updated;
    });

    return !hasErrors;
  };

  const validateStep = (stepNumber) => {
    const index = stepNumber - 1;
    if (index < 0 || index >= STEP_FIELDS.length) {
      return true;
    }
    const fields = STEP_FIELDS[index];
    return validateFields(fields);
  };

  const validateAll = () => validateFields(Object.keys(formData));

  const handleSubmit = async () => {
    const isValid = validateAll();
    if (!isValid) {
      return { completed: false };
    }

    setSubmissionState({ status: 'pending', message: '' });

    try {
      const payload = sanitizePayload(formData);
      const response = await createClient(payload);

      setSubmissionState({
        status: 'success',
        message:
          'Thank you! Our recruitment crew will review your profile and reach out shortly.',
      });

      if (typeof onSuccess === 'function') {
        onSuccess(response);
      }

      return { completed: true, data: response };
    } catch (error) {
      const message =
        error?.details?.message ||
        error?.message ||
        'We could not submit your details. Please try again.';

      setSubmissionState({
        status: 'error',
        message,
      });

      return { completed: false, error };
    }
  };

  const renderField = (fieldName, options = {}) => {
    const errorMessage = errors[fieldName];
    const isTextArea =
      options.as === 'textarea' || TEXTAREA_FIELDS.has(fieldName);
    const commonProps = {
      id: fieldName,
      name: fieldName,
      value: formData[fieldName],
      onChange: handleFieldChange,
      placeholder: FIELD_PLACEHOLDERS[fieldName],
      className: `client-intake__${isTextArea ? 'textarea' : 'input'}`,
      autoComplete: options.autoComplete,
    };

    return (
      <div
        key={fieldName}
        className={`client-intake__field${
          errorMessage ? ' client-intake__field--invalid' : ''
        }`}
      >
        <label className="client-intake__label" htmlFor={fieldName}>
          {FIELD_LABELS[fieldName]}
        </label>
        {isTextArea ? (
          <textarea
            rows={options.rows || 4}
            {...commonProps}
          />
        ) : (
          <input
            type={options.type || 'text'}
            {...commonProps}
          />
        )}
        {options.hint ? (
          <p className="client-intake__hint">{options.hint}</p>
        ) : null}
        {errorMessage ? (
          <p className="client-intake__error">{errorMessage}</p>
        ) : null}
      </div>
    );
  };

  const stepperHeader = (
    <header className="client-intake__intro">
      <span className="client-intake__eyebrow">Become a client</span>
      <h1 className="client-intake__headline">
        Share your story and join the Breakwaters talent network
      </h1>
      <p className="client-intake__subtext">
        Complete the steps below so we can match you with opportunities that
        fit your goals. It only takes a few minutes.
      </p>
      <span className="client-intake__step-count">
        Step {activeStep} of 4
      </span>
    </header>
  );

  return (
    <section className="client-intake">
      <div className="client-intake__stepper">
        <Stepper
          className="client-intake__stepper-inner"
          headerContent={stepperHeader}
          initialStep={1}
          onStepChange={(step) => setActiveStep(step)}
          onFinalStepCompleted={handleSubmit}
          backButtonText="Back"
          nextButtonText="Continue"
          finishButtonText="Submit details"
          allowStepClick
        >
          <Step
            title="Contact details"
            description="How can we reach you?"
            onNext={() => validateStep(1)}
          >
            <div className="client-intake__grid">
              {renderField('fullName')}
              {renderField('email', { type: 'email', autoComplete: 'email' })}
              {renderField('phoneNumber', { type: 'tel', autoComplete: 'tel' })}
              {renderField('location')}
            </div>
          </Step>

          <Step
            title="Your skills"
            description="Show us what you bring"
            onNext={() => validateStep(2)}
          >
            <div className="client-intake__grid client-intake__grid--single">
              {renderField('skills', {
                as: 'textarea',
                hint: 'Separate skills with commas or short phrases.',
                rows: 4,
              })}
              {renderField('preferredRole')}
              {renderField('experience', {
                as: 'textarea',
                rows: 5,
                hint: 'Give a snapshot of your current or most recent role.',
              })}
            </div>
          </Step>

          <Step
            title="Education & links"
            description="Round out your profile"
            onNext={() => validateStep(3)}
          >
            <div className="client-intake__grid client-intake__grid--single">
              {renderField('education')}
              {renderField('linkedinUrl', {
                type: 'url',
                autoComplete: 'url',
                hint: 'Optional, but helps us connect quicker.',
              })}
            </div>
          </Step>

          <Step
            title="Review & submit"
            description="Everything look good?"
            onNext={validateAll}
            pendingText="Submitting..."
            isNextDisabled={submissionState.status === 'pending'}
          >
            {({ isCompleted }) => (
              <div className="client-intake__review">
                <h2 className="client-intake__review-title">
                  {isCompleted
                    ? 'Thanks for sharing your details!'
                    : 'Here is what we will send to our team'}
                </h2>
                <dl className="client-intake__summary">
                  {summaryItems.map((item) => (
                    <div className="client-intake__summary-item" key={item.key}>
                      <dt>{item.label}</dt>
                      <dd>{item.value || '\u2014'}</dd>
                    </div>
                  ))}
                </dl>

                {submissionState.status === 'pending' ? (
                  <div className="client-intake__alert client-intake__alert--info">
                    {'Submitting your details\u2026'}
                  </div>
                ) : null}

                {submissionState.status === 'error' ? (
                  <div className="client-intake__alert client-intake__alert--error">
                    {submissionState.message}
                  </div>
                ) : null}

                {submissionState.status === 'success' ? (
                  <div className="client-intake__alert client-intake__alert--success">
                    {submissionState.message}
                  </div>
                ) : null}
              </div>
            )}
          </Step>
        </Stepper>
      </div>
    </section>
  );
}

ClientIntakeStepper.propTypes = {
  onSuccess: PropTypes.func,
};

ClientIntakeStepper.defaultProps = {
  onSuccess: undefined,
};

export default ClientIntakeStepper;
