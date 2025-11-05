import { Navigate, useRoutes } from 'react-router-dom';
import Dashboard from '../components/ui/dashboard/Dashboard';
import DashboardHome from '../components/ui/dashboard/DashboardHome';
import CandidatesListView from '../components/ui/dashboard/CandidatesListView';
import CompaniesListView from '../components/ui/dashboard/CompaniesListView';
import AssignmentsListView from '../components/ui/dashboard/AssignmentsListView';
import PageMeta from '../components/seo/PageMeta';

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

  return (
    <>
      <PageMeta
        title="Recruitment Officer Dashboard | Breakwaters"
        description="Manage candidates, companies, and assignments from the Breakwaters Recruitment officer dashboard."
        canonical="https://breakwatersrecruitment.co.za/rod"
      />
      {element}
    </>
  );
}
