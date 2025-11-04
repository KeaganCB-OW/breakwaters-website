import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Stepper, { Step } from '../auth/Stepper';
import RolesDropdown from './RolesDropdown';
import '../../../styling/ClientIntakeStepper.css';
import '../../../styling/forms.css';
import { createClient } from '../../../services/clientService';
import { uploadClientCv } from '../../../services/cvService';
import { AuthContext } from '../../../context/AuthContext';

const INITIAL_FORM_DATA = {
  fullName: '',
  email: '',
  phoneNumber: '',
  location: '',
  skills: '',
  desiredRole: '',
  education: '',
  linkedinUrl: '',
  experience: '',
};

const STEP_FIELDS = [
  ['fullName', 'email', 'phoneNumber', 'location'],
  ['skills', 'desiredRole', 'experience'],
  ['education', 'linkedinUrl'],
];

const FIELD_LABELS = {
  fullName: 'Full name',
  email: 'Email address',
  phoneNumber: 'Phone number',
  location: 'Location',
  skills: 'Skills & tools',
  desiredRole: 'Desired role',
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
  desiredRole: 'Select a role from the list',
  education: 'Highest level or relevant certification',
  linkedinUrl: 'https://www.linkedin.com/in/your-profile',
  experience: 'Share your most recent experience and highlights',
};

const TEXTAREA_FIELDS = new Set(['skills', 'experience']);

const MAX_CV_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_PDF_MIME_TYPES = new Set(['application/pdf', 'application/x-pdf']);

const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = size >= 10 || unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
};

const isPdfFile = (file) => {
  if (!file) {
    return false;
  }

  const mimeType = file.type?.toLowerCase() || '';
  if (mimeType && ALLOWED_PDF_MIME_TYPES.has(mimeType)) {
    return true;
  }

  return (file.name || '').toLowerCase().endsWith('.pdf');
};

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
  desiredRole: (value) =>
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
  preferredRole: data.desiredRole.trim(),
  education: data.education.trim(),
  linkedinUrl: data.linkedinUrl.trim(),
  experience: data.experience.trim(),
});

