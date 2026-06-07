import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BaseCrudService } from '@/integrations';
import type { Profissionais } from '@/entities';

export default function ProfessionalLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { items } = await BaseCrudService.getAll<Profissionais>('profissionais');
      const professional = items.find(
        p => p.email === email && p.password === password && p.status === 'Ativo'
      );

      if (professional) {
        localStorage.setItem('professionalId', professional._id);
        localStorage.setItem('professionalProfile', professional.profile || '');
        
        // Redirect based on profile
        if (professional.profile === 'Enfermeiro') {
          navigate('/nursing-dashboard');
        } else if (professional.profile === 'Médico') {
          navigate('/medical-dashboard');
        } else if (professional.profile === 'Administrador') {
          navigate('/admin-dashboard');
        }
      } else {
        setError('Email, senha incorretos ou profissional inativo');
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-secondary/30">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
              <p className="font-paragraph text-sm text-foreground/60">Acesso Profissional</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-secondary/20 overflow-hidden p-8">
            <div className="text-center mb-8">
              <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
                Acesso Profissional
              </h2>
              <p className="font-paragraph text-base text-foreground/70">
                Faça login com suas credenciais
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="font-paragraph text-sm text-destructive">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-paragraph text-sm font-semibold text-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="pl-11 font-paragraph"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-paragraph text-sm font-semibold text-foreground">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-secondary/30">
              <p className="font-paragraph text-sm text-foreground/60 text-center">
                Contato de suporte: suporte@posopconectado.gov.br
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link to="/" className="font-paragraph text-sm text-primary hover:underline">
              ← Voltar para página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
