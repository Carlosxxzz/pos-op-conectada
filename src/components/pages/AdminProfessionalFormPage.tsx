import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import type { Profissionais, Especialidades, Hospitais, Setores } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import ProfessionalProfileHeader from '@/components/ProfessionalProfileHeader';
import { ArrowLeft } from 'lucide-react';

// Utility functions for formatting
const formatCPF = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
};

const formatPhone = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
};

const formatCEP = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 5) return cleaned;
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
};

const formatCRM = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  return cleaned.slice(0, 10);
};

// Custom Select Component
interface SelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
}

const CustomSelect = ({ value, onChange, children, required, disabled }: SelectProps) => (
  <select
    value={value}
    onChange={onChange}
    required={required}
    disabled={disabled}
    className="w-full px-4 py-3 border border-secondary/30 rounded-lg bg-white text-foreground placeholder-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-paragraph text-base disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {children}
  </select>
);

export default function AdminProfessionalFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [professional, setProfessional] = useState<Profissionais | null>(null);
  const [adminUser, setAdminUser] = useState<Profissionais | null>(null);
  const [hospitals, setHospitals] = useState<Hospitais[]>([]);
  const [setores, setSetores] = useState<Setores[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidades[]>([]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    profile: 'Médico',
    hospital: '',
    specialty: '',
    registroProfissional: '',
    cpf: '',
    dataNascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',
    cep: '',
    estado: '',
    cidade: '',
    endereco: '',
    numero: '',
    complemento: '',
    turno: '',
    cargaHoraria: '',
    dataAdmissao: '',
    status: 'Ativo',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const adminId = localStorage.getItem('professionalId');
      if (!adminId) {
        navigate('/professional-login');
        return;
      }

      const adminData = await BaseCrudService.getById<Profissionais>('profissionais', adminId);
      setAdminUser(adminData);

      const { items: hospList } = await BaseCrudService.getAll<Hospitais>('hospitais');
      const { items: setorList } = await BaseCrudService.getAll<Setores>('setores');
      const { items: espList } = await BaseCrudService.getAll<Especialidades>('especialidades');

      setHospitals(hospList);
      setSetores(setorList);
      setEspecialidades(espList);

      if (id) {
        const profData = await BaseCrudService.getById<Profissionais>('profissionais', id);
        if (profData) {
          setFormData({
            fullName: profData.fullName || '',
            email: profData.email || '',
            password: '',
            confirmPassword: '',
            profile: profData.profile || 'Médico',
            hospital: profData.hospital || '',
            specialty: profData.specialty || '',
            registroProfissional: profData.registroProfissional || '',
            cpf: profData.cpf || '',
            dataNascimento: profData.dataNascimento ? new Date(profData.dataNascimento).toISOString().split('T')[0] : '',
            sexo: profData.sexo || '',
            telefone: profData.telefone || '',
            whatsapp: profData.whatsapp || '',
            cep: profData.cep || '',
            estado: profData.estado || '',
            cidade: profData.cidade || '',
            endereco: profData.endereco || '',
            numero: profData.numero || '',
            complemento: profData.complemento || '',
            turno: profData.turno || '',
            cargaHoraria: profData.cargaHoraria || '',
            dataAdmissao: profData.dataAdmissao ? new Date(profData.dataAdmissao).toISOString().split('T')[0] : '',
            status: profData.status || 'Ativo',
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      alert('Nome completo é obrigatório');
      return false;
    }
    if (!formData.email.trim()) {
      alert('Email é obrigatório');
      return false;
    }
    if (!formData.profile) {
      alert('Tipo de profissional é obrigatório');
      return false;
    }
    if (!formData.hospital) {
      alert('Hospital é obrigatório');
      return false;
    }
    if (!id && !formData.password) {
      alert('Senha é obrigatória para novo profissional');
      return false;
    }
    if (!id && formData.password !== formData.confirmPassword) {
      alert('Senhas não conferem');
      return false;
    }
    if (formData.cpf && !validateCPF(formData.cpf)) {
      alert('CPF inválido');
      return false;
    }
    return true;
  };

  const validateCPF = (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.length === 11;
  };

  const getFilteredSpecialties = () => {
    if (formData.profile === 'Médico') {
      return especialidades.filter(e => e.professionalType === 'Médico' || !e.professionalType);
    } else if (formData.profile === 'Enfermeiro') {
      return especialidades.filter(e => e.professionalType === 'Enfermeiro' || !e.professionalType);
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const dataToSave: any = {
        fullName: formData.fullName,
        email: formData.email,
        profile: formData.profile,
        hospital: formData.hospital,
        specialty: formData.specialty,
        registroProfissional: formData.registroProfissional,
        cpf: formData.cpf,
        dataNascimento: formData.dataNascimento,
        sexo: formData.sexo,
        telefone: formData.telefone,
        whatsapp: formData.whatsapp,
        cep: formData.cep,
        estado: formData.estado,
        cidade: formData.cidade,
        endereco: formData.endereco,
        numero: formData.numero,
        complemento: formData.complemento,
        turno: formData.turno,
        cargaHoraria: formData.cargaHoraria,
        dataAdmissao: formData.dataAdmissao,
        status: formData.status,
      };

      if (id) {
        // Update existing
        dataToSave._id = id;
        if (formData.password) {
          dataToSave.password = formData.password;
        }
        await BaseCrudService.update('profissionais', dataToSave);
      } else {
        // Create new
        dataToSave._id = crypto.randomUUID();
        dataToSave.password = formData.password;
        dataToSave.criadoPor = adminUser?.fullName || 'Sistema';
        dataToSave.ultimoAcesso = new Date();
        await BaseCrudService.create('profissionais', dataToSave);
      }

      alert(id ? 'Profissional atualizado com sucesso!' : 'Profissional criado com sucesso!');
      navigate('/admin-professionals');
    } catch (error) {
      console.error('Error saving professional:', error);
      alert('Erro ao salvar profissional');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('professionalId');
    localStorage.removeItem('professionalProfile');
    navigate('/professional-login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProfessionalProfileHeader
        professional={adminUser}
        dashboardLink="/admin-dashboard"
        profileLink="/admin-profile"
        onLogout={handleLogout}
      />

      {/* Main Content - Full Width */}
      <div className="px-8 py-12 max-w-[100rem] mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin-professionals')}
            className="p-2 hover:bg-primary/10 rounded-lg transition"
          >
            <ArrowLeft className="w-6 h-6 text-primary" />
          </button>
          <div>
            <h2 className="font-heading text-4xl font-bold text-foreground">
              {id ? 'Editar Profissional' : 'Novo Profissional'}
            </h2>
            <p className="font-paragraph text-lg text-foreground/70 mt-2">
              {id ? 'Atualize as informações do profissional' : 'Cadastre um novo profissional no sistema'}
            </p>
          </div>
        </div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Personal Data Card */}
          <div className="bg-white rounded-xl p-8 border border-secondary/20 shadow-sm">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-8">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Nome Completo *
                </label>
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Digite o nome completo"
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  CPF
                </label>
                <Input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Data de Nascimento
                </label>
                <Input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Sexo *
                </label>
                <CustomSelect
                  value={formData.sexo}
                  onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </CustomSelect>
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Telefone
                </label>
                <Input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  WhatsApp
                </label>
                <Input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                  className="w-full"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Professional Data Card */}
          <div className="bg-white rounded-xl p-8 border border-secondary/20 shadow-sm">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-8">Dados Profissionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Tipo de Profissional *
                </label>
                <CustomSelect
                  value={formData.profile}
                  onChange={(e) => setFormData({ ...formData, profile: e.target.value, specialty: '' })}
                  required
                >
                  <option value="Médico">Médico</option>
                  <option value="Enfermeiro">Enfermeiro</option>
                  <option value="Administrador">Administrador</option>
                </CustomSelect>
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Hospital *
                </label>
                <CustomSelect
                  value={formData.hospital}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                  required
                >
                  <option value="">Selecione um hospital</option>
                  {hospitals.map(h => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </CustomSelect>
              </div>

              {formData.profile !== 'Administrador' && (
                <div>
                  <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                    Especialidade
                  </label>
                  <CustomSelect
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  >
                    <option value="">Selecione uma especialidade</option>
                    {getFilteredSpecialties().map(e => (
                      <option key={e._id} value={e._id}>{e.name}</option>
                    ))}
                  </CustomSelect>
                </div>
              )}

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Registro Profissional (CRM/COREN)
                </label>
                <Input
                  type="text"
                  value={formData.registroProfissional}
                  onChange={(e) => setFormData({ ...formData, registroProfissional: formatCRM(e.target.value) })}
                  placeholder="123456"
                  maxLength={10}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Turno
                </label>
                <CustomSelect
                  value={formData.turno}
                  onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                >
                  <option value="">Selecione</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                  <option value="Integral">Integral</option>
                  <option value="Plantonista">Plantonista</option>
                </CustomSelect>
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Carga Horária
                </label>
                <Input
                  type="text"
                  value={formData.cargaHoraria}
                  onChange={(e) => setFormData({ ...formData, cargaHoraria: e.target.value })}
                  placeholder="40 horas"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Data de Admissão
                </label>
                <Input
                  type="date"
                  value={formData.dataAdmissao}
                  onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Status
                </label>
                <CustomSelect
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Férias">Férias</option>
                  <option value="Licença">Licença</option>
                  <option value="Afastado">Afastado</option>
                </CustomSelect>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-white rounded-xl p-8 border border-secondary/20 shadow-sm">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-8">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  CEP
                </label>
                <Input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                  placeholder="00000-000"
                  maxLength={9}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Estado
                </label>
                <Input
                  type="text"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value.toUpperCase() })}
                  placeholder="SP"
                  maxLength={2}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Cidade
                </label>
                <Input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="São Paulo"
                  className="w-full"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Rua/Avenida
                </label>
                <Input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua/Avenida"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Número
                </label>
                <Input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="123"
                  className="w-full"
                />
              </div>

              <div className="lg:col-span-3">
                <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                  Complemento
                </label>
                <Input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  placeholder="Apto 101"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Access Card */}
          <div className="bg-white rounded-xl p-8 border border-secondary/20 shadow-sm">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-8">Conta de Acesso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!id && (
                <>
                  <div className="md:col-span-2">
                    <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                      Senha Inicial *
                    </label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required={!id}
                      className="w-full"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                      Confirmar Senha *
                    </label>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required={!id}
                      className="w-full"
                    />
                  </div>
                </>
              )}

              {id && (
                <div className="md:col-span-2">
                  <label className="block font-paragraph text-sm font-semibold text-foreground mb-3">
                    Nova Senha (deixe em branco para manter)
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end pt-4">
            <Button
              type="button"
              onClick={() => navigate('/admin-professionals')}
              variant="outline"
              className="border-secondary/20 px-8 py-3 font-paragraph font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 font-paragraph font-semibold"
            >
              {isSaving ? 'Salvando...' : id ? 'Atualizar Profissional' : 'Criar Profissional'}
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
