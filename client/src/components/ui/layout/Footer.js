import '../../../styling/Footer.css';
import { ReactComponent as Logo } from '../../../assets/logos/logo.svg';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <nav className="footer__links" aria-label="Footer navigation">
            <a href="/">Home</a>
            <a href="/about">About us</a> 
            {/* <a href="/#companies">For Companies</a> */}
            {/* <a href="/#testimonials">Testimonials</a> */}
          </nav>
          <div className="footer__logo" aria-hidden="true">
            <Logo className="footer__logo-svg" focusable="false" />
          </div>
          <div className="footer__contact">
            <p>
              Email:{' '}
              <a href="mailto:support@breakwaters.co.za">
                support@breakwaters.co.za
              </a>
            </p>
            <p>
              Phone:{' '}
              <a href="tel:+27211234567">+27 21 123 4567</a>
            </p>
            <p>Location: Cape Town, South Africa</p>
          </div>
        </div>
        <div className="footer__bottom">
          {/* <a className="footer__policy" href="/privacy">
            Privacy Policy
          </a> */}
          {/* <a className="footer__policy" href="/terms">
            Terms of Service
          </a> */}
          {/* <a className="footer__policy" href="/terms">
            2025 Breakwaters. All rights reserved.
          </a> */}
        </div>
      </div>
    </footer>
  );
}
