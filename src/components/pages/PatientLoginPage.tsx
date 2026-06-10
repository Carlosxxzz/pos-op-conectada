import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock, User, Phone, MapPin, Calendar, Stethoscope, Building2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BaseCrudService } from '@/integrations';
import type { Pacientes } from '@/entities';

export default function PatientLoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);

    try {
      const { items } = await BaseCrudService.getAll<Pacientes>('pacientes');
      const patient = items.find(p => p.email === loginEmail && p.password === loginPassword);

      if (patient) {
        localStorage.setItem('patientId', patient._id);
        navigate('/patient-dashboard');
      } else {
        alert('Email ou senha incorretos');
      }
    } catch (error) {
      alert('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newPatient: Pacientes = {
        _id: crypto.randomUUID(),
        ...formData,
      };

      await BaseCrudService.create('pacientes', newPatient);
      alert('Cadastro realizado com sucesso! Faça login para continuar.');
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
    } catch (error) {
      alert('Erro ao realizar cadastro');
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
              <p className="font-paragraph text-sm text-foreground/60">Área do Paciente</p>
            </div>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-secondary/20 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-secondary/30">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-4 font-paragraph font-semibold transition-colors ${
                  isLogin
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white text-foreground hover:bg-background'
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-4 font-paragraph font-semibold transition-colors ${
                  !isLogin
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white text-foreground hover:bg-background'
                }`}
              >
                Cadastro
              </button>
            </div>

            <div className="p-8">
              {isLogin ? (
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Bem-vindo de volta</h2>
                    <p className="font-paragraph text-base text-foreground/70">
                      Acesse sua área de acompanhamento
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-paragraph text-sm font-semibold text-foreground">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                      <Input
                        id="email"
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
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
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
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
              ) : (
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Criar Conta</h2>
                    <p className="font-paragraph text-base text-foreground/70">
                      Preencha seus dados para começar o acompanhamento
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">
                        Nome Completo
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <Input
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Nome completo"
                          className="pl-11 font-paragraph"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">CPF</Label>
                      <Input
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                        className="font-paragraph"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">
                        Data de Nascimento
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <Input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                          className="pl-11 font-paragraph"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <Input
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          placeholder="(11) 99999-9999"
                          className="pl-11 font-paragraph"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">
                        Número do SUS
                      </Label>
                      <Input
                        value={formData.susNumber}
                        onChange={(e) => setFormData({ ...formData, susNumber: e.target.value })}
                        placeholder="000 0000 0000 0000"
                        className="font-paragraph"
                        required
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">Endereço</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <Input
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Rua, número, bairro, cidade"
                          className="pl-11 font-paragraph"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">
                        Tipo de Cirurgia
                      </Label>
                      <div className="relative">
                        <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <Input
                          value={formData.surgeryType}
                          onChange={(e) => setFormData({ ...formData, surgeryType: e.target.value })}
                          placeholder="Ex: Apendicectomia"
                          className="pl-11 font-paragraph"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">
                        Data da Cirurgia
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <Input
                          type="date"
                          value={formData.surgeryDate}
                          onChange={(e) => setFormData({ ...formData, surgeryDate: e.target.value })}
                          className="pl-11 font-paragraph"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">
                        Hospital Responsável
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <Input
                          value={formData.responsibleHospital}
                          onChange={(e) => setFormData({ ...formData, responsibleHospital: e.target.value })}
                          placeholder="Nome do hospital"
                          className="pl-11 font-paragraph"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">
                        Médico Responsável
                      </Label>
                      <div className="relative">
                        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <Input
                          value={formData.responsibleDoctorName}
                          onChange={(e) => setFormData({ ...formData, responsibleDoctorName: e.target.value })}
                          placeholder="Dr(a). Nome"
                          className="pl-11 font-paragraph"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">
                        Hospital
                      </Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <Input
                          value={formData.hospital}
                          onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                          placeholder="Nome do hospital"
                          className="pl-11 font-paragraph"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">
                        Contato de Emergência
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <Input
                          value={formData.emergencyContact}
                          onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                          placeholder="Nome e telefone"
                          className="pl-11 font-paragraph"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="seu@email.com"
                          className="pl-11 font-paragraph"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-paragraph text-sm font-semibold text-foreground">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                        <Input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          className="pl-11 font-paragraph"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-6 rounded-lg"
                  >
                    {isLoading ? 'Cadastrando...' : 'Criar Conta'}
                  </Button>
                </form>
              )}
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
