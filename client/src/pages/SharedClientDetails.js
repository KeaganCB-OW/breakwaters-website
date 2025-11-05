import SharedClientDetails from '../components/ui/share/SharedClientDetails';
import PageMeta from '../components/seo/PageMeta';

export default function SharedClientDetailsPage() {
  return (
    <>
      <PageMeta
        title="Breakwaters Candidate Snapshot"
        description="View a curated summary of a Breakwaters Recruitment candidate, including key experience highlights shared securely with partner companies."
      />
      <SharedClientDetails />
    </>
  );
}

