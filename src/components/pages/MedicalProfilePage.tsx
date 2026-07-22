import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  Shield,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { Profissionais } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';
import ProfilePhotoDisplay from '@/components/ProfilePhotoDisplay';
import ProfessionalProfileHeader from '@/components/ProfessionalProfileHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MedicalProfilePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [professional, setProfessional] = useState<Profissionais | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

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

      const professionalData = await BaseCrudService.getById<Profissionais>(
        'profissionais',
        professionalId
      );
      setProfessional(professionalData);
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

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Todos os campos são obrigatórios');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (passwordData.currentPassword !== professional?.password) {
      setPasswordError('Senha atual incorreta');
      return;
    }

    try {
      const professionalId = localStorage.getItem('professionalId');
      if (!professionalId) return;

      await BaseCrudService.update<Profissionais>('profissionais', {
        _id: professionalId,
        password: passwordData.newPassword,
      });

      setProfessional({
        ...professional!,
        password: passwordData.newPassword,
      });

      setPasswordSuccess('Senha alterada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setShowPasswordForm(false), 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Erro ao alterar senha');
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
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
      <ProfessionalProfileHeader
        professional={professional}
        dashboardLink="/medical-dashboard"
        profileLink="/medical-profile"
        onLogout={handleLogout}
      />

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
                <h2 className="font-heading text-2xl font-bold text-foreground mt-6">
                  {professional?.fullName}
                </h2>
                <p className="font-paragraph text-sm text-foreground/60 mt-1">{professional?.profile}</p>
              </div>

              <div className="space-y-4 border-t border-secondary/20 pt-6">
                <div>
                  <p className="font-paragraph text-xs text-foreground/60 uppercase tracking-wide mb-1">
                    Hospital
                  </p>
                  <p className="font-paragraph text-sm font-semibold text-foreground">
                    {professional?.hospital || '-'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-xs text-foreground/60 uppercase tracking-wide mb-1">
                    Status
                  </p>
                  <p className="font-paragraph text-sm font-semibold text-foreground">
                    <span className="inline-block px-3 py-1 bg-stable/20 text-stable rounded-full text-xs">
                      {professional?.status || 'Ativo'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-xs text-foreground/60 uppercase tracking-wide mb-1">
                    ID Interno
                  </p>
                  <p className="font-paragraph text-xs font-mono text-foreground">
                    {professional?._id?.substring(0, 8)}...
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Profile Details with Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-white border border-secondary/20 rounded-2xl p-1">
                <TabsTrigger value="info" className="font-paragraph">
                  Informações
                </TabsTrigger>
                <TabsTrigger value="security" className="font-paragraph">
                  Segurança
                </TabsTrigger>
              </TabsList>

              {/* Information Tab */}
              <TabsContent value="info" className="space-y-8">
                {/* Contact Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-8 border border-secondary/20"
                >
                  <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
                    Informações de Contato
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-paragraph text-sm text-foreground/60 mb-1">E-mail</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {professional?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Professional Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl p-8 border border-secondary/20"
                >
                  <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
                    Informações Profissionais
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <Briefcase className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-paragraph text-sm text-foreground/60 mb-1">Cargo</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {professional?.profile}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Building2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-paragraph text-sm text-foreground/60 mb-1">Hospital</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {professional?.hospital}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Account Information */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl p-8 border border-secondary/20"
                >
                  <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
                    Informações da Conta
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-4">
                      <Calendar className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-paragraph text-sm text-foreground/60 mb-1">Data de Criação</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {formatDate(professional?._createdDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-paragraph text-sm text-foreground/60 mb-1">Último Acesso</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {formatDate(professional?._updatedDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-8 border border-secondary/20"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Shield className="w-6 h-6 text-primary" />
                    <h3 className="font-heading text-2xl font-bold text-foreground">Alterar Senha</h3>
                  </div>

                  {!showPasswordForm ? (
                    <Button
                      onClick={() => setShowPasswordForm(true)}
                      className="w-full bg-primary text-primary-foreground font-paragraph font-semibold"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      {passwordError && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="font-paragraph text-sm text-destructive">{passwordError}</p>
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="p-4 bg-stable/10 border border-stable/20 rounded-lg">
                          <p className="font-paragraph text-sm text-stable">{passwordSuccess}</p>
                        </div>
                      )}

                      <div>
                        <Label className="font-paragraph text-sm mb-2">Senha Atual</Label>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value,
                              })
                            }
                            className="font-paragraph pr-10"
                            placeholder="Digite sua senha atual"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="w-4 h-4 text-foreground/60" />
                            ) : (
                              <Eye className="w-4 h-4 text-foreground/60" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label className="font-paragraph text-sm mb-2">Nova Senha</Label>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                newPassword: e.target.value,
                              })
                            }
                            className="font-paragraph pr-10"
                            placeholder="Digite sua nova senha"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-4 h-4 text-foreground/60" />
                            ) : (
                              <Eye className="w-4 h-4 text-foreground/60" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label className="font-paragraph text-sm mb-2">Confirmar Nova Senha</Label>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                confirmPassword: e.target.value,
                              })
                            }
                            className="font-paragraph pr-10"
                            placeholder="Confirme sua nova senha"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4 text-foreground/60" />
                            ) : (
                              <Eye className="w-4 h-4 text-foreground/60" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          onClick={handlePasswordChange}
                          className="flex-1 bg-primary text-primary-foreground font-paragraph font-semibold"
                        >
                          Salvar Alterações
                        </Button>
                        <Button
                          onClick={() => setShowPasswordForm(false)}
                          variant="outline"
                          className="flex-1 font-paragraph"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
