import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, LogOut, User, Mail, Building2, Briefcase, Users, CheckCircle, Award, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { Profissionais, AvaliaesdeEnfermagem } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';
import ProfilePhotoDisplay from '@/components/ProfilePhotoDisplay';

export default function NursingProfilePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [professional, setProfessional] = useState<Profissionais | null>(null);
  const [stats, setStats] = useState({
    totalEvaluations: 0,
    totalReferrals: 0,
    totalPatients: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const professionalId = localStorage.getItem('professionalId');
      if (!professionalId) {
        navigate('/professional-login');
        return;
      }

      const professionalData = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
      setProfessional(professionalData);

      // Get statistics
      const { items: allEvaluations } = await BaseCrudService.getAll<AvaliaesdeEnfermagem>('avaliacoesenfermagem');
      const { items: allReferrals } = await BaseCrudService.getAll<any>('encaminhamentosmedicos');

      const evaluationsByThisNurse = allEvaluations.filter(e => e.nurseName === professionalData?.fullName);
      const referralsByThisNurse = allReferrals.filter((r: any) => r.nurseId === professionalId);
      const uniquePatients = new Set(evaluationsByThisNurse.map(e => e.patientId)).size;

      setStats({
        totalEvaluations: evaluationsByThisNurse.length,
        totalReferrals: referralsByThisNurse.length,
        totalPatients: uniquePatients,
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('professionalId');
    localStorage.removeItem('professionalProfile');
    navigate('/professional-login');
  };

  const handlePhotoUpdate = async (croppedImage: string) => {
    try {
      const professionalId = localStorage.getItem('professionalId');
      if (!professionalId || !professional) return;

      await BaseCrudService.update<Profissionais>('profissionais', {
        _id: professionalId,
        profilePhoto: croppedImage,
      });

      setProfessional({
        ...professional,
        profilePhoto: croppedImage,
      });
    } catch (error) {
      console.error('Error updating photo:', error);
    }
  };

  const handlePhotoRemove = async () => {
    try {
      const professionalId = localStorage.getItem('professionalId');
      if (!professionalId || !professional) return;

      await BaseCrudService.update<Profissionais>('profissionais', {
        _id: professionalId,
        profilePhoto: '',
      });

      setProfessional({
        ...professional,
        profilePhoto: '',
      });
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-secondary/30 sticky top-0 z-50">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/nursing-dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Perfil do Enfermeiro</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/nursing-dashboard">
                <Button variant="outline" className="flex items-center gap-2 font-paragraph">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2 bg-destructive text-destructive-foreground font-paragraph font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl p-8 border border-secondary/20 sticky top-24">
              <div className="flex flex-col items-center text-center mb-8">
                <ProfilePhotoDisplay
                  photo={professional?.profilePhoto}
                  name={professional?.fullName}
                  onPhotoUpdate={handlePhotoUpdate}
                  onPhotoRemove={handlePhotoRemove}
                  size="lg"
                  showEditIcon={true}
                />
                <h2 className="font-heading text-2xl font-bold text-foreground mt-6">{professional?.fullName}</h2>
                <p className="font-paragraph text-sm text-foreground/60 mt-1">{professional?.profile}</p>
              </div>

              <div className="space-y-4 border-t border-secondary/20 pt-6">
                <div>
                  <p className="font-paragraph text-xs text-foreground/60 uppercase tracking-wide mb-1">Especialidade</p>
                  <p className="font-paragraph text-sm font-semibold text-foreground">{professional?.specialty || '-'}</p>
                </div>
                <div>
                  <p className="font-paragraph text-xs text-foreground/60 uppercase tracking-wide mb-1">Hospital</p>
                  <p className="font-paragraph text-sm font-semibold text-foreground">{professional?.hospital || '-'}</p>
                </div>
                <div>
                  <p className="font-paragraph text-xs text-foreground/60 uppercase tracking-wide mb-1">Status</p>
                  <p className="font-paragraph text-sm font-semibold text-foreground">
                    <span className="inline-block px-3 py-1 bg-stable/20 text-stable rounded-full text-xs">
                      {professional?.status || 'Ativo'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 border border-secondary/20"
            >
              <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Informações de Contato</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-paragraph text-sm text-foreground/60 mb-1">E-mail</p>
                    <p className="font-paragraph text-base font-semibold text-foreground">{professional?.email}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Professional Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8 border border-secondary/20"
            >
              <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Informações Profissionais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <Briefcase className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-paragraph text-sm text-foreground/60 mb-1">Perfil</p>
                    <p className="font-paragraph text-base font-semibold text-foreground">{professional?.profile}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Building2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-paragraph text-sm text-foreground/60 mb-1">Hospital</p>
                    <p className="font-paragraph text-base font-semibold text-foreground">{professional?.hospital}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <div className="bg-white rounded-2xl p-6 border border-secondary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-foreground">{stats.totalPatients}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Pacientes Avaliados</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-secondary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-foreground">{stats.totalEvaluations}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Avaliações Realizadas</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-secondary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-foreground">{stats.totalReferrals}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Encaminhamentos Realizados</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
