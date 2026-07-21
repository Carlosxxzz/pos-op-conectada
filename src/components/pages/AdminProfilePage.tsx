import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  LogOut,
  Mail,
  Building2,
  Briefcase,
  Users,
  CheckCircle,
  Award,
  Lock,
  Eye,
  EyeOff,
  Bell,
  Moon,
  Globe,
  Calendar,
  AlertCircle,
  Clock,
  Shield,
  Settings,
  History,
  MapPin,
  Phone,
  FileText,
  UserCog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type {
  Profissionais,
  Pacientes,
  ChecklistsDirios,
  AvaliaesdeEnfermagem,
  AvaliaesMdicas,
  ActivityHistory,
  Notifications,
  PriorityAlerts,
} from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';
import ProfilePhotoDisplay from '@/components/ProfilePhotoDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

export default function AdminProfilePage() {
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

  const [preferences, setPreferences] = useState({
    notifications: true,
    theme: 'light',
    language: 'pt-BR',
    dateFormat: 'DD/MM/YYYY',
  });

  const [stats, setStats] = useState({
    totalPatients: 0,
    patientsInFollowUp: 0,
    dischargedPatients: 0,
    checklistsToday: 0,
    pendingChecklists: 0,
    nurses: 0,
    doctors: 0,
    admins: 0,
    referrals: 0,
    medicalEvaluations: 0,
    nursingEvaluations: 0,
    criticalAlerts: 0,
    pendingNotifications: 0,
  });

  const [recentActivities, setRecentActivities] = useState<ActivityHistory[]>([]);
  const [hospitalData, setHospitalData] = useState({
    name: '',
    address: '',
    phone: '',
    cnpj: '',
    email: '',
    technicalResponsible: '',
    beds: 0,
    professionals: 0,
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

      const professionalData = await BaseCrudService.getById<Profissionais>(
        'profissionais',
        professionalId
      );
      setProfessional(professionalData);

      // Load statistics
      const { items: patients } = await BaseCrudService.getAll<Pacientes>('pacientes');
      const { items: checklists } = await BaseCrudService.getAll<ChecklistsDirios>(
        'checklistsdiarios'
      );
      const { items: nursingEvals } = await BaseCrudService.getAll<AvaliaesdeEnfermagem>(
        'avaliacoesenfermagem'
      );
      const { items: medicalEvals } = await BaseCrudService.getAll<AvaliaesMdicas>(
        'avaliacoesmedicas'
      );
      const { items: referrals } = await BaseCrudService.getAll<any>('encaminhamentosmedicos');
      const { items: professionals } = await BaseCrudService.getAll<Profissionais>('profissionais');
      const { items: activities } = await BaseCrudService.getAll<ActivityHistory>(
        'historicoatividades',
        {},
        { limit: 10 }
      );
      const { items: alerts } = await BaseCrudService.getAll<PriorityAlerts>('alertasprioritarios');
      const { items: notifications } = await BaseCrudService.getAll<Notifications>('notificacoes');

      // Calculate statistics
      const today = new Date().toDateString();
      const checklistsToday = checklists.filter(
        (c) => new Date(c.checklistDate || '').toDateString() === today
      ).length;
      const pendingChecklists = checklists.filter((c) => c.status === 'pending').length;
      const dischargedPatients = patients.filter((p) => p.followUpStatus === 'Alta').length;
      const patientsInFollowUp = patients.filter((p) => p.followUpStatus === 'Em Acompanhamento')
        .length;

      const nurses = professionals.filter((p) => p.profile === 'Enfermeiro').length;
      const doctors = professionals.filter((p) => p.profile === 'Médico').length;
      const admins = professionals.filter((p) => p.profile === 'Administrador').length;

      const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
      const pendingNotifications = notifications.filter((n) => !n.isRead).length;

      setStats({
        totalPatients: patients.length,
        patientsInFollowUp,
        dischargedPatients,
        checklistsToday,
        pendingChecklists,
        nurses,
        doctors,
        admins,
        referrals: referrals.length,
        medicalEvaluations: medicalEvals.length,
        nursingEvaluations: nursingEvals.length,
        criticalAlerts,
        pendingNotifications,
      });

      setRecentActivities(activities);

      // Set hospital data from professional's hospital field
      if (professionalData?.hospital) {
        setHospitalData({
          name: professionalData.hospital,
          address: '-',
          phone: '-',
          cnpj: '-',
          email: '-',
          technicalResponsible: professionalData.fullName,
          beds: 0,
          professionals: professionals.length,
        });
      }

      // Load preferences from localStorage
      const savedPreferences = localStorage.getItem('adminPreferences');
      if (savedPreferences) {
        setPreferences(JSON.parse(savedPreferences));
      }
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

  const handlePreferencesChange = (key: string, value: any) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    localStorage.setItem('adminPreferences', JSON.stringify(newPreferences));
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

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
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
      <header className="bg-white border-b border-secondary/30 sticky top-0 z-50">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/admin-dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Perfil do Administrador</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/admin-dashboard">
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
              <TabsList className="grid w-full grid-cols-4 mb-8 bg-white border border-secondary/20 rounded-2xl p-1">
                <TabsTrigger value="info" className="font-paragraph">
                  Informações
                </TabsTrigger>
                <TabsTrigger value="security" className="font-paragraph">
                  Segurança
                </TabsTrigger>
                <TabsTrigger value="preferences" className="font-paragraph">
                  Preferências
                </TabsTrigger>
                <TabsTrigger value="stats" className="font-paragraph">
                  Estatísticas
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

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-8 border border-secondary/20"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <Settings className="w-6 h-6 text-primary" />
                    <h3 className="font-heading text-2xl font-bold text-foreground">Preferências</h3>
                  </div>

                  <div className="space-y-6">
                    {/* Notifications */}
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-secondary/20">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-paragraph font-semibold text-foreground">
                            Receber Notificações
                          </p>
                          <p className="font-paragraph text-sm text-foreground/60">
                            Ativar notificações do sistema
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.notifications}
                        onChange={(e) => handlePreferencesChange('notifications', e.target.checked)}
                        className="w-5 h-5 rounded cursor-pointer"
                      />
                    </div>

                    {/* Theme */}
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-secondary/20">
                      <div className="flex items-center gap-3">
                        <Moon className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-paragraph font-semibold text-foreground">Tema</p>
                          <p className="font-paragraph text-sm text-foreground/60">
                            Selecione o tema da interface
                          </p>
                        </div>
                      </div>
                      <select
                        value={preferences.theme}
                        onChange={(e) => handlePreferencesChange('theme', e.target.value)}
                        className="font-paragraph px-3 py-2 border border-secondary/20 rounded-lg bg-white"
                      >
                        <option value="light">Claro</option>
                        <option value="dark">Escuro</option>
                      </select>
                    </div>

                    {/* Language */}
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-secondary/20">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-paragraph font-semibold text-foreground">Idioma</p>
                          <p className="font-paragraph text-sm text-foreground/60">
                            Selecione o idioma da interface
                          </p>
                        </div>
                      </div>
                      <select
                        value={preferences.language}
                        onChange={(e) => handlePreferencesChange('language', e.target.value)}
                        className="font-paragraph px-3 py-2 border border-secondary/20 rounded-lg bg-white"
                      >
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English</option>
                        <option value="es-ES">Español</option>
                      </select>
                    </div>

                    {/* Date Format */}
                    <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-secondary/20">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <div>
                          <p className="font-paragraph font-semibold text-foreground">Formato de Data</p>
                          <p className="font-paragraph text-sm text-foreground/60">
                            Selecione o formato de data
                          </p>
                        </div>
                      </div>
                      <select
                        value={preferences.dateFormat}
                        onChange={(e) => handlePreferencesChange('dateFormat', e.target.value)}
                        className="font-paragraph px-3 py-2 border border-secondary/20 rounded-lg bg-white"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="stats" className="space-y-8">
                {/* Admin Statistics */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.totalPatients}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Total de Pacientes</p>
                  </Card>

                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.patientsInFollowUp}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Em Acompanhamento</p>
                  </Card>

                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-stable/10 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-stable" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.dischargedPatients}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Pacientes de Alta</p>
                  </Card>

                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.checklistsToday}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Checklists Hoje</p>
                  </Card>

                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-attention/10 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-attention" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.pendingChecklists}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Checklists Pendentes</p>
                  </Card>

                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.nurses}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Enfermeiros</p>
                  </Card>

                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.doctors}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Médicos</p>
                  </Card>

                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <UserCog className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.admins}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Administradores</p>
                  </Card>

                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.referrals}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Encaminhamentos</p>
                  </Card>

                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.medicalEvaluations}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Avaliações Médicas</p>
                  </Card>

                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-primary" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.nursingEvaluations}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Avaliações Enfermagem</p>
                  </Card>

                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-critical/10 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-critical" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.criticalAlerts}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Alertas Críticos</p>
                  </Card>

                  <Card className="p-6 border border-secondary/20">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-attention/10 rounded-lg flex items-center justify-center">
                        <Bell className="w-6 h-6 text-attention" />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">
                        {stats.pendingNotifications}
                      </span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">Notificações Pendentes</p>
                  </Card>
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Recent Activities Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-white rounded-2xl p-8 border border-secondary/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <History className="w-6 h-6 text-primary" />
            <h3 className="font-heading text-2xl font-bold text-foreground">Atividades Recentes</h3>
          </div>

          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div
                  key={activity._id}
                  className="flex items-start gap-4 p-4 bg-background rounded-lg border border-secondary/20 hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-paragraph font-semibold text-foreground">
                      {activity.actionDescription}
                    </p>
                    <p className="font-paragraph text-sm text-foreground/60 mt-1">
                      {activity.actionDetails}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-foreground/50">
                      <span>{formatDate(activity.actionTimestamp)}</span>
                      <span>{formatTime(activity.actionTimestamp)}</span>
                      <span>{activity.nurseName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-paragraph text-center text-foreground/60 py-8">
              Nenhuma atividade recente
            </p>
          )}
        </motion.div>

        {/* Hospital Data Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white rounded-2xl p-8 border border-secondary/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-6 h-6 text-primary" />
            <h3 className="font-heading text-2xl font-bold text-foreground">Dados do Hospital</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <Building2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-paragraph text-sm text-foreground/60 mb-1">Nome do Hospital</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {hospitalData.name || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-paragraph text-sm text-foreground/60 mb-1">Endereço</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {hospitalData.address}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-paragraph text-sm text-foreground/60 mb-1">Telefone</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {hospitalData.phone}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <FileText className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-paragraph text-sm text-foreground/60 mb-1">CNPJ</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {hospitalData.cnpj}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-paragraph text-sm text-foreground/60 mb-1">E-mail Institucional</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {hospitalData.email}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Users className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-paragraph text-sm text-foreground/60 mb-1">Responsável Técnico</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {hospitalData.technicalResponsible}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Building2 className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-paragraph text-sm text-foreground/60 mb-1">Quantidade de Leitos</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {hospitalData.beds || '-'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Users className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-paragraph text-sm text-foreground/60 mb-1">Profissionais</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {hospitalData.professionals}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Management Shortcuts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-white rounded-2xl p-8 border border-secondary/20"
        >
          <div className="flex items-center gap-3 mb-6">
            <UserCog className="w-6 h-6 text-primary" />
            <h3 className="font-heading text-2xl font-bold text-foreground">Gestão de Usuários</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/admin-dashboard">
              <Button className="w-full bg-primary text-primary-foreground font-paragraph font-semibold">
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Médicos
              </Button>
            </Link>
            <Link to="/admin-dashboard">
              <Button className="w-full bg-primary text-primary-foreground font-paragraph font-semibold">
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Enfermeiros
              </Button>
            </Link>
            <Link to="/admin-dashboard">
              <Button className="w-full bg-primary text-primary-foreground font-paragraph font-semibold">
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Pacientes
              </Button>
            </Link>
            <Link to="/admin-dashboard">
              <Button className="w-full bg-primary text-primary-foreground font-paragraph font-semibold">
                <UserCog className="w-4 h-4 mr-2" />
                Gerenciar Administradores
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
