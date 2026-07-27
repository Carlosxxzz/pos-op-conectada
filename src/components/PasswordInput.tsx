import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { validatePassword, passwordRules, PasswordValidationResult } from '@/lib/passwordValidator';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (validation: PasswordValidationResult) => void;
  placeholder?: string;
  showRequirements?: boolean;
  error?: string;
  showLabel?: boolean;
}

export default function PasswordInput({
  label,
  value,
  onChange,
  onValidationChange,
  placeholder = 'Digite sua senha',
  showRequirements = true,
  error,
  showLabel = true,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const validation = validatePassword(value);

  React.useEffect(() => {
    if (onValidationChange) {
      onValidationChange(validation);
    }
  }, [value, onValidationChange, validation]);

  return (
    <div className="w-full">
      {showLabel && label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {error && <p className="text-destructive text-sm mt-2">{error}</p>}

      {showRequirements && value.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold text-foreground mb-2">
            Requisitos da senha:
          </p>
          <ul className="space-y-1">
            {passwordRules.requirements.map((req) => {
              const isMet = validation.requirements[req.key as keyof typeof validation.requirements];
              return (
                <li
                  key={req.key}
                  className={`text-xs flex items-center gap-2 ${
                    isMet ? 'text-stable' : 'text-gray-500'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-white text-xs ${
                    isMet ? 'bg-stable' : 'bg-gray-300'
                  }`}>
                    {isMet ? '✓' : '○'}
                  </span>
                  {req.label}
                </li>
              );
            })}
          </ul>
          {validation.isValid && (
            <p className="text-xs text-stable font-semibold mt-3">
              ✓ Senha válida!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
