import { useState } from 'react';
import { BaseCrudService } from '@/integrations';
import type { Pacientes } from '@/entities';
import { logger } from '@/lib/logger';

interface RecoveryToken {
  code: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
}

const RECOVERY_TOKENS = new Map<string, RecoveryToken>();
const RESEND_COOLDOWN = new Map<string, number>();
const BLOCKED_EMAILS = new Map<string, number>();

const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const CODE_EXPIRY = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_DURATION = 60 * 1000; // 60 seconds

export function usePasswordRecovery() {
  const [step, setStep] = useState<'email' | 'code' | 'password' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [patientName, setPatientName] = useState('');

  const generateCode = (): string => {
    return Math.random().toString().slice(2, 8).padStart(6, '0');
  };

  const isEmailBlocked = (emailAddress: string): boolean => {
    const blockTime = BLOCKED_EMAILS.get(emailAddress);
    if (!blockTime) return false;
    
    if (Date.now() > blockTime) {
      BLOCKED_EMAILS.delete(emailAddress);
      return false;
    }
    return true;
  };

  const blockEmail = (emailAddress: string) => {
    BLOCKED_EMAILS.set(emailAddress, Date.now() + BLOCK_DURATION);
  };

  const canResendCode = (emailAddress: string): boolean => {
    const lastResendTime = RESEND_COOLDOWN.get(emailAddress);
    if (!lastResendTime) return true;
    return Date.now() > lastResendTime;
  };

  const setResendCooldown = (emailAddress: string) => {
    RESEND_COOLDOWN.set(emailAddress, Date.now() + RESEND_COOLDOWN_DURATION);
    setResendCountdown(60);
    
    const interval = setInterval(() => {
      setResendCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const requestRecovery = async (emailAddress: string): Promise<boolean> => {
    setError('');
    setIsLoading(true);

    try {
      if (isEmailBlocked(emailAddress)) {
        const errorMsg = 'Muitas tentativas. Tente novamente em 15 minutos.';
        setError(errorMsg);
        logger.warn('PasswordRecovery', 'requestRecovery', 'Email blocked due to too many attempts', { 
          email: emailAddress,
          blockedUntil: new Date(BLOCKED_EMAILS.get(emailAddress) || 0).toISOString()
        });
        return false;
      }

      logger.info('PasswordRecovery', 'requestRecovery', 'Starting password recovery process', { email: emailAddress });

      const { items } = await BaseCrudService.getAll<Pacientes>('pacientes');
      const patient = items.find(p => p.email === emailAddress);

      if (!patient) {
        const errorMsg = 'Não encontramos uma conta vinculada a este e-mail.';
        setError(errorMsg);
        logger.warn('PasswordRecovery', 'requestRecovery', 'Patient not found', { email: emailAddress });
        return false;
      }

      const recoveryCode = generateCode();
      const expiresAt = Date.now() + CODE_EXPIRY;

      logger.info('PasswordRecovery', 'requestRecovery', 'Recovery code generated successfully', {
        email: emailAddress,
        code: recoveryCode,
        expiresAt: new Date(expiresAt).toISOString(),
        patientName: patient.fullName,
        codeExpiryMinutes: CODE_EXPIRY / 60000,
      });

      RECOVERY_TOKENS.set(emailAddress, {
        code: recoveryCode,
        expiresAt,
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS,
      });

      setPatientName(patient.fullName || '');
      setEmail(emailAddress);
      setResendCooldown(emailAddress);

      // Log email sending attempt
      logger.info('PasswordRecovery', 'requestRecovery', 'Attempting to send recovery code via email', {
        email: emailAddress,
        recipientName: patient.fullName,
        timestamp: new Date().toISOString(),
      });

      // NOTE: Email sending is not supported in the current Wix Vibe environment
      // In production, this would integrate with:
      // - Wix Automations API
      // - Third-party email service (SendGrid, Mailgun, etc.)
      // - Custom backend function
      console.log(`[PASSWORD RECOVERY] Code generated for ${emailAddress}: ${recoveryCode}`);
      console.log(`[PASSWORD RECOVERY] Code expires at: ${new Date(expiresAt).toISOString()}`);
      console.log(`[PASSWORD RECOVERY] Patient: ${patient.fullName}`);

      setStep('code');
      return true;
    } catch (err) {
      logger.error('PasswordRecovery', 'requestRecovery', 'Error requesting recovery', err);
      const errorMsg = 'Erro ao solicitar recuperação. Tente novamente.';
      setError(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (codeInput: string): Promise<boolean> => {
    setError('');
    setIsLoading(true);

    try {
      const token = RECOVERY_TOKENS.get(email);

      if (!token) {
        setError('Sessão expirada. Solicite um novo código.');
        logger.warn('PasswordRecovery', 'verifyCode', 'No token found for email', { email });
        return false;
      }

      if (Date.now() > token.expiresAt) {
        RECOVERY_TOKENS.delete(email);
        setError('Código expirado. Solicite um novo código.');
        logger.warn('PasswordRecovery', 'verifyCode', 'Code expired', { email });
        return false;
      }

      if (token.attempts >= token.maxAttempts) {
        RECOVERY_TOKENS.delete(email);
        blockEmail(email);
        setError('Muitas tentativas incorretas. Tente novamente em 15 minutos.');
        logger.warn('PasswordRecovery', 'verifyCode', 'Max attempts exceeded', { email });
        return false;
      }

      if (codeInput !== token.code) {
        token.attempts += 1;
        setError(`Código inválido. ${token.maxAttempts - token.attempts} tentativas restantes.`);
        logger.warn('PasswordRecovery', 'verifyCode', 'Invalid code', { email, attempts: token.attempts });
        return false;
      }

      logger.info('PasswordRecovery', 'verifyCode', 'Code verified successfully', { email });
      setStep('password');
      return true;
    } catch (err) {
      logger.error('PasswordRecovery', 'verifyCode', 'Error verifying code', err);
      setError('Erro ao verificar código. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async (): Promise<boolean> => {
    if (!canResendCode(email)) {
      setError('Aguarde antes de solicitar um novo código.');
      return false;
    }

    return requestRecovery(email);
  };

  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Mínimo 8 caracteres');
    }
    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Pelo menos 1 letra');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Pelo menos 1 número');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; percentage: number } => {
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;

    let strengthLevel: 'weak' | 'medium' | 'strong' = 'weak';
    if (strength >= 75) strengthLevel = 'strong';
    else if (strength >= 50) strengthLevel = 'medium';

    return {
      strength: strengthLevel,
      percentage: Math.min(strength, 100),
    };
  };

  const resetPassword = async (newPass: string): Promise<boolean> => {
    setError('');
    setIsLoading(true);

    try {
      const validation = validatePassword(newPass);
      if (!validation.valid) {
        setError(validation.errors.join(', '));
        return false;
      }

      if (newPass !== confirmPassword) {
        setError('As senhas não coincidem.');
        return false;
      }

      logger.info('PasswordRecovery', 'resetPassword', 'Updating patient password', { email });

      const { items } = await BaseCrudService.getAll<Pacientes>('pacientes');
      const patient = items.find(p => p.email === email);

      if (!patient) {
        setError('Paciente não encontrado.');
        return false;
      }

      if (patient.password === newPass) {
        setError('A nova senha não pode ser igual à anterior.');
        return false;
      }

      await BaseCrudService.update('pacientes', {
        _id: patient._id,
        password: newPass,
      });

      RECOVERY_TOKENS.delete(email);
      logger.info('PasswordRecovery', 'resetPassword', 'Password reset successfully', { email });

      setStep('success');
      return true;
    } catch (err) {
      logger.error('PasswordRecovery', 'resetPassword', 'Error resetting password', err);
      setError('Erro ao alterar senha. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setResendCountdown(0);
    setPatientName('');
  };

  return {
    step,
    setStep,
    email,
    code,
    setCode,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
    setError,
    isLoading,
    resendCountdown,
    patientName,
    requestRecovery,
    verifyCode,
    resendCode,
    resetPassword,
    validatePassword,
    getPasswordStrength,
    reset,
  };
}
