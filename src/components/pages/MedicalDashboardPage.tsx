import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Stethoscope, AlertCircle, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { ChecklistsDirios, Pacientes, Profissionais } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';

interface ReferredCase {
  checklist: ChecklistsDirios;
  patient: Pacientes | null;
  referral: any;
}

export default function MedicalDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [referredCases, setReferredCases] = useState<ReferredCase[]>([]);
  const [professional, setProfessional] = useState<Profissionais | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get professional info from localStorage
      const professionalId = localStorage.getItem('professionalId');
      if (!professionalId) {
        navigate('/professional-login');
        return;
      }

      const professionalData = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
      setProfessional(professionalData);

      console.log('[MEDICAL] Carregando dados do médico', {
        professionalId: professionalId.substring(0, 8),
        hospital: professionalData?.hospital,
      });

      // Get all checklists and referrals
      const { items: allChecklists } = await BaseCrudService.getAll<any>('checklistsdiarios');
      const { items: allPatients } = await BaseCrudService.getAll<Pacientes>('pacientes');
      const { items: allReferrals } = await BaseCrudService.getAll<any>('encaminhamentosmedicos');

      console.log('[MEDICAL] Total de checklists no banco:', allChecklists.length);
      console.log('[MEDICAL] Total de encaminhamentos no banco:', allReferrals.length);

      // Filter referrals: only those for this doctor AND not yet evaluated (status not 'Alta' or 'Continuidade')
      const referralsForThisDoctor = allReferrals.filter((referral: any) => {
        const isForThisDoctor = referral.doctorId === professionalId;
        const isNotEvaluated = referral.status !== 'Alta' && referral.status !== 'Continuidade' && referral.status !== 'Avaliado';
        
        return isForThisDoctor && isNotEvaluated;
      });

      console.log('[MEDICAL] Encaminhamentos para este médico:', {
        total: referralsForThisDoctor.length,
        doctorId: professionalId.substring(0, 8),
        details: referralsForThisDoctor.map((r: any) => ({ checklistId: r.checklistId, status: r.status })),
      });

      // Map referrals to cases with checklists and patients
      const referred = referralsForThisDoctor.map((referral: any) => {
        const checklist = allChecklists.find(c => c._id === referral.checklistId);
        const patient = allPatients.find(p => p._id === referral.patientId) || null;
        return { checklist, patient, referral };
      }).filter(item => item.checklist && item.patient) // Only include if both checklist and patient exist
        .sort((a, b) => {
          const dateA = new Date(a.referral.referralDate || 0).getTime();
          const dateB = new Date(b.referral.referralDate || 0).getTime();
          return dateB - dateA;
        });

      console.log('[MEDICAL] Casos filtrados para avaliação:', {
        total: referred.length,
        cases: referred.map((c: any) => ({ 
          patientName: c.patient?.fullName, 
          checklistId: c.checklist?._id,
          riskLevel: c.checklist?.riskLevel 
        })),
      });

      setReferredCases(referred as any);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const criticalCases = referredCases.filter(c => c.checklist.riskLevel === 'critical');
  const observationCases = referredCases.filter(c => c.checklist.riskLevel === 'attention');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-secondary/30">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Dashboard Médico</p>
                {professional && (
                  <p className="font-paragraph text-xs text-foreground/50 mt-1">
                    Hospital: {professional.hospital}
                  </p>
                )}
              </div>
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
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        {/* Empty State */}
        {referredCases.length === 0 ? (
          <div className="text-center py-16">
            <Stethoscope className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
              Nenhum paciente encaminhado
            </h2>
            <p className="font-paragraph text-lg text-foreground/70 mb-8">
              Os pacientes encaminhados pela enfermagem aparecerão aqui quando forem referenciados.
            </p>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-6 border border-secondary/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-foreground">{referredCases.length}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Casos Encaminhados</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-critical/10 rounded-2xl p-6 border border-critical/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-critical rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-critical-foreground" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-critical">{criticalCases.length}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Casos Críticos</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-attention/10 rounded-2xl p-6 border border-attention/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-attention rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-attention-foreground" />
                  </div>
                  <span className="font-heading text-3xl font-bold text-attention-foreground">{observationCases.length}</span>
                </div>
                <p className="font-paragraph text-sm text-foreground/70">Em Observação</p>
              </motion.div>
            </div>

            {/* Critical Cases Section */}
            {criticalCases.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className="w-6 h-6 text-critical" />
                  <h2 className="font-heading text-3xl font-bold text-foreground">
                    Casos Críticos - Prioridade Máxima
                  </h2>
                </div>
                <div className="space-y-4">
                  {criticalCases.map((item, index) => (
                    <motion.div
                      key={item.checklist._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={`/medical-evaluation/${item.patient?._id}`}
                        className="block bg-critical/10 border-2 border-critical rounded-2xl p-6 hover:bg-critical/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="font-heading text-xl font-bold text-foreground">
                                {item.patient?.fullName}
                              </span>
                              <span className="bg-critical text-critical-foreground text-xs font-semibold px-3 py-1 rounded-full">
                                CRÍTICO
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="font-paragraph text-xs text-foreground/60 mb-1">Cirurgia</p>
                                <p className="font-paragraph text-sm font-semibold text-foreground">
                                  {item.patient?.surgeryType}
                                </p>
                              </div>
                              <div>
                                <p className="font-paragraph text-xs text-foreground/60 mb-1">Enfermeiro(a)</p>
                                <p className="font-paragraph text-sm font-semibold text-foreground">
                                  {item.checklist.enfermeiroResponsavel}
                                </p>
                              </div>
                              <div>
                                <p className="font-paragraph text-xs text-foreground/60 mb-1">Data do Encaminhamento</p>
                                <p className="font-paragraph text-sm font-semibold text-foreground">
                                  {item.checklist.dataEncaminhamento 
                                    ? new Date(item.checklist.dataEncaminhamento).toLocaleDateString('pt-BR')
                                    : '-'}
                                </p>
                              </div>
                              <div>
                                <p className="font-paragraph text-xs text-foreground/60 mb-1">Hospital</p>
                                <p className="font-paragraph text-sm font-semibold text-foreground">
                                  {item.patient?.hospital}
                                </p>
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-6 h-6 text-critical flex-shrink-0 ml-4" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Observation Cases Section */}
            {observationCases.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-6 h-6 text-attention-foreground" />
                  <h2 className="font-heading text-3xl font-bold text-foreground">
                    Casos em Observação
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {observationCases.map((item, index) => (
                    <motion.div
                      key={item.checklist._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={`/medical-evaluation/${item.patient?._id}`}
                        className="block bg-white border border-attention/30 rounded-2xl p-6 hover:bg-attention/5 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-heading text-lg font-bold text-foreground">
                            {item.patient?.fullName}
                          </span>
                          <span className="bg-attention/20 text-attention-foreground text-xs font-semibold px-3 py-1 rounded-full">
                            OBSERVAÇÃO
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Cirurgia:</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">
                              {item.patient?.surgeryType}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Enfermeiro(a):</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">
                              {item.checklist.enfermeiroResponsavel}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-paragraph text-sm text-foreground/60">Hospital:</span>
                            <span className="font-paragraph text-sm font-semibold text-foreground">
                              {item.patient?.hospital}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
