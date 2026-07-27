import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { validatePasswordMatch } from '@/lib/passwordValidator';

interface PasswordConfirmationProps {
  password: string;
  confirmPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  showLabel?: boolean;
}

export default function PasswordConfirmation({
  password,
  confirmPassword,
  onConfirmPasswordChange,
  placeholder = 'Confirme sua senha',
  error,
  label = 'Confirmar Senha',
  showLabel = true,
}: PasswordConfirmationProps) {
  const [showPassword, setShowPassword] = useState(false);
  const matchValidation = validatePasswordMatch(password, confirmPassword);

  return (
    <div className="w-full">
      {showLabel && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => onConfirmPasswordChange(e.target.value)}
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

      {confirmPassword.length > 0 && (
        <div className="mt-2">
          {matchValidation.isMatch ? (
            <p className="text-xs text-stable font-semibold">
              ✓ As senhas coincidem
            </p>
          ) : (
            <p className="text-xs text-destructive font-semibold">
              ✗ {matchValidation.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
