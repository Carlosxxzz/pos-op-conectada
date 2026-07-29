import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, FileText, AlertCircle, Clock, User, Building2, Calendar, Pill, Thermometer, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { Pacientes, ChecklistsDirios, AvaliaesdeEnfermagem, AvaliaesMdicas, Profissionais } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';
import ResponsiveImageDisplay from '@/components/ResponsiveImageDisplay';
import { motion } from 'framer-motion';

export default function MedicalEvaluationHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [patient, setPatient] = useState<Pacientes | null>(null);
  const [checklist, setChecklist] = useState<ChecklistsDirios | null>(null);
  const [nursingEvaluation, setNursingEvaluation] = useState<AvaliaesdeEnfermagem | null>(null);
  const [medicalEvaluation, setMedicalEvaluation] = useState<AvaliaesMdicas | null>(null);
  const [professional, setProfessional] = useState<Profissionais | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      const professionalId = localStorage.getItem('professionalId');
      const professionalProfile = localStorage.getItem('professionalProfile');
      
      if (!professionalId || !professionalProfile) {
        navigate('/professional-login');
        return;
      }

      if (professionalProfile !== 'Médico') {
        setIsLoading(false);
        return;
      }

      const professionalData = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
      setProfessional(professionalData);
      
      const patientData = await BaseCrudService.getById<Pacientes>('pacientes', id);
      setPatient(patientData);

      // Get referral data to find the checklist
      const { items: referrals } = await BaseCrudService.getAll<any>('encaminhamentosmedicos');
      const referral = referrals.find(r => r.patientId === id && r.doctorId === professionalId);
      
      if (!referral) {
        console.error('No referral found for this patient and doctor');
        setIsLoading(false);
        return;
      }

      // Get the specific checklist from the referral
      const { items: checklistItems } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
      const referralChecklistId = referral.checklistId;
      const referralChecklistData = checklistItems.find(c => c._id === referralChecklistId);
      
      if (referralChecklistData) {
        setChecklist(referralChecklistData);
      }

      // Get nursing evaluation if it exists
      const { items: evaluations } = await BaseCrudService.getAll<AvaliaesdeEnfermagem>('avaliacoesenfermagem');
      const patientEvaluations = evaluations.filter(e => e.patientId === id && e.checklistId === referralChecklistId);
      
      if (patientEvaluations.length > 0) {
        setNursingEvaluation(patientEvaluations[0]);
      } else if (referral) {
        const syntheticEvaluation: AvaliaesdeEnfermagem = {
          _id: 'synthetic-' + referral._id,
          checklistId: referral.checklistId,
          patientId: referral.patientId,
          nurseName: referral.nurseName,
          clinicalObservations: referral.nurseMessage,
          patientGuidelines: '',
          patientStatus: 'stable',
          referredToDoctor: true,
        };
        setNursingEvaluation(syntheticEvaluation);
      }

      // Get medical evaluation
      const { items: medicalEvaluations } = await BaseCrudService.getAll<AvaliaesMdicas>('avaliacoesmedicas');
      const medicalEval = medicalEvaluations.find(e => e.checklistId === referralChecklistId && e.patientId === id);
      
      if (medicalEval) {
        setMedicalEvaluation(medicalEval);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDaysSinceSurgery = () => {
    if (!patient?.surgeryDate) return 0;
    const surgery = new Date(patient.surgeryDate);
    const today = new Date();
    const diffMs = today.getTime() - surgery.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!patient || !checklist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
            Paciente não encontrado
          </h2>
          <p className="font-paragraph text-lg text-foreground/70 mb-6">
            Não foi possível carregar os dados do paciente.
          </p>
          <Link to="/medical-dashboard">
            <Button className="bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-bold">
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-secondary/30 sticky top-0 z-50">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/medical-dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Histórico de Avaliação</p>
              </div>
            </Link>
            <Link to="/medical-dashboard">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient History */}
          <div className="lg:col-span-2 space-y-8">
            {/* Read-Only Badge */}
            <div className="bg-stable/10 border-2 border-stable rounded-2xl p-6 flex items-center gap-4">
              <Eye className="w-6 h-6 text-stable flex-shrink-0" />
              <div>
                <h3 className="font-heading text-lg font-bold text-foreground">Modo Visualização</h3>
                <p className="font-paragraph text-sm text-foreground/70 mt-1">
                  Esta avaliação foi finalizada. Você está visualizando o histórico completo do paciente.
                </p>
              </div>
            </div>

            {/* Patient Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 border border-secondary/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <User className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Informações do Paciente
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Nome Completo</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">{patient.fullName}</p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">CPF</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">{patient.cpf}</p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">SUS</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">{patient.susNumber || '-'}</p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Telefone</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">{patient.phoneNumber || '-'}</p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Hospital</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">{patient.hospital}</p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Médico Responsável</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">{patient.responsibleDoctorName || '-'}</p>
                </div>
              </div>
            </motion.div>

            {/* Surgery Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-8 border border-secondary/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-primary" />
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  Informações da Cirurgia
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Tipo de Cirurgia</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">{patient.surgeryType}</p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Data da Cirurgia</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {patient.surgeryDate ? new Date(patient.surgeryDate).toLocaleDateString('pt-BR') : '-'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Dias de Pós-Operatório</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">{calculateDaysSinceSurgery()} dias</p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Status de Acompanhamento</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      patient.followUpStatus === 'Ativo' 
                        ? 'bg-primary/20 text-primary'
                        : 'bg-stable/20 text-stable'
                    }`}>
                      {patient.followUpStatus || 'Ativo'}
                    </span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Nursing Evaluation with Referral Reason */}
            {nursingEvaluation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl p-8 border border-secondary/20"
              >
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-primary" />
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Motivo do Encaminhamento
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="font-paragraph text-sm text-foreground/60 mb-1">Enfermeiro(a)</p>
                    <p className="font-paragraph text-base font-semibold text-foreground">
                      {nursingEvaluation.nurseName}
                    </p>
                  </div>
                  <div>
                    <p className="font-paragraph text-sm text-foreground/60 mb-2">Motivo do Encaminhamento</p>
                    <div className="bg-background rounded-xl p-4 border-l-4 border-primary">
                      <p className="font-paragraph text-sm text-foreground">
                        {nursingEvaluation.clinicalObservations}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Checklist History */}
            {checklist && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl p-8 border border-secondary/20"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-heading text-2xl font-bold text-foreground">
                      Checklist do Paciente
                    </h2>
                    <p className="font-paragraph text-sm text-foreground/60 mt-1">
                      {new Date(checklist.checklistDate || '').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`font-paragraph text-sm font-semibold px-4 py-2 rounded-full ${
                    checklist.riskLevel === 'critical' 
                      ? 'bg-critical/10 text-critical'
                      : checklist.riskLevel === 'attention'
                      ? 'bg-attention/10 text-attention-foreground'
                      : 'bg-stable/10 text-stable'
                  }`}>
                    {checklist.riskLevel === 'critical' 
                      ? 'CRÍTICO'
                      : checklist.riskLevel === 'attention'
                      ? 'ATENÇÃO'
                      : 'ESTÁVEL'}
                  </span>
                </div>

                {/* Vital Signs */}
                <div className="mb-6 pb-6 border-b border-secondary/20">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-4">Sinais Vitais</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-critical mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-paragraph text-xs text-foreground/60 mb-1">Nível de Dor</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {checklist.painLevel}/10
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Thermometer className="w-5 h-5 text-attention-foreground mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-paragraph text-xs text-foreground/60 mb-1">Temperatura</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {checklist.bodyTemperature}°C
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1">Febre</p>
                      <p className="font-paragraph text-base font-semibold text-foreground">
                        {checklist.hasFever ? 'Sim' : 'Não'}
                      </p>
                    </div>
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1">Alimentação</p>
                      <p className="font-paragraph text-base font-semibold text-foreground">
                        {checklist.eatingNormally ? 'Normal' : 'Alterada'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Surgical Site */}
                <div className="mb-6 pb-6 border-b border-secondary/20">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-4">Sítio Cirúrgico</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1">Vermelhidão</p>
                      <p className="font-paragraph text-base font-semibold text-foreground">
                        {checklist.scarRedness ? 'Sim' : 'Não'}
                      </p>
                    </div>
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1">Secreção</p>
                      <p className="font-paragraph text-base font-semibold text-foreground">
                        {checklist.hasSecretion ? 'Sim' : 'Não'}
                      </p>
                    </div>
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1">Mau Cheiro</p>
                      <p className="font-paragraph text-base font-semibold text-foreground">
                        {checklist.hasBadOdor ? 'Sim' : 'Não'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Symptoms */}
                <div className="mb-6 pb-6 border-b border-secondary/20">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-4">Sintomas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1">Falta de Ar</p>
                      <p className="font-paragraph text-base font-semibold text-foreground">
                        {checklist.shortnessOfBreath ? 'Sim' : 'Não'}
                      </p>
                    </div>
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1">Tontura</p>
                      <p className="font-paragraph text-base font-semibold text-foreground">
                        {checklist.dizziness ? 'Sim' : 'Não'}
                      </p>
                    </div>
                    <div>
                      <p className="font-paragraph text-xs text-foreground/60 mb-1">Dor Crescente</p>
                      <p className="font-paragraph text-base font-semibold text-foreground">
                        {checklist.increasingPain ? 'Sim' : 'Não'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medications */}
                <div className="mb-6 pb-6 border-b border-secondary/20">
                  <h3 className="font-heading text-lg font-bold text-foreground mb-4">Medicamentos</h3>
                  <div className="flex items-start gap-3">
                    <Pill className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-paragraph text-sm text-foreground">
                        {checklist.takingMedicationCorrectly ? 'Tomando corretamente' : 'Não está tomando corretamente'}
                      </p>
                      {!checklist.takingMedicationCorrectly && checklist.reasonNotTakingMedication && (
                        <p className="font-paragraph text-sm text-foreground/60 mt-2">
                          Motivo: {checklist.reasonNotTakingMedication}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scar Photo */}
                {checklist.scarPhoto && (
                  <div>
                    <p className="font-paragraph text-sm font-semibold text-foreground mb-3">Foto da Cicatriz</p>
                    <ResponsiveImageDisplay
                      src={checklist.scarPhoto}
                      alt="Foto da cicatriz"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Medical Evaluation Summary - Read-Only */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-8 border border-secondary/20 sticky top-8">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                Avaliação Médica
              </h2>

              {medicalEvaluation ? (
                <div className="space-y-6">
                  <div className="bg-background rounded-lg p-4 border border-secondary/20">
                    <p className="font-paragraph text-sm text-foreground/60 mb-1">Médico(a)</p>
                    <p className="font-paragraph text-base font-semibold text-foreground">{medicalEvaluation.doctorName}</p>
                  </div>

                  <div className="bg-background rounded-lg p-4 border border-secondary/20">
                    <p className="font-paragraph text-sm text-foreground/60 mb-1">Hospital</p>
                    <p className="font-paragraph text-base font-semibold text-foreground">{medicalEvaluation.hospitalName}</p>
                  </div>

                  <div className="bg-background rounded-lg p-4 border border-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <p className="font-paragraph text-xs text-foreground/60 uppercase tracking-wide">Data/Hora da Avaliação</p>
                    </div>
                    <p className="font-paragraph text-sm text-foreground">
                      {new Date(medicalEvaluation.evaluationDate || '').toLocaleDateString('pt-BR')} às {new Date(medicalEvaluation.evaluationDate || '').toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="border-t border-secondary/30 pt-6 space-y-6">
                    <div>
                      <p className="font-paragraph text-sm font-semibold text-foreground/60 mb-2">Condição Clínica</p>
                      <p className="font-paragraph text-base text-foreground">{medicalEvaluation.clinicalCondition}</p>
                    </div>

                    <div>
                      <p className="font-paragraph text-sm font-semibold text-foreground/60 mb-2">Conduta Médica</p>
                      <div className="bg-background rounded-lg p-3 border border-secondary/20">
                        <p className="font-paragraph text-sm text-foreground whitespace-pre-wrap">
                          {medicalEvaluation.medicalConduct}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="font-paragraph text-sm font-semibold text-foreground/60 mb-2">Prescrição Médica</p>
                      <div className="bg-background rounded-lg p-3 border border-secondary/20">
                        <p className="font-paragraph text-sm text-foreground whitespace-pre-wrap">
                          {medicalEvaluation.medicalPrescription || '-'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="font-paragraph text-sm font-semibold text-foreground/60 mb-2">Recomendações ao Paciente</p>
                      <div className="bg-background rounded-lg p-3 border border-secondary/20">
                        <p className="font-paragraph text-sm text-foreground whitespace-pre-wrap">
                          {medicalEvaluation.patientRecommendations || '-'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="font-paragraph text-sm font-semibold text-foreground/60 mb-2">Necessita Acompanhamento</p>
                      <p className="font-paragraph text-base text-foreground">
                        {medicalEvaluation.needsFollowUp ? 'Sim' : 'Não'}
                      </p>
                    </div>

                    <div>
                      <p className="font-paragraph text-sm font-semibold text-foreground/60 mb-2">Status Final</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        medicalEvaluation.status === 'Alta'
                          ? 'bg-stable/20 text-stable'
                          : 'bg-primary/20 text-primary'
                      }`}>
                        {medicalEvaluation.status === 'Alta' ? 'ALTA' : 'CONTINUIDADE'}
                      </span>
                    </div>

                    {medicalEvaluation.medicalObservations && (
                      <div>
                        <p className="font-paragraph text-sm font-semibold text-foreground/60 mb-2">Observações Médicas</p>
                        <div className="bg-background rounded-lg p-3 border border-secondary/20">
                          <p className="font-paragraph text-sm text-foreground whitespace-pre-wrap">
                            {medicalEvaluation.medicalObservations}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
                  <p className="font-paragraph text-sm text-foreground/60">
                    Nenhuma avaliação médica encontrada
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
