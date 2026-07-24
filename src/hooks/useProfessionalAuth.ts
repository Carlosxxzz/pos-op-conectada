import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useProfessionalAuth() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<string | null>(null);
  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem('professionalId');
    const prof = localStorage.getItem('professionalProfile');
    const hospital = localStorage.getItem('professionalHospital');

    if (id && prof) {
      setIsAuthenticated(true);
      setProfessionalId(id);
      setProfile(prof);
      setHospitalId(hospital);
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('professionalId');
    localStorage.removeItem('professionalProfile');
    localStorage.removeItem('professionalHospital');
    setIsAuthenticated(false);
    setProfile(null);
    setProfessionalId(null);
    setHospitalId(null);
    navigate('/professional-login');
  };

  return {
    isAuthenticated,
    profile,
    professionalId,
    hospitalId,
    isLoading,
    logout,
  };
}
