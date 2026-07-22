import SharedProfilePage from './SharedProfilePage';

export default function MedicalProfilePage() {
  return (
    <SharedProfilePage
      dashboardLink="/medical-dashboard"
      profileLabel="Perfil do Médico"
      userType="doctor"
    />
  );
}
