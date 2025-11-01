import { useContext } from 'react';
import { ResumeModalContext } from '../context/ResumeModalContext';

export default function useResumeModal() {
  return useContext(ResumeModalContext);
}
