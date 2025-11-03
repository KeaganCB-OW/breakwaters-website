import { Navigate, useRoutes } from 'react-router-dom';
import Dashboard from '../components/ui/dashboard/Dashboard';
import DashboardHome from '../components/ui/dashboard/DashboardHome';
import CandidatesListView from '../components/ui/dashboard/CandidatesListView';
import CompaniesListView from '../components/ui/dashboard/CompaniesListView';
import AssignmentsListView from '../components/ui/dashboard/AssignmentsListView';

export default function RODashboard() {
  const element = useRoutes([
    {
      path: '/',
      element: <Dashboard />,
      children: [
        { index: true, element: <DashboardHome /> },
        { path: 'candidates', element: <CandidatesListView /> },
        { path: 'companies', element: <CompaniesListView /> },
        { path: 'assignments', element: <AssignmentsListView /> },
      ],
    },
    { path: '*', element: <Navigate to="." replace /> },
  ]);

  return element;
}
