import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../context/AuthContext';
import { useResumeSubmission } from '../../../context/ResumeSubmissionContext';
import FormStepper from '../stepper/FormStepper';
import '../../../styling/resume-modal.css';
import { createClientProfile, fetchCurrentClientProfile } from '../../../services/clientService';

const initialFormValues = {
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

const required = (label) => (value) => {
  if (value == null) {
    return `${label} is required.`;
  }
  const trimmed = String(value).trim();
  return trimmed.length === 0 ? `${label} is required.` : null;
};

const validEmail = (value) => {
  if (!value) {
    return 'Email is required.';
  }
  const trimmed = value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? null : 'Please provide a valid email address.';
};

const validPhone = (value) => {
  if (!value) {
    return 'Phone number is required.';
  }
  const digits = value.replace(/[^0-9+]/g, '');
  return digits.length >= 7 ? null : 'Please enter a valid phone number.';
};

const fullNameValidator = (value) => {
  if (!value) {
    return 'Full name is required.';
  }
  const trimmed = value.trim();
  if (!trimmed.includes(' ')) {
    return 'Please enter your first and last name.';
  }
  return trimmed.length >= 4 ? null : 'Full name must be at least 4 characters.';
};

const linkedinValidator = (value) => {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (!url.hostname.includes('linkedin.com')) {
      return 'Please provide a valid LinkedIn URL.';
    }
    return null;
  } catch (error) {
    return 'Please provide a valid LinkedIn URL.';
  }
};

const stepConfiguration = [
  {
    id: 'contact',
    title: 'Your contact details',
    subtitle: 'Let recruiters know how to reach you.',
    fields: [
      {
        name: 'fullName',
        label: 'Full name',
        placeholder: 'Jane Doe',
        autoComplete: 'name',
        validate: [fullNameValidator],
      },
      {
        name: 'email',
        label: 'Email address',
        type: 'email',
        placeholder: 'jane.doe@email.com',
        autoComplete: 'email',
        validate: [validEmail],
      },
      {
        name: 'phoneNumber',
        label: 'Phone number',
        type: 'tel',
        placeholder: '+27 82 123 4567',
        autoComplete: 'tel',
        validate: [validPhone],
      },
      {
        name: 'location',
        label: 'Location',
        placeholder: 'City, Country',
        autoComplete: 'address-level2',
        validate: [required('Location')],
      },
    ],
  },
  {
    id: 'background',
    title: 'Professional background',
    subtitle: 'Share your skills and the role you are after.',
    fields: [
      {
        name: 'skills',
        label: 'Key skills',
        type: 'textarea',
        placeholder: 'e.g. React, Node.js, UX Design',
        description: 'Separate skills with commas to help us understand your strengths.',
        validate: [required('Skills')],
      },
      {
        name: 'preferredRole',
        label: 'Preferred role',
        placeholder: 'What role are you looking for?',
        validate: [required('Preferred role')],
      },
      {
        name: 'education',
        label: 'Education',
        type: 'textarea',
        placeholder: 'Highest qualification, institution, and year.',
        validate: [required('Education')],
      },
    ],
  },
  {
    id: 'experience',
    title: 'Experience and presence',
    subtitle: 'Tell us about your experience and share your profile.',
    fields: [
      {
        name: 'linkedinUrl',
        label: 'LinkedIn URL',
        placeholder: 'https://linkedin.com/in/your-profile',
        description: 'Optional, but it helps us to learn more about you quickly.',
        validate: [linkedinValidator],
      },
      {
        name: 'experience',
        label: 'Experience summary',
        type: 'textarea',
        placeholder: 'Highlight your most relevant experience in a few sentences.',
        validate: [required('Experience summary')],
      },
    ],
  },
];

const normaliseFieldValue = (value) => (typeof value === 'string' ? value.trim() : value);

const buildClientPayload = (values) => ({
  fullName: values.fullName?.trim() ?? '',
  email: values.email?.trim() ?? '',
  phoneNumber: values.phoneNumber?.trim() ?? '',
  location: values.location?.trim() ?? '',
  skills: values.skills?.trim() ?? '',
  preferredRole: values.preferredRole?.trim() ?? '',
  education: values.education?.trim() ?? '',
  linkedinUrl: values.linkedinUrl?.trim() ?? '',
  experience: values.experience?.trim() ?? '',
});

