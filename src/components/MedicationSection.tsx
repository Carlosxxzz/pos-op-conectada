import { useState, useEffect, useRef } from 'react';
import { Plus, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { BaseCrudService } from '@/integrations';
import type { Medicamentos } from '@/entities';
import { motion, AnimatePresence } from 'framer-motion';

interface MedicationEntry {
  id: string;
  medicationName: string;
  timeTaken: string;
  doseQuantity: string;
}

interface MedicationSectionProps {
  takingMedicationCorrectly: boolean;
  onMedicationChange: (takingCorrectly: boolean) => void;
  onMedicationsChange: (medications: MedicationEntry[]) => void;
  onReasonChange: (reason: string) => void;
  medications: MedicationEntry[];
  reasonNotTaking: string;
  eatingNormally: boolean;
  onEatingNormallyChange: (eatingNormally: boolean) => void;
}

const MEDICATION_REASONS = [
  { value: 'forgot', label: 'Esqueci' },
  { value: 'not_time_yet', label: 'Ainda não chegou o horário' },
  { value: 'dont_have', label: 'Não tenho o medicamento' },
  { value: 'felt_sick', label: 'Passei mal' },
  { value: 'other', label: 'Outro' },
];

const TIME_OPTIONS = (() => {
  const times: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      times.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    }
  }
  return times;
})();

