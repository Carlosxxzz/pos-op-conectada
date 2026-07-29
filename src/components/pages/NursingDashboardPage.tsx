import NotificationPanel from '@/components/NotificationPanel';
import { Button } from '@/components/ui/button';
import { Image } from '@/components/ui/image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type {
  AvaliaesdeEnfermagem,
  AvaliaesMdicas,
  ChecklistsDirios,
  EncaminhamentosMdicos,
  Pacientes, Profissionais
} from '@/entities';
import { useNotifications } from '@/hooks/useNotifications';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';
import { BaseCrudService } from '@/integrations';
import { logger } from '@/lib/logger';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  Filter,
  LogOut,
  Search,
  Stethoscope,
  User,
  Users
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type EvaluationStatus = 'AGUARDANDO_ENFERMAGEM' | 'AVALIADO_ENFERMAGEM' | 'ENCAMINHADO_MEDICO' | 'AVALIADO_MEDICO' | 'CONCLUIDO';
type FilterType = 'TODOS' | 'AGUARDANDO_ENFERMAGEM' | 'AVALIADO_ENFERMAGEM' | 'ENCAMINHADO_MEDICO' | 'AVALIADO_MEDICO' | 'URGENTE' | 'ULTIMOS_7_DIAS' | 'ULTIMOS_30_DIAS' | 'REFERIDO_MEDICO' | 'AVALIADO_MEDICO_COMPLETO';

interface PatientEvaluationData {
  patient: Pacientes;
  latestChecklist: ChecklistsDirios | null;
  status: EvaluationStatus;
  nurseName?: string;
  doctorName?: string;
  evaluationDate?: Date | string;
  referralDate?: Date | string;
  isPriority?: boolean;
  priorityReason?: string;
}

interface DashboardStats {
  awaitingEvaluation: number;
  referredToDoctor: number;
  evaluatedByNurse: number;
  evaluatedByDoctor: number;
  inFollowUp: number;
  critical: number;
  totalChecklistsToday: number;
  discharged: number;
}

