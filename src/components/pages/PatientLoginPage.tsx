import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, User, Phone, MapPin, Calendar, Stethoscope, Building2, UserPlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BaseCrudService } from '@/integrations';
import type { Pacientes } from '@/entities';
import { logger } from '@/lib/logger';

export default function PatientLoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    dateOfBirth: '',
    phoneNumber: '',
    address: '',
    susNumber: '',
    surgeryType: '',
    surgeryDate: '',
    responsibleHospital: '',
    responsibleDoctorName: '',
    emergencyContact: '',
    email: '',
    password: '',
    hospital: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      logger.info('PatientLogin', 'handleLogin', 'Attempting patient login', { email: loginEmail });

      const { items } = await BaseCrudService.getAll<Pacientes>('pacientes');
      const patient = items.find(p => p.email === loginEmail && p.password === loginPassword);

      if (patient) {
        localStorage.setItem('patientId', patient._id);
        logger.info('PatientLogin', 'handleLogin', 'Login successful', { patientId: patient._id.substring(0, 8) });
        navigate('/patient-dashboard');
      } else {
        const errorMsg = 'Email ou senha incorretos';
        logger.warn('PatientLogin', 'handleLogin', errorMsg, { email: loginEmail });
        setError(errorMsg);
      }
    } catch (error) {
      logger.error('PatientLogin', 'handleLogin', 'Login error', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      logger.info('PatientLogin', 'handleRegister', 'Attempting patient registration', { email: formData.email });

      const newPatient: Pacientes = {
        _id: crypto.randomUUID(),
        ...formData,
      };

      await BaseCrudService.create('pacientes', newPatient);
      
      logger.info('PatientLogin', 'handleRegister', 'Registration successful', { patientId: newPatient._id.substring(0, 8) });
      
      setError('');
      setIsLogin(true);
      setFormData({
        fullName: '',
        cpf: '',
        dateOfBirth: '',
        phoneNumber: '',
        address: '',
        susNumber: '',
        surgeryType: '',
        surgeryDate: '',
        responsibleHospital: '',
        responsibleDoctorName: '',
        emergencyContact: '',
        email: '',
        password: '',
        hospital: '',
      });
      
      // Show success message
      setError('');
    } catch (error) {
      logger.error('PatientLogin', 'handleRegister', 'Registration error', error);
      setError('Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Mobile Optimized */}
      <header className="bg-white border-b-2 border-secondary/30 flex-shrink-0 sticky top-0 z-40">
        <div className="w-full px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-xl font-bold text-foreground leading-tight">Pós-Op Conectado</h1>
              <p className="font-paragraph text-xs text-foreground/60">Área do Paciente</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content - Mobile Optimized */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 w-full">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl overflow-hidden border-2 border-secondary/30">
            {/* Tabs - Larger touch targets */}
            <div className="flex border-b-2 border-secondary/30">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-5 font-paragraph font-bold text-lg transition-colors ${
                  isLogin
                    ? 'bg-primary text-white'
                    : 'bg-white text-foreground'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-5 font-paragraph font-bold text-lg transition-colors ${
                  !isLogin
                    ? 'bg-primary text-white'
                    : 'bg-white text-foreground'
                }`}
              >
                Cadastro
              </button>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Bem-vindo</h2>
                    <p className="font-paragraph text-base text-foreground/70">
                      Acesse sua conta
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="font-paragraph text-base text-destructive font-semibold">{error}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="email" className="font-paragraph text-base font-bold text-foreground">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        id="email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="seu@email.com"
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="font-paragraph text-base font-bold text-foreground">
                        Senha
                      </Label>
                      <Link to="/patient-password-recovery" className="font-paragraph text-sm text-primary hover:underline font-semibold">
                        Esqueceu?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        id="password"
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-white hover:opacity-90 font-paragraph font-bold py-4 rounded-2xl text-lg h-16 mt-8"
                  >
                    {isLoading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="text-center mb-6">
                    <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Criar Conta</h2>
                    <p className="font-paragraph text-base text-foreground/70">
                      Preencha seus dados
                    </p>
                  </div>

                  {error && (
                    <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                      <p className="font-paragraph text-base text-destructive font-semibold">{error}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Nome Completo</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Seu nome"
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">CPF</Label>
                    <Input
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                      className="font-paragraph text-lg h-14 rounded-2xl border-2"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Data de Nascimento</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Telefone</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        placeholder="(11) 99999-9999"
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Número do SUS</Label>
                    <Input
                      value={formData.susNumber}
                      onChange={(e) => setFormData({ ...formData, susNumber: e.target.value })}
                      placeholder="000 0000 0000 0000"
                      className="font-paragraph text-lg h-14 rounded-2xl border-2"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Endereço</Label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Rua, número, bairro"
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Tipo de Cirurgia</Label>
                    <div className="relative">
                      <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        value={formData.surgeryType}
                        onChange={(e) => setFormData({ ...formData, surgeryType: e.target.value })}
                        placeholder="Ex: Apendicectomia"
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Data da Cirurgia</Label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        type="date"
                        value={formData.surgeryDate}
                        onChange={(e) => setFormData({ ...formData, surgeryDate: e.target.value })}
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Hospital Responsável</Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        value={formData.responsibleHospital}
                        onChange={(e) => setFormData({ ...formData, responsibleHospital: e.target.value })}
                        placeholder="Nome do hospital"
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Médico Responsável</Label>
                    <div className="relative">
                      <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        value={formData.responsibleDoctorName}
                        onChange={(e) => setFormData({ ...formData, responsibleDoctorName: e.target.value })}
                        placeholder="Dr(a). Nome"
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Hospital</Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        value={formData.hospital}
                        onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                        placeholder="Nome do hospital"
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Contato de Emergência</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                        placeholder="Nome e telefone"
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="seu@email.com"
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="font-paragraph text-base font-bold text-foreground">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-foreground/40" />
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className="pl-14 font-paragraph text-lg h-14 rounded-2xl border-2"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-white hover:opacity-90 font-paragraph font-bold py-4 rounded-2xl text-lg h-16 mt-8"
                  >
                    {isLoading ? 'Cadastrando...' : 'Criar Conta'}
                  </Button>
                </form>
              )}
            </div>
          </div>

          <div className="text-center mt-6 pb-4">
            <Link to="/" className="font-paragraph text-base text-primary hover:underline font-bold">
              ← Voltar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
