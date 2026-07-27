import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePasswordRecovery } from '@/hooks/usePasswordRecovery';
import PasswordInput from '@/components/PasswordInput';
import PasswordConfirmation from '@/components/PasswordConfirmation';

export default function PatientPasswordRecoveryPage() {
  const navigate = useNavigate();
  const {
    step,
    email,
    code,
    setCode,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    error,
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
    setStep,
    setError,
  } = usePasswordRecovery();

  const [emailInput, setEmailInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordValidation, setNewPasswordValidation] = useState({ isValid: false, requirements: {}, errors: [] });

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    await requestRecovery(emailInput);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyCode(code);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await resetPassword(newPassword);
    if (success) {
      setTimeout(() => {
        navigate('/patient-login');
      }, 2000);
    }
  };

  const handleResendCode = async () => {
    await resendCode();
  };

  const handleBackFromCode = () => {
    setCode('');
    setError('');
    setStep('email');
  };

  const passwordValidation = validatePassword(newPassword);
  const passwordStrength = getPasswordStrength(newPassword);

  const getStrengthColor = () => {
    if (passwordStrength.strength === 'strong') return 'bg-stable';
    if (passwordStrength.strength === 'medium') return 'bg-attention';
    return 'bg-destructive';
  };

  const getStrengthText = () => {
    if (passwordStrength.strength === 'strong') return 'Forte';
    if (passwordStrength.strength === 'medium') return 'Média';
    return 'Fraca';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-secondary/30">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <button
            onClick={() => navigate('/patient-login')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">AcompanhaMed</h1>
              <p className="font-paragraph text-sm text-foreground/60">Recuperar Senha</p>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-secondary/20 overflow-hidden">
            <div className="p-8">
              {/* Step 1: Email Request */}
              {step === 'email' && (
                <form onSubmit={handleRequestRecovery} className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
                      Recuperar Senha
                    </h2>
                    <p className="font-paragraph text-base text-foreground/70">
                      Digite seu e-mail para receber um código de verificação
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="font-paragraph text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-paragraph text-sm font-semibold text-foreground">
                      E-mail
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <Input
                        id="email"
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-11 font-paragraph"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-6 rounded-lg"
                  >
                    {isLoading ? 'Enviando...' : 'Enviar Código'}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/patient-login')}
                      className="font-paragraph text-sm text-primary hover:underline"
                    >
                      ← Voltar para Login
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Code Verification */}
              {step === 'code' && (
                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
                      Verificar Código
                    </h2>
                    <p className="font-paragraph text-base text-foreground/70">
                      Digite o código enviado para seu e-mail para continuar a recuperação da senha.
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="font-paragraph text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="code" className="font-paragraph text-sm font-semibold text-foreground">
                      Código de Verificação
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="000000"
                      maxLength={6}
                      className="font-paragraph text-center text-2xl tracking-widest"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-6 rounded-lg"
                  >
                    {isLoading ? 'Verificando...' : 'Verificar Código'}
                  </Button>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCountdown > 0 || isLoading}
                      className="w-full font-paragraph text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendCountdown > 0
                        ? `Reenviar em ${resendCountdown}s`
                        : 'Reenviar Código'}
                    </button>

                    <button
                      type="button"
                      onClick={handleBackFromCode}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 font-paragraph text-sm text-foreground/70 hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Voltar
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: New Password */}
              {step === 'password' && (
                <form onSubmit={handleResetPassword} className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
                      Nova Senha
                    </h2>
                    <p className="font-paragraph text-base text-foreground/70">
                      Crie uma nova senha segura para sua conta
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="font-paragraph text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="font-paragraph text-sm font-semibold text-foreground">
                      Nova Senha
                    </Label>
                    <PasswordInput
                      label=""
                      value={newPassword}
                      onChange={setNewPassword}
                      onValidationChange={setNewPasswordValidation}
                      placeholder="••••••••"
                      showRequirements={true}
                      showLabel={false}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="font-paragraph text-sm font-semibold text-foreground">
                      Confirmar Senha
                    </Label>
                    <PasswordConfirmation
                      password={newPassword}
                      confirmPassword={confirmPassword}
                      onConfirmPasswordChange={setConfirmPassword}
                      placeholder="••••••••"
                      label=""
                      showLabel={false}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !newPasswordValidation.isValid || newPassword !== confirmPassword}
                    className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-6 rounded-lg disabled:opacity-50"
                  >
                    {isLoading ? 'Alterando...' : 'Alterar Senha'}
                  </Button>
                </form>
              )}

              {/* Step 4: Success */}
              {step === 'success' && (
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-stable/10 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-stable" />
                    </div>
                  </div>

                  <div>
                    <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
                      Sucesso!
                    </h2>
                    <p className="font-paragraph text-base text-foreground/70">
                      Sua senha foi alterada com sucesso.
                    </p>
                  </div>

                  <p className="font-paragraph text-sm text-foreground/60">
                    Redirecionando para login em alguns segundos...
                  </p>

                  <Button
                    onClick={() => navigate('/patient-login')}
                    className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-6 rounded-lg"
                  >
                    Ir para Login
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
