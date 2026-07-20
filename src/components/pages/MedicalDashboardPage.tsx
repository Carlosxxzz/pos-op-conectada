import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Stethoscope, AlertCircle, ArrowRight, LogOut, Search, Filter, Bell, User, Clock, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BaseCrudService } from '@/integrations';
import type { ChecklistsDirios, Pacientes, Profissionais, AvaliaesMdicas } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';

interface ReferredCase {
  checklist: ChecklistsDirios;
  patient: Pacientes | null;
  referral: any;
}

interface DashboardStats {
  pendingCount: number;
  evaluatedTodayCount: number;
  evaluatedWeekCount: number;
  totalPatientsCount: number;
  lastEvaluatedPatient: Pacientes | null;
}

export default function MedicalDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [referredCases, setReferredCases] = useState<ReferredCase[]>([]);
  const [evaluatedCases, setEvaluatedCases] = useState<any[]>([]);
  const [professional, setProfessional] = useState<Profissionais | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    pendingCount: 0,
    evaluatedTodayCount: 0,
    evaluatedWeekCount: 0,
    totalPatientsCount: 0,
    lastEvaluatedPatient: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'evaluated'>('all');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
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

      // Get all data
      const { items: allChecklists } = await BaseCrudService.getAll<any>('checklistsdiarios');
      const { items: allPatients } = await BaseCrudService.getAll<Pacientes>('pacientes');
      const { items: allReferrals } = await BaseCrudService.getAll<any>('encaminhamentosmedicos');
      const { items: allEvaluations } = await BaseCrudService.getAll<AvaliaesMdicas>('avaliacoesmedicas');

      // Filter pending referrals for this doctor
      const referralsForThisDoctor = allReferrals.filter((referral: any) => 
        referral.doctorId === professionalId && referral.status === 'Encaminhado ao Médico'
      );

      const referred = referralsForThisDoctor.map((referral: any) => {
        const checklist = allChecklists.find(c => c._id === referral.checklistId);
        const patient = allPatients.find(p => p._id === referral.patientId) || null;
        return { checklist, patient, referral };
      }).filter(item => item.checklist && item.patient)
        .sort((a, b) => {
          const dateA = new Date(a.referral.referralDate || 0).getTime();
          const dateB = new Date(b.referral.referralDate || 0).getTime();
          return dateB - dateA;
        });

      // Get evaluated cases (completed evaluations by this doctor)
      const evaluatedByThisDoctor = allEvaluations.filter(e => e.doctorName === professionalData?.fullName);
      const evaluated = evaluatedByThisDoctor.map(evaluation => {
        const patient = allPatients.find(p => p._id === evaluation.patientId);
        return { evaluation, patient };
      }).sort((a, b) => {
        const dateA = new Date(a.evaluation.evaluationDate || 0).getTime();
        const dateB = new Date(b.evaluation.evaluationDate || 0).getTime();
        return dateB - dateA;
      });

      setReferredCases(referred as any);
      setEvaluatedCases(evaluated);

      // Calculate statistics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const evaluatedToday = evaluatedByThisDoctor.filter(e => {
        const evalDate = new Date(e.evaluationDate || '');
        evalDate.setHours(0, 0, 0, 0);
        return evalDate.getTime() === today.getTime();
      }).length;

      const evaluatedThisWeek = evaluatedByThisDoctor.filter(e => {
        const evalDate = new Date(e.evaluationDate || '');
        return evalDate >= weekAgo;
      }).length;

      const uniquePatients = new Set(allReferrals
        .filter((r: any) => r.doctorId === professionalId)
        .map((r: any) => r.patientId)
      ).size;

      const lastEval = evaluated[0];

      setStats({
        pendingCount: referred.length,
        evaluatedTodayCount: evaluatedToday,
        evaluatedWeekCount: evaluatedThisWeek,
        totalPatientsCount: uniquePatients,
        lastEvaluatedPatient: lastEval?.patient || null,
      });
    } catch (error) {
      console.error('[MEDICAL] Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('professionalId');
    localStorage.removeItem('professionalProfile');
    navigate('/professional-login');
  };

  const filteredCases = referredCases.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      item.patient?.fullName?.toLowerCase().includes(searchLower) ||
      item.patient?.cpf?.includes(searchTerm) ||
      item.patient?.susNumber?.includes(searchTerm);
    
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'pending' && item.referral.status === 'Encaminhado ao Médico');
    
    return matchesSearch && matchesFilter;
  });

  const filteredEvaluated = evaluatedCases.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return !searchTerm || 
      item.patient?.fullName?.toLowerCase().includes(searchLower) ||
      item.patient?.cpf?.includes(searchTerm) ||
      item.patient?.susNumber?.includes(searchTerm);
  });

  const handleEvaluatedCaseClick = (patientId: string) => {
    navigate(`/medical-evaluation-history/${patientId}`);
  };

  const calculateTimeSinceReferral = (referralDate: string | Date) => {
    const now = new Date();
    const refDate = new Date(referralDate);
    const diffMs = now.getTime() - refDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d atrás`;
    if (diffHours > 0) return `${diffHours}h atrás`;
    return 'Agora';
  };

  const getPriority = (checklist: ChecklistsDirios) => {
    if (checklist.riskLevel === 'critical') return { label: 'Urgente', color: 'bg-critical text-critical-foreground' };
    if (checklist.riskLevel === 'attention') return { label: 'Atenção', color: 'bg-attention text-attention-foreground' };
    return { label: 'Normal', color: 'bg-stable text-stable' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const criticalCases = filteredCases.filter(c => c.checklist.riskLevel === 'critical');
  const attentionCases = filteredCases.filter(c => c.checklist.riskLevel === 'attention');
  const normalCases = filteredCases.filter(c => c.checklist.riskLevel !== 'critical' && c.checklist.riskLevel !== 'attention');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-secondary/30 sticky top-0 z-50">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Dashboard Médico</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-6">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-background rounded-lg transition-colors">
                <Bell className="w-6 h-6 text-foreground" />
                {stats.pendingCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-critical text-critical-foreground text-xs font-bold rounded-full flex items-center justify-center">
                    {stats.pendingCount}
                  </span>
                )}
              </button>

              {/* Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 hover:bg-background rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-paragraph text-sm font-semibold text-foreground hidden sm:inline">
                    {professional?.fullName?.split(' ')[0]}
                  </span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg border border-secondary/20 shadow-lg z-50">
                    <Link
                      to="/medical-profile"
                      className="block px-4 py-3 font-paragraph text-sm text-foreground hover:bg-background rounded-t-lg transition-colors"
                    >
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
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        {/* Dashboard Stats - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-secondary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-critical/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-critical" />
              </div>
              <span className="font-heading text-3xl font-bold text-critical">{stats.pendingCount}</span>
            </div>
            <p className="font-paragraph text-sm text-foreground/70">Aguardando Avaliação</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-secondary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <span className="font-heading text-3xl font-bold text-primary">{stats.evaluatedTodayCount}</span>
            </div>
            <p className="font-paragraph text-sm text-foreground/70">Avaliados Hoje</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-secondary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-stable/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-stable" />
              </div>
              <span className="font-heading text-3xl font-bold text-stable">{stats.evaluatedWeekCount}</span>
            </div>
            <p className="font-paragraph text-sm text-foreground/70">Avaliados na Semana</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-secondary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <span className="font-heading text-3xl font-bold text-foreground">{stats.totalPatientsCount}</span>
            </div>
            <p className="font-paragraph text-sm text-foreground/70">Total de Pacientes</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-6 border border-secondary/20"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-attention/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-attention-foreground" />
              </div>
            </div>
            <p className="font-paragraph text-xs text-foreground/60 mb-1">Último Avaliado</p>
            <p className="font-paragraph text-sm font-semibold text-foreground truncate">
              {stats.lastEvaluatedPatient?.fullName || '-'}
            </p>
          </motion.div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-6 border border-secondary/20 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <Input
                type="text"
                placeholder="Pesquisar por nome, CPF ou SUS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 font-paragraph"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-paragraph text-sm font-semibold transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground border border-secondary/20 hover:bg-secondary/10'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-4 py-2 rounded-lg font-paragraph text-sm font-semibold transition-colors ${
                  filterStatus === 'pending'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-foreground border border-secondary/20 hover:bg-secondary/10'
                }`}
              >
                Pendentes
              </button>
            </div>
          </div>
        </div>

        {/* Pending Cases by Priority */}
        {filterStatus === 'all' || filterStatus === 'pending' ? (
          <>
            {/* Critical Cases */}
            {criticalCases.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className="w-6 h-6 text-critical" />
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Casos Urgentes ({criticalCases.length})
                  </h2>
                </div>
                <div className="space-y-4">
                  {criticalCases.map((item, index) => (
                    <motion.div
                      key={item.checklist._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={`/medical-evaluation/${item.patient?._id}`}
                        className="block bg-critical/10 border-2 border-critical rounded-2xl p-6 hover:bg-critical/20 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-heading text-lg font-bold text-foreground">{item.patient?.fullName}</h3>
                            <p className="font-paragraph text-sm text-foreground/60 mt-1">
                              CPF: {item.patient?.cpf} | SUS: {item.patient?.susNumber}
                            </p>
                          </div>
                          <span className="bg-critical text-critical-foreground text-xs font-semibold px-3 py-1 rounded-full">
                            URGENTE
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1">Hospital</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground">{item.patient?.hospital}</p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1">Encaminhado</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground">
                              {calculateTimeSinceReferral(item.referral.referralDate)}
                            </p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1">Enfermeiro(a)</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground">
                              {item.referral.nurseName}
                            </p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1">Motivo</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground truncate">
                              {item.referral.nurseMessage?.substring(0, 20)}...
                            </p>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Attention Cases */}
            {attentionCases.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-6 h-6 text-attention-foreground" />
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Casos em Atenção ({attentionCases.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {attentionCases.map((item, index) => (
                    <motion.div
                      key={item.checklist._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={`/medical-evaluation/${item.patient?._id}`}
                        className="block bg-white border border-attention/30 rounded-2xl p-6 hover:bg-attention/5 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-heading text-lg font-bold text-foreground">{item.patient?.fullName}</h3>
                            <p className="font-paragraph text-sm text-foreground/60 mt-1">
                              CPF: {item.patient?.cpf}
                            </p>
                          </div>
                          <span className="bg-attention/20 text-attention-foreground text-xs font-semibold px-3 py-1 rounded-full">
                            ATENÇÃO
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Hospital:</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">{item.patient?.hospital}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Encaminhado:</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">
                              {calculateTimeSinceReferral(item.referral.referralDate)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Enfermeiro(a):</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">{item.referral.nurseName}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Normal Cases */}
            {normalCases.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <CheckCircle className="w-6 h-6 text-stable" />
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Casos Normais ({normalCases.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {normalCases.map((item, index) => (
                    <motion.div
                      key={item.checklist._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={`/medical-evaluation/${item.patient?._id}`}
                        className="block bg-white border border-secondary/20 rounded-2xl p-6 hover:bg-secondary/5 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-heading text-lg font-bold text-foreground">{item.patient?.fullName}</h3>
                            <p className="font-paragraph text-sm text-foreground/60 mt-1">
                              CPF: {item.patient?.cpf}
                            </p>
                          </div>
                          <span className="bg-stable/20 text-stable text-xs font-semibold px-3 py-1 rounded-full">
                            NORMAL
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Hospital:</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">{item.patient?.hospital}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Encaminhado:</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">
                              {calculateTimeSinceReferral(item.referral.referralDate)}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {filteredCases.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-secondary/20">
                <Stethoscope className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
                  Nenhum paciente encontrado
                </h2>
                <p className="font-paragraph text-lg text-foreground/70">
                  {searchTerm ? 'Tente refinar sua busca' : 'Nenhum paciente aguardando avaliação no momento'}
                </p>
              </div>
            )}
          </>
        ) : null}

        {/* Evaluated Cases Section */}
        {filterStatus === 'all' && evaluatedCases.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-6 h-6 text-stable" />
              <h2 className="font-heading text-2xl font-bold text-foreground">
                Pacientes Avaliados ({filteredEvaluated.length})
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvaluated.slice(0, 6).map((item, index) => (
                <motion.div
                  key={item.evaluation._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => handleEvaluatedCaseClick(item.patient?._id || '')}
                    className="w-full text-left block bg-white border border-secondary/20 rounded-2xl p-6 hover:bg-secondary/5 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-heading text-lg font-bold text-foreground">{item.patient?.fullName}</h3>
                        <p className="font-paragraph text-sm text-foreground/60 mt-1">
                          Avaliado em {new Date(item.evaluation.evaluationDate || '').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        item.evaluation.status === 'Alta' 
                          ? 'bg-stable/20 text-stable'
                          : 'bg-primary/20 text-primary'
                      }`}>
                        {item.evaluation.status === 'Alta' ? 'ALTA' : 'CONTINUIDADE'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-paragraph text-sm text-foreground/60">Hospital:</span>
                        <span className="font-paragraph text-sm font-semibold text-foreground">{item.patient?.hospital}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-paragraph text-sm text-foreground/60">Condição:</span>
                        <span className="font-paragraph text-sm font-semibold text-foreground">
                          {item.evaluation.clinicalCondition}
                        </span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
