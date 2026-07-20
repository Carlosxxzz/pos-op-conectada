import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, Users, AlertCircle, CheckCircle, Clock, ArrowRight, LogOut, Filter, Eye,
  Bell, Search, TrendingUp, Calendar, BarChart3, User, FileText, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type {
  ChecklistsDirios, Pacientes, Profissionais, AvaliaesdeEnfermagem,
  EncaminhamentosMdicos, AvaliaesMdicas
} from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';
import { logger } from '@/lib/logger';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';

type EvaluationStatus = 'AGUARDANDO_ENFERMAGEM' | 'AVALIADO_ENFERMAGEM' | 'ENCAMINHADO_MEDICO' | 'AVALIADO_MEDICO' | 'CONCLUIDO';
type FilterType = 'TODOS' | 'AGUARDANDO_ENFERMAGEM' | 'AVALIADO_ENFERMAGEM' | 'ENCAMINHADO_MEDICO' | 'AVALIADO_MEDICO' | 'URGENTE' | 'ULTIMOS_7_DIAS' | 'ULTIMOS_30_DIAS';

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
  const [filterType, setFilterType] = useState<FilterType>('TODOS');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prioritarios' | 'agenda' | 'historico' | 'perfil'>('dashboard');
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
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
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

      // Load all data
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

      // Build patient evaluation data
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
            if (medicalEval) {
              status = 'AVALIADO_MEDICO';
              doctorName = medicalEval.doctorName;
              evaluationDate = medicalEval.evaluationDate;
            } else {
              status = 'ENCAMINHADO_MEDICO';
              nurseName = referral.nurseName;
              doctorName = referral.doctorName;
              referralDate = referral.referralDate;
            }
          }

          // Determine priority
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

          // Update stats
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

  // Filter and search logic
  const filteredPatients = useMemo(() => {
    let result = allPatients;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.patient.fullName?.toLowerCase().includes(query) ||
        item.patient.cpf?.includes(query) ||
        item.patient.susNumber?.includes(query)
      );
    }

    // Apply status filter
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
    } else {
      return result.filter(item => item.status === filterType);
    }
  }, [allPatients, filterType, searchQuery]);

  // Priority patients
  const priorityPatients = useMemo(() => {
    return allPatients.filter(item => item.isPriority).sort((a, b) => {
      const aPriority = a.latestChecklist?.riskLevel === 'critical' ? 0 : 1;
      const bPriority = b.latestChecklist?.riskLevel === 'critical' ? 0 : 1;
      return aPriority - bPriority;
    });
  }, [allPatients]);

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
      {/* Header */}
      <header className="bg-white border-b border-secondary/30 sticky top-0 z-40">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Dashboard Profissional de Enfermagem</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-background rounded-lg transition-colors">
                <Bell className="w-6 h-6 text-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-critical rounded-full"></span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-6 py-2 bg-destructive text-destructive-foreground font-paragraph font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'prioritarios', label: 'Prioritários', icon: AlertCircle },
              { id: 'agenda', label: 'Agenda', icon: Calendar },
              { id: 'historico', label: 'Histórico', icon: FileText },
              { id: 'perfil', label: 'Meu Perfil', icon: User },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-paragraph text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white border border-secondary/20 text-foreground hover:border-primary/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { label: 'Aguardando Avaliação', value: stats.awaitingEvaluation, icon: Clock, color: 'primary', bg: 'bg-primary/10' },
                { label: 'Encaminhados ao Médico', value: stats.referredToDoctor, icon: ArrowRight, color: 'attention-foreground', bg: 'bg-attention/10' },
                { label: 'Avaliados Enfermagem', value: stats.evaluatedByNurse, icon: CheckCircle, color: 'stable', bg: 'bg-stable/10' },
                { label: 'Avaliados Médico', value: stats.evaluatedByDoctor, icon: CheckCircle, color: 'stable', bg: 'bg-stable/10' },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${stat.bg} rounded-2xl p-6 border border-secondary/20`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-${stat.color} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 text-${stat.color === 'attention-foreground' ? 'attention-foreground' : stat.color}`} />
                      </div>
                      <span className="font-heading text-3xl font-bold text-foreground">{stat.value}</span>
                    </div>
                    <p className="font-paragraph text-sm text-foreground/70">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Critical Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-critical/10 rounded-2xl p-6 border border-critical/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-critical rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-critical-foreground" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-critical">{stats.critical}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Pacientes Críticos</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-primary/10 rounded-2xl p-6 border border-primary/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-primary">{stats.totalChecklistsToday}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Checklists Hoje</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-stable/10 rounded-2xl p-6 border border-stable/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-stable rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-stable-foreground" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-stable">{stats.inFollowUp}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Em Acompanhamento</p>
              </motion.div>
            </div>

            {/* Search and Filter */}
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

              {/* Filters */}
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

            {/* Patients List */}
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

        {/* Agenda Tab */}
        {activeTab === 'agenda' && (
          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-8">Agenda Diária</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Devem responder hoje', count: stats.totalChecklistsToday, icon: Clock, color: 'primary' },
                { title: 'Aguardando avaliação', count: stats.awaitingEvaluation, icon: Users, color: 'attention-foreground' },
                { title: 'Encaminhados ao médico', count: stats.referredToDoctor, icon: ArrowRight, color: 'attention-foreground' },
                { title: 'Aguardando resposta médica', count: stats.referredToDoctor, icon: Clock, color: 'primary' },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-${item.color}/10 rounded-2xl p-6 border border-${item.color}/20`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-paragraph text-sm text-foreground/70 mb-2">{item.title}</p>
                      <p className="font-heading text-4xl font-bold text-foreground">{item.count}</p>
                    </div>
                    <item.icon className={`w-12 h-12 text-${item.color}`} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico Tab */}
        {activeTab === 'historico' && (
          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-8">Histórico de Atividades</h2>
            <div className="bg-white rounded-2xl border border-secondary/20 p-8">
              <p className="font-paragraph text-foreground/70 text-center">Histórico de atividades será exibido aqui</p>
            </div>
          </div>
        )}

        {/* Perfil Tab */}
        {activeTab === 'perfil' && professional && (
          <div>
            <h2 className="font-heading text-3xl font-bold text-foreground mb-8">Meu Perfil Profissional</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-8 border border-secondary/20 md:col-span-1"
              >
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <h3 className="font-heading text-2xl font-bold text-foreground text-center mb-2">{professional.fullName}</h3>
                <p className="font-paragraph text-sm text-foreground/70 text-center mb-6">{professional.profile}</p>
                <div className="space-y-4 border-t border-secondary/20 pt-6">
                  <div>
                    <p className="font-paragraph text-xs text-foreground/60 mb-1">Hospital</p>
                    <p className="font-paragraph text-sm font-semibold text-foreground">{professional.hospital}</p>
                  </div>
                  <div>
                    <p className="font-paragraph text-xs text-foreground/60 mb-1">Email</p>
                    <p className="font-paragraph text-sm font-semibold text-foreground">{professional.email}</p>
                  </div>
                  <div>
                    <p className="font-paragraph text-xs text-foreground/60 mb-1">Especialidade</p>
                    <p className="font-paragraph text-sm font-semibold text-foreground">{professional.specialty || '-'}</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl p-8 border border-secondary/20 md:col-span-2"
              >
                <h4 className="font-heading text-xl font-bold text-foreground mb-6">Estatísticas de Desempenho</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="font-paragraph text-sm text-foreground/70 mb-2">Pacientes Acompanhados</p>
                    <p className="font-heading text-3xl font-bold text-primary">{allPatients.length}</p>
                  </div>
                  <div>
                    <p className="font-paragraph text-sm text-foreground/70 mb-2">Avaliações Realizadas</p>
                    <p className="font-heading text-3xl font-bold text-stable">{stats.evaluatedByNurse}</p>
                  </div>
                  <div>
                    <p className="font-paragraph text-sm text-foreground/70 mb-2">Encaminhamentos Feitos</p>
                    <p className="font-heading text-3xl font-bold text-attention-foreground">{stats.referredToDoctor}</p>
                  </div>
                  <div>
                    <p className="font-paragraph text-sm text-foreground/70 mb-2">Pacientes Críticos</p>
                    <p className="font-heading text-3xl font-bold text-critical">{stats.critical}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
