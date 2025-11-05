import ClientDetails from '../components/ui/dashboard/ClientDetails';
import PageMeta from '../components/seo/PageMeta';

export default function ClientDetailsPage() {
  return (
    <>
      <PageMeta
        title="Client Details | Breakwaters Recruitment Dashboard"
        description="Review candidate histories, track status updates with partner companies, and manage next steps inside the Breakwaters recruitment dashboard."
        canonical="https://breakwatersrecruitment.co.za/client-details"
      />
      <ClientDetails />
    </>
  );
}

