import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowLeft, AlertCircle, Clock, User, Building2, FileText, CheckCircle,
  AlertTriangle, Pill, ImageIcon, Calendar, Stethoscope, Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type {
  Pacientes, ChecklistsDirios, AvaliaesdeEnfermagem, Profissionais,
  EncaminhamentosMdicos, AvaliaesMdicas, MedicacoesChecklist, PatientFollowupStatus
} from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';
import { motion } from 'framer-motion';

export default function NursingReferralViewPage() {
  const { referralId } = useParams<{ referralId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const [patient, setPatient] = useState<Pacientes | null>(null);
  const [checklist, setChecklist] = useState<ChecklistsDirios | null>(null);
  const [referral, setReferral] = useState<EncaminhamentosMdicos | null>(null);
  const [medicalEval, setMedicalEval] = useState<AvaliaesMdicas | null>(null);
  const [medications, setMedications] = useState<MedicacoesChecklist[]>([]);
  const [followUpStatus, setFollowUpStatus] = useState<PatientFollowupStatus | null>(null);
  const [professional, setProfessional] = useState<Profissionais | null>(null);

  useEffect(() => {
    loadData();
  }, [referralId]);

  const loadData = async () => {
    if (!referralId) return;

    try {
      // Verify professional is logged in
      const professionalId = localStorage.getItem('professionalId');
      const professionalProfile = localStorage.getItem('professionalProfile');

      if (!professionalId || professionalProfile !== 'Enfermeiro') {
        navigate('/professional-login');
        return;
      }

      const professionalData = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
      if (!professionalData) {
        navigate('/professional-login');
        return;
      }

      setProfessional(professionalData);

      // Load checklist first (referralId is actually checklistId)
      const checklistData = await BaseCrudService.getById<ChecklistsDirios>('checklistsdiarios', referralId);
      if (!checklistData) {
        setError('Checklist não encontrado.');
        return;
      }

      setChecklist(checklistData);

      // Load patient
      const patientData = await BaseCrudService.getById<Pacientes>('pacientes', checklistData.patientId || '');
      if (!patientData) {
        setError('Paciente não encontrado.');
        return;
      }

      // Verify nurse has access to this patient (same hospital)
      if (patientData.hospital !== professionalData.hospital) {
        navigate('/nursing-dashboard');
        return;
      }

      setPatient(patientData);

      // Load referral for this checklist
      const { items: allReferrals } = await BaseCrudService.getAll<EncaminhamentosMdicos>('encaminhamentosmedicos');
      const referralData = allReferrals.find(r => r.checklistId === referralId);
      if (!referralData) {
        setError('Encaminhamento não encontrado.');
        return;
      }

      setReferral(referralData);

      // Load medications for this checklist
      const { items: allMeds } = await BaseCrudService.getAll<MedicacoesChecklist>('medicacoeschecklist');
      const checklistDateStr = new Date(checklistData.checklistDate || '').toISOString().split('T')[0];
      const checklistMeds = allMeds.filter(med => {
        const medDateStr = new Date(med.checklistDate || '').toISOString().split('T')[0];
        return medDateStr === checklistDateStr;
      });
      setMedications(checklistMeds);

      // Load medical evaluation if exists (search by referral ID in nursingEvaluationId field)
      const { items: medicalEvals } = await BaseCrudService.getAll<AvaliaesMdicas>('avaliacoesmedicas');
      const eval_ = medicalEvals.find(e => e.nursingEvaluationId === referralData._id);
      if (eval_) {
        setMedicalEval(eval_);
      }

      // Load follow-up status
      const { items: followUpStatuses } = await BaseCrudService.getAll<PatientFollowupStatus>('statusacompanhamentopaciente');
      const status = followUpStatuses.find(s => s.patientName === patientData.fullName);
      if (status) {
        setFollowUpStatus(status);
      }

      // Mark referral as viewed
      if (!referralData.viewed) {
        await BaseCrudService.update('encaminhamentosmedicos', {
          _id: referralData._id,
          viewed: true,
        });
      }
    } catch (err) {
      console.error('Error loading referral data:', err);
      setError('Erro ao carregar dados do encaminhamento.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !referral || !patient || !checklist) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-white border-b border-secondary/30">
          <div className="max-w-[120rem] mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <Link to="/nursing-dashboard" className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Activity className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                  <p className="font-paragraph text-sm text-foreground/60">Visualização de Encaminhamento</p>
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
              <h2 className="font-heading text-xl font-bold text-foreground">Aviso</h2>
            </div>
            <p className="font-paragraph text-base text-foreground/70 mb-6">{error || 'Encaminhamento não encontrado.'}</p>
            <Link to="/nursing-dashboard">
              <Button className="w-full bg-primary text-primary-foreground hover:opacity-90">
                Retornar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDaysInFollowUp = () => {
    if (!patient.surgeryDate) return '-';
    const surgeryDate = new Date(patient.surgeryDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - surgeryDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} dias`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-secondary/30 sticky top-0 z-40">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/nursing-dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Visualização de Encaminhamento (Somente Leitura)</p>
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

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        <div className="space-y-8">
          {/* Patient Data Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Dados do Paciente</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Nome</p>
                <p className="font-paragraph text-base font-semibold text-foreground">{patient.fullName}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">CPF</p>
                <p className="font-paragraph text-base font-semibold text-foreground">{patient.cpf || '-'}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Cartão SUS</p>
                <p className="font-paragraph text-base font-semibold text-foreground">{patient.susNumber || '-'}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Hospital</p>
                <p className="font-paragraph text-base font-semibold text-foreground">{patient.hospital || '-'}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Data da Cirurgia</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {patient.surgeryDate ? new Date(patient.surgeryDate).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Dias de Acompanhamento</p>
                <p className="font-paragraph text-base font-semibold text-foreground">{calculateDaysInFollowUp()}</p>
              </div>
            </div>
          </motion.div>

          {/* Checklist Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Checklist Enviado pelo Paciente</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Data/Hora</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {formatDate(checklist.checklistDate)}
                </p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Nível de Risco</p>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${
                    checklist.riskLevel === 'critical' ? 'bg-critical' :
                    checklist.riskLevel === 'attention' ? 'bg-attention' : 'bg-stable'
                  }`} />
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {checklist.riskLevel === 'critical' ? 'CRÍTICO' :
                     checklist.riskLevel === 'attention' ? 'ATENÇÃO' : 'ESTÁVEL'}
                  </p>
                </div>
              </div>
            </div>

            {/* Checklist Details */}
            <div className="border-t border-secondary/20 pt-6">
              <h3 className="font-heading text-lg font-bold text-foreground mb-4">Respostas do Paciente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-background rounded-lg p-4 border border-secondary/10">
                  <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Nível de Dor</p>
                  <p className="font-paragraph text-lg font-bold text-foreground">{checklist.painLevel}/10</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-secondary/10">
                  <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Temperatura</p>
                  <p className="font-paragraph text-lg font-bold text-foreground">{checklist.bodyTemperature}°C</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-secondary/10">
                  <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Febre</p>
                  <p className="font-paragraph text-lg font-bold text-foreground">{checklist.hasFever ? 'Sim' : 'Não'}</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-secondary/10">
                  <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Vermelhidão na Cicatriz</p>
                  <p className="font-paragraph text-lg font-bold text-foreground">{checklist.scarRedness ? 'Sim' : 'Não'}</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-secondary/10">
                  <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Secreção</p>
                  <p className="font-paragraph text-lg font-bold text-foreground">{checklist.hasSecretion ? 'Sim' : 'Não'}</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-secondary/10">
                  <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Mau Cheiro</p>
                  <p className="font-paragraph text-lg font-bold text-foreground">{checklist.hasBadOdor ? 'Sim' : 'Não'}</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-secondary/10">
                  <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Falta de Ar</p>
                  <p className="font-paragraph text-lg font-bold text-foreground">{checklist.shortnessOfBreath ? 'Sim' : 'Não'}</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-secondary/10">
                  <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Tontura</p>
                  <p className="font-paragraph text-lg font-bold text-foreground">{checklist.dizziness ? 'Sim' : 'Não'}</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-secondary/10">
                  <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Alimentação Normal</p>
                  <p className="font-paragraph text-lg font-bold text-foreground">{checklist.eatingNormally ? 'Sim' : 'Não'}</p>
                </div>
              </div>
            </div>

            {/* Medications */}
            {medications.length > 0 && (
              <div className="border-t border-secondary/20 pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Pill className="w-5 h-5 text-primary" />
                  <h3 className="font-heading text-lg font-bold text-foreground">Medicamentos Tomados</h3>
                </div>
                <div className="space-y-3">
                  {medications.map((med) => (
                    <div key={med._id} className="bg-background rounded-lg p-4 border border-secondary/10">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Medicamento</p>
                          <p className="font-paragraph text-sm font-semibold text-foreground">{med.medicationName}</p>
                        </div>
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Horário</p>
                          <p className="font-paragraph text-sm font-semibold text-foreground">{med.timeTaken}</p>
                        </div>
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Dose</p>
                          <p className="font-paragraph text-sm font-semibold text-foreground">{med.doseQuantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scar Photo */}
            {checklist.scarPhoto && (
              <div className="border-t border-secondary/20 pt-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-heading text-lg font-bold text-foreground">Foto da Cicatriz</h3>
                </div>
                <Image
                  src={checklist.scarPhoto}
                  alt="Foto da cicatriz"
                  width={400}
                  className="rounded-xl border border-secondary/20 max-w-md"
                />
              </div>
            )}
          </motion.div>

          {/* Nursing Evaluation Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Stethoscope className="w-6 h-6 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Avaliação Realizada pela Enfermagem</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Nome do Enfermeiro</p>
                <p className="font-paragraph text-base font-semibold text-foreground">{referral.nurseName || '-'}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Data/Hora da Avaliação</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {formatDate(referral.referralDate)}
                </p>
              </div>
            </div>
            <div className="bg-background rounded-lg p-4 border border-secondary/10">
              <p className="font-paragraph text-xs text-foreground/60 mb-2 uppercase tracking-wide">Observações da Enfermagem</p>
              <p className="font-paragraph text-sm text-foreground">{referral.nurseMessage || '-'}</p>
            </div>
          </motion.div>

          {/* Medical Referral Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-6 h-6 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-foreground">Encaminhamento Médico</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Motivo do Encaminhamento</p>
                <p className="font-paragraph text-base font-semibold text-foreground">{referral.nurseMessage || '-'}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Médico Escolhido</p>
                <p className="font-paragraph text-base font-semibold text-foreground">{referral.doctorName || '-'}</p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Data/Hora do Encaminhamento</p>
                <p className="font-paragraph text-base font-semibold text-foreground">
                  {formatDate(referral.referralDate)}
                </p>
              </div>
              <div className="bg-background rounded-lg p-4 border border-secondary/10">
                <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Status</p>
                <p className="font-paragraph text-base font-semibold text-foreground">{referral.status || '-'}</p>
              </div>
            </div>

            {/* Medical Response Status */}
            {!medicalEval ? (
              <div className="bg-attention/10 border-2 border-attention rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-attention-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground mb-2">
                      Aguardando Avaliação Médica
                    </h3>
                    <p className="font-paragraph text-sm text-foreground/70">
                      O médico ainda não realizou a avaliação. Você será notificado assim que a análise for concluída.
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-attention-foreground" />
                      <p className="font-paragraph text-sm font-semibold text-foreground">
                        Encaminhado há {Math.floor((new Date().getTime() - new Date(referral.referralDate || 0).getTime()) / (1000 * 60 * 60))} horas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-stable/10 border-2 border-stable rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-stable flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                      Avaliação Médica Concluída
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-background rounded-lg p-4 border border-secondary/10">
                        <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Nome do Médico</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">{medicalEval.doctorName || '-'}</p>
                      </div>
                      <div className="bg-background rounded-lg p-4 border border-secondary/10">
                        <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Data da Avaliação</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {formatDate(medicalEval.evaluationDate)}
                        </p>
                      </div>
                      <div className="bg-background rounded-lg p-4 border border-secondary/10">
                        <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Condição Clínica</p>
                        <p className="font-paragraph text-sm text-foreground">{medicalEval.clinicalCondition || '-'}</p>
                      </div>
                      <div className="bg-background rounded-lg p-4 border border-secondary/10">
                        <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Diagnóstico</p>
                        <p className="font-paragraph text-sm text-foreground">{medicalEval.referralReason || '-'}</p>
                      </div>
                      <div className="bg-background rounded-lg p-4 border border-secondary/10">
                        <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Conduta Médica</p>
                        <p className="font-paragraph text-sm text-foreground">{medicalEval.medicalConduct || '-'}</p>
                      </div>
                      <div className="bg-background rounded-lg p-4 border border-secondary/10">
                        <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Prescrição</p>
                        <p className="font-paragraph text-sm text-foreground">{medicalEval.medicalPrescription || '-'}</p>
                      </div>
                      <div className="bg-background rounded-lg p-4 border border-secondary/10">
                        <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Orientações Médicas</p>
                        <p className="font-paragraph text-sm text-foreground">{medicalEval.patientRecommendations || '-'}</p>
                      </div>
                      <div className="bg-background rounded-lg p-4 border border-secondary/10">
                        <p className="font-paragraph text-xs text-foreground/60 mb-1 uppercase tracking-wide">Observações</p>
                        <p className="font-paragraph text-sm text-foreground">{medicalEval.medicalObservations || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/nursing-dashboard" className="flex-1 sm:flex-none">
              <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-6 rounded-lg">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar ao Dashboard
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