function ClientIntakeStepper({ onSuccess, onComplete }) {
  const { token } = useContext(AuthContext);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState(() => buildEmptyErrors());
  const [submissionState, setSubmissionState] = useState({
    status: 'idle',
    message: '',
  });
  const [cvFile, setCvFile] = useState(null);
  const [cvError, setCvError] = useState('');
  const [cvUploadState, setCvUploadState] = useState({ status: 'idle', progress: 0, key: '' });
  const [createdClient, setCreatedClient] = useState(null);
  const fileInputRef = useRef(null);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimeoutRef = useRef(null);
  const completionTimeoutRef = useRef(null);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
    };
  }, []);

  const summaryItems = useMemo(
    () => [
      { key: 'fullName', label: FIELD_LABELS.fullName, value: formData.fullName },
      { key: 'email', label: FIELD_LABELS.email, value: formData.email },
      { key: 'phoneNumber', label: FIELD_LABELS.phoneNumber, value: formData.phoneNumber },
      { key: 'location', label: FIELD_LABELS.location, value: formData.location },
      { key: 'desiredRole', label: FIELD_LABELS.desiredRole, value: formData.desiredRole },
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

  const showToast = useCallback((message) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }

    if (!message) {
      setToastMessage('');
      return;
    }

    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage('');
      toastTimeoutRef.current = null;
    }, 4000);
  }, []);

  const scheduleCompletion = useCallback(
    (payload) => {
      if (typeof onComplete !== 'function') {
        return;
      }

      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }

      completionTimeoutRef.current = setTimeout(() => {
        completionTimeoutRef.current = null;
        onComplete(payload);
      }, 500);
    },
    [onComplete]
  );

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

  const handleDesiredRoleChange = (value) => {
    setFormData((previous) => ({
      ...previous,
      desiredRole: value || '',
    }));

    setErrors((previous) => ({
      ...previous,
      desiredRole: '',
    }));

    resetSubmissionState();
  };

  const clearCvSelection = (resetUploadState = true) => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setCvFile(null);
    if (resetUploadState) {
      setCvUploadState({ status: 'idle', progress: 0, key: '' });
    }
  };

  const handleCvFileChange = (event) => {
    const file = event.target?.files?.[0] || null;

    if (!file) {
      clearCvSelection();
      setCvError('');
      return;
    }

    if (!isPdfFile(file)) {
      clearCvSelection();
      setCvError('Please select a PDF file.');
      return;
    }

    if (file.size > MAX_CV_FILE_SIZE) {
      clearCvSelection();
      setCvError('Your CV must be 5MB or smaller.');
      return;
    }

    setCvFile(file);
    setCvError('');
    setCvUploadState({ status: 'ready', progress: 0, key: '' });
    resetSubmissionState();
  };

  const handleRemoveCv = () => {
    clearCvSelection();
    setCvError('');
    resetSubmissionState();
  };

  const handleTriggerFilePicker = () => {
    if (cvUploadState.status === 'uploading') {
      return;
    }

    fileInputRef.current?.click();
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

    if (!token) {
      setSubmissionState({
        status: 'error',
        message:
          'Please sign in to submit your details. Once signed in, you can complete the intake form.',
      });
      return { completed: false };
    }

    if (!cvFile) {
      setCvError('Please attach your CV before finishing.');
      setSubmissionState({
        status: 'error',
        message: 'Add your CV so we can review your experience.',
      });
      return { completed: false };
    }

    setSubmissionState({
      status: 'pending',
      message: 'Submitting your details...',
    });

    let clientRecord = createdClient;

    if (!clientRecord) {
      try {
        const payload = sanitizePayload(formData);
        clientRecord = await createClient(payload, token);
        setCreatedClient(clientRecord);
      } catch (error) {
        const message =
          error?.details?.message ||
          error?.message ||
          'We could not submit your details. Please try again.';

        if (error?.details?.errors && typeof error.details.errors === 'object') {
          setErrors((previous) => ({
            ...previous,
            ...error.details.errors,
          }));
        }

        setSubmissionState({
          status: 'error',
          message,
        });

        return { completed: false, error };
      }
    }

    setSubmissionState({
      status: 'pending',
      message: 'Uploading your CV...',
    });
    setCvError('');
    setCvUploadState({ status: 'uploading', progress: 0, key: '' });

    try {
      const uploadResponse = await uploadClientCv(
        { clientId: clientRecord.id, file: cvFile },
        token,
        (progress) => {
          setCvUploadState((previous) => ({
            ...previous,
            status: 'uploading',
            progress,
          }));
        }
      );

      const uploadedKey = uploadResponse?.key || '';
      setCvUploadState({ status: 'success', progress: 1, key: uploadedKey });
      setCvError('');
      setSubmissionState({
        status: 'success',
        message: 'All set! We received your details and CV.',
      });
      showToast('CV uploaded successfully.');
      clearCvSelection(false);

      if (typeof onSuccess === 'function') {
        onSuccess({ ...clientRecord, cvKey: uploadedKey });
      }
      scheduleCompletion({ client: clientRecord, cvKey: uploadedKey });

      return { completed: true, data: { client: clientRecord, cvKey: uploadedKey } };
    } catch (error) {
      const message =
        error?.details?.message ||
        error?.message ||
        'We could not upload your CV. Please try again.';

      setCvUploadState({ status: 'error', progress: 0, key: '' });
      setCvError(message);
      setSubmissionState({
        status: 'error',
        message,
      });

      return { completed: false, error };
    }
  };

  const uploadPercent = Math.round((cvUploadState.progress || 0) * 100);

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
      {toastMessage ? (
        <div className="client-intake__toast" role="status" aria-live="polite">
          {toastMessage}
        </div>
      ) : null}
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
            <div className="formScroll">
              <div className="client-intake__grid">
                {renderField('fullName')}
                {renderField('email', { type: 'email', autoComplete: 'email' })}
                {renderField('phoneNumber', { type: 'tel', autoComplete: 'tel' })}
                {renderField('location')}
              </div>
            </div>
          </Step>

          <Step
            title="Your skills"
            description="Show us what you bring"
            onNext={() => validateStep(2)}
          >
            <div className="formScroll">
              <div className="client-intake__grid client-intake__grid--single">
                {renderField('skills', {
                  as: 'textarea',
                  hint: 'Separate skills with commas or short phrases.',
                  rows: 4,
                })}
                <RolesDropdown
                  id="desiredRole"
                  label={FIELD_LABELS.desiredRole}
                  placeholder="Select your desired role"
                  description="Pick the role that best matches your next opportunity."
                  selected={formData.desiredRole}
                  onChange={handleDesiredRoleChange}
                  error={errors.desiredRole}
                  className="client-intake__field"
                  invalidClassName="client-intake__field--invalid"
                />
                {renderField('experience', {
                  as: 'textarea',
                  rows: 5,
                  hint: 'Give a snapshot of your current or most recent role.',
                })}
              </div>
            </div>
          </Step>

          <Step
            title="Education & links"
            description="Round out your profile"
            onNext={() => validateStep(3)}
          >
            <div className="formScroll">
              <div className="client-intake__grid client-intake__grid--single">
                {renderField('education')}
                {renderField('linkedinUrl', {
                  type: 'url',
                  autoComplete: 'url',
                  hint: 'Optional, but helps us connect quicker.',
                })}
              </div>
            </div>
          </Step>

          <Step
            title="Review & submit"
            description="Everything look good?"
            onNext={validateAll}
            pendingText="Working..."
            isNextDisabled={
              submissionState.status === 'pending' || cvUploadState.status === 'uploading'
            }
          >
            {({ isCompleted }) => (
              <div className="formScroll">
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

                  <div
                    className={[
                      'client-intake__field',
                      'client-intake__field--file',
                      cvError ? 'client-intake__field--invalid' : null,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <label className="client-intake__label" htmlFor="client-intake-cv">
                      Upload your CV{' '}
                      <span className="client-intake__label-note">(PDF, max 5MB)</span>
                    </label>
                    <input
                      ref={fileInputRef}
                      id="client-intake-cv"
                      type="file"
                      name="cv"
                      accept="application/pdf"
                      className="client-intake__file-input"
                      onChange={handleCvFileChange}
                      disabled={cvUploadState.status === 'uploading'}
                    />
                    <div className="client-intake__file-actions">
                      <button
                        type="button"
                        className="client-intake__upload-button"
                        onClick={handleTriggerFilePicker}
                        disabled={cvUploadState.status === 'uploading'}
                      >
                        {cvFile ? 'Replace PDF' : 'Choose PDF'}
                      </button>
                      {cvFile ? (
                        <button
                          type="button"
                          className="client-intake__file-remove"
                          onClick={handleRemoveCv}
                          disabled={cvUploadState.status === 'uploading'}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    <p className="client-intake__hint">
                      Attach a PDF resume so our recruitment team can review your experience quickly.
                    </p>
                    {cvFile ? (
                      <div className="client-intake__file-pill" role="status">
                        <span className="client-intake__file-name">{cvFile.name}</span>
                        <span className="client-intake__file-size">
                          {formatFileSize(cvFile.size)}
                        </span>
                      </div>
                    ) : (
                      <p className="client-intake__hint client-intake__hint--muted">
                        No file selected yet.
                      </p>
                    )}
                    {cvUploadState.status === 'uploading' ? (
                      <div className="client-intake__progress" role="status" aria-live="polite">
                        <div className="client-intake__progress-track">
                          <div
                            className="client-intake__progress-bar"
                            style={{
                              width: `${Math.min(Math.max(uploadPercent, 0), 100)}%`,
                            }}
                          />
                        </div>
                        <span className="client-intake__progress-label">
                          {uploadPercent > 0 ? `Uploading ${uploadPercent}%` : 'Uploading...'}
                        </span>
                      </div>
                    ) : null}
                    {cvUploadState.status === 'success' ? (
                      <p className="client-intake__hint client-intake__hint--success" role="status">
                        CV uploaded successfully.
                      </p>
                    ) : null}
                    {cvError ? (
                      <p className="client-intake__error" role="alert">
                        {cvError}
                      </p>
                    ) : null}
                  </div>

                  {submissionState.status === 'pending' ? (
                    <div className="client-intake__alert client-intake__alert--info">
                      {submissionState.message || 'Working on your submission...'}
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
  onComplete: PropTypes.func,
};

ClientIntakeStepper.defaultProps = {
  onSuccess: undefined,
  onComplete: undefined,
};

export default ClientIntakeStepper;
