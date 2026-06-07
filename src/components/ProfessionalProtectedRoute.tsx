import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProfessionalProtectedRouteProps {
  children: React.ReactNode;
  allowedProfiles?: string[];
}

export function ProfessionalProtectedRoute({
  children,
  allowedProfiles,
}: ProfessionalProtectedRouteProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const professionalId = localStorage.getItem('professionalId');
    const profile = localStorage.getItem('professionalProfile');

    if (!professionalId || !profile) {
      navigate('/professional-login');
      return;
    }

    if (allowedProfiles && !allowedProfiles.includes(profile)) {
      navigate('/');
      return;
    }

    setIsAuthorized(true);
    setIsLoading(false);
  }, [navigate, allowedProfiles]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
