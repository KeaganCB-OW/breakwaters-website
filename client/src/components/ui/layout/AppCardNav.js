import { useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import CardNav from './CardNav';
import defaultLogo from '../../../assets/logos/Logo-full.svg';
import { AuthContext } from '../../../context/AuthContext';
import useResumeModal from '../../../hooks/useResumeModal';

const defaultItems = [
  {
    label: 'About',
    bgColor: '#082658',
    textColor: '#fff',
    links: [
      { label: 'Home', ariaLabel: 'Home Page' },
      { label: 'About Us', ariaLabel: 'About Us' },
      { label: 'For Companies', ariaLabel: 'Join the Breakwaters Network' }
    ]
  },
  {
    label: 'Our Clients',
    bgColor: '#0b3173ff',
    textColor: '#fff',
    links: [
      { label: 'Featured Companies', ariaLabel: 'Featured Companies' },
      { label: 'Testimonials', ariaLabel: 'Our Testimonials' }
    ]
  },
  {
    label: 'Contact',
    bgColor: '#10387fff',
    textColor: '#fff',
    links: [
      { label: 'Email', ariaLabel: 'Email us' },
      { label: 'Twitter', ariaLabel: 'Twitter' },
      { label: 'LinkedIn', ariaLabel: 'LinkedIn' }
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
  rightContent,
  ...rest
}) => {
  const { user } = useContext(AuthContext);
  const { open } = useResumeModal();
  const navigate = useNavigate();

  const handleCtaClick = useCallback(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    open();
  }, [navigate, open, user]);

  const effectiveRightContent = rightContent ?? (
    <button
      type="button"
      className="card-nav-cta-button"
      style={{ backgroundColor: buttonBgColor, color: buttonTextColor }}
      onClick={handleCtaClick}
    >
      {user ? 'Get Started' : 'Sign In/Sign Up'}
    </button>
  );

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
      rightContent={effectiveRightContent}
      {...rest}
    />
  );
};

export default AppCardNav;