export default function NursingDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [allPatients, setAllPatients] = useState<PatientEvaluationData[]>([]);
  const [professional, setProfessional] = useState<Profissionais | null>(null);
  const [error, setError] = useState<string>('');
  const { unreadCount } = useNotifications(professional?._id || null, 'Enfermeiro');
  const [referrals, setReferrals] = useState<EncaminhamentosMdicos[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prioritarios' | 'aguardando' | 'encaminhados' | 'avaliados-enfermagem'| 'avaliados-medico' | 'historico'>('dashboard'); //
  const [stats, setStats] = useState<DashboardStats>({
    awaitingEvaluation: 0,
    referredToDoctor: 0,
    evaluatedByNurse: 0,
    evaluatedByDoctor: 0,
    inFollowUp: 0,
    critical: 0,
    totalChecklistsToday: 0,
    discharged: 0,
  });

  useSessionPersistence();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const professionalId = localStorage.getItem('professionalId');
      if (!professionalId) {
        logger.warn('NursingDashboard', 'loadData', 'No professionalId found');
        navigate('/professional-login');
        return;
      }

      const professionalData = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
      if (!professionalData) {
        logger.error('NursingDashboard', 'loadData', 'Professional not found');
        setError('Dados do profissional não encontrados.');
        navigate('/professional-login');
        return;
      }

      setProfessional(professionalData);

      const [patientsRes, checklistsRes, nursingEvalsRes, referralsRes, medicalEvalsRes] = await Promise.all([
        BaseCrudService.getAll<Pacientes>('pacientes'),
        BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios'),
        BaseCrudService.getAll<AvaliaesdeEnfermagem>('avaliacoesenfermagem'),
        BaseCrudService.getAll<EncaminhamentosMdicos>('encaminhamentosmedicos'),
        BaseCrudService.getAll<AvaliaesMdicas>('avaliacoesmedicas'),
      ]);

      const allChecklists = checklistsRes.items;
      const allNursingEvals = nursingEvalsRes.items;
      const allReferrals = referralsRes.items;
      const allMedicalEvals = medicalEvalsRes.items;

      const patientsList: PatientEvaluationData[] = [];
      const statsData: DashboardStats = {
        awaitingEvaluation: 0,
        referredToDoctor: 0,
        evaluatedByNurse: 0,
        evaluatedByDoctor: 0,
        inFollowUp: 0,
        critical: 0,
        totalChecklistsToday: 0,
        discharged: 0,
      };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      patientsRes.items.forEach(patient => {
        if (patient.hospital !== professionalData.hospital) return;

        const patientChecklists = allChecklists.filter(c => c.patientId === patient._id);
        if (patientChecklists.length === 0) return;

        const sortedChecklists = patientChecklists.sort((a, b) =>
          new Date(b.checklistDate || 0).getTime() - new Date(a.checklistDate || 0).getTime()
        );

        sortedChecklists.forEach(checklist => {
          const nursingEval = allNursingEvals.find(e => e.checklistId === checklist._id);
          const referral = allReferrals.find(r => r.checklistId === checklist._id);
          const medicalEval = referral ? allMedicalEvals.find(e => e.nursingEvaluationId === referral._id) : null;

          let status: EvaluationStatus = 'AGUARDANDO_ENFERMAGEM';
          let nurseName: string | undefined;
          let doctorName: string | undefined;
          let evaluationDate: Date | string | undefined;
          let referralDate: Date | string | undefined;

          if (nursingEval) {
            status = 'AVALIADO_ENFERMAGEM';
            nurseName = nursingEval.nurseName;
            evaluationDate = nursingEval.checklistDate;
          } else if (referral) {
            // CRITICAL FIX: Check referral status - if CONCLUIDO or has medical eval, show as AVALIADO_MEDICO
            if (referral.status === 'CONCLUIDO' || medicalEval) {
              status = 'AVALIADO_MEDICO';
              doctorName = medicalEval?.doctorName || referral.doctorName;
              evaluationDate = medicalEval?.evaluationDate || referral.responseDate;
            } else {
              // Only show as ENCAMINHADO_MEDICO if referral is still pending (not CONCLUIDO)
              status = 'ENCAMINHADO_MEDICO';
              nurseName = referral.nurseName;
              doctorName = referral.doctorName;
              referralDate = referral.referralDate;
            }
          }

          let isPriority = false;
          let priorityReason = '';

          if (checklist.painLevel && checklist.painLevel > 7) {
            isPriority = true;
            priorityReason = `Dor alta (${checklist.painLevel}/10)`;
          } else if (checklist.bodyTemperature && checklist.bodyTemperature > 38) {
            isPriority = true;
            priorityReason = `Febre (${checklist.bodyTemperature}°C)`;
          } else if (checklist.scarRedness || checklist.hasSecretion || checklist.hasBadOdor) {
            isPriority = true;
            priorityReason = 'Alteração na ferida';
          }

          const data: PatientEvaluationData = {
            patient,
            latestChecklist: checklist,
            status,
            nurseName,
            doctorName,
            evaluationDate,
            referralDate,
            isPriority,
            priorityReason,
          };

          patientsList.push(data);

          if (status === 'AGUARDANDO_ENFERMAGEM') statsData.awaitingEvaluation++;
          if (status === 'ENCAMINHADO_MEDICO') statsData.referredToDoctor++;
          if (status === 'AVALIADO_ENFERMAGEM') statsData.evaluatedByNurse++;
          if (status === 'AVALIADO_MEDICO') statsData.evaluatedByDoctor++;
          if (checklist.riskLevel === 'critical') statsData.critical++;

          const checklistDate = new Date(checklist.checklistDate || 0);
          checklistDate.setHours(0, 0, 0, 0);
          if (checklistDate.getTime() === today.getTime()) statsData.totalChecklistsToday++;
        });
      });

      setAllPatients(patientsList);
      setStats(statsData);
    } catch (error) {
      logger.error('NursingDashboard', 'loadData', 'Error loading data', error);
      setError('Erro ao carregar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('professionalId');
    localStorage.removeItem('professionalProfile');
    navigate('/professional-login');
  };

  const handleCardClick = (newFilterType: FilterType) => {
    setFilterType(newFilterType);
    setActiveTab('dashboard');
  };

  const handleNotificationClick = (notificationId: string, checklistId?: string) => {
    setShowNotifications(false);
    if (checklistId) {
      navigate(`/nursing-evaluation/${checklistId}`);
    }
  };

  const filteredPatients = useMemo(() => {
    let result = allPatients;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.patient.fullName?.toLowerCase().includes(query) ||
        item.patient.cpf?.includes(query) ||
        item.patient.susNumber?.includes(query)
      );
    }

    if (filterType === 'TODOS') {
      return result;
    } else if (filterType === 'URGENTE') {
      return result.filter(item => item.isPriority);
    } else if (filterType === 'ULTIMOS_7_DIAS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return result.filter(item => {
        const checklistDate = new Date(item.latestChecklist?.checklistDate || 0);
        return checklistDate >= sevenDaysAgo;
      });
    } else if (filterType === 'ULTIMOS_30_DIAS') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return result.filter(item => {
        const checklistDate = new Date(item.latestChecklist?.checklistDate || 0);
        return checklistDate >= thirtyDaysAgo;
      });
    } else if (filterType === 'REFERIDO_MEDICO') {
      return result.filter(item => item.status === 'ENCAMINHADO_MEDICO');
    } else if (filterType === 'AVALIADO_MEDICO_COMPLETO') {
      return result.filter(item => item.status === 'AVALIADO_MEDICO');
    } else {
      return result.filter(item => item.status === filterType);
    }
  }, [allPatients, filterType, searchQuery]);

  const priorityPatients = useMemo(() => {
    // CRITICAL FIX: Only show patients AWAITING NURSING EVALUATION with priority indicators
    // Once evaluated or referred, they should NOT appear in the priority list
    return allPatients
      .filter(item => item.status === 'AGUARDANDO_ENFERMAGEM' && item.isPriority)
      .sort((a, b) => {
        const aPriority = a.latestChecklist?.riskLevel === 'critical' ? 0 : 1;
        const bPriority = b.latestChecklist?.riskLevel === 'critical' ? 0 : 1;
        return aPriority - bPriority;
      });
  }, [allPatients]);

  const awaitingPatients = useMemo(() => {
    return allPatients.filter(item => item.status === 'AGUARDANDO_ENFERMAGEM');
  }, [allPatients]);

  const evaluatedByNursePatients = useMemo(() => {
    return allPatients.filter(item => item.status === 'AVALIADO_ENFERMAGEM');
  }, [allPatients]);

  const colorMap = {
    primary: { bg: 'bg-primary/10', text: 'text-primary', icon: 'text-primary', bgIcon: 'bg-primary' },
    attention: { bg: 'bg-attention/10', text: 'text-attention-foreground', icon: 'text-attention-foreground', bgIcon: 'bg-attention' },
    'attention-foreground': { bg: 'bg-attention/10', text: 'text-attention-foreground', icon: 'text-attention-foreground', bgIcon: 'bg-attention' },
    stable: { bg: 'bg-stable/10', text: 'text-stable', icon: 'text-stable', bgIcon: 'bg-stable' },
  };

  const getStatusBadge = (status: EvaluationStatus) => {
    switch (status) {
      case 'AVALIADO_ENFERMAGEM':
        return { bg: 'bg-stable/10', text: 'text-stable', label: '✓ Avaliado Enfermagem', icon: '🟢' };
      case 'ENCAMINHADO_MEDICO':
        return { bg: 'bg-attention/10', text: 'text-attention-foreground', label: '🟡 Encaminhado Médico', icon: '🟡' };
      case 'AVALIADO_MEDICO':
        return { bg: 'bg-stable/10', text: 'text-stable', label: '✓ Avaliado Médico', icon: '🟢' };
      default:
        return { bg: 'bg-background', text: 'text-foreground', label: 'Pendente', icon: '⚪' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-secondary/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
            <h2 className="font-heading text-xl font-bold text-foreground">Erro</h2>
          </div>
          <p className="font-paragraph text-base text-foreground/70 mb-6">{error}</p>
          <Button
            onClick={() => {
              setError('');
              loadData();
            }}
            className="w-full bg-primary text-primary-foreground hover:opacity-90"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-secondary/30 sticky top-0 z-40">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">AcompanhaMed</h1>
                <p className="font-paragraph text-sm text-foreground/60">Dashboard Profissional de Enfermagem</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <NotificationPanel
                professionalId={professional?._id || null}
                recipientType="Enfermeiro"
                onNotificationClick={handleNotificationClick}
              />

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 hover:bg-background rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-primary/20 flex-shrink-0">
                    {professional?.profilePhoto ? (
                      <Image src={professional.profilePhoto} alt={professional.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <span className="font-paragraph text-sm font-semibold text-foreground hidden sm:inline">
                    {professional?.fullName?.split(' ')[0]}
                  </span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-secondary/20 shadow-lg z-50">
                    <Link
                      to="/nursing-profile"
                      className="block px-4 py-3 font-paragraph text-sm text-foreground hover:bg-background rounded-t-lg transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Meu Perfil
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 font-paragraph text-sm text-destructive hover:bg-background rounded-b-lg transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Horizontal Scrollable */}
          <div className="overflow-x-auto -mx-8 px-8 pb-2">
            <div className="flex gap-3 min-w-min">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'prioritarios', label: 'Prioritários', icon: AlertCircle },
                { id: 'aguardando', label: 'Aguardando Avaliação', icon: Clock },
                { id: 'encaminhados', label: 'Encaminhados ao Médico', icon: Stethoscope },
                { id: 'avaliados-enfermagem', label: 'Avaliados pela Enfermagem', icon: AlertCircle },
                { id: 'avaliados-medico', label: 'Avaliados pelo Médico', icon: AlertCircle },
                { id: 'historico', label: 'Histórico', icon: FileText },
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-paragraph text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 border ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-white border-secondary/20 text-foreground hover:border-primary/50 hover:bg-background'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden text-xs">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[120rem] mx-auto px-8 py-12">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[
                { label: 'Prioritários', value: allPatients.filter(p => p.isPriority && p.status === 'AGUARDANDO_ENFERMAGEM').length, icon: AlertTriangle, colorKey: 'attention', filterId: 'URGENTE' as FilterType },
                { label: 'Encaminhados ao Médico', value: stats.referredToDoctor, icon: Stethoscope, colorKey: 'attention', filterId: 'ENCAMINHADO_MEDICO' as FilterType },
                { label: 'Avaliados pela Enfermagem', value: stats.evaluatedByNurse, icon: AlertCircle, colorKey: 'stable', filterId: 'AVALIADO_ENFERMAGEM' as FilterType },
                { label: 'Avaliados pelo Médico', value: stats.evaluatedByDoctor, icon: AlertCircle, colorKey: 'primary', filterId: 'AVALIADO_MEDICO_COMPLETO' as FilterType },
              ].map((stat, index) => {
                const Icon = stat.icon;
                const colors = colorMap[stat.colorKey as keyof typeof colorMap];
                return (
                  <motion.button
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleCardClick(stat.filterId)}
                    whileHover={{ y: -4 }}
                    className={`${colors.bg} rounded-2xl p-6 border border-secondary/20 hover:shadow-lg transition-all cursor-pointer text-left`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 ${colors.bgIcon} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">{stat.value}</span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">{stat.label}</p>
                  </motion.button>
                );
              })}
            </div>

            <div className="mb-8">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome, CPF ou SUS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-secondary/20 rounded-lg font-paragraph text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'TODOS', label: 'Todos' },
                  { value: 'AGUARDANDO_ENFERMAGEM', label: 'Aguardando Avaliação' },
                  { value: 'AVALIADO_ENFERMAGEM', label: 'Avaliado Enfermagem' },
                  { value: 'ENCAMINHADO_MEDICO', label: 'Encaminhado Médico' },
                  { value: 'AVALIADO_MEDICO', label: 'Avaliado Médico' },
                  { value: 'URGENTE', label: 'Urgente' },
                  { value: 'ULTIMOS_7_DIAS', label: 'Últimos 7 dias' },
                  { value: 'ULTIMOS_30_DIAS', label: 'Últimos 30 dias' },
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterType(filter.value as FilterType)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-paragraph text-sm font-semibold transition-all ${
                      filterType === filter.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white border border-secondary/20 text-foreground hover:border-primary/50'
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-secondary/20">
                <Users className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Nenhum paciente encontrado</h2>
                <p className="font-paragraph text-lg text-foreground/70">
                  {searchQuery ? 'Tente ajustar sua pesquisa' : 'Nenhum paciente com este filtro'}
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-secondary/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background">
                      <tr>
                        <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">Paciente</th>
                        <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">CPF / SUS</th>
                        <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">Cirurgia</th>
                        <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">Dor / Temp</th>
                        <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">Status</th>
                        <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((item) => {
                        const badge = getStatusBadge(item.status);
                        return (
                          <tr key={`${item.patient._id}-${item.status}`} className="border-t border-secondary/20 hover:bg-background/50 transition-colors">
                            <td className="px-6 py-4 font-paragraph text-sm font-semibold text-foreground">
                              {item.isPriority && <span className="text-critical mr-2">⚠️</span>}
                              {item.patient.fullName}
                            </td>
                            <td className="px-6 py-4 font-paragraph text-sm text-foreground/70">
                              {item.patient.cpf || item.patient.susNumber || '-'}
                            </td>
                            <td className="px-6 py-4 font-paragraph text-sm text-foreground">{item.patient.surgeryType}</td>
                            <td className="px-6 py-4 font-paragraph text-sm text-foreground">
                              {item.latestChecklist?.painLevel}/10 | {item.latestChecklist?.bodyTemperature}°C
                            </td>
                            <td className="px-6 py-4">
                              <span className={`${badge.bg} ${badge.text} text-xs font-semibold px-3 py-1 rounded-full`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Link
                                to={`/nursing-evaluation/${item.patient._id}`}
                                className="text-primary font-paragraph text-sm font-semibold hover:underline"
                              >
                                Ver →
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Priority Patients Tab */}
        {activeTab === 'prioritarios' && (
          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-8">Pacientes Prioritários</h2>
            {priorityPatients.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-secondary/20">
                <CheckCircle className="w-16 h-16 text-stable mx-auto mb-4" />
                <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Nenhum paciente prioritário</h3>
                <p className="font-paragraph text-lg text-foreground/70">Todos os pacientes estão estáveis</p>
              </div>
            ) : (
              <div className="space-y-4">
                {priorityPatients.map((item, index) => (
                  <motion.div
                    key={item.patient._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/nursing-evaluation/${item.patient._id}`}
                      className={`block rounded-2xl p-6 border-2 transition-colors ${
                        item.latestChecklist?.riskLevel === 'critical'
                          ? 'bg-critical/10 border-critical hover:bg-critical/20'
                          : 'bg-attention/10 border-attention hover:bg-attention/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="font-heading text-xl font-bold text-foreground">{item.patient.fullName}</span>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              item.latestChecklist?.riskLevel === 'critical'
                                ? 'bg-critical text-critical-foreground'
                                : 'bg-attention/20 text-attention-foreground'
                            }`}>
                              {item.priorityReason}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="font-paragraph text-xs text-foreground/60 mb-1">Dor</p>
                              <p className="font-paragraph text-sm font-semibold text-foreground">{item.latestChecklist?.painLevel}/10</p>
                            </div>
                            <div>
                              <p className="font-paragraph text-xs text-foreground/60 mb-1">Temperatura</p>
                              <p className="font-paragraph text-sm font-semibold text-foreground">{item.latestChecklist?.bodyTemperature}°C</p>
                            </div>
                            <div>
                              <p className="font-paragraph text-xs text-foreground/60 mb-1">Cirurgia</p>
                              <p className="font-paragraph text-sm font-semibold text-foreground">{item.patient.surgeryType}</p>
                            </div>
                            <div>
                              <p className="font-paragraph text-xs text-foreground/60 mb-1">Status</p>
                              <p className="font-paragraph text-sm font-semibold text-foreground">{item.status}</p>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-foreground flex-shrink-0 ml-4" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Aguardando Avaliação Tab */}
        {activeTab === 'aguardando' && (
          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-8">Aguardando Avaliação</h2>
            {awaitingPatients.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-secondary/20">
                <CheckCircle className="w-16 h-16 text-stable mx-auto mb-4" />
                <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Nenhum paciente aguardando</h3>
                <p className="font-paragraph text-lg text-foreground/70">Todos os pacientes foram avaliados</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-secondary/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-background">
                      <tr>
                        <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">Paciente</th>
                        <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">CPF / SUS</th>
                        <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">Cirurgia</th>
                        <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">Dor / Temp</th>
                        <th className="px-6 py-4 text-left font-paragraph text-sm font-semibold text-foreground">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {awaitingPatients.map((item) => (
                        <tr key={`${item.patient._id}-awaiting`} className="border-t border-secondary/20 hover:bg-background/50 transition-colors">
                          <td className="px-6 py-4 font-paragraph text-sm font-semibold text-foreground">
                            {item.isPriority && <span className="text-critical mr-2">⚠️</span>}
                            {item.patient.fullName}
                          </td>
                          <td className="px-6 py-4 font-paragraph text-sm text-foreground/70">
                            {item.patient.cpf || item.patient.susNumber || '-'}
                          </td>
                          <td className="px-6 py-4 font-paragraph text-sm text-foreground">{item.patient.surgeryType}</td>
                          <td className="px-6 py-4 font-paragraph text-sm text-foreground">
                            {item.latestChecklist?.painLevel}/10 | {item.latestChecklist?.bodyTemperature}°C
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              to={`/nursing-evaluation/${item.patient._id}`}
                              className="text-primary font-paragraph text-sm font-semibold hover:underline"
                            >
                              Avaliar →
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Encaminhados Tab */}
        {activeTab === 'encaminhados' && (() => {
          const hospitalReferrals = allPatients
            .filter(p => p.status === 'ENCAMINHADO_MEDICO')
            .map(p => ({
              patient: p.patient,
              checklist: p.latestChecklist,
              doctorName: p.doctorName,
              referralDate: p.referralDate,
            }));

          return (
            <div>
              <h2 className="font-heading text-3xl font-bold text-foreground mb-8">Pacientes Encaminhados ao Médico</h2>
              {hospitalReferrals.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-secondary/20">
                  <CheckCircle className="w-16 h-16 text-stable mx-auto mb-4" />
                  <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Nenhum encaminhamento pendente</h3>
                  <p className="font-paragraph text-lg text-foreground/70">Todos os encaminhamentos foram processados</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hospitalReferrals.map((item, index) => (
                    <motion.div
                      key={`${item.patient._id}-referral`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl p-6 border border-secondary/20 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-heading text-lg font-bold text-foreground mb-2">{item.patient.fullName}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="font-paragraph text-xs text-foreground/60 mb-1">CPF</p>
                              <p className="font-paragraph text-sm font-semibold text-foreground">{item.patient.cpf || '-'}</p>
                            </div>
                            <div>
                              <p className="font-paragraph text-xs text-foreground/60 mb-1">Médico</p>
                              <p className="font-paragraph text-sm font-semibold text-foreground">{item.doctorName || '-'}</p>
                            </div>
                            <div>
                              <p className="font-paragraph text-xs text-foreground/60 mb-1">Data Encaminhamento</p>
                              <p className="font-paragraph text-sm font-semibold text-foreground">
                                {item.referralDate ? new Date(item.referralDate).toLocaleDateString('pt-BR') : '-'}
                              </p>
                            </div>
                            <div>
                              <p className="font-paragraph text-xs text-foreground/60 mb-1">Status</p>
                              <span className="inline-block bg-attention/10 text-attention-foreground text-xs font-semibold px-3 py-1 rounded-full">
                                Aguardando Médico
                              </span>
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/nursing-referral-view/${item.checklist?._id}`}
                          className="ml-4 flex-shrink-0"
                        >
                          <Button className="bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Ver
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Avaliados pela Enfermagem Tab */}
        {activeTab === 'avaliados-enfermagem' && (
          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-8">Avaliados pela Enfermagem</h2>
            {evaluatedByNursePatients.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-secondary/20">
                <Image
                  src="https://static.wixstatic.com/media/2621fb_e8cec05bf0f24238b9bff19dd42a14a0~mv2.png?originWidth=384&originHeight=256"
                  alt="Avaliados pela Enfermagem"
                  className="w-32 h-32 mx-auto mb-4 object-cover rounded-lg"
                  width={128}
                  height={128}
                />
                <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Nenhum paciente avaliado</h3>
                <p className="font-paragraph text-lg text-foreground/70">Nenhum paciente foi avaliado pela enfermagem ainda</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evaluatedByNursePatients.map((item, index) => (
                  <motion.div
                    key={`${item.patient._id}-nurse-eval`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-6 border border-secondary/20 hover:shadow-lg transition-all"
                  >
                    <div className="flex gap-6 mb-4">
                      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-stable/10">
                        <Image
                          src="https://static.wixstatic.com/media/2621fb_e8cec05bf0f24238b9bff19dd42a14a0~mv2.png?originWidth=384&originHeight=256"
                          alt="Avaliação de Enfermagem"
                          className="w-full h-full object-cover"
                          width={96}
                          height={96}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Paciente</p>
                          <p className="font-paragraph text-sm font-semibold text-foreground">{item.patient.fullName}</p>
                        </div>
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">CPF / SUS</p>
                          <p className="font-paragraph text-sm font-semibold text-foreground">{item.patient.cpf || item.patient.susNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Enfermeiro</p>
                          <p className="font-paragraph text-sm font-semibold text-foreground">{item.nurseName || '-'}</p>
                        </div>
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Status</p>
                          <span className="bg-stable/10 text-stable text-xs font-semibold px-3 py-1 rounded-full inline-block">
                            ✓ Avaliado
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Avaliados pelo Médico Tab */}
        {activeTab === 'avaliados-medico' && (() => {
          const evaluatedByDoctor = allPatients.filter(p => p.status === 'AVALIADO_MEDICO');

          return (
            <div>
              <h2 className="font-heading text-3xl font-bold text-foreground mb-8">Pacientes Avaliados pelo Médico</h2>
              {evaluatedByDoctor.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-secondary/20">
                  <Image
                    src="https://static.wixstatic.com/media/2621fb_5c338de50c8d4798b7398046ecbbb92c~mv2.png?originWidth=384&originHeight=256"
                    alt="Avaliados pelo Médico"
                    className="w-32 h-32 mx-auto mb-4 object-cover rounded-lg"
                    width={128}
                    height={128}
                  />
                  <h3 className="font-heading text-2xl font-bold text-foreground mb-2">Nenhum paciente avaliado</h3>
                  <p className="font-paragraph text-lg text-foreground/70">Nenhum paciente foi avaliado pelo médico ainda</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluatedByDoctor.map((item, index) => (
                    <motion.div
                      key={`${item.patient._id}-evaluated`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl p-6 border border-secondary/20 hover:shadow-lg transition-all"
                    >
                      <div className="flex gap-6 mb-4">
                        <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-stable/10">
                          <Image
                            src="https://static.wixstatic.com/media/2621fb_5c338de50c8d4798b7398046ecbbb92c~mv2.png?originWidth=384&originHeight=256"
                            alt="Avaliação Médica"
                            className="w-full h-full object-cover"
                            width={96}
                            height={96}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Paciente</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground">{item.patient.fullName}</p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">CPF / SUS</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground">{item.patient.cpf || item.patient.susNumber || '-'}</p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Médico</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground">{item.doctorName || '-'}</p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Status</p>
                            <span className="bg-stable/10 text-stable text-xs font-semibold px-3 py-1 rounded-full inline-block">
                              ✓ Avaliado Médico
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Histórico Tab */}
        {activeTab === 'historico' && (
          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-8">Histórico de Avaliações</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link to="/nursing-evaluation-history">
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl overflow-hidden border border-secondary/20 hover:shadow-lg transition-all text-left w-full h-full flex flex-col"
                >
                  <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden">
                    <Image
                      src="https://static.wixstatic.com/media/2621fb_2c1e7369618c4464b97faf4fab8c8180~mv2.png?originWidth=384&originHeight=128"
                      alt="Histórico de Avaliações"
                      className="w-full h-full object-cover"
                      width={400}
                      height={128}
                    />
                  </div>
                  <div className="p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                          <FileText className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <ArrowRight className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-heading text-lg font-bold text-foreground mb-2">Histórico de Avaliações</h3>
                      <p className="font-paragraph text-sm text-foreground/70">Visualize todas as avaliações realizadas</p>
                    </div>
                  </div>
                </motion.button>
              </Link>


            </div>
          </div>
        )}
      </div>
    </div>
  );
}
