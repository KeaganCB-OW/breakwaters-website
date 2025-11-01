import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';

const ResumeSubmissionContext = createContext({
  isOpen: false,
  open: () => {},
  close: () => {},
  clientProfile: undefined,
  setClientProfile: () => {},
});

export function ResumeSubmissionProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [clientProfile, setClientProfileState] = useState(undefined);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setClientProfile = useCallback((profile) => {
    setClientProfileState(profile === undefined ? undefined : profile ?? null);
  }, []);

  useEffect(() => {
    if (!user) {
      setClientProfileState(undefined);
      setIsOpen(false);
    }
  }, [user]);

  const value = useMemo(() => ({
    isOpen,
    open,
    close,
    clientProfile,
    setClientProfile,
  }), [clientProfile, close, isOpen, open, setClientProfile]);

  return (
    <ResumeSubmissionContext.Provider value={value}>
      {children}
    </ResumeSubmissionContext.Provider>
  );
}

export function useResumeSubmission() {
  return useContext(ResumeSubmissionContext);
}

export default ResumeSubmissionContext;
