import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Send, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BaseCrudService } from '@/integrations';
import type { Pacientes, ChecklistsDirios, AvaliaesdeEnfermagem, AvaliaesMdicas } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';

export default function MedicalEvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [patient, setPatient] = useState<Pacientes | null>(null);
  const [checklists, setChecklists] = useState<ChecklistsDirios[]>([]);
  const [nursingEvaluation, setNursingEvaluation] = useState<AvaliaesdeEnfermagem | null>(null);
  
  const [formData, setFormData] = useState({
    doctorName: '',
    clinicalRecommendations: '',
    hospitalReturnRecommended: false,
    inPersonEvaluationRecommended: false,
    medicationGuidanceAdjustment: '',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      const patientData = await BaseCrudService.getById<Pacientes>('pacientes', id);
      setPatient(patientData);

      const { items: checklistItems } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
      // Filter checklists by patient ID only
      const patientChecklists = checklistItems.filter(c => c.patientId === id);
      setChecklists(patientChecklists.sort((a, b) => 
        new Date(b.checklistDate || 0).getTime() - new Date(a.checklistDate || 0).getTime()
      ));

      const { items: evaluations } = await BaseCrudService.getAll<AvaliaesdeEnfermagem>('avaliacoesenfermagem');
      // Filter evaluations by patient ID
      const patientEvaluations = evaluations.filter(e => e.patientId === id);
      const latestEvaluation = patientEvaluations.sort((a, b) => 
        new Date(b.checklistDate || 0).getTime() - new Date(a.checklistDate || 0).getTime()
      )[0];
      setNursingEvaluation(latestEvaluation || null);
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
      const evaluation: AvaliaesMdicas = {
        _id: crypto.randomUUID(),
        patientId: id,
        nursingEvaluationId: nursingEvaluation?._id || '',
        ...formData,
      };

      await BaseCrudService.create('avaliacoesmedicas', evaluation);
      alert('Avaliação médica enviada com sucesso!');
      navigate('/medical-dashboard');
    } catch (error) {
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

  if (!patient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-secondary/30">
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
              </div>
            </div>

            {/* Nursing Evaluation */}
            {nursingEvaluation && (
              <div className="bg-white rounded-2xl p-8 border border-secondary/20">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="w-6 h-6 text-primary" />
                  <h2 className="font-heading text-2xl font-bold text-foreground">
                    Avaliação da Enfermagem
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
                    <p className="font-paragraph text-sm text-foreground/60 mb-1">Status do Paciente</p>
                    <span className={`inline-block font-paragraph text-sm font-semibold px-3 py-1 rounded-full ${
                      nursingEvaluation.patientStatus === 'critical'
                        ? 'bg-critical/10 text-critical'
                        : nursingEvaluation.patientStatus === 'observation'
                        ? 'bg-attention/10 text-attention-foreground'
                        : 'bg-stable/10 text-stable'
                    }`}>
                      {nursingEvaluation.patientStatus === 'critical'
                        ? 'Crítico'
                        : nursingEvaluation.patientStatus === 'observation'
                        ? 'Em Observação'
                        : 'Estável'}
                    </span>
                  </div>
                  <div>
                    <p className="font-paragraph text-sm text-foreground/60 mb-2">Observações Clínicas</p>
                    <div className="bg-background rounded-xl p-4">
                      <p className="font-paragraph text-sm text-foreground">
                        {nursingEvaluation.clinicalObservations}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="font-paragraph text-sm text-foreground/60 mb-2">Orientações ao Paciente</p>
                    <div className="bg-background rounded-xl p-4">
                      <p className="font-paragraph text-sm text-foreground">
                        {nursingEvaluation.patientGuidelines}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Checklists History */}
            {checklists.length > 0 ? (
              <div className="space-y-8">
                {checklists.map((checklist, index) => (
                  <div key={checklist._id} className="bg-white rounded-2xl p-8 border border-secondary/20">
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
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div>
                        <p className="font-paragraph text-sm text-foreground/60 mb-1">Nível de Dor</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {checklist.painLevel}/10
                        </p>
                      </div>
                      <div>
                        <p className="font-paragraph text-sm text-foreground/60 mb-1">Temperatura</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {checklist.bodyTemperature}°C
                        </p>
                      </div>
                      <div>
                        <p className="font-paragraph text-sm text-foreground/60 mb-1">Febre</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {checklist.hasFever ? 'Sim' : 'Não'}
                        </p>
                      </div>
                      <div>
                        <p className="font-paragraph text-sm text-foreground/60 mb-1">Vermelhidão</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {checklist.scarRedness ? 'Sim' : 'Não'}
                        </p>
                      </div>
                      <div>
                        <p className="font-paragraph text-sm text-foreground/60 mb-1">Secreção</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {checklist.hasSecretion ? 'Sim' : 'Não'}
                        </p>
                      </div>
                      <div>
                        <p className="font-paragraph text-sm text-foreground/60 mb-1">Falta de Ar</p>
                        <p className="font-paragraph text-base font-semibold text-foreground">
                          {checklist.shortnessOfBreath ? 'Sim' : 'Não'}
                        </p>
                      </div>
                    </div>

                    {checklist.scarPhoto && (
                      <div className="mt-6">
                        <p className="font-paragraph text-sm font-semibold text-foreground mb-3">Foto da Cicatriz</p>
                        <Image
                          src={checklist.scarPhoto}
                          alt="Foto da cicatriz"
                          width={400}
                          className="rounded-xl border border-secondary/20 max-w-md"
                        />
                      </div>
                    )}
                  </div>
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
                <div>
                  <Label className="font-paragraph text-sm font-semibold text-foreground mb-2 block">
                    Nome do Médico(a)
                  </Label>
                  <input
                    type="text"
                    value={formData.doctorName}
                    onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                    className="w-full px-4 py-3 border border-secondary rounded-lg font-paragraph focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Dr(a). Seu nome"
                    required
                  />
                </div>

                <div>
                  <Label className="font-paragraph text-sm font-semibold text-foreground mb-2 block">
                    Recomendações Clínicas
                  </Label>
                  <Textarea
                    value={formData.clinicalRecommendations}
                    onChange={(e) => setFormData({ ...formData, clinicalRecommendations: e.target.value })}
                    className="font-paragraph min-h-[120px]"
                    placeholder="Descreva suas recomendações clínicas..."
                    required
                  />
                </div>

                <div>
                  <Label className="font-paragraph text-sm font-semibold text-foreground mb-2 block">
                    Ajuste de Medicação/Orientações
                  </Label>
                  <Textarea
                    value={formData.medicationGuidanceAdjustment}
                    onChange={(e) => setFormData({ ...formData, medicationGuidanceAdjustment: e.target.value })}
                    className="font-paragraph min-h-[100px]"
                    placeholder="Ajustes necessários..."
                  />
                </div>

                <div className="pt-4 border-t border-secondary/30 space-y-4">
                  <div>
                    <Label className="font-paragraph text-sm font-semibold text-foreground mb-3 block">
                      Retorno Hospitalar Recomendado?
                    </Label>
                    <RadioGroup
                      value={formData.hospitalReturnRecommended ? 'yes' : 'no'}
                      onValueChange={(value) => setFormData({ ...formData, hospitalReturnRecommended: value === 'yes' })}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="yes" id="hospital-yes" />
                        <Label htmlFor="hospital-yes" className="font-paragraph cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="hospital-no" />
                        <Label htmlFor="hospital-no" className="font-paragraph cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="font-paragraph text-sm font-semibold text-foreground mb-3 block">
                      Avaliação Presencial Recomendada?
                    </Label>
                    <RadioGroup
                      value={formData.inPersonEvaluationRecommended ? 'yes' : 'no'}
                      onValueChange={(value) => setFormData({ ...formData, inPersonEvaluationRecommended: value === 'yes' })}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="yes" id="person-yes" />
                        <Label htmlFor="person-yes" className="font-paragraph cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id="person-no" />
                        <Label htmlFor="person-no" className="font-paragraph cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
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
                      Enviar Avaliação Médica
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
