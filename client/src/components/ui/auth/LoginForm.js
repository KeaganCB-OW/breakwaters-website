import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import octopusImage from '../../../assets/images/octopus-image.png';
import '../../../styling/auth.css';
import googleIcon from '../../../assets/icons/icons8-google.svg';
import facebookIcon from '../../../assets/icons/icons8-facebook-logo.svg';
import appleIcon from '../../../assets/icons/icons8-apple.svg';
import { AuthContext } from '../../../context/AuthContext';
import { login as loginRequest } from '../../../services/authService';

const BreakwatersLogo = () => (
  <svg className="breakwaters-logo" width="94" height="97" viewBox="0 0 94 97" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_48_115)">
      <path d="M59.0125 77.4052C47.3171 76.2526 35.3941 68.5786 31.6597 57.0523C29.4388 50.7775 28.8358 43.2885 32.158 37.3157C33.5731 34.8687 35.7694 32.4956 38.3903 31.269C40.9496 30.517 45.5945 30.7697 48.0062 32.1751C48.5168 32.5203 49.9934 33.3894 49.4335 34.0982C48.9967 34.5112 48.2584 34.7208 47.717 35.0659C39.9283 40.3422 39.9837 51.9794 44.7886 59.2527C53.6663 72.9549 72.935 75.5314 87.5035 70.7853C88.0388 70.6866 88.4202 70.5942 88.5371 70.8962C88.654 71.1612 88.5248 71.642 88.2664 72.0427C80.8714 83.6122 70.1604 91.8963 58.385 95.2864C46.7388 98.8306 33.0932 96.8212 22.4314 89.7513C-17.9519 64.2454 -0.227329 0.0616017 47.1203 -3.651e-05C68.7454 -0.160296 88.1618 15.9643 92.8314 37.0199C94.7632 45.7602 94.5725 56.9352 90.1798 65.3488C78.6566 74.237 53.7708 70.9825 47.0957 57.1324C43.9027 51.3816 45.3484 43.2392 49.1505 38.0431C53.2417 32.7483 60.9628 32.3847 67.0535 34.7208C70.3327 36.0152 71.9076 38.0431 73.8025 40.9955C74.4608 42.0557 76.3926 41.6242 76.7494 40.7921C77.8138 38.2341 75.8143 34.6838 74.793 32.3415C72.5844 27.5892 67.1766 22.7814 63.0915 20.47C41.977 9.0731 13.0307 22.9355 9.55473 47.1039C9.39477 47.936 9.78851 47.936 10.0961 47.11C12.2802 39.9353 19.9335 30.1595 27.1624 27.0776C30.2201 25.8633 34.1268 25.0497 37.2829 24.908C35.8863 26.4489 33.327 28.2672 31.9981 29.95C28.7005 34.24 26.3134 38.7827 25.3229 44.176C24.4739 49.1564 24.2094 54.4203 26.1165 58.9569C32.8348 76.1231 50.1287 81.6829 67.0228 78.8907C67.5949 78.7674 71.2124 78.3483 69.822 77.4792C66.3952 77.2819 62.4947 77.775 59.1171 77.4052L59.0125 77.3929V77.4052Z" fill="#082658"/>
    </g>
    <defs>
      <clipPath id="clip0_48_115">
        <rect width="94" height="97" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

const isValidEmail = (value) => {
  if (!value) {
    return false;
  }
  const trimmed = value.trim();
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return false;
  }
  const [local, domain] = parts;
  if (!local || !domain) {
    return false;
  }
  if (!domain.includes('.')) {
    return false;
  }
  return true;
};

export default function LoginForm() {
  const navigate = useNavigate();
  const { login: setAuthState } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
    setErrors((previous) => ({
      ...previous,
      [name]: '',
      general: '',
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!isValidEmail(formData.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    }

    setErrors((previous) => ({ ...previous, ...nextErrors }));

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginRequest(formData.email.trim(), formData.password);
      setAuthState(result.user, result.token);

      const role = result?.user?.role;
      if (role === 'recruitment_officer') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      const field = error.field;
      if (field === 'email' || field === 'password') {
        setErrors((previous) => ({
          ...previous,
          [field]: error.message,
        }));
      } else {
        setErrors((previous) => ({
          ...previous,
          general: error.message || 'Unable to log in right now.',
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="auth-page">
      <img
        className="octopus-illustration"
        src={octopusImage}
        alt="Octopus illustration"
      />

      <div className="auth-container">
        <BreakwatersLogo />

        <h1 className="brand-title">Breakwaters</h1>
        <h2 className="auth-subtitle">Log into your account</h2>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              name="email"
              className="form-input"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
            {errors.email && (
              <span className="form-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="password-input-container">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>
            {errors.password && (
              <span className="form-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>

          {errors.general && (
            <p className="form-error form-error--general" role="alert">
              {errors.general}
            </p>
          )}
        </form>

        {/*<a href="#" className="forgot-password">Forgot password?</a>*/}

        <div className="divider-section">
          <div className="divider-line"></div>
          <div className="divider-text">or</div>
        </div>

        {/*<div className="social-login">
          <button className="social-button" aria-label="Login with Google">
            <img src={googleIcon} alt="Google icon" />
          </button>
          <button className="social-button" aria-label="Login with Facebook">
            <img src={facebookIcon} alt="Facebook icon" />
          </button>
          <button className="social-button" aria-label="Login with Apple">
            <img src={appleIcon} alt="Apple icon" />
          </button>
        </div>*/}

        <div className="auth-link-text">
          Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
