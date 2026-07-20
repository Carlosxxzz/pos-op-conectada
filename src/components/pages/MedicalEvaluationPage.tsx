import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Send, FileText, AlertCircle, Clock, User, Building2, Calendar, Pill, Thermometer, Heart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BaseCrudService } from '@/integrations';
import type { Pacientes, ChecklistsDirios, AvaliaesdeEnfermagem, AvaliaesMdicas, Profissionais } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';
import { motion } from 'framer-motion';

export default function MedicalEvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [patient, setPatient] = useState<Pacientes | null>(null);
  const [checklists, setChecklists] = useState<ChecklistsDirios[]>([]);
  const [nursingEvaluation, setNursingEvaluation] = useState<AvaliaesdeEnfermagem | null>(null);
  const [referralChecklist, setReferralChecklist] = useState<ChecklistsDirios | null>(null);
  const [referralData, setReferralData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    clinicalCondition: 'stable',
    medicalConduct: '',
    medicalPrescription: '',
    patientRecommendations: '',
    needsFollowUp: true,
    medicalObservations: '',
  });

  const [professional, setProfessional] = useState<Profissionais | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      // Get professional info to verify access
      const professionalId = localStorage.getItem('professionalId');
      const professionalProfile = localStorage.getItem('professionalProfile');
      
      if (!professionalId || !professionalProfile) {
        navigate('/professional-login');
        return;
      }

      // Verify professional has Médico profile
      if (professionalProfile !== 'Médico') {
        setIsLoading(false);
        return;
      }

      const professionalData = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
      setProfessional(professionalData);
      
      const patientData = await BaseCrudService.getById<Pacientes>('pacientes', id);
      setPatient(patientData);

      // Load referral data to find the checklist
      const { items: referrals } = await BaseCrudService.getAll<any>('encaminhamentosmedicos');
      const referral = referrals.find(r => r.patientId === id && r.doctorId === professionalId);
      
      if (!referral) {
        console.error('No referral found for this patient and doctor');
        setIsLoading(false);
        return;
      }

      setReferralData(referral);

      // Get the specific checklist from the referral
      const { items: checklistItems } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
      const referralChecklistId = referral.checklistId;
      const referralChecklistData = checklistItems.find(c => c._id === referralChecklistId);
      
      if (referralChecklistData) {
        setReferralChecklist(referralChecklistData);
        setChecklists([referralChecklistData]);

        // Check if this checklist has already been evaluated by this doctor
        const { items: medicalEvaluations } = await BaseCrudService.getAll<AvaliaesMdicas>('avaliacoesmedicas');
        const existingEvaluation = medicalEvaluations.find(
          e => e.checklistId === referralChecklistId && e.patientId === id
        );

        if (existingEvaluation) {
          // Redirect to history page if evaluation already exists
          navigate(`/medical-evaluation-history/${id}`);
          return;
        }
      }

      // Get nursing evaluation if it exists
      const { items: evaluations } = await BaseCrudService.getAll<AvaliaesdeEnfermagem>('avaliacoesenfermagem');
      const patientEvaluations = evaluations.filter(e => e.patientId === id && e.checklistId === referralChecklistId);
      
      if (patientEvaluations.length > 0) {
        setNursingEvaluation(patientEvaluations[0]);
      } else if (referral) {
        // Create a synthetic nursing evaluation object from the referral data
        const syntheticEvaluation: AvaliaesdeEnfermagem = {
          _id: 'synthetic-' + referral._id,
          checklistId: referral.checklistId,
          patientId: referral.patientId,
          nurseName: referral.nurseName,
          clinicalObservations: referral.nurseMessage, // Use the referral reason as clinical observations
          patientGuidelines: '',
          patientStatus: 'stable',
          referredToDoctor: true,
        };
        setNursingEvaluation(syntheticEvaluation);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!id || !patient || !professional || !referralChecklist || !referralData) {
        alert('Erro: Dados não identificados');
        return;
      }

      const medicalEvaluationId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const evaluation: AvaliaesMdicas = {
        _id: medicalEvaluationId,
        patientId: id,
        nursingEvaluationId: nursingEvaluation?._id || '',
        checklistId: referralChecklist._id,
        doctorName: professional.fullName || professional.email || '',
        enfermeiroResponsavel: nursingEvaluation?.nurseName || '',
        hospitalName: professional.hospital || '',
        evaluationDate: now,
        clinicalCondition: formData.clinicalCondition,
        medicalConduct: formData.medicalConduct,
        medicalPrescription: formData.medicalPrescription,
        patientRecommendations: formData.patientRecommendations,
        needsFollowUp: formData.needsFollowUp,
        medicalObservations: formData.medicalObservations,
        referralReason: nursingEvaluation?.clinicalObservations || '',
        status: formData.needsFollowUp ? 'Continuidade' : 'Alta',
        followUpStatus: formData.needsFollowUp ? 'Continuidade' : 'Alta',
        clinicalRecommendations: formData.medicalConduct,
        hospitalReturnRecommended: false,
        inPersonEvaluationRecommended: false,
        medicationGuidanceAdjustment: formData.medicalPrescription,
      };

      // Create the medical evaluation
      await BaseCrudService.create('avaliacoesmedicas', evaluation);

      // Update the checklist to mark medical evaluation as complete
      const updateChecklistData: any = {
        _id: referralChecklist._id,
        statusMedico: formData.needsFollowUp ? 'Continuidade' : 'Alta',
        medicalEvaluationId: medicalEvaluationId,
        status: formData.needsFollowUp ? 'Continuidade' : 'Alta',
        followUpStatus: formData.needsFollowUp ? 'Continuidade' : 'Alta',
      };

      await BaseCrudService.update('checklistsdiarios', updateChecklistData);

      // Update patient follow-up status
      await BaseCrudService.update('pacientes', {
        _id: id,
        followUpStatus: formData.needsFollowUp ? 'Ativo' : 'Alta',
        lastMedicalEvaluationId: medicalEvaluationId,
      });

      // Update the referral record to mark as CONCLUIDO (completed)
      await BaseCrudService.update('encaminhamentosmedicos', {
        _id: referralData._id,
        viewed: true,
        doctorResponse: formData.medicalConduct,
        responseDate: now,
        status: 'CONCLUIDO',
      });

      // Create notification for patient about medical evaluation
      const notificationId = crypto.randomUUID();
      const patientNotification = {
        _id: notificationId,
        recipientId: id,
        recipientType: 'Paciente',
        message: `Sua avaliação médica foi concluída. ${formData.needsFollowUp ? 'Você necessita de novo acompanhamento.' : 'Você recebeu alta médica.'}`,
        notificationType: 'Avaliação Médica',
        isRead: false,
        timestamp: now,
      };

      await BaseCrudService.create('notificacoes', patientNotification);

      alert('Avaliação médica finalizada com sucesso!');
      navigate('/medical-dashboard');
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('Erro ao enviar avaliação');
    } finally {
      setIsSaving(false);
    }
  };

  const latestChecklist = checklists[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!patient || !referralChecklist) {
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

  const calculateDaysSinceSurgery = () => {
    if (!patient?.surgeryDate) return 0;
    const surgery = new Date(patient.surgeryDate);
    const today = new Date();
    const diffMs = today.getTime() - surgery.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

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
                <p className="font-paragraph text-sm text-foreground/60">Avaliação Médica</p>
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

            {/* Checklists History */}
            {checklists.length > 0 ? (
              <div className="space-y-8">
                {checklists.map((checklist, index) => (
                  <motion.div
                    key={checklist._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-white rounded-2xl p-8 border border-secondary/20"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="font-heading text-2xl font-bold text-foreground">
                          {index === 0 ? 'Último Checklist' : `Checklist ${checklists.length - index}`}
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
                        <Image
                          src={checklist.scarPhoto}
                          alt="Foto da cicatriz"
                          width={400}
                          className="rounded-xl border border-secondary/20 max-w-md"
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 border border-secondary/20 text-center">
                <p className="font-paragraph text-base text-foreground/60">
                  Nenhum checklist do paciente disponível
                </p>
              </div>
            )}
          </div>

          {/* Medical Evaluation Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-secondary/20 sticky top-8">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                Avaliação Médica
              </h2>

              <div className="space-y-6">
                <div className="bg-background rounded-lg p-4 border border-secondary/20">
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Nome do Médico(a)</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">{professional?.fullName || professional?.email}</p>
                </div>

                <div className="bg-background rounded-lg p-4 border border-secondary/20">
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Hospital</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">{professional?.hospital}</p>
                </div>

                <div className="bg-background rounded-lg p-4 border border-secondary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <p className="font-paragraph text-xs text-foreground/60 uppercase tracking-wide">Data/Hora</p>
                  </div>
                  <p className="font-paragraph text-sm text-foreground">
                    {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="border-t border-secondary/30 pt-6 space-y-6">
                  {/* Clinical Condition */}
                  <div>
                    <Label className="font-paragraph text-sm font-semibold text-foreground mb-3 block">
                      Condição Clínica *
                    </Label>
                    <RadioGroup
                      value={formData.clinicalCondition}
                      onValueChange={(value) => setFormData({ ...formData, clinicalCondition: value })}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="stable" id="cond-stable" />
                        <Label htmlFor="cond-stable" className="font-paragraph cursor-pointer">Estável</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="improving" id="cond-improving" />
                        <Label htmlFor="cond-improving" className="font-paragraph cursor-pointer">Melhorando</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="observation" id="cond-observation" />
                        <Label htmlFor="cond-observation" className="font-paragraph cursor-pointer">Em Observação</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="attention" id="cond-attention" />
                        <Label htmlFor="cond-attention" className="font-paragraph cursor-pointer">Atenção</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="critical" id="cond-critical" />
                        <Label htmlFor="cond-critical" className="font-paragraph cursor-pointer">Crítico</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Medical Conduct */}
                  <div>
                    <Label className="font-paragraph text-sm font-semibold text-foreground mb-2 block">
                      Conduta Médica *
                    </Label>
                    <Textarea
                      value={formData.medicalConduct}
                      onChange={(e) => setFormData({ ...formData, medicalConduct: e.target.value })}
                      className="font-paragraph min-h-[100px]"
                      placeholder="Ex: Manter tratamento atual, Ajustar medicação, Prescrever novo medicamento, Solicitar retorno ao hospital, Solicitar exames, Encaminhar para especialista, Internação necessária, Alta médica..."
                      required
                    />
                  </div>

                  {/* Medical Prescription */}
                  <div>
                    <Label className="font-paragraph text-sm font-semibold text-foreground mb-2 block">
                      Prescrição Médica
                    </Label>
                    <Textarea
                      value={formData.medicalPrescription}
                      onChange={(e) => setFormData({ ...formData, medicalPrescription: e.target.value })}
                      className="font-paragraph min-h-[100px]"
                      placeholder="Medicamentos, doses, horários e orientações..."
                    />
                  </div>

                  {/* Patient Recommendations */}
                  <div>
                    <Label className="font-paragraph text-sm font-semibold text-foreground mb-2 block">
                      Recomendações ao Paciente
                    </Label>
                    <Textarea
                      value={formData.patientRecommendations}
                      onChange={(e) => setFormData({ ...formData, patientRecommendations: e.target.value })}
                      className="font-paragraph min-h-[100px]"
                      placeholder="Repouso, hidratação, retorno em X dias, evitar esforço, observar sinais de alerta..."
                    />
                  </div>

                  {/* Follow-up Decision */}
                  <div>
                    <Label className="font-paragraph text-sm font-semibold text-foreground mb-3 block">
                      Necessita novo acompanhamento? *
                    </Label>
                    <RadioGroup
                      value={formData.needsFollowUp ? 'yes' : 'no'}
                      onValueChange={(value) => setFormData({ ...formData, needsFollowUp: value === 'yes' })}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="yes" id="followup-yes" />
                        <Label htmlFor="followup-yes" className="font-paragraph cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="followup-no" />
                        <Label htmlFor="followup-no" className="font-paragraph cursor-pointer">Não (Alta)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Medical Observations */}
                  <div>
                    <Label className="font-paragraph text-sm font-semibold text-foreground mb-2 block">
                      Observações Médicas
                    </Label>
                    <Textarea
                      value={formData.medicalObservations}
                      onChange={(e) => setFormData({ ...formData, medicalObservations: e.target.value })}
                      className="font-paragraph min-h-[80px]"
                      placeholder="Informações adicionais (visível apenas aos profissionais)..."
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSaving || !formData.medicalConduct}
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-6 rounded-lg"
                >
                  {isSaving ? (
                    'Finalizando...'
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Finalizar Avaliação Médica
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
