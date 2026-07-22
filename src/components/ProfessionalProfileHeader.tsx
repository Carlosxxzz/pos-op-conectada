import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, Settings, Lock, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfilePhotoDisplay from '@/components/ProfilePhotoDisplay';
import type { Profissionais } from '@/entities';
import { Image } from '@/components/ui/image';

interface ProfessionalProfileHeaderProps {
  professional: Profissionais | null;
  dashboardLink: string;
  profileLink: string;
  onLogout: () => void;
}

export default function ProfessionalProfileHeader({
  professional,
  dashboardLink,
  profileLink,
  onLogout,
}: ProfessionalProfileHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate(profileLink);
    setShowProfileMenu(false);
  };

  const handleSecurityClick = () => {
    navigate(profileLink);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    onLogout();
  };

  return (
    <header className="bg-white border-b border-secondary/30 sticky top-0 z-50">
      <div className="max-w-[120rem] mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <Link to={dashboardLink} className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
              <p className="font-paragraph text-sm text-foreground/60">
                {professional?.profile === 'Médico' && 'Dashboard do Médico'}
                {professional?.profile === 'Enfermeiro' && 'Dashboard do Enfermeiro'}
                {professional?.profile === 'Administrador' && 'Dashboard Administrativo'}
              </p>
            </div>
          </Link>

          {/* Profile Section */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-background transition-colors"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary flex-shrink-0">
                {professional?.profilePhoto ? (
                  <Image src={professional.profilePhoto} alt={professional.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                    <span className="font-heading font-bold text-primary text-sm">
                      {professional?.fullName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Name and Role */}
              <div className="text-left hidden sm:block">
                <p className="font-paragraph font-semibold text-foreground text-sm">
                  {professional?.fullName}
                </p>
                <p className="font-paragraph text-xs text-foreground/60">
                  {professional?.profile}
                </p>
              </div>

              {/* Chevron */}
              <ChevronDown
                className={`w-4 h-4 text-foreground/60 transition-transform ${
                  showProfileMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-secondary/20 overflow-hidden z-50"
                >
                  {/* Profile Info */}
                  <div className="px-4 py-3 border-b border-secondary/20 bg-background">
                    <p className="font-paragraph font-semibold text-foreground text-sm">
                      {professional?.fullName}
                    </p>
                    <p className="font-paragraph text-xs text-foreground/60 mt-1">
                      {professional?.email}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={handleProfileClick}
                      className="w-full px-4 py-2 text-left font-paragraph text-sm text-foreground hover:bg-background transition-colors flex items-center gap-3"
                    >
                      <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      Meu Perfil
                    </button>

                    <button
                      onClick={handleSecurityClick}
                      className="w-full px-4 py-2 text-left font-paragraph text-sm text-foreground hover:bg-background transition-colors flex items-center gap-3"
                    >
                      <Lock className="w-4 h-4 text-primary" />
                      Segurança
                    </button>

                    <button
                      onClick={handleSecurityClick}
                      className="w-full px-4 py-2 text-left font-paragraph text-sm text-foreground hover:bg-background transition-colors flex items-center gap-3"
                    >
                      <Settings className="w-4 h-4 text-primary" />
                      Configurações
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-secondary/20 py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left font-paragraph text-sm text-destructive hover:bg-destructive/5 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
