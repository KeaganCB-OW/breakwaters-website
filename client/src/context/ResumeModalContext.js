import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { fetchCurrentClient } from '../services/clientService';

export const ResumeModalContext = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
  hasSubmitted: false,
  clientRecord: null,
  isCheckingStatus: false,
  statusError: null,
  markSubmitted: () => {},
});

export function ResumeModalProvider({ children }) {
  const { user, token } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [clientRecord, setClientRecord] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusError, setStatusError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!user || !token) {
      setHasSubmitted(false);
      setClientRecord(null);
      setStatusError(null);
      setIsOpen(false);
      return;
    }

    let isMounted = true;
    setIsCheckingStatus(true);
    setStatusError(null);

    fetchCurrentClient(token)
      .then(record => {
        if (!isMounted) {
          return;
        }

        if (record) {
          setHasSubmitted(true);
          setClientRecord(record);
        } else {
          setHasSubmitted(false);
          setClientRecord(null);
        }
      })
      .catch(error => {
        if (!isMounted) {
          return;
        }

        console.error('Failed to determine resume submission status', error);
        setStatusError('Unable to determine your submission status right now.');
        setHasSubmitted(false);
        setClientRecord(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsCheckingStatus(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  const open = useCallback(() => {
    if (!user) {
      return;
    }
    setIsOpen(true);
  }, [user]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const markSubmitted = useCallback(record => {
    setClientRecord(record ?? null);
    setHasSubmitted(Boolean(record));
  }, []);

  const contextValue = useMemo(
    () => ({
      isOpen,
      open,
      close,
      hasSubmitted,
      clientRecord,
      isCheckingStatus,
      statusError,
      markSubmitted,
    }),
    [clientRecord, close, hasSubmitted, isCheckingStatus, isOpen, markSubmitted, open, statusError]
  );

  return <ResumeModalContext.Provider value={contextValue}>{children}</ResumeModalContext.Provider>;
}

export function useResumeModalContext() {
  return useContext(ResumeModalContext);
}
