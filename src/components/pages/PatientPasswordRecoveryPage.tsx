import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePasswordRecovery } from '@/hooks/usePasswordRecovery';

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
  } = usePasswordRecovery();

  const [emailInput, setEmailInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
              <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
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
                      Digite o código enviado para<br />
                      <span className="font-semibold text-foreground">{email}</span>
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

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendCountdown > 0 || isLoading}
                      className="font-paragraph text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resendCountdown > 0
                        ? `Reenviar em ${resendCountdown}s`
                        : 'Reenviar Código'}
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
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <Input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-11 pr-11 font-paragraph"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="font-paragraph text-xs text-foreground/60">Força da senha:</span>
                          <span className={`font-paragraph text-xs font-semibold ${
                            passwordStrength.strength === 'strong'
                              ? 'text-stable'
                              : passwordStrength.strength === 'medium'
                              ? 'text-attention'
                              : 'text-destructive'
                          }`}>
                            {getStrengthText()}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getStrengthColor()} transition-all duration-300`}
                            style={{ width: `${passwordStrength.percentage}%` }}
                          />
                        </div>

                        {/* Validation Requirements */}
                        <div className="space-y-1 mt-3">
                          {[
                            { met: newPassword.length >= 8, text: 'Mínimo 8 caracteres' },
                            { met: /[a-zA-Z]/.test(newPassword), text: 'Pelo menos 1 letra' },
                            { met: /[0-9]/.test(newPassword), text: 'Pelo menos 1 número' },
                          ].map((req, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                req.met ? 'bg-stable' : 'bg-foreground/10'
                              }`}>
                                {req.met && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
                              </div>
                              <span className={`font-paragraph text-xs ${
                                req.met ? 'text-foreground/70' : 'text-foreground/40'
                              }`}>
                                {req.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="font-paragraph text-sm font-semibold text-foreground">
                      Confirmar Senha
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-11 pr-11 font-paragraph"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="font-paragraph text-xs text-destructive">As senhas não coincidem</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading || !passwordValidation.valid || newPassword !== confirmPassword}
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
