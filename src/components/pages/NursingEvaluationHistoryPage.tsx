import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowLeft, AlertCircle, CheckCircle, Clock, Search, Filter, Eye,
  User, Building2, Calendar, FileText, LogOut, Stethoscope
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
import ProfilePhotoDisplay from '@/components/ProfilePhotoDisplay';
import { Image } from '@/components/ui/image';

interface EvaluationHistoryItem {
  patient: Pacientes;
  checklist: ChecklistsDirios;
  nursingEval: AvaliaesdeEnfermagem;
  referral: EncaminhamentosMdicos | null;
  medicalEval: AvaliaesMdicas | null;
  status: 'AVALIADO_ENFERMAGEM' | 'ENCAMINHADO_MEDICO' | 'AVALIADO_MEDICO';
}

export default function NursingEvaluationHistoryPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [professional, setProfessional] = useState<Profissionais | null>(null);
  const [historyItems, setHistoryItems] = useState<EvaluationHistoryItem[]>([]);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'TODOS' | 'AVALIADO_ENFERMAGEM' | 'ENCAMINHADO_MEDICO' | 'AVALIADO_MEDICO'>('TODOS');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useSessionPersistence();

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
      if (!professionalData) {
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

      // Build history items - only include evaluations done by this nurse
      const history: EvaluationHistoryItem[] = [];

      allNursingEvals.forEach(nursingEval => {
        // Only include evaluations from this nurse
        if (nursingEval.nurseName !== professionalData.fullName && nursingEval.nurseName !== professionalData.email) {
          return;
        }

        const checklist = allChecklists.find(c => c._id === nursingEval.checklistId);
        const patient = patientsRes.items.find(p => p._id === nursingEval.patientId);

        if (!checklist || !patient || patient.hospital !== professionalData.hospital) {
          return;
        }

        // Find referral and medical evaluation if exists
        const referral = allReferrals.find(r => r.checklistId === nursingEval.checklistId);
        const medicalEval = referral ? allMedicalEvals.find(e => e.nursingEvaluationId === referral._id) : null;

        let status: 'AVALIADO_ENFERMAGEM' | 'ENCAMINHADO_MEDICO' | 'AVALIADO_MEDICO' = 'AVALIADO_ENFERMAGEM';
        if (medicalEval) {
          status = 'AVALIADO_MEDICO';
        } else if (referral) {
          status = 'ENCAMINHADO_MEDICO';
        }

        history.push({
          patient,
          checklist,
          nursingEval,
          referral: referral || null,
          medicalEval: medicalEval || null,
          status,
        });
      });

      // Sort by date descending
      history.sort((a, b) => 
        new Date(b.nursingEval.checklistDate || 0).getTime() - 
        new Date(a.nursingEval.checklistDate || 0).getTime()
      );

      setHistoryItems(history);
    } catch (error) {
      logger.error('NursingEvaluationHistory', 'loadData', 'Error loading data', error);
      setError('Erro ao carregar histórico. Tente novamente.');
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
  const filteredItems = useMemo(() => {
    let result = historyItems;

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
    if (filterType !== 'TODOS') {
      result = result.filter(item => item.status === filterType);
    }

    return result;
  }, [historyItems, filterType, searchQuery]);

  const getStatusBadge = (status: 'AVALIADO_ENFERMAGEM' | 'ENCAMINHADO_MEDICO' | 'AVALIADO_MEDICO') => {
    switch (status) {
      case 'AVALIADO_ENFERMAGEM':
        return { bg: 'bg-stable/10', text: 'text-stable', label: '✓ Avaliado Enfermagem', icon: '🟢' };
      case 'ENCAMINHADO_MEDICO':
        return { bg: 'bg-attention/10', text: 'text-attention-foreground', label: '🟡 Aguardando Médico', icon: '🟡' };
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
      <div className="min-h-screen bg-background">
        <header className="bg-white border-b border-secondary/30 sticky top-0 z-40">
          <div className="max-w-[120rem] mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <Link to="/nursing-dashboard" className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Activity className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                  <p className="font-paragraph text-sm text-foreground/60">Histórico de Avaliações</p>
                </div>
              </Link>
              <Link to="/nursing-dashboard">
                <Button variant="outline" className="flex items-center gap-2 font-paragraph">
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-[120rem] mx-auto px-8 py-12">
          <div className="bg-white rounded-2xl p-8 border border-secondary/20 max-w-md mx-auto">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-secondary/30 sticky top-0 z-40">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link to="/nursing-dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Histórico de Avaliações de Enfermagem</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              {/* Profile Menu */}
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

          {/* Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Link to="/nursing-dashboard">
              <Button variant="outline" className="flex items-center gap-2 font-paragraph whitespace-nowrap">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
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
              { value: 'AVALIADO_ENFERMAGEM', label: 'Avaliado Enfermagem' },
              { value: 'ENCAMINHADO_MEDICO', label: 'Aguardando Médico' },
              { value: 'AVALIADO_MEDICO', label: 'Avaliado Médico' },
            ].map(filter => (
              <button
                key={filter.value}
                onClick={() => setFilterType(filter.value as any)}
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

        {/* History List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-secondary/20">
            <FileText className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Nenhuma avaliação encontrada</h2>
            <p className="font-paragraph text-lg text-foreground/70">
              {searchQuery ? 'Tente ajustar sua pesquisa' : 'Você ainda não realizou nenhuma avaliação'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, index) => {
              const badge = getStatusBadge(item.status);
              return (
                <motion.div
                  key={`${item.patient._id}-${item.nursingEval._id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl p-6 border border-secondary/20 hover:shadow-lg transition-all"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Paciente</p>
                      <p className="font-paragraph text-sm font-semibold text-foreground">{item.patient.fullName}</p>
                    </div>
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">CPF / SUS</p>
                      <p className="font-paragraph text-sm font-semibold text-foreground">{item.patient.cpf || item.patient.susNumber || '-'}</p>
                    </div>
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Data da Avaliação</p>
                      <p className="font-paragraph text-sm font-semibold text-foreground">
                        {new Date(item.nursingEval.checklistDate || '').toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Status</p>
                      <span className={`${badge.bg} ${badge.text} text-xs font-semibold px-3 py-1 rounded-full inline-block`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4 pt-4 border-t border-secondary/20">
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1">Cirurgia</p>
                      <p className="font-paragraph text-sm text-foreground">{item.patient.surgeryType}</p>
                    </div>
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1">Risco</p>
                      <p className="font-paragraph text-sm text-foreground">
                        {item.checklist.riskLevel === 'critical' ? 'Crítico' : item.checklist.riskLevel === 'attention' ? 'Atenção' : 'Estável'}
                      </p>
                    </div>
                    {item.referral && (
                      <div>
                        <p className="font-paragraph text-xs text-foreground/60 mb-1">Médico Responsável</p>
                        <p className="font-paragraph text-sm text-foreground">{item.referral.doctorName || '-'}</p>
                      </div>
                    )}
                    {item.medicalEval && (
                      <div>
                        <p className="font-paragraph text-xs text-foreground/60 mb-1">Data Avaliação Médica</p>
                        <p className="font-paragraph text-sm text-foreground">
                          {new Date(item.medicalEval.evaluationDate || '').toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Observations */}
                  {item.nursingEval.clinicalObservations && (
                    <div className="mb-4 pt-4 border-t border-secondary/20">
                      <p className="font-paragraph text-xs text-foreground/60 mb-2 uppercase tracking-wide">Observações Clínicas</p>
                      <p className="font-paragraph text-sm text-foreground bg-background rounded-lg p-3">{item.nursingEval.clinicalObservations}</p>
                    </div>
                  )}

                  {/* Medical Evaluation Info */}
                  {item.medicalEval && (
                    <div className="mb-4 pt-4 border-t border-secondary/20 bg-stable/5 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-5 h-5 text-stable" />
                        <p className="font-paragraph text-sm font-semibold text-foreground">Avaliação Médica Concluída</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1">Médico</p>
                          <p className="font-paragraph text-sm font-semibold text-foreground">{item.medicalEval.doctorName}</p>
                        </div>
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1">Data</p>
                          <p className="font-paragraph text-sm font-semibold text-foreground">
                            {new Date(item.medicalEval.evaluationDate || '').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* View Button */}
                  <div className="flex justify-end pt-4 border-t border-secondary/20">
                    <Link
                      to={`/nursing-evaluation/${item.patient._id}`}
                      className="text-primary font-paragraph text-sm font-semibold hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Ver Detalhes
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
