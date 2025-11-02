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
      { label: 'About Us', ariaLabel: 'About Us', href: '/about' },
      { label: 'For Companies', ariaLabel: 'Join the Breakwaters Network', href: '/become-client' }
    ]
  },
  {
    label: 'Our Clients',
    bgColor: '#0b3173ff',
    textColor: '#fff',
    links: [
      { label: 'Featured Companies', ariaLabel: 'Featured Companies', href: '/#companies' },
      { label: 'Testimonials', ariaLabel: 'Our Testimonials', href: '/#testimonials' }
    ]
  },
  {
    label: 'Contact',
    bgColor: '#10387fff',
    textColor: '#fff',
    links: [
      { label: 'Email', ariaLabel: 'Email us', href: 'mailto:support@breakwaters.co.za' },
      { label: 'Twitter', ariaLabel: 'Twitter', href: '#' },
      { label: 'LinkedIn', ariaLabel: 'LinkedIn', href: '#' }
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
  const { openClientIntake } = useClientIntake();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleGetStarted = useCallback(() => {
    if (typeof onGetStarted === 'function') {
      onGetStarted();
    } else {
      openClientIntake();
    }
  }, [onGetStarted, openClientIntake]);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const computedRightContent = useMemo(() => {
    if (rightContent) {
      return rightContent;
    }

    const primaryButton = (
      <button
        type="button"
        className="card-nav-cta-button"
        style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
        onClick={handleGetStarted}
      >
        {ctaLabel}
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
