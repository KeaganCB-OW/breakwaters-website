import CardNav from './CardNav';
import defaultLogo from '../../../logo.svg';

const defaultItems = [
  {
    label: 'About',
    bgColor: '#082658',
    textColor: '#fff',
    links: [
      { label: 'Company', ariaLabel: 'About Company' },
      { label: 'Careers', ariaLabel: 'About Careers' }
    ]
  },
  {
    label: 'Projects',
    bgColor: '#0b3173ff',
    textColor: '#fff',
    links: [
      { label: 'Featured', ariaLabel: 'Featured Projects' },
      { label: 'Case Studies', ariaLabel: 'Project Case Studies' }
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
  ...rest
}) => (
  <CardNav
    logo={logo}
    logoAlt={logoAlt}
    items={items}
    baseColor={baseColor}
    menuColor={menuColor}
    buttonBgColor={buttonBgColor}
    buttonTextColor={buttonTextColor}
    ease={ease}
    {...rest}
  />
);

export default AppCardNav;