export default function MedicationSection({
  takingMedicationCorrectly,
  onMedicationChange,
  onMedicationsChange,
  onReasonChange,
  medications,
  reasonNotTaking,
  eatingNormally,
  onEatingNormallyChange,
}: MedicationSectionProps) {
  const [medicationSuggestions, setMedicationSuggestions] = useState<Medicamentos[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<Medicamentos[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: boolean }>({});
  const [otherReason, setOtherReason] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadMedicationSuggestions();
  }, []);

  // Focus textarea when "other" reason is selected
  useEffect(() => {
    if (reasonNotTaking === 'other' && textareaRef.current) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [reasonNotTaking]);

  // Sync otherReason with reasonNotTaking when reason changes to 'other'
  // This ensures the local state stays in sync with parent state
  useEffect(() => {
    if (reasonNotTaking.startsWith('other:')) {
      const extractedText = reasonNotTaking.substring(6);
      setOtherReason(extractedText);
    } else if (reasonNotTaking !== 'other') {
      setOtherReason('');
    }
  }, [reasonNotTaking]);

  const loadMedicationSuggestions = async () => {
    try {
      const result = await BaseCrudService.getAll<Medicamentos>('medicamentos', [], { limit: 100 });
      setMedicationSuggestions(result.items || []);
    } catch (error) {
      console.error('Error loading medication suggestions:', error);
    }
  };

  // Handle switching between Yes and No
  const handleMedicationToggle = (value: string) => {
    const isYes = value === 'yes';
    
    if (isYes) {
      // Switching to YES: clear reason and reset medications to single empty entry
      onReasonChange('');
      setOtherReason('');
      onMedicationsChange([
        {
          id: crypto.randomUUID(),
          medicationName: '',
          timeTaken: '',
          doseQuantity: '',
        },
      ]);
    } else {
      // Switching to NO: clear all medications
      onMedicationsChange([]);
      onReasonChange('');
      setOtherReason('');
    }
    
    onMedicationChange(isYes);
  };

  const handleMedicationNameChange = (id: string, value: string) => {
    const updated = medications.map(m => 
      m.id === id ? { ...m, medicationName: value } : m
    );
    onMedicationsChange(updated);

    // Filter suggestions
    if (value.trim()) {
      const filtered = medicationSuggestions.filter(med =>
        med.medicationName?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions({ ...showSuggestions, [id]: true });
    } else {
      setShowSuggestions({ ...showSuggestions, [id]: false });
    }
  };

  const selectMedicationSuggestion = (id: string, medicationName: string) => {
    const updated = medications.map(m =>
      m.id === id ? { ...m, medicationName } : m
    );
    onMedicationsChange(updated);
    setShowSuggestions({ ...showSuggestions, [id]: false });
  };

  const handleTimeChange = (id: string, time: string) => {
    const updated = medications.map(m =>
      m.id === id ? { ...m, timeTaken: time } : m
    );
    onMedicationsChange(updated);
  };

  const handleDoseChange = (id: string, dose: string) => {
    const updated = medications.map(m =>
      m.id === id ? { ...m, doseQuantity: dose } : m
    );
    onMedicationsChange(updated);
  };

  const addMedication = () => {
    const newMedication: MedicationEntry = {
      id: crypto.randomUUID(),
      medicationName: '',
      timeTaken: '',
      doseQuantity: '',
    };
    onMedicationsChange([...medications, newMedication]);
  };

  const removeMedication = (id: string) => {
    const filtered = medications.filter(m => m.id !== id);
    // Ensure at least one empty medication entry remains
    if (filtered.length === 0) {
      onMedicationsChange([
        {
          id: crypto.randomUUID(),
          medicationName: '',
          timeTaken: '',
          doseQuantity: '',
        },
      ]);
    } else {
      onMedicationsChange(filtered);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border-2 border-secondary/30">
      <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
        Medicação e Alimentação
      </h3>

      {/* Medication Question */}
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-background rounded-2xl border-2 border-secondary/20">
          <Label className="font-paragraph text-lg text-foreground font-semibold">
            Você tomou seus medicamentos conforme orientação?
          </Label>
          <RadioGroup
            value={takingMedicationCorrectly ? 'yes' : 'no'}
            onValueChange={handleMedicationToggle}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="medication-yes-item" className="w-6 h-6" />
              <Label htmlFor="medication-yes-item" className="font-paragraph text-lg cursor-pointer">
                Sim
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="medication-no-item" className="w-6 h-6" />
              <Label htmlFor="medication-no-item" className="font-paragraph text-lg cursor-pointer">
                Não
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* If YES - Show medication form */}
        <AnimatePresence>
          {takingMedicationCorrectly && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Medications List */}
              <div className="space-y-4">
                {medications.map((medication, index) => (
                  <motion.div
                    key={medication.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-background rounded-2xl p-4 border-2 border-secondary/20 space-y-4"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-heading text-lg font-bold text-foreground">
                        Medicamento {index + 1}
                      </span>
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedication(medication.id)}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-destructive" />
                        </button>
                      )}
                    </div>

                    {/* Medication Name with Autocomplete */}
                    <div className="relative">
                      <Label htmlFor={`med-name-${medication.id}`} className="font-paragraph text-base font-semibold text-foreground mb-2 block">
                        Nome do medicamento
                      </Label>
                      <Input
                        id={`med-name-${medication.id}`}
                        type="text"
                        placeholder="Digite o nome do medicamento"
                        value={medication.medicationName}
                        onChange={(e) => handleMedicationNameChange(medication.id, e.target.value)}
                        onFocus={() => medication.medicationName && setShowSuggestions({ ...showSuggestions, [medication.id]: true })}
                        className="font-paragraph text-base h-12 rounded-xl border-2"
                      />
                      {/* Suggestions Dropdown */}
                      <AnimatePresence>
                        {showSuggestions[medication.id] && filteredSuggestions.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-secondary/30 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto"
                          >
                            {filteredSuggestions.map((suggestion) => (
                              <button
                                key={suggestion._id}
                                type="button"
                                onClick={() => selectMedicationSuggestion(medication.id, suggestion.medicationName || '')}
                                className="w-full text-left px-4 py-3 hover:bg-primary/10 transition-colors border-b border-secondary/10 last:border-b-0"
                              >
                                <div className="font-paragraph font-semibold text-foreground">
                                  {suggestion.medicationName}
                                </div>
                                {suggestion.strength && (
                                  <div className="font-paragraph text-sm text-foreground/60">
                                    {suggestion.strength}
                                  </div>
                                )}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Time Taken */}
                    <div>
                      <Label htmlFor={`med-time-${medication.id}`} className="font-paragraph text-base font-semibold text-foreground mb-2 block">
                        Horário em que tomou
                      </Label>
                      <select
                        id={`med-time-${medication.id}`}
                        value={medication.timeTaken}
                        onChange={(e) => handleTimeChange(medication.id, e.target.value)}
                        className="w-full font-paragraph text-base h-12 rounded-xl border-2 border-secondary/30 px-4 bg-white cursor-pointer"
                      >
                        <option value="">Selecione o horário</option>
                        {TIME_OPTIONS.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Dose/Quantity */}
                    <div>
                      <Label htmlFor={`med-dose-${medication.id}`} className="font-paragraph text-base font-semibold text-foreground mb-2 block">
                        Quantidade/Dose
                      </Label>
                      <Input
                        id={`med-dose-${medication.id}`}
                        type="text"
                        placeholder="Ex: 1 comprimido, 20 gotas, 10 ml"
                        value={medication.doseQuantity}
                        onChange={(e) => handleDoseChange(medication.id, e.target.value)}
                        className="font-paragraph text-base h-12 rounded-xl border-2"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add Medication Button */}
              <Button
                type="button"
                onClick={addMedication}
                variant="outline"
                className="w-full border-2 border-dashed border-primary text-primary hover:bg-primary/5 font-paragraph font-bold py-3 rounded-2xl text-base h-12 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Adicionar outro medicamento
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* If NO - Show reason selection */}
        <AnimatePresence>
          {!takingMedicationCorrectly && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="bg-background rounded-2xl p-4 border-2 border-secondary/20">
                <Label className="font-paragraph text-base font-semibold text-foreground mb-4 block">
                  Qual o motivo?
                </Label>
                <RadioGroup
                  value={reasonNotTaking}
                  onValueChange={(value) => {
                    onReasonChange(value);
                    if (value !== 'other') {
                      setOtherReason('');
                    }
                  }}
                  className="space-y-3"
                >
                  {MEDICATION_REASONS.map((reason) => (
                    <div key={reason.value} className="flex items-center space-x-3 p-3 bg-white rounded-xl border-2 border-secondary/20">
                      <RadioGroupItem value={reason.value} id={`reason-${reason.value}`} className="w-6 h-6" />
                      <Label htmlFor={`reason-${reason.value}`} className="font-paragraph text-base cursor-pointer font-semibold">
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* If "Other" is selected - Show text field */}
              <AnimatePresence>
                {(reasonNotTaking === 'other' || reasonNotTaking.startsWith('other:')) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="bg-white rounded-2xl p-4 border-2 border-primary/50">
                      <Label className="font-paragraph text-base font-semibold text-foreground mb-3 block">
                        Descreva o motivo:
                      </Label>
                      <textarea
                        ref={textareaRef}
                        placeholder="Descreva o motivo..."
                        value={otherReason}
                        onChange={(e) => {
                          const value = e.target.value.substring(0, 300);
                          setOtherReason(value);
                          onReasonChange(`other:${value}`);
                        }}
                        onBlur={() => {
                          onReasonChange(`other:${otherReason}`);
                        }}
                        maxLength={300}
                        className="w-full font-paragraph text-base h-24 rounded-xl border-2 border-primary/50 px-4 py-3 bg-white text-foreground/80 placeholder-foreground/40 resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                      <div className="flex justify-between items-center mt-2">
                        <p className="font-paragraph text-xs text-foreground/50">
                          {otherReason.length}/300 caracteres
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Eating Normally */}
        <div className="flex items-center justify-between p-4 bg-background rounded-2xl border-2 border-secondary/20">
          <Label className="font-paragraph text-lg text-foreground font-semibold">
            Alimentando normalmente?
          </Label>
          <RadioGroup
            value={eatingNormally ? 'yes' : 'no'}
            onValueChange={(value) => {
              onEatingNormallyChange(value === 'yes');
            }}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id="eating-yes-item" className="w-6 h-6" />
              <Label htmlFor="eating-yes-item" className="font-paragraph text-lg cursor-pointer">
                Sim
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="eating-no-item" className="w-6 h-6" />
              <Label htmlFor="eating-no-item" className="font-paragraph text-lg cursor-pointer">
                Não
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
