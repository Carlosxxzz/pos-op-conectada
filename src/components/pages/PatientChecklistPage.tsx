import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Save, Smile, Meh, Frown, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BaseCrudService } from '@/integrations';
import type { Pacientes, ChecklistsDirios } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useChecklistFlow } from '@/hooks/useChecklistFlow';
import { logger } from '@/lib/logger';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';

export default function PatientChecklistPage() {
  const navigate = useNavigate();
  const { setTempChecklistData, setSavedChecklistId } = useChecklistFlow();
  const [patient, setPatient] = useState<Pacientes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  
  // Maintain session persistence
  useSessionPersistence();

  const [formData, setFormData] = useState({
    painLevel: 0,
    hasFever: false,
    bodyTemperature: 36.5,
    scarRedness: false,
    hasSecretion: false,
    hasBadOdor: false,
    shortnessOfBreath: false,
    dizziness: false,
    increasingPain: false,
    takingMedicationCorrectly: true,
    eatingNormally: true,
  });

  useEffect(() => {
    loadPatient();
  }, []);

  const loadPatient = async () => {
    try {
      const patientId = localStorage.getItem('patientId');
      if (!patientId) {
        logger.warn('PatientChecklist', 'loadPatient', 'No patientId found in localStorage');
        navigate('/patient-login');
        return;
      }

      logger.info('PatientChecklist', 'loadPatient', 'Loading patient data', { patientId: patientId.substring(0, 8) });

      const patientData = await BaseCrudService.getById<Pacientes>('pacientes', patientId);
      if (!patientData) {
        logger.error('PatientChecklist', 'loadPatient', 'Patient data not found');
        setError('Dados do paciente não encontrados. Por favor, faça login novamente.');
        navigate('/patient-login');
        return;
      }
      
      setPatient(patientData);
      logger.info('PatientChecklist', 'loadPatient', 'Patient data loaded successfully');
    } catch (error) {
      logger.error('PatientChecklist', 'loadPatient', 'Error loading patient', error);
      setError('Erro ao carregar dados do paciente. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRiskLevel = (): string => {
    let riskScore = 0;

    if (formData.painLevel >= 8) riskScore += 3;
    else if (formData.painLevel >= 5) riskScore += 1;

    if (formData.hasFever && formData.bodyTemperature >= 38) riskScore += 3;
    if (formData.scarRedness) riskScore += 2;
    if (formData.hasSecretion) riskScore += 2;
    if (formData.hasBadOdor) riskScore += 3;
    if (formData.shortnessOfBreath) riskScore += 3;
    if (formData.increasingPain) riskScore += 2;
    if (!formData.takingMedicationCorrectly) riskScore += 1;
    if (!formData.eatingNormally) riskScore += 1;

    if (riskScore >= 5) return 'critical';
    if (riskScore >= 2) return 'attention';
    return 'stable';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const patientId = localStorage.getItem('patientId');
      if (!patientId) {
        logger.warn('PatientChecklist', 'handleSubmit', 'No patientId found during submit');
        navigate('/patient-login');
        return;
      }

      const riskLevel = calculateRiskLevel();
      
      const newChecklistId = crypto.randomUUID();
      const newChecklist: ChecklistsDirios = {
        _id: newChecklistId,
        checklistDate: new Date().toISOString(),
        patientId: patientId,
        ...formData,
        riskLevel,
        scarPhoto: '',
      };

      logger.info('PatientChecklist', 'handleSubmit', 'Checklist prepared', {
        checklistId: newChecklistId.substring(0, 8),
        riskLevel,
      });

      // Store temporary checklist data (not saved yet)
      setTempChecklistData(newChecklist);
      setSavedChecklistId(newChecklistId);
      setChecklistId(newChecklistId);
      
      logger.info('PatientChecklist', 'handleSubmit', 'Checklist saved to temporary storage');
    } catch (error) {
      logger.error('PatientChecklist', 'handleSubmit', 'Error submitting checklist', error);
      setError('Erro ao enviar checklist. Por favor, tente novamente.');
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

  if (error && !checklistId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-secondary/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
            <h2 className="font-heading text-xl font-bold text-foreground">Erro</h2>
          </div>
          <p className="font-paragraph text-base text-foreground/70 mb-6">{error}</p>
          <Button
            onClick={() => {
              setError('');
              loadPatient();
            }}
            className="w-full bg-primary text-primary-foreground hover:opacity-90"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // Show success screen with photo upload option
  if (checklistId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-secondary/30 flex-shrink-0">
          <div className="max-w-[120rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between gap-4">
              <Link to="/patient-dashboard" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                  <Activity className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-heading text-lg sm:text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                  <p className="font-paragraph text-xs sm:text-sm text-foreground/60">Próxima Etapa</p>
                </div>
              </Link>
              <Link to="/patient-dashboard" className="flex-shrink-0">
                <Button variant="outline" className="flex items-center gap-1 sm:gap-2 font-paragraph text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2">
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Voltar</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content - Centered */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="w-full max-w-md">
            {/* Success Card */}
            <div className="bg-white rounded-2xl border border-secondary/20 shadow-sm overflow-hidden">
              {/* Card Content */}
              <div className="p-6 sm:p-8 lg:p-10 flex flex-col items-center text-center space-y-6 sm:space-y-8">
                {/* Success Icon */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-stable/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Save className="w-8 h-8 sm:w-10 sm:h-10 text-stable" />
                </div>

                {/* Title */}
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground leading-tight">
                  Checklist Enviado com Sucesso!
                </h2>

                {/* Description */}
                <p className="font-paragraph text-base sm:text-lg text-foreground/70 leading-relaxed">
                  Agora é necessário enviar uma foto da cicatriz para completar o acompanhamento diário.
                </p>

                {/* Button */}
                <Link
                  to={`/patient-photo-upload/${checklistId}`}
                  className="w-full pt-2"
                >
                  <Button className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg flex items-center justify-center gap-2 rounded-lg transition-opacity">
                    Continuar para Envio de Foto
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
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
                <p className="font-paragraph text-sm text-foreground/60">Checklist Diário</p>
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="font-heading text-4xl font-bold text-foreground mb-2">
              Checklist Diário
            </h2>
            <p className="font-paragraph text-lg text-foreground/70">
              Responda as perguntas sobre sua recuperação hoje
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Pain Level */}
            <div className="bg-white rounded-2xl p-8 border border-secondary/20">
              <Label className="font-heading text-xl font-bold text-foreground mb-6 block">
                Qual seu nível de dor hoje?
              </Label>
              <div className="space-y-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.painLevel}
                  onChange={(e) => setFormData({ ...formData, painLevel: Number(e.target.value) })}
                  className="w-full h-3 bg-secondary rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #32CD32 0%, #FFD700 50%, #FF0000 100%)`
                  }}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smile className="w-6 h-6 text-stable" />
                    <span className="font-paragraph text-sm text-foreground/70">Sem dor</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                      <span className="font-heading text-3xl font-bold text-primary-foreground">
                        {formData.painLevel}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-paragraph text-sm text-foreground/70">Dor intensa</span>
                    <Frown className="w-6 h-6 text-critical" />
                  </div>
                </div>
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-white rounded-2xl p-8 border border-secondary/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="font-paragraph text-base font-semibold text-foreground mb-4 block">
                    Está com febre?
                  </Label>
                  <RadioGroup
                    value={formData.hasFever ? 'yes' : 'no'}
                    onValueChange={(value) => setFormData({ ...formData, hasFever: value === 'yes' })}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="fever-yes" />
                      <Label htmlFor="fever-yes" className="font-paragraph cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="fever-no" />
                      <Label htmlFor="fever-no" className="font-paragraph cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="temperature" className="font-paragraph text-base font-semibold text-foreground mb-4 block">
                    Temperatura corporal (°C)
                  </Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={formData.bodyTemperature}
                    onChange={(e) => setFormData({ ...formData, bodyTemperature: Number(e.target.value) })}
                    className="font-paragraph text-lg"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Symptoms Checklist */}
            <div className="bg-white rounded-2xl p-8 border border-secondary/20">
              <h3 className="font-heading text-xl font-bold text-foreground mb-6">
                Sintomas e Condições
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'scarRedness', label: 'Existe vermelhidão na cicatriz?' },
                  { key: 'hasSecretion', label: 'Existe secreção?' },
                  { key: 'hasBadOdor', label: 'Existe mau cheiro?' },
                  { key: 'shortnessOfBreath', label: 'Está sentindo falta de ar?' },
                  { key: 'dizziness', label: 'Está sentindo tontura?' },
                  { key: 'increasingPain', label: 'Está sentindo dor crescente?' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-xl">
                    <Label className="font-paragraph text-base text-foreground">
                      {item.label}
                    </Label>
                    <RadioGroup
                      value={formData[item.key as keyof typeof formData] ? 'yes' : 'no'}
                      onValueChange={(value) => setFormData({ ...formData, [item.key]: value === 'yes' })}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id={`${item.key}-yes`} />
                        <Label htmlFor={`${item.key}-yes`} className="font-paragraph cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id={`${item.key}-no`} />
                        <Label htmlFor={`${item.key}-no`} className="font-paragraph cursor-pointer">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </div>

            {/* Medication and Diet */}
            <div className="bg-white rounded-2xl p-8 border border-secondary/20">
              <h3 className="font-heading text-xl font-bold text-foreground mb-6">
                Medicação e Alimentação
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background rounded-xl">
                  <Label className="font-paragraph text-base text-foreground">
                    Está tomando os medicamentos corretamente?
                  </Label>
                  <RadioGroup
                    value={formData.takingMedicationCorrectly ? 'yes' : 'no'}
                    onValueChange={(value) => setFormData({ ...formData, takingMedicationCorrectly: value === 'yes' })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="medication-yes" />
                      <Label htmlFor="medication-yes" className="font-paragraph cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="medication-no" />
                      <Label htmlFor="medication-no" className="font-paragraph cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex items-center justify-between p-4 bg-background rounded-xl">
                  <Label className="font-paragraph text-base text-foreground">
                    Está conseguindo se alimentar normalmente?
                  </Label>
                  <RadioGroup
                    value={formData.eatingNormally ? 'yes' : 'no'}
                    onValueChange={(value) => setFormData({ ...formData, eatingNormally: value === 'yes' })}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="eating-yes" />
                      <Label htmlFor="eating-yes" className="font-paragraph cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="eating-no" />
                      <Label htmlFor="eating-no" className="font-paragraph cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-6 rounded-lg text-lg"
              >
                {isSaving ? (
                  'Enviando...'
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Enviar Checklist
                  </>
                )}
              </Button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="font-paragraph text-sm text-destructive">{error}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
