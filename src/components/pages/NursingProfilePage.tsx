import SharedProfilePage from './SharedProfilePage';

export default function NursingProfilePage() {
  return (
    <SharedProfilePage
      dashboardLink="/nursing-dashboard"
      profileLabel="Perfil do Enfermeiro"
      userType="nurse"
    />
  );
}
