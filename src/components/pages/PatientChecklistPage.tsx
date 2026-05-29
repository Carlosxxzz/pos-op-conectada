import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Save, Smile, Meh, Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BaseCrudService } from '@/integrations';
import type { Pacientes, ChecklistsDirios } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function PatientChecklistPage() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Pacientes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
    const patientId = localStorage.getItem('patientId');
    if (!patientId) {
      navigate('/patient-login');
      return;
    }

    try {
      const patientData = await BaseCrudService.getById<Pacientes>('pacientes', patientId);
      setPatient(patientData);
    } catch (error) {
      console.error('Error loading patient:', error);
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

    try {
      const riskLevel = calculateRiskLevel();
      
      const newChecklist: ChecklistsDirios = {
        _id: crypto.randomUUID(),
        checklistDate: new Date().toISOString(),
        ...formData,
        riskLevel,
      };

      await BaseCrudService.create('checklistsdiarios', newChecklist);
      alert('Checklist enviado com sucesso!');
      navigate('/patient-dashboard');
    } catch (error) {
      alert('Erro ao enviar checklist');
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
          </form>
        </div>
      </div>
    </div>
  );
}
