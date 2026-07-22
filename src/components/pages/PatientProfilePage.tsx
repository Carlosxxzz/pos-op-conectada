import SharedProfilePage from './SharedProfilePage';

export default function PatientProfilePage() {
  return (
    <SharedProfilePage
      dashboardLink="/patient-dashboard"
      profileLabel="Perfil do Paciente"
      userType="patient"
    />
  );
}
