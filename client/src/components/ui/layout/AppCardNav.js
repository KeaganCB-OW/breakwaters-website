import { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CardNav from './CardNav';
import defaultLogo from '../../../assets/logos/Logo-full.svg';
import { useClientIntake } from '../../../context/ClientIntakeContext';
import { AuthContext } from '../../../context/AuthContext';

const defaultItems = [
  {
    label: 'About',
    bgColor: '#082658',
    textColor: '#fff',
    links: [
      { label: 'Home', ariaLabel: 'Home Page', href: '/' },
      { label: 'About Us', ariaLabel: 'About Us', href: '/about' }
      
    ]
  },
  {
    label: 'Contact',
    bgColor: '#10387fff',
    textColor: '#fff',
    links: [
      { label: 'Email', ariaLabel: 'Email us', href: 'mailto:support@breakwaters.co.za' },
      { label: 'LinkedIn', ariaLabel: 'LinkedIn', href: 'https://www.linkedin.com/' }
    ]
  }
];

const AppCardNav = ({
  logo = defaultLogo,
  logoAlt = 'Company Logo',
  items = defaultItems,
  baseColor = '#fff',
  menuColor = '#082658',
  buttonBgColor = '#082658',
  buttonTextColor = '#fff',
  ease = 'power3.out',
  onGetStarted,
  ctaLabel = 'Get Started',
  rightContent,
  ...rest
}) => {
  const { openClientIntake, hasRegisteredBusiness } = useClientIntake();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGetStarted = useCallback(() => {
    if (user?.role === 'recruitment_officer') {
      navigate('/rod');
    } else if (typeof onGetStarted === 'function') {
      onGetStarted();
    } else {
      openClientIntake();
    }
  }, [user, navigate, onGetStarted, openClientIntake]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const computedRightContent = useMemo(() => {
    if (rightContent) {
      return rightContent;
    }

    const ctaText = hasRegisteredBusiness ? 'View Company Profile' : ctaLabel;
    const primaryButton = hasRegisteredBusiness ? (
      <a
        className="card-nav-cta-button"
        style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
        href="/business/profile"
        aria-label="View company profile"
      >
        {ctaText}
      </a>
    ) : (
      <button
        type="button"
        className="card-nav-cta-button"
        style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
        onClick={handleGetStarted}
      >
        {ctaText}
      </button>
    );

    if (!user) {
      return primaryButton;
    }

    return (
      <div className="card-nav-action-group">
        {primaryButton}
        <button
          type="button"
          className="card-nav-secondary-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    );
  }, [
    rightContent,
    user,
    buttonBgColor,
    buttonTextColor,
    handleGetStarted,
    hasRegisteredBusiness,
    ctaLabel,
    handleLogout,
  ]);

  return (
    <CardNav
      logo={logo}
      logoAlt={logoAlt}
      items={items}
      baseColor={baseColor}
      menuColor={menuColor}
      buttonBgColor={buttonBgColor}
      buttonTextColor={buttonTextColor}
      ease={ease}
      onCtaClick={handleGetStarted}
      rightContent={computedRightContent}
      {...rest}
    />
  );
};

export default AppCardNav;
