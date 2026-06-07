import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useProfessionalAuth() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('professionalId');
    const prof = localStorage.getItem('professionalProfile');

    if (id && prof) {
      setIsAuthenticated(true);
      setProfessionalId(id);
      setProfile(prof);
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('professionalId');
    localStorage.removeItem('professionalProfile');
    setIsAuthenticated(false);
    setProfile(null);
    setProfessionalId(null);
    navigate('/professional-login');
  };

  return {
    isAuthenticated,
    profile,
    professionalId,
    isLoading,
    logout,
  };
}