export default function ResumeSubmissionModal() {
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const { isOpen, close, clientProfile, setClientProfile } = useResumeSubmission();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [successProfile, setSuccessProfile] = useState(null);
  const [resetSignal, setResetSignal] = useState(0);

  const initialValues = useMemo(() => {
    if (clientProfile && typeof clientProfile === 'object') {
      return {
        fullName: normaliseFieldValue(clientProfile.fullName) ?? '',
        email: normaliseFieldValue(clientProfile.email) ?? '',
        phoneNumber: normaliseFieldValue(clientProfile.phoneNumber) ?? '',
        location: normaliseFieldValue(clientProfile.location) ?? '',
        skills: normaliseFieldValue(clientProfile.skills) ?? '',
        preferredRole: normaliseFieldValue(clientProfile.preferredRole) ?? '',
        education: normaliseFieldValue(clientProfile.education) ?? '',
        linkedinUrl: normaliseFieldValue(clientProfile.linkedinUrl) ?? '',
        experience: normaliseFieldValue(clientProfile.experience) ?? '',
      };
    }
    return { ...initialFormValues };
  }, [clientProfile]);

  useEffect(() => {
    if (!isOpen) {
      setSubmissionError('');
      setIsSubmitting(false);
      setSuccessProfile(null);
      setResetSignal((previous) => previous + 1);
      return;
    }

    if (!user || !token) {
      return;
    }

    if (clientProfile === undefined) {
      setIsLoadingProfile(true);
      fetchCurrentClientProfile(token)
        .then((profile) => {
          setClientProfile(profile ?? null);
          if (profile) {
            setSuccessProfile(profile);
          }
        })
        .catch((error) => {
          if (error?.status === 404) {
            setClientProfile(null);
            return;
          }
          console.error('Failed to load current client profile', error);
          setSubmissionError(error?.message || 'Unable to load your profile right now.');
        })
        .finally(() => {
          setIsLoadingProfile(false);
        });
    } else if (clientProfile) {
      setSuccessProfile(clientProfile);
    }
  }, [clientProfile, isOpen, setClientProfile, token, user]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [close, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleCancel = () => {
    close();
  };

  const handleSubmit = async (values) => {
    if (!token) {
      navigate('/login');
      close();
      return;
    }

    setIsSubmitting(true);
    setSubmissionError('');

    try {
      const payload = buildClientPayload(values);
      const profile = await createClientProfile(payload, token);
      setClientProfile(profile);
      setSuccessProfile(profile);
    } catch (error) {
      if (error?.status === 409) {
        setSubmissionError('You have already submitted your resume.');
        setClientProfile(error.details?.client ?? clientProfile ?? null);
        setSuccessProfile(error.details?.client ?? clientProfile ?? null);
      } else {
        setSubmissionError(error?.message || 'Failed to submit your resume. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSuccessState = () => (
    <div className="resume-modal-success" role="status">
      <h3>Resume received!</h3>
      <p>
        Thanks for sharing your details with Breakwaters. Our recruitment officers will review your profile and reach out when
        there&apos;s a great match.
      </p>
      {successProfile && (
        <dl className="resume-modal-success-details">
          <div>
            <dt>Full name</dt>
            <dd>{successProfile.fullName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{successProfile.email}</dd>
          </div>
          <div>
            <dt>Phone number</dt>
            <dd>{successProfile.phoneNumber || '—'}</dd>
          </div>
          <div>
            <dt>Preferred role</dt>
            <dd>{successProfile.preferredRole || '—'}</dd>
          </div>
        </dl>
      )}
      <button type="button" className="form-stepper-button form-stepper-button--primary" onClick={close}>
        Close
      </button>
    </div>
  );

  const renderLoadingState = () => (
    <div className="resume-modal-loading" role="status" aria-live="polite">
      <div className="resume-modal-spinner" aria-hidden="true" />
      <p>Preparing your resume submission...</p>
    </div>
  );

  const renderUnauthenticatedState = () => (
    <div className="resume-modal-error" role="alert">
      <h3>You need an account</h3>
      <p>Please sign in or create an account before submitting your resume.</p>
      <button
        type="button"
        className="form-stepper-button form-stepper-button--primary"
        onClick={() => {
          close();
          navigate('/login');
        }}
      >
        Go to login
      </button>
    </div>
  );

  return (
    <div className="resume-modal-overlay" role="presentation" onClick={handleCancel}>
      <div
        className="resume-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="resume-modal-header">
          <div>
            <h2 id="resume-modal-title" className="resume-modal-heading">
              Submit your resume
            </h2>
            <p className="resume-modal-subheading">Complete the steps below so we can connect you with opportunities.</p>
          </div>
          <button type="button" className="resume-modal-close" onClick={handleCancel}>
            Close
          </button>
        </div>
        <div className="resume-modal-body">
          {!user || !token ? (
            renderUnauthenticatedState()
          ) : isLoadingProfile ? (
            renderLoadingState()
          ) : successProfile ? (
            renderSuccessState()
          ) : (
            <FormStepper
              key={resetSignal}
              steps={stepConfiguration}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              submitLabel="Submit resume"
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submissionError={submissionError}
              resetSignal={resetSignal}
            />
          )}
        </div>
      </div>
    </div>
  );
}
