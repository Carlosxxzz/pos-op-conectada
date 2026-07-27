import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Save, Smile, Meh, Frown, ArrowRight, AlertCircle, CheckCircle, Clock } from 'lucide-react';
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
import MedicationSection from '@/components/MedicationSection';
import TemperatureInput from '@/components/TemperatureInput';
import { validateChecklistSubmission, getTimeUntilNextRelease } from '@/lib/checklistValidator';

interface MedicationEntry {
  id: string;
  medicationName: string;
  timeTaken: string;
  doseQuantity: string;
}

export default function PatientChecklistPage() {
  const navigate = useNavigate();
  const { setTempChecklistData, setSavedChecklistId } = useChecklistFlow();
  const [patient, setPatient] = useState<Pacientes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [checklistId, setChecklistId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [isTemperatureValid, setIsTemperatureValid] = useState(false);
  const [checklistBlocked, setChecklistBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string>('');
  
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
    reasonNotTakingMedication: '',
  });

  const [medications, setMedications] = useState<MedicationEntry[]>([]);

  // Function to get color based on pain level
  const getPainLevelColor = (level: number): { bg: string; text: string } => {
    if (level <= 3) {
      return { bg: '#32CD32', text: '#FFFFFF' }; // Green - Light pain
    } else if (level <= 6) {
      return { bg: '#FFD700', text: '#333333' }; // Yellow - Moderate pain
    } else if (level <= 8) {
      return { bg: '#FF8C00', text: '#FFFFFF' }; // Orange - Strong pain
    } else {
      return { bg: '#FF0000', text: '#FFFFFF' }; // Red - Very intense pain
    }
  };

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

      // Validate if checklist can be submitted
      const validation = await validateChecklistSubmission(patientId);
      if (!validation.canSubmit) {
        setChecklistBlocked(true);
        setBlockReason(validation.reason || '');
        logger.info('PatientChecklist', 'loadPatient', 'Checklist blocked', { reason: validation.reason });
      }
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
    
    // Validate temperature before submitting
    if (!isTemperatureValid) {
      setError('Por favor, informe uma temperatura válida entre 30,0 °C e 45,0 °C.');
      return;
    }
    
    setIsSaving(true);
    setError('');

    try {
      const patientId = localStorage.getItem('patientId');
      if (!patientId) {
        logger.warn('PatientChecklist', 'handleSubmit', 'No patientId found during submit');
        navigate('/patient-login');
        return;
      }

      // Re-validate before submission (server-side check)
      const validation = await validateChecklistSubmission(patientId);
      if (!validation.canSubmit) {
        setError(validation.reason || 'Não é possível enviar o checklist no momento.');
        setChecklistBlocked(true);
        setBlockReason(validation.reason || '');
        setIsSaving(false);
        logger.warn('PatientChecklist', 'handleSubmit', 'Submission blocked by validation', { reason: validation.reason });
        return;
      }

      // Validate medications if taking correctly
      if (formData.takingMedicationCorrectly) {
        const validMedications = medications.filter(m => m.medicationName.trim());
        if (validMedications.length === 0) {
          setError('Por favor, adicione pelo menos um medicamento.');
          setIsSaving(false);
          return;
        }
        for (const med of validMedications) {
          if (!med.timeTaken || !med.doseQuantity.trim()) {
            setError('Por favor, preencha horário e dose para todos os medicamentos.');
            setIsSaving(false);
            return;
          }
        }
      } else {
        // Validate reason if not taking medication
        if (!formData.reasonNotTakingMedication.trim()) {
          setError('Por favor, selecione um motivo.');
          setIsSaving(false);
          return;
        }
        // Validate that "other" reason has text
        if (formData.reasonNotTakingMedication.startsWith('other:')) {
          const otherText = formData.reasonNotTakingMedication.substring(6).trim();
          if (!otherText) {
            setError('Por favor, informe o motivo.');
            setIsSaving(false);
            return;
          }
        }
      }

      const riskLevel = calculateRiskLevel();
      
      const newChecklistId = crypto.randomUUID();
      const newChecklist: any = {
        _id: newChecklistId,
        checklistDate: new Date().toISOString(),
        patientId: patientId,
        painLevel: formData.painLevel,
        hasFever: formData.hasFever,
        bodyTemperature: formData.bodyTemperature,
        scarRedness: formData.scarRedness,
        hasSecretion: formData.hasSecretion,
        hasBadOdor: formData.hasBadOdor,
        shortnessOfBreath: formData.shortnessOfBreath,
        dizziness: formData.dizziness,
        increasingPain: formData.increasingPain,
        takingMedicationCorrectly: formData.takingMedicationCorrectly,
        eatingNormally: formData.eatingNormally,
        // Only save reason if not taking medication correctly
        reasonNotTakingMedication: formData.takingMedicationCorrectly ? '' : formData.reasonNotTakingMedication,
        riskLevel,
        scarPhoto: '',
        status: 'Aguardando Avaliação de Enfermagem',
        encaminhadoMedico: false,
        hospital: patient?.hospital || '',
      };

      logger.info('PatientChecklist', 'handleSubmit', 'Checklist created', {
        checklistId: newChecklistId.substring(0, 8),
        riskLevel,
        status: 'Aguardando Avaliação de Enfermagem',
        hospital: patient?.hospital,
      });

      // Store temporary checklist data (not saved yet)
      setTempChecklistData(newChecklist);
      setSavedChecklistId(newChecklistId);
      setChecklistId(newChecklistId);

      // Save medications if taking correctly
      if (formData.takingMedicationCorrectly) {
        const validMedications = medications.filter(m => m.medicationName.trim());
        for (const med of validMedications) {
          await BaseCrudService.create('medicacoeschecklist', {
            _id: crypto.randomUUID(),
            medicationName: med.medicationName,
            timeTaken: med.timeTaken,
            doseQuantity: med.doseQuantity,
            checklistDate: new Date().toISOString().split('T')[0],
            patientNotes: '',
          });
        }
      }
      
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
        <div className="max-w-md w-full bg-white rounded-3xl p-6 border-2 border-secondary/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
            <h2 className="font-heading text-2xl font-bold text-foreground">Erro</h2>
          </div>
          <p className="font-paragraph text-lg text-foreground/70 mb-6">{error}</p>
          <Button
            onClick={() => {
              setError('');
              loadPatient();
            }}
            className="w-full bg-primary text-white hover:opacity-90 font-paragraph font-bold py-4 rounded-2xl text-lg h-16"
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
        <header className="bg-white border-b-2 border-secondary/30 flex-shrink-0">
          <div className="w-full px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <Link to="/patient-dashboard" className="flex items-center gap-3 flex-1">
                <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-heading text-xl font-bold text-foreground leading-tight">Pós-Op</h1>
                  <p className="font-paragraph text-xs text-foreground/60">Próxima Etapa</p>
                </div>
              </Link>
              <Link to="/patient-dashboard" className="flex-shrink-0">
                <Button variant="outline" className="flex items-center gap-2 font-paragraph font-bold py-3 px-4 rounded-2xl border-2 h-14 text-base">
                  <ArrowLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Voltar</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content - Centered */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            {/* Success Card */}
            <div className="bg-white rounded-3xl border-2 border-secondary/20 overflow-hidden">
              {/* Card Content */}
              <div className="p-8 flex flex-col items-center text-center space-y-8">
                {/* Success Icon */}
                <div className="w-24 h-24 bg-stable/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Save className="w-12 h-12 text-stable" />
                </div>

                {/* Title */}
                <h2 className="font-heading text-3xl font-bold text-foreground leading-tight">
                  Checklist Enviado!
                </h2>

                {/* Description */}
                <p className="font-paragraph text-lg text-foreground/70 leading-relaxed">
                  Agora envie uma foto da cicatriz para completar o acompanhamento. A foto é obrigatória.
                </p>

                {/* Button */}
                <Link
                  to={`/patient-photo-upload/${checklistId}`}
                  className="w-full pt-4"
                >
                  <Button className="w-full bg-primary text-white hover:opacity-90 font-paragraph font-bold py-4 rounded-2xl text-lg h-16 flex items-center justify-center gap-3">
                    Continuar para Foto
                    <ArrowRight className="w-5 h-5 flex-shrink-0" />
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-2 border-secondary/30 flex-shrink-0 sticky top-0 z-40">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <Link to="/patient-dashboard" className="flex items-center gap-3 flex-1">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-heading text-xl font-bold text-foreground leading-tight">Checklist</h1>
                <p className="font-paragraph text-xs text-foreground/60">Diário</p>
              </div>
            </Link>
            <Link to="/patient-dashboard">
              <Button variant="outline" className="flex items-center gap-2 font-paragraph font-bold py-3 px-4 rounded-2xl border-2 h-14 text-base">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Show blocked state if checklist is blocked */}
        {checklistBlocked ? (
          <div className="space-y-6">
            {/* Blocked Message Card */}
            <div className="bg-white rounded-3xl p-8 border-2 border-secondary/30">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Checkmark Icon */}
                <div className="w-24 h-24 bg-stable/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-12 h-12 text-stable" />
                </div>

                {/* Title */}
                <h2 className="font-heading text-3xl font-bold text-foreground leading-tight">
                  Checklist Diário Concluído
                </h2>

                {/* Message */}
                <p className="font-paragraph text-lg text-foreground/70 leading-relaxed">
                  {blockReason}
                </p>

                {/* Next Release Time */}
                <div className="w-full bg-primary/10 rounded-2xl p-4 border-2 border-primary/20">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <p className="font-paragraph text-base font-semibold text-primary">
                      Próxima liberação em
                    </p>
                  </div>
                  <p className="font-heading text-2xl font-bold text-primary">
                    Amanhã às 05:00
                  </p>
                </div>

                {/* Back Button */}
                <Link to="/patient-dashboard" className="w-full pt-4">
                  <Button className="w-full bg-primary text-white hover:opacity-90 font-paragraph font-bold py-4 rounded-2xl text-lg h-16">
                    Voltar ao Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
                Checklist Diário
              </h2>
              <p className="font-paragraph text-lg text-foreground/70">
                Responda ao questionário enviado pela equipe de saúde
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-8">
              {/* Pain Level */}
              <div className="bg-white rounded-3xl p-6 border-2 border-secondary/30">
                <Label className="font-heading text-2xl font-bold text-foreground mb-6 block">
                  Qual seu nível de dor?
                </Label>
                <div className="space-y-6">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={formData.painLevel}
                    onChange={(e) => setFormData({ ...formData, painLevel: Number(e.target.value) })}
                    className="w-full h-4 bg-secondary rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #32CD32 0%, #FFD700 50%, #FF0000 100%)`
                    }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smile className="w-8 h-8 text-stable" />
                      <span className="font-paragraph text-base text-foreground/70">Sem dor</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300 ease-out"
                        style={{
                          backgroundColor: getPainLevelColor(formData.painLevel).bg,
                        }}
                      >
                        <span 
                          className="font-heading text-4xl font-bold transition-colors duration-300 ease-out"
                          style={{
                            color: getPainLevelColor(formData.painLevel).text,
                          }}
                        >
                          {formData.painLevel}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-paragraph text-base text-foreground/70">Dor intensa</span>
                      <Frown className="w-8 h-8 text-critical" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Temperature */}
              <div className="bg-white rounded-3xl p-6 border-2 border-secondary/30">
                <div className="space-y-6">
                  <div>
                    <Label className="font-paragraph text-2xl font-bold text-foreground mb-4 block">
                      Está com febre?
                    </Label>
                    <RadioGroup
                      value={formData.hasFever ? 'yes' : 'no'}
                      onValueChange={(value) => setFormData({ ...formData, hasFever: value === 'yes' })}
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-3 bg-background rounded-2xl border-2 border-secondary/20">
                        <RadioGroupItem value="yes" id="fever-yes" className="w-6 h-6" />
                        <Label htmlFor="fever-yes" className="font-paragraph text-lg cursor-pointer font-semibold">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-background rounded-2xl border-2 border-secondary/20">
                        <RadioGroupItem value="no" id="fever-no" className="w-6 h-6" />
                        <Label htmlFor="fever-no" className="font-paragraph text-lg cursor-pointer font-semibold">Não</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div>

                    <TemperatureInput
                      value={formData.bodyTemperature}
                      onChange={(temp) => setFormData({ ...formData, bodyTemperature: temp })}
                      onValidationChange={setIsTemperatureValid}
                    />
                  </div>
                </div>
              </div>

              {/* Symptoms Checklist */}
              <div className="bg-white rounded-3xl p-6 border-2 border-secondary/30">
                <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
                  Sintomas
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'scarRedness', label: 'Vermelhidão na cicatriz?' },
                    { key: 'hasSecretion', label: 'Secreção?' },
                    { key: 'hasBadOdor', label: 'Mau cheiro?' },
                    { key: 'shortnessOfBreath', label: 'Falta de ar?' },
                    { key: 'dizziness', label: 'Tontura?' },
                    { key: 'increasingPain', label: 'Dor crescente?' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-2xl border-2 border-secondary/20">
                      <Label className="font-paragraph text-lg text-foreground font-semibold">
                        {item.label}
                      </Label>
                      <RadioGroup
                        value={formData[item.key as keyof typeof formData] ? 'yes' : 'no'}
                        onValueChange={(value) => setFormData({ ...formData, [item.key]: value === 'yes' })}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id={`${item.key}-yes`} className="w-6 h-6" />
                          <Label htmlFor={`${item.key}-yes`} className="font-paragraph text-lg cursor-pointer">Sim</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id={`${item.key}-no`} className="w-6 h-6" />
                          <Label htmlFor={`${item.key}-no`} className="font-paragraph text-lg cursor-pointer">Não</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medication and Diet */}
              <MedicationSection
                takingMedicationCorrectly={formData.takingMedicationCorrectly}
                onMedicationChange={(value) => setFormData({ ...formData, takingMedicationCorrectly: value })}
                onMedicationsChange={setMedications}
                onReasonChange={(reason) => setFormData({ ...formData, reasonNotTakingMedication: reason })}
                medications={medications}
                reasonNotTaking={formData.reasonNotTakingMedication}
                eatingNormally={formData.eatingNormally}
                onEatingNormallyChange={(value) => setFormData({ ...formData, eatingNormally: value })}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full bg-primary text-white hover:opacity-90 font-paragraph font-bold py-4 rounded-2xl text-lg h-16 flex items-center justify-center gap-3 mb-8"
              >
                {isSaving ? (
                  'Enviando...'
                ) : (
                  <>
                    <Save className="w-6 h-6" />
                    Enviar Checklist
                  </>
                )}
              </Button>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-destructive/10 border-2 border-destructive/20 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="font-paragraph text-base text-destructive font-semibold">{error}</p>
                </div>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
