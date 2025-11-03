import React, { useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Stepper, { Step } from '../auth/Stepper';
import RolesDropdown from './RolesDropdown';
import '../../../styling/BusinessIntakeStepper.css';
import '../../../styling/forms.css';
import { AuthContext } from '../../../context/AuthContext';
import { createCompany } from '../../../services/companyService';

const INITIAL_FORM_DATA = {
  company_name: '',
  industry: '',
  phone_number: '',
  email: '',
  workforce_size: '',
  location: '',
  available_roles: [],
  specifications: '',
};

const STEP_FIELDS = [
  ['company_name', 'industry', 'workforce_size', 'location'],
  ['phone_number', 'email', 'available_roles', 'specifications'],
];

const FIELD_LABELS = {
  company_name: 'Company name',
  industry: 'Industry',
  phone_number: 'Phone number',
  email: 'Company email',
  workforce_size: 'Workforce size',
  location: 'Primary location',
  available_roles: 'Roles you are hiring for',
  specifications: 'What roles are you looking to fill?',
};

const FIELD_PLACEHOLDERS = {
  company_name: 'e.g. Breakwaters Technologies',
  industry: 'Technology, Finance, Healthcare, etc.',
  phone_number: '+1 (555) 123-4567',
  email: 'talent@company.com',
  workforce_size: 'Size of your team (e.g. 25)',
  location: 'City, Country or Remote',
  specifications: 'Share details about the roles, requirements, and timeline.',
};

const emailPattern = /^\S+@\S+\.\S+$/;
const phonePattern = /^[0-9+\-\s()]{7,}$/;

const buildEmptyErrors = () =>
  Object.keys(INITIAL_FORM_DATA).reduce(
    (accumulator, field) => ({ ...accumulator, [field]: '' }),
    {}
  );

const sanitizePayload = (data) => ({
  company_name: data.company_name.trim(),
  industry: data.industry.trim(),
  phone_number: data.phone_number.trim(),
  email: data.email.trim(),
  workforce_size: data.workforce_size.trim(),
  location: data.location.trim(),
  available_roles: Array.isArray(data.available_roles)
    ? data.available_roles
    : [],
  specifications: data.specifications.trim(),
});

function BusinessIntakeStepper({ onSubmitCompany }) {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState(() => buildEmptyErrors());
  const [submissionState, setSubmissionState] = useState({
    status: 'idle',
    message: '',
  });
  const [activeStep, setActiveStep] = useState(1);

  const summaryItems = useMemo(
    () => [
      { key: 'company_name', label: FIELD_LABELS.company_name, value: formData.company_name },
      { key: 'industry', label: FIELD_LABELS.industry, value: formData.industry },
      { key: 'phone_number', label: FIELD_LABELS.phone_number, value: formData.phone_number },
      { key: 'email', label: FIELD_LABELS.email, value: formData.email },
      { key: 'workforce_size', label: FIELD_LABELS.workforce_size, value: formData.workforce_size },
      { key: 'location', label: FIELD_LABELS.location, value: formData.location },
      {
        key: 'available_roles',
        label: FIELD_LABELS.available_roles,
        value:
          formData.available_roles.length > 0
            ? formData.available_roles.join(', ')
            : '—',
      },
      { key: 'specifications', label: FIELD_LABELS.specifications, value: formData.specifications },
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

  const handleRolesChange = (roles) => {
    setFormData((previous) => ({
      ...previous,
      available_roles: Array.isArray(roles) ? roles : [],
    }));

    setErrors((previous) => ({
      ...previous,
      available_roles: '',
    }));

    resetSubmissionState();
  };

  const fieldValidators = {
    company_name: (value) =>
      value.trim() ? '' : 'Please enter your company name.',
    industry: (value) =>
      value.trim() ? '' : 'Industry is required.',
    phone_number: (value) =>
      phonePattern.test(value.trim())
        ? ''
        : 'Enter a valid phone number.',
    email: (value) =>
      emailPattern.test(value.trim())
        ? ''
        : 'Enter a valid email address.',
    workforce_size: (value) =>
      value.trim() ? '' : 'Workforce size is required.',
    location: (value) =>
      value.trim() ? '' : 'Location is required.',
    specifications: (value) =>
      value.trim() ? '' : 'Please describe the roles or requirements.',
    available_roles: (value) =>
      Array.isArray(value) && value.length > 0
        ? ''
        : 'Select at least one role.',
  };

  const validateFields = (fields) => {
    const nextErrors = {};

    fields.forEach((field) => {
      const validator = fieldValidators[field];
      if (!validator) {
        return;
      }

      const message = validator(formData[field]);
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

    const payload = sanitizePayload(formData);

    try {
      let response;
      if (typeof onSubmitCompany === 'function') {
        response = await onSubmitCompany(payload, token);
      } else {
        response = await createCompany(payload, token);
      }

      setSubmissionState({
        status: 'success',
        message:
          'Thanks for registering your company. Our partnerships team will reach out shortly.',
      });

      return { completed: true, data: response };
    } catch (error) {
      const message =
        error?.details?.message ||
        error?.message ||
        'We could not submit your company details. Please try again.';

      if (error?.details?.errors && typeof error.details.errors === 'object') {
        setErrors((previous) => ({
          ...previous,
          ...error.details.errors,
        }));
      }

      setSubmissionState({ status: 'error', message });

      return { completed: false, error };
    }
  };

  const renderField = (fieldName, options = {}) => {
    const errorMessage = errors[fieldName];
    const isTextarea = options.as === 'textarea';
    const commonProps = {
      id: fieldName,
      name: fieldName,
      value: formData[fieldName],
      onChange: handleFieldChange,
      placeholder: FIELD_PLACEHOLDERS[fieldName],
      className: `business-intake__${isTextarea ? 'textarea' : 'input'}`,
      type: options.type || 'text',
    };

    return (
      <div
        key={fieldName}
        className={`business-intake__field${
          errorMessage ? ' business-intake__field--invalid' : ''
        }`}
      >
        <label className="business-intake__label" htmlFor={fieldName}>
          {FIELD_LABELS[fieldName]}
        </label>
        {isTextarea ? (
          <textarea rows={options.rows || 4} {...commonProps} />
        ) : (
          <input {...commonProps} />
        )}
        {errorMessage ? (
          <p className="business-intake__error">{errorMessage}</p>
        ) : null}
      </div>
    );
  };

  const stepperHeader = (
    <header className="business-intake__intro">
      <span className="business-intake__eyebrow">Register your company</span>
      <h1 className="business-intake__headline">
        Connect with Breakwaters talent partners
      </h1>
      <p className="business-intake__subtext">
        Tell us about your team and the roles you&apos;re hiring for. Our partnerships team will follow up with the next steps.
      </p>
      <span className="business-intake__step-count">Step {activeStep} of 3</span>
    </header>
  );

  return (
    <section className="business-intake">
      <div className="business-intake__stepper">
        <Stepper
          className="business-intake__stepper-inner"
          headerContent={stepperHeader}
          initialStep={1}
          onStepChange={(step) => setActiveStep(step)}
          onFinalStepCompleted={handleSubmit}
          backButtonText="Back"
          nextButtonText="Continue"
          finishButtonText={
            submissionState.status === 'success' ? 'Submitted' : 'Submit company'
          }
          allowStepClick
        >
          <Step
            title="Company overview"
            description="Share your core details"
            onNext={() => validateStep(1)}
          >
            <div className="formScroll">
              <div className="business-intake__grid">
                {renderField('company_name')}
                {renderField('industry')}
                {renderField('workforce_size', { type: 'number' })}
                {renderField('location')}
              </div>
            </div>
          </Step>

          <Step
            title="Contact & roles"
            description="How should we reach you?"
            onNext={() => validateStep(2)}
          >
            <div className="formScroll">
              <div className="business-intake__grid business-intake__grid--single">
                <div className="business-intake__dual">
                  {renderField('phone_number')}
                  {renderField('email', { type: 'email' })}
                </div>
                <RolesDropdown
                  id="available_roles"
                  label={FIELD_LABELS.available_roles}
                  multiple
                  selected={formData.available_roles}
                  onChange={handleRolesChange}
                  placeholder="Select all applicable roles"
                  description="Choose the roles you are hiring for. Select all that apply."
                  error={errors.available_roles}
                  className="business-intake__field"
                  invalidClassName="business-intake__field--invalid"
                />
                {renderField('specifications', { as: 'textarea', rows: 5 })}
              </div>
            </div>
          </Step>

          <Step
            title="Review & send"
            description="Confirm your details"
            onNext={validateAll}
            pendingText="Submitting..."
            isNextDisabled={submissionState.status === 'pending'}
          >
            {({ isCompleted }) => (
              <div className="formScroll">
                <div className="business-intake__review">
                  <h2 className="business-intake__review-title">
                    {isCompleted
                      ? 'Thanks for partnering with Breakwaters!'
                      : 'Please verify your company information'}
                  </h2>
                  <dl className="business-intake__summary">
                    {summaryItems.map((item) => (
                      <div className="business-intake__summary-item" key={item.key}>
                        <dt>{item.label}</dt>
                        <dd>{item.value || '—'}</dd>
                      </div>
                    ))}
                  </dl>

                  {submissionState.status === 'pending' ? (
                    <div className="business-intake__alert business-intake__alert--info">
                      Submitting your company information...
                    </div>
                  ) : null}

                  {submissionState.status === 'error' ? (
                    <div className="business-intake__alert business-intake__alert--error">
                      {submissionState.message}
                    </div>
                  ) : null}

                  {submissionState.status === 'success' ? (
                    <div className="business-intake__alert business-intake__alert--success">
                      {submissionState.message}
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </Step>
        </Stepper>
      </div>
    </section>
  );
}

BusinessIntakeStepper.propTypes = {
  onSubmitCompany: PropTypes.func,
};

BusinessIntakeStepper.defaultProps = {
  onSubmitCompany: undefined,
};

export default BusinessIntakeStepper;
