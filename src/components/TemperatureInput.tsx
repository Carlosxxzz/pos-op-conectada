import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface TemperatureInputProps {
  value: number;
  onChange: (value: number) => void;
  onValidationChange?: (isValid: boolean) => void;
  label?: string;
  required?: boolean;
}

const MIN_TEMPERATURE = 30.0;
const MAX_TEMPERATURE = 45.0;

export default function TemperatureInput({
  value,
  onChange,
  onValidationChange,
  label = 'Temperatura (°C)',
  required = true,
}: TemperatureInputProps) {
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState(false);

  const isValidTemperature = (temp: number): boolean => {
    // Check if it's a valid number
    if (isNaN(temp)) return false;
    
    // Check if it's within the valid range
    if (temp < MIN_TEMPERATURE || temp > MAX_TEMPERATURE) return false;
    
    // Check if it has at most one decimal place
    const decimalPlaces = (temp.toString().split('.')[1] || '').length;
    if (decimalPlaces > 1) return false;
    
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Allow empty input while typing
    if (inputValue === '' || inputValue === '-') {
      onChange(0);
      setError('');
      onValidationChange?.(false);
      return;
    }

    // Parse the input value
    const numValue = parseFloat(inputValue);

    // Check for invalid input (non-numeric)
    if (isNaN(numValue)) {
      setError('Informe um valor numérico válido.');
      onValidationChange?.(false);
      return;
    }

    // Check for negative numbers
    if (numValue < 0) {
      setError('A temperatura não pode ser negativa.');
      onValidationChange?.(false);
      return;
    }

    // Check decimal places
    const decimalPlaces = (inputValue.split('.')[1] || '').length;
    if (decimalPlaces > 1) {
      setError('Informe apenas uma casa decimal (ex.: 36,5 °C).');
      onValidationChange?.(false);
      return;
    }

    // Check range
    if (numValue < MIN_TEMPERATURE || numValue > MAX_TEMPERATURE) {
      setError(`Informe uma temperatura válida entre ${MIN_TEMPERATURE.toFixed(1)} °C e ${MAX_TEMPERATURE.toFixed(1)} °C.`);
      onValidationChange?.(false);
      return;
    }

    // Valid temperature
    setError('');
    onChange(numValue);
    onValidationChange?.(true);
  };

  const handleBlur = () => {
    setTouched(true);
    
    // If empty on blur, it's invalid
    if (value === 0 && required) {
      setError('Informe uma temperatura válida entre 30,0 °C e 45,0 °C.');
      onValidationChange?.(false);
    }
  };

  const handleFocus = () => {
    setTouched(true);
  };

  const isValid = isValidTemperature(value);

  return (
    <div className="space-y-3">
      <Label htmlFor="temperature" className="font-paragraph text-2xl font-bold text-foreground block">
        {label}
      </Label>
      <div className="relative">
        <input
          id="temperature"
          type="number"
          inputMode="decimal"
          step="0.1"
          min={MIN_TEMPERATURE}
          max={MAX_TEMPERATURE}
          value={value === 0 ? '' : value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder="Exemplo: 36,5 °C"
          className={`w-full font-paragraph text-2xl h-16 rounded-2xl border-2 px-4 transition-colors ${
            touched && error
              ? 'border-destructive/50 bg-destructive/5 focus:border-destructive focus:outline-none'
              : touched && isValid
              ? 'border-stable/50 bg-stable/5 focus:border-stable focus:outline-none'
              : 'border-secondary/30 focus:border-primary focus:outline-none'
          }`}
          required={required}
        />
      </div>

      {/* Error Message */}
      {touched && error && (
        <div className="flex items-start gap-3 p-3 bg-destructive/10 border-2 border-destructive/20 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="font-paragraph text-sm text-destructive font-semibold">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {touched && isValid && !error && (
        <div className="flex items-start gap-3 p-3 bg-stable/10 border-2 border-stable/20 rounded-2xl">
          <p className="font-paragraph text-sm text-stable font-semibold">✓ Temperatura válida</p>
        </div>
      )}

      {/* Helper Text */}
      {!touched && (
        <p className="font-paragraph text-sm text-foreground/60">
          Intervalo válido: {MIN_TEMPERATURE.toFixed(1)} °C a {MAX_TEMPERATURE.toFixed(1)} °C
        </p>
      )}
    </div>
  );
}
