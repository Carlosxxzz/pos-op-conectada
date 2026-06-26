import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, CheckCircle, AlertTriangle, ShieldAlert, Award, Pill, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { AvaliaesdeEnfermagem, AvaliaesMdicas, Pacientes } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface EvaluationWithMedical extends AvaliaesdeEnfermagem {
  medicalEvaluation?: AvaliaesMdicas;
}

export default function PatientEvaluationsPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<EvaluationWithMedical[]>([]);
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

      // Load nursing evaluations for this patient
      const { items: nursingEvals } = await BaseCrudService.getAll<AvaliaesdeEnfermagem>('avaliacoesenfermagem');
      const patientNursingEvals = nursingEvals.filter(e => e.patientId === patientId);

      // Load medical evaluations
      const { items: medicalEvals } = await BaseCrudService.getAll<AvaliaesMdicas>('avaliacoesmedicas');

      // Combine evaluations with their medical counterparts
      const combined: EvaluationWithMedical[] = patientNursingEvals.map(nursing => {
        const medical = medicalEvals.find(m => m.nursingEvaluationId === nursing._id);
        return {
          ...nursing,
          medicalEvaluation: medical
        };
      });

      // Sort by date (newest first)
      combined.sort((a, b) => 
        new Date(b.checklistDate || 0).getTime() - new Date(a.checklistDate || 0).getTime()
      );

      setEvaluations(combined);
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

  const isDischargedFromFollowUp = (medical?: AvaliaesMdicas) => {
    return medical?.followUpStatus === 'Alta' || medical?.followUpStatus === 'Alta concedida';
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
                key={evaluation._id} 
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
  evaluation: EvaluationWithMedical;
  getStatusIcon: (status?: string) => React.ReactNode;
  getStatusLabel: (status?: string) => string;
}

function EvaluationCard({ evaluation, getStatusIcon, getStatusLabel }: EvaluationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const medical = evaluation.medicalEvaluation;
  const isDischargedFromFollowUp = medical?.followUpStatus === 'Alta' || medical?.followUpStatus === 'Alta concedida';

  return (
    <div className="bg-white rounded-2xl border border-secondary/20 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-secondary/20">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {getStatusIcon(evaluation.patientStatus)}
              <div>
                <p className="font-heading text-xl font-bold text-foreground">
                  Avaliação de {new Date(evaluation.checklistDate || '').toLocaleDateString('pt-BR')}
                </p>
                <p className="font-paragraph text-sm text-foreground/60">
                  {evaluation.hospital}
                </p>
              </div>
            </div>
            <p className="font-paragraph text-base font-semibold text-foreground mb-2">
              Status: {getStatusLabel(evaluation.patientStatus)}
            </p>
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
                {evaluation.nurseName || 'Não informado'}
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
              <p className="font-paragraph text-xs text-foreground/60 mb-1">Status do Acompanhamento</p>
              <p className={`font-paragraph text-base font-semibold ${
                isDischargedFromFollowUp ? 'text-stable' : 'text-primary'
              }`}>
                {isDischargedFromFollowUp ? '🟢 Alta concedida' : 'Em acompanhamento'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Nursing Evaluation */}
          <div>
            <h3 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Avaliação de Enfermagem
            </h3>
            <div className="space-y-4 ml-7">
              <div>
                <p className="font-paragraph text-sm text-foreground/60 mb-1">Enfermeiro</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {evaluation.nurseName || 'Não informado'}
                </p>
              </div>
              <div>
                <p className="font-paragraph text-sm text-foreground/60 mb-1">Parecer da Enfermagem</p>
                <p className="font-paragraph text-base text-foreground bg-background rounded-lg p-3">
                  {evaluation.clinicalObservations || 'Sem observações'}
                </p>
              </div>
              <div>
                <p className="font-paragraph text-sm text-foreground/60 mb-1">Orientações ao Paciente</p>
                <p className="font-paragraph text-base text-foreground bg-background rounded-lg p-3">
                  {evaluation.patientGuidelines || 'Sem orientações específicas'}
                </p>
              </div>
              <div>
                <p className="font-paragraph text-sm text-foreground/60 mb-1">Status do Paciente</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {getStatusLabel(evaluation.patientStatus)}
                </p>
              </div>
              {evaluation.referredToDoctor && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="font-paragraph text-sm font-semibold text-primary">
                    ✓ Encaminhado para avaliação médica
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Medical Evaluation */}
          {medical && (
            <div className="border-t border-secondary/20 pt-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-primary" />
                Avaliação Médica
              </h3>
              <div className="space-y-4 ml-7">
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Médico</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {medical.doctorName || 'Não informado'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Diagnóstico/Avaliação</p>
                  <p className="font-paragraph text-base text-foreground bg-background rounded-lg p-3">
                    {medical.clinicalRecommendations || 'Sem recomendações'}
                  </p>
                </div>
                {medical.medicationGuidanceAdjustment && (
                  <div>
                    <p className="font-paragraph text-sm text-foreground/60 mb-2 flex items-center gap-2">
                      <Pill className="w-4 h-4" />
                      Medicamentos Prescritos
                    </p>
                    <p className="font-paragraph text-base text-foreground bg-background rounded-lg p-3">
                      {medical.medicationGuidanceAdjustment}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-secondary/20">
                  <div>
                    <p className="font-paragraph text-sm text-foreground/60 mb-1">Retorno Hospitalar</p>
                    <p className="font-paragraph text-base font-semibold">
                      {medical.hospitalReturnRecommended ? '✓ Recomendado' : '✗ Não recomendado'}
                    </p>
                  </div>
                  <div>
                    <p className="font-paragraph text-sm text-foreground/60 mb-1">Avaliação Presencial</p>
                    <p className="font-paragraph text-base font-semibold">
                      {medical.inPersonEvaluationRecommended ? '✓ Recomendada' : '✗ Não recomendada'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Follow-up Status */}
          <div className="border-t border-secondary/20 pt-6">
            <h3 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-primary" />
              Status do Acompanhamento
            </h3>
            {isDischargedFromFollowUp ? (
              <div className="bg-stable/10 border-2 border-stable/30 rounded-lg p-4 ml-7">
                <p className="font-paragraph text-lg font-bold text-stable mb-3">
                  🟢 Alta Concedida
                </p>
                <p className="font-paragraph text-base text-foreground">
                  Parabéns! Sua equipe de saúde concluiu que você não necessita mais enviar checklists diários. Caso volte a precisar de acompanhamento em uma nova consulta ou procedimento, o hospital poderá reativar seu acompanhamento.
                </p>
              </div>
            ) : (
              <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4 ml-7">
                <p className="font-paragraph text-lg font-bold text-primary mb-2">
                  Em Acompanhamento
                </p>
                <p className="font-paragraph text-base text-foreground">
                  Continue preenchendo seus checklists diários para que a equipe de saúde possa acompanhar sua recuperação.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


