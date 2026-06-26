import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Send, AlertTriangle, Image as ImageIcon, Pill, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BaseCrudService } from '@/integrations';
import type { Pacientes, ChecklistsDirios, AvaliaesdeEnfermagem, Profissionais, MedicacoesChecklist } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';

export default function NursingEvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [patient, setPatient] = useState<Pacientes | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistsDirios | null>(null);
  const [checklists, setChecklists] = useState<ChecklistsDirios[]>([]);
  const [professional, setProfessional] = useState<Profissionais | null>(null);
  const [medicationsByChecklist, setMedicationsByChecklist] = useState<{ [key: string]: MedicacoesChecklist[] }>({});
  const [error, setError] = useState<string>('');
   
  const [formData, setFormData] = useState({
    nurseName: '',
    clinicalObservations: '',
    patientGuidelines: '',
    patientStatus: 'stable',
    referredToDoctor: false,
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      // Get professional info
      const professionalId = localStorage.getItem('professionalId');
      if (!professionalId) {
        navigate('/professional-login');
        return;
      }

      const professionalData = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
      setProfessional(professionalData);

      const patientData = await BaseCrudService.getById<Pacientes>('pacientes', id);
      
      // Verify patient belongs to same hospital
      if (patientData?.hospital !== professionalData?.hospital) {
        navigate('/nursing-dashboard');
        return;
      }

      setPatient(patientData);

      const { items } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
      // Filter checklists by patient ID and get only PENDING ones
      const patientChecklists = items.filter(c => 
        c.patientId === id && (c.statusEnfermagem === 'Pendente' || !c.avaliadoEnfermagem)
      );
      
      const sortedChecklists = patientChecklists.sort((a, b) => 
        new Date(b.checklistDate || 0).getTime() - new Date(a.checklistDate || 0).getTime()
      );

      setChecklists(sortedChecklists);

      // Set the first pending checklist as selected
      if (sortedChecklists.length > 0) {
        setSelectedChecklist(sortedChecklists[0]);
      } else {
        setError('Nenhum checklist pendente para este paciente. Todos já foram avaliados.');
      }

      // Load medications for each checklist
      const { items: allMedications } = await BaseCrudService.getAll<MedicacoesChecklist>('medicacoeschecklist');
      const medsByChecklist: { [key: string]: MedicacoesChecklist[] } = {};
      
      patientChecklists.forEach(checklist => {
        const checklistDateStr = new Date(checklist.checklistDate || '').toISOString().split('T')[0];
        medsByChecklist[checklist._id] = allMedications.filter(med => {
          const medDateStr = new Date(med.checklistDate || '').toISOString().split('T')[0];
          return medDateStr === checklistDateStr;
        });
      });
      
      setMedicationsByChecklist(medsByChecklist);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erro ao carregar dados. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!id || !patient || !professional || !selectedChecklist) {
        alert('Erro: Dados não identificados');
        return;
      }

      // Double-check that the checklist hasn't been evaluated already
      const checklistCheck = await BaseCrudService.getById<ChecklistsDirios>('checklistsdiarios', selectedChecklist._id);
      if (checklistCheck?.avaliadoEnfermagem || checklistCheck?.statusEnfermagem === 'Concluído') {
        alert('Este checklist já foi avaliado. Por favor, retorne ao dashboard.');
        navigate('/nursing-dashboard');
        return;
      }

      const evaluationId = crypto.randomUUID();
      const now = new Date().toISOString();
      
      const evaluation: AvaliaesdeEnfermagem = {
        _id: evaluationId,
        checklistDate: now,
        patientId: id,
        checklistId: selectedChecklist._id,
        nurseName: formData.nurseName,
        clinicalObservations: formData.clinicalObservations,
        patientGuidelines: formData.patientGuidelines,
        patientStatus: formData.patientStatus,
        referredToDoctor: formData.referredToDoctor,
      };

      // Create the nursing evaluation
      await BaseCrudService.create('avaliacoesenfermagem', evaluation);

      console.log('[NURSING] Avaliação criada', {
        evaluationId: evaluationId.substring(0, 8),
        checklistId: selectedChecklist._id.substring(0, 8),
        patientId: id.substring(0, 8),
        referredToDoctor: formData.referredToDoctor,
      });

      // Update the checklist status to mark it as evaluated
      const updateData: any = {
        _id: selectedChecklist._id,
        statusEnfermagem: formData.referredToDoctor ? 'Encaminhado' : 'Concluído',
        avaliadoEnfermagem: true,
        dataAvaliacaoEnfermagem: now,
        enfermeiroResponsavel: professional.fullName || professional.email || '',
      };

      // If referring to doctor, also set the doctor referral fields
      if (formData.referredToDoctor) {
        updateData.status = 'Aguardando Avaliação Médica';
        updateData.encaminhadoMedico = true;
        updateData.dataEncaminhamento = now;
      }

      await BaseCrudService.update('checklistsdiarios', updateData);

      console.log('[NURSING] Checklist atualizado', {
        checklistId: selectedChecklist._id.substring(0, 8),
        statusEnfermagem: updateData.statusEnfermagem,
        avaliadoEnfermagem: true,
        referredToDoctor: formData.referredToDoctor,
      });

      alert('Avaliação enviada com sucesso!');
      navigate('/nursing-dashboard');
    } catch (error) {
      console.error('[NURSING] Erro ao enviar avaliação:', error);
      alert('Erro ao enviar avaliação. Por favor, tente novamente.');
    } finally {
      setIsSaving(false);
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
        <header className="bg-white border-b border-secondary/30">
          <div className="max-w-[120rem] mx-auto px-8 py-6">
            <div className="flex items-center justify-between">
              <Link to="/nursing-dashboard" className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Activity className="w-7 h-7 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                  <p className="font-paragraph text-sm text-foreground/60">Avaliação de Enfermagem</p>
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
            <p className="font-paragraph text-base text-foreground/70 mb-6">{error}</p>
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

  if (!patient || !selectedChecklist) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-secondary/30">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/nursing-dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Avaliação de Enfermagem</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient Info & Checklist */}
          <div className="lg:col-span-2 space-y-8">
            {/* Patient Info */}
            <div className="bg-white rounded-2xl p-8 border border-secondary/20">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                Informações do Paciente
              </h2>
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
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Hospital</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">{patient.responsibleHospital}</p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Médico Responsável</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">{patient.responsibleDoctorName}</p>
                </div>
              </div>
            </div>

            {/* Selected Checklist */}
            <div className="bg-white rounded-2xl p-8 border border-secondary/20">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Checklist para Avaliação
                  </h2>
                  <p className="font-paragraph text-sm text-foreground/60 mt-1">
                    {new Date(selectedChecklist.checklistDate || '').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={`font-paragraph text-sm font-semibold px-4 py-2 rounded-full ${
                  selectedChecklist.riskLevel === 'critical' 
                    ? 'bg-critical/10 text-critical'
                    : selectedChecklist.riskLevel === 'attention'
                    ? 'bg-attention/10 text-attention-foreground'
                    : 'bg-stable/10 text-stable'
                }`}>
                  {selectedChecklist.riskLevel === 'critical' 
                    ? 'CRÍTICO'
                    : selectedChecklist.riskLevel === 'attention'
                    ? 'ATENÇÃO'
                    : 'ESTÁVEL'}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Nível de Dor</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {selectedChecklist.painLevel}/10
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Temperatura</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {selectedChecklist.bodyTemperature}°C
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Febre</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {selectedChecklist.hasFever ? 'Sim' : 'Não'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Vermelhidão</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {selectedChecklist.scarRedness ? 'Sim' : 'Não'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Secreção</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {selectedChecklist.hasSecretion ? 'Sim' : 'Não'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Mau Cheiro</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {selectedChecklist.hasBadOdor ? 'Sim' : 'Não'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Falta de Ar</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {selectedChecklist.shortnessOfBreath ? 'Sim' : 'Não'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Tontura</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {selectedChecklist.dizziness ? 'Sim' : 'Não'}
                  </p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Medicação</p>
                  <p className="font-paragraph text-base font-semibold text-foreground">
                    {selectedChecklist.takingMedicationCorrectly ? 'Sim' : 'Não'}
                  </p>
                </div>
              </div>

              {/* Medications Section */}
              {selectedChecklist.takingMedicationCorrectly && medicationsByChecklist[selectedChecklist._id]?.length > 0 && (
                <div className="mt-8 pt-8 border-t border-secondary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Pill className="w-5 h-5 text-primary" />
                    <h3 className="font-heading text-lg font-bold text-foreground">Medicamentos Tomados</h3>
                  </div>
                  <div className="space-y-3">
                    {medicationsByChecklist[selectedChecklist._id].map((med) => (
                      <div key={med._id} className="bg-background rounded-lg p-4 border border-secondary/10">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1">Medicamento</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground">{med.medicationName}</p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1">Horário</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground">{med.timeTaken}</p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1">Dose</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground">{med.doseQuantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medication Not Taken Reason */}
              {!selectedChecklist.takingMedicationCorrectly && selectedChecklist.reasonNotTakingMedication && (
                <div className="mt-8 pt-8 border-t border-secondary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-attention" />
                    <h3 className="font-heading text-lg font-bold text-foreground">Motivo - Não Tomou Medicação</h3>
                  </div>
                  <div className="bg-attention/10 rounded-lg p-4 border border-attention/20">
                    <p className="font-paragraph text-sm text-foreground">{selectedChecklist.reasonNotTakingMedication}</p>
                  </div>
                </div>
              )}

              {selectedChecklist.scarPhoto && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    <p className="font-paragraph text-sm font-semibold text-foreground">Foto da Cicatriz</p>
                  </div>
                  <Image
                    src={selectedChecklist.scarPhoto}
                    alt="Foto da cicatriz"
                    width={400}
                    className="rounded-xl border border-secondary/20 max-w-md"
                  />
                </div>
              )}
            </div>

            {/* Other Pending Checklists */}
            {checklists.length > 1 && (
              <div className="bg-white rounded-2xl p-8 border border-secondary/20">
                <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                  Outros Checklists Pendentes ({checklists.length - 1})
                </h3>
                <div className="space-y-3">
                  {checklists.slice(1).map((checklist) => (
                    <div key={checklist._id} className="p-4 bg-background rounded-lg border border-secondary/10">
                      <p className="font-paragraph text-sm font-semibold text-foreground">
                        {new Date(checklist.checklistDate || '').toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="font-paragraph text-xs text-foreground/60 mt-1">
                        Risco: {checklist.riskLevel === 'critical' ? 'Crítico' : checklist.riskLevel === 'attention' ? 'Atenção' : 'Estável'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Evaluation Form */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-secondary/20 sticky top-8">
              <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
                Avaliação de Enfermagem
              </h2>

              <div className="space-y-6">
                <div>
                  <Label className="font-paragraph text-sm font-semibold text-foreground mb-2 block">
                    Nome do Enfermeiro(a)
                  </Label>
                  <input
                    type="text"
                    value={formData.nurseName}
                    onChange={(e) => setFormData({ ...formData, nurseName: e.target.value })}
                    className="w-full px-4 py-3 border border-secondary rounded-lg font-paragraph focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Seu nome"
                    required
                  />
                </div>

                <div>
                  <Label className="font-paragraph text-sm font-semibold text-foreground mb-2 block">
                    Observações Clínicas
                  </Label>
                  <Textarea
                    value={formData.clinicalObservations}
                    onChange={(e) => setFormData({ ...formData, clinicalObservations: e.target.value })}
                    className="font-paragraph min-h-[100px]"
                    placeholder="Descreva suas observações sobre o estado do paciente..."
                    required
                  />
                </div>

                <div>
                  <Label className="font-paragraph text-sm font-semibold text-foreground mb-2 block">
                    Orientações ao Paciente
                  </Label>
                  <Textarea
                    value={formData.patientGuidelines}
                    onChange={(e) => setFormData({ ...formData, patientGuidelines: e.target.value })}
                    className="font-paragraph min-h-[100px]"
                    placeholder="Orientações e recomendações..."
                    required
                  />
                </div>

                <div>
                  <Label className="font-paragraph text-sm font-semibold text-foreground mb-3 block">
                    Status do Paciente
                  </Label>
                  <RadioGroup
                    value={formData.patientStatus}
                    onValueChange={(value) => setFormData({ ...formData, patientStatus: value })}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="stable" id="status-stable" />
                      <Label htmlFor="status-stable" className="font-paragraph cursor-pointer">Estável</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="observation" id="status-observation" />
                      <Label htmlFor="status-observation" className="font-paragraph cursor-pointer">Em Observação</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="critical" id="status-critical" />
                      <Label htmlFor="status-critical" className="font-paragraph cursor-pointer">Crítico</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="pt-4 border-t border-secondary/30">
                  <div className="flex items-start gap-3 p-4 bg-attention/10 rounded-xl mb-4">
                    <AlertTriangle className="w-5 h-5 text-attention-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-paragraph text-sm font-semibold text-foreground mb-1">
                        Encaminhar para Médico?
                      </p>
                      <p className="font-paragraph text-xs text-foreground/70">
                        Marque se o caso necessita avaliação médica
                      </p>
                    </div>
                  </div>
                  <RadioGroup
                    value={formData.referredToDoctor ? 'yes' : 'no'}
                    onValueChange={(value) => setFormData({ ...formData, referredToDoctor: value === 'yes' })}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="refer-yes" />
                      <Label htmlFor="refer-yes" className="font-paragraph cursor-pointer">Sim, encaminhar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="refer-no" />
                      <Label htmlFor="refer-no" className="font-paragraph cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-6 rounded-lg"
                >
                  {isSaving ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Finalizar Avaliação
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
