// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('motion/react', () => {
  const React = require('react');

  const createMotionComponent = (tag) =>
    React.forwardRef(({ children, ...rest }, ref) =>
      React.createElement(tag, { ref, ...rest }, children)
    );

  const motionProxy = new Proxy(
    {},
    {
      get: (_, tag) => createMotionComponent(tag),
    }
  );

  return {
    __esModule: true,
    motion: motionProxy,
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
  };
}, { virtual: true });

if (typeof window !== 'undefined' && typeof window.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    constructor() {}

    observe() {
      return null;
    }

    unobserve() {
      return null;
    }

    disconnect() {
      return null;
    }
  }

  window.IntersectionObserver = MockIntersectionObserver;
  window.IntersectionObserverEntry = class IntersectionObserverEntry {};
}
