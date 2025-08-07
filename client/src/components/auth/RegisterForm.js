import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import octopusImage from '../../assets/images/octopus-image.png';
import '../../styling/auth.css';
import googleIcon from '../../assets/icons/icons8-google.svg';
import facebookIcon from '../../assets/icons/icons8-facebook-logo.svg';
import appleIcon from '../../assets/icons/icons8-apple.svg';


const BreakwatersLogo = () => (
  <svg className="breakwaters-logo" width="94" height="97" viewBox="0 0 94 97" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_50_154)">
      <path d="M59.0125 77.4052C47.3171 76.2526 35.3941 68.5786 31.6597 57.0523C29.4388 50.7775 28.8358 43.2885 32.158 37.3157C33.5731 34.8687 35.7694 32.4956 38.3903 31.269C40.9496 30.517 45.5945 30.7697 48.0062 32.1751C48.5168 32.5203 49.9934 33.3894 49.4335 34.0982C48.9967 34.5112 48.2584 34.7208 47.717 35.0659C39.9283 40.3422 39.9837 51.9794 44.7886 59.2527C53.6663 72.9549 72.935 75.5314 87.5035 70.7853C88.0388 70.6866 88.4202 70.5942 88.5371 70.8962C88.654 71.1612 88.5248 71.642 88.2664 72.0427C80.8714 83.6122 70.1604 91.8963 58.385 95.2864C46.7388 98.8306 33.0932 96.8212 22.4314 89.7513C-17.9519 64.2454 -0.227329 0.0616017 47.1203 -3.651e-05C68.7454 -0.160296 88.1618 15.9643 92.8314 37.0199C94.7632 45.7602 94.5725 56.9352 90.1798 65.3488C78.6566 74.237 53.7708 70.9825 47.0957 57.1324C43.9027 51.3816 45.3484 43.2392 49.1505 38.0431C53.2417 32.7483 60.9628 32.3847 67.0535 34.7208C70.3327 36.0152 71.9076 38.0431 73.8025 40.9955C74.4608 42.0557 76.3926 41.6242 76.7494 40.7921C77.8138 38.2341 75.8143 34.6838 74.793 32.3415C72.5844 27.5892 67.1766 22.7814 63.0915 20.47C41.977 9.0731 13.0307 22.9355 9.55473 47.1039C9.39477 47.936 9.78851 47.936 10.0961 47.11C12.2802 39.9353 19.9335 30.1595 27.1624 27.0776C30.2201 25.8633 34.1268 25.0497 37.2829 24.908C35.8863 26.4489 33.327 28.2672 31.9981 29.95C28.7005 34.24 26.3134 38.7827 25.3229 44.176C24.4739 49.1564 24.2094 54.4203 26.1165 58.9569C32.8348 76.1231 50.1287 81.6829 67.0228 78.8907C67.5949 78.7674 71.2124 78.3483 69.822 77.4792C66.3952 77.2819 62.4947 77.775 59.1171 77.4052L59.0125 77.3929V77.4052Z" fill="#082658"/>
    </g>
    <defs>
      <clipPath id="clip0_50_154">
        <rect width="94" height="97" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    console.log('Register form submitted:', formData);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
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
        <h2 className="auth-subtitle">Lets get you signed up!</h2>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="fullName"
              className="form-input"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                className="form-input"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <button type="submit" className="auth-button">
            Sign Up
          </button>
        </form>
                      <div className="divider-section">
                <div className="divider-line"></div>
                <div className="divider-text">or</div>
              </div>
              
              <div className="social-login">
                <button className="social-button" aria-label="Login with Google">
                  <img src={googleIcon} alt="Google icon" />
                </button>
                <button className="social-button" aria-label="Login with Facebook">
                  <img src={facebookIcon} alt="Facebook icon" />
                </button>
                <button className="social-button" aria-label="Login with Apple">
                  <img src={appleIcon} alt="Apple icon" />
                </button>
              </div>
      </div>

    </div>
  );
}
