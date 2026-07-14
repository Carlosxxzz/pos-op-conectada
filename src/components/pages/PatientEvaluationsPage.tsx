import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, CheckCircle, AlertTriangle, ShieldAlert, Award, Pill, ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { AvaliaesdeEnfermagem, AvaliaesMdicas, Pacientes, ChecklistsDirios } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface EvaluationRecord {
  type: 'nursing' | 'medical' | 'pending';
  checklistId: string;
  checklistDate: Date | string;
  nursing?: AvaliaesdeEnfermagem;
  medical?: AvaliaesMdicas;
  checklist?: ChecklistsDirios;
}

export default function PatientEvaluationsPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [patient, setPatient] = useState<Pacientes | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const patientId = localStorage.getItem('patientId');
    if (!patientId) {
      navigate('/patient-login');
      return;
    }

    try {
      // Load patient data
      const patientData = await BaseCrudService.getById<Pacientes>('pacientes', patientId);
      setPatient(patientData);

      // Load all necessary data
      const { items: nursingEvals } = await BaseCrudService.getAll<AvaliaesdeEnfermagem>('avaliacoesenfermagem');
      const { items: medicalEvals } = await BaseCrudService.getAll<AvaliaesMdicas>('avaliacoesmedicas');
      const { items: checklists } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
      const { items: referrals } = await BaseCrudService.getAll<any>('encaminhamentosmedicos');

      const patientChecklists = checklists.filter(c => c.patientId === patientId);
      const evaluationRecords: EvaluationRecord[] = [];

      // Process each checklist
      patientChecklists.forEach(checklist => {
        const nursing = nursingEvals.find(e => e.checklistId === checklist._id);
        const medical = medicalEvals.find(m => m.checklistId === checklist._id);
        const referral = referrals.find(r => r.checklistId === checklist._id && r.patientId === patientId);

        // CASE 1: Nursing evaluation finalized (no referral)
        if (nursing && !referral && !medical) {
          evaluationRecords.push({
            type: 'nursing',
            checklistId: checklist._id,
            checklistDate: nursing.checklistDate || checklist.checklistDate,
            nursing,
            checklist
          });
        }
        // CASE 2: Medical evaluation completed (after referral)
        else if (medical) {
          evaluationRecords.push({
            type: 'medical',
            checklistId: checklist._id,
            checklistDate: medical.evaluationDate || checklist.checklistDate,
            nursing,
            medical,
            checklist
          });
        }
        // CASE 3: Referral pending (awaiting medical evaluation)
        else if (referral && referral.status !== 'CONCLUIDO') {
          evaluationRecords.push({
            type: 'pending',
            checklistId: checklist._id,
            checklistDate: referral.referralDate || checklist.checklistDate,
            nursing,
            checklist
          });
        }
      });

      // Sort by date (newest first)
      evaluationRecords.sort((a, b) => 
        new Date(b.checklistDate || 0).getTime() - new Date(a.checklistDate || 0).getTime()
      );

      setEvaluations(evaluationRecords);
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'stable':
        return <CheckCircle className="w-6 h-6 text-stable" />;
      case 'attention':
        return <AlertTriangle className="w-6 h-6 text-attention" />;
      case 'critical':
        return <ShieldAlert className="w-6 h-6 text-critical" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'stable':
        return '🟢 Estável';
      case 'attention':
        return '🟡 Requer Atenção';
      case 'critical':
        return '🔴 Crítico';
      default:
        return 'Desconhecido';
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
      <header className="bg-white border-b border-secondary/30">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/patient-dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Avaliação da Equipe</p>
              </div>
            </Link>
            <Link to="/patient-dashboard">
              <Button variant="outline" className="flex items-center gap-2 font-paragraph">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        <div className="mb-8">
          <h2 className="font-heading text-4xl font-bold text-foreground mb-2">
            Avaliação da Equipe
          </h2>
          <p className="font-paragraph text-lg text-foreground/70">
            Acompanhe as avaliações realizadas pela equipe de saúde
          </p>
        </div>

        {evaluations.length > 0 ? (
          <div className="space-y-6">
            {evaluations.map((evaluation) => (
              <EvaluationCard 
                key={evaluation.checklistId} 
                evaluation={evaluation}
                getStatusIcon={getStatusIcon}
                getStatusLabel={getStatusLabel}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-16 border border-secondary/20 text-center">
            <Award className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <p className="font-paragraph text-lg text-foreground/60 mb-4">
              Nenhuma avaliação disponível ainda
            </p>
            <p className="font-paragraph text-base text-foreground/50 mb-6">
              Após preencher seu checklist e enviar fotos, a equipe de saúde realizará uma avaliação que aparecerá aqui.
            </p>
            <Link to="/patient-dashboard">
              <Button className="bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold">
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface EvaluationCardProps {
  evaluation: EvaluationRecord;
  getStatusIcon: (status?: string) => React.ReactNode;
  getStatusLabel: (status?: string) => string;
}

function EvaluationCard({ evaluation, getStatusIcon, getStatusLabel }: EvaluationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const nursing = evaluation.nursing;
  const medical = evaluation.medical;
  const isPending = evaluation.type === 'pending';

  return (
    <div className="bg-white rounded-2xl border border-secondary/20 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className={`p-6 border-b border-secondary/20 ${
        isPending ? 'bg-attention/5' : 'bg-gradient-to-r from-primary/5 to-secondary/5'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {!isPending && getStatusIcon(nursing?.patientStatus || medical?.clinicalCondition)}
              {isPending && <Clock className="w-6 h-6 text-attention" />}
              <div>
                <p className="font-heading text-xl font-bold text-foreground">
                  {isPending ? 'Aguardando Avaliação Médica' : `Avaliação de ${new Date(evaluation.checklistDate || '').toLocaleDateString('pt-BR')}`}
                </p>
                <p className="font-paragraph text-sm text-foreground/60">
                  {evaluation.checklist?.hospital || 'Hospital'}
                </p>
              </div>
            </div>
            {!isPending && (
              <p className="font-paragraph text-base font-semibold text-foreground mb-2">
                Status: {getStatusLabel(nursing?.patientStatus || medical?.clinicalCondition)}
              </p>
            )}
            {isPending && (
              <p className="font-paragraph text-base font-semibold text-attention mb-2">
                Sua avaliação foi encaminhada para um médico. Aguarde a análise da equipe médica.
              </p>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowRight className={`w-5 h-5 text-primary transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Collapsed Summary */}
      {!isExpanded && (
        <div className="px-6 py-4 border-b border-secondary/20 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="font-paragraph text-xs text-foreground/60 mb-1">Enfermeiro</p>
              <p className="font-paragraph text-base font-semibold text-foreground">
                {nursing?.nurseName || 'Não informado'}
              </p>
            </div>
            {medical && (
              <div>
                <p className="font-paragraph text-xs text-foreground/60 mb-1">Médico</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {medical.doctorName || 'Não informado'}
                </p>
              </div>
            )}
            <div>
              <p className="font-paragraph text-xs text-foreground/60 mb-1">Tipo de Avaliação</p>
              <p className={`font-paragraph text-base font-semibold ${
                isPending ? 'text-attention' : medical ? 'text-primary' : 'text-stable'
              }`}>
                {isPending ? '⏳ Pendente' : medical ? '✓ Médica' : '✓ Enfermagem'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Nursing Evaluation */}
          {nursing && (
            <div>
              <h3 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Avaliação de Enfermagem
              </h3>
              <div className="space-y-4 ml-7">
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Enfermeiro(a)</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {nursing.nurseName || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Data e Hora</p>
                  <p className="font-paragraph text-base text-foreground">
                    {new Date(nursing.checklistDate || '').toLocaleDateString('pt-BR')} às {new Date(nursing.checklistDate || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Estado do Paciente</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {getStatusLabel(nursing.patientStatus)}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Observações</p>
                  <p className="font-paragraph text-base text-foreground bg-background rounded-lg p-3">
                    {nursing.clinicalObservations || 'Sem observações'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Orientações ao Paciente</p>
                  <p className="font-paragraph text-base text-foreground bg-background rounded-lg p-3">
                    {nursing.patientGuidelines || 'Sem orientações específicas'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Status do Acompanhamento</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {nursing.referredToDoctor ? 'Encaminhado para Médico' : 'Finalizado'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Medical Evaluation */}
          {medical && (
            <div className="border-t border-secondary/20 pt-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                Avaliação Médica
              </h3>
              <div className="space-y-4 ml-7">
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Médico(a)</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {medical.doctorName || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Especialidade</p>
                  <p className="font-paragraph text-base text-foreground">
                    {medical.clinicalRecommendations ? 'Clínico Geral' : 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Data</p>
                  <p className="font-paragraph text-base text-foreground">
                    {new Date(medical.evaluationDate || '').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Estado do Paciente</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {getStatusLabel(medical.clinicalCondition)}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Conduta Médica</p>
                  <p className="font-paragraph text-base text-foreground bg-background rounded-lg p-3">
                    {medical.medicalConduct || 'Sem conduta informada'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Orientações</p>
                  <p className="font-paragraph text-base text-foreground bg-background rounded-lg p-3">
                    {medical.patientRecommendations || 'Sem orientações específicas'}
                  </p>
                </div>
                {medical.medicalPrescription && (
                  <div>
                    <p className="font-paragraph text-sm text-foreground/60 mb-2 flex items-center gap-2">
                      <Pill className="w-4 h-4" />
                      Prescrição Médica
                    </p>
                    <p className="font-paragraph text-base text-foreground bg-background rounded-lg p-3">
                      {medical.medicalPrescription}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pending Status */}
          {isPending && (
            <div className="border-t border-secondary/20 pt-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-attention" />
                Status da Avaliação
              </h3>
              <div className="bg-attention/10 border-2 border-attention/30 rounded-lg p-4 ml-7">
                <p className="font-paragraph text-lg font-bold text-attention mb-3">
                  ⏳ Aguardando Avaliação Médica
                </p>
                <p className="font-paragraph text-base text-foreground">
                  Sua avaliação foi encaminhada para um médico da equipe. Aguarde a análise do profissional. Você será notificado assim que a avaliação médica for concluída.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
