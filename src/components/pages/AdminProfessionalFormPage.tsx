import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import type { Profissionais, Especialidades, Hospitais, Setores } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { motion } from 'framer-motion';
import ProfessionalProfileHeader from '@/components/ProfessionalProfileHeader';
import { ArrowLeft } from 'lucide-react';

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
    if (cleanCPF.length !== 11) return false;
    // Basic CPF validation
    return true;
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
          className="bg-white rounded-2xl p-8 border border-secondary/20"
        >
          {/* Personal Data Section */}
          <div className="mb-8">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Dados Pessoais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Nome Completo *
                </label>
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  CPF
                </label>
                <Input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Data de Nascimento
                </label>
                <Input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Sexo
                </label>
                <Select
                  value={formData.sexo}
                  onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                >
                  <option value="">Selecione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outro">Outro</option>
                </Select>
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Telefone
                </label>
                <Input
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  WhatsApp
                </label>
                <Input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="mb-8">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  CEP
                </label>
                <Input
                  type="text"
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  placeholder="00000-000"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Estado
                </label>
                <Input
                  type="text"
                  value={formData.estado}
                  onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  placeholder="SP"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Cidade
                </label>
                <Input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Endereço
                </label>
                <Input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua/Avenida"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Número
                </label>
                <Input
                  type="text"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  placeholder="123"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Complemento
                </label>
                <Input
                  type="text"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                  placeholder="Apto 101"
                />
              </div>
            </div>
          </div>

          {/* Professional Data Section */}
          <div className="mb-8">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Dados Profissionais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Tipo de Profissional *
                </label>
                <Select
                  value={formData.profile}
                  onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                  required
                >
                  <option value="Médico">Médico</option>
                  <option value="Enfermeiro">Enfermeiro</option>
                  <option value="Administrador">Administrador</option>
                </Select>
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Hospital *
                </label>
                <Select
                  value={formData.hospital}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                  required
                >
                  <option value="">Selecione um hospital</option>
                  {hospitals.map(h => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Especialidade
                </label>
                <Select
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                >
                  <option value="">Selecione uma especialidade</option>
                  {especialidades.map(e => (
                    <option key={e._id} value={e._id}>{e.name}</option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Registro Profissional (CRM/COREN)
                </label>
                <Input
                  type="text"
                  value={formData.registroProfissional}
                  onChange={(e) => setFormData({ ...formData, registroProfissional: e.target.value })}
                  placeholder="123456"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Turno
                </label>
                <Select
                  value={formData.turno}
                  onChange={(e) => setFormData({ ...formData, turno: e.target.value })}
                >
                  <option value="">Selecione</option>
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                  <option value="Integral">Integral</option>
                  <option value="Plantonista">Plantonista</option>
                </Select>
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Carga Horária
                </label>
                <Input
                  type="text"
                  value={formData.cargaHoraria}
                  onChange={(e) => setFormData({ ...formData, cargaHoraria: e.target.value })}
                  placeholder="40 horas"
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Data de Admissão
                </label>
                <Input
                  type="date"
                  value={formData.dataAdmissao}
                  onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
                />
              </div>

              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Férias">Férias</option>
                  <option value="Licença">Licença</option>
                  <option value="Afastado">Afastado</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="mb-8">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Conta de Acesso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  required
                />
              </div>

              {!id && (
                <>
                  <div>
                    <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                      Senha Inicial *
                    </label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required={!id}
                    />
                  </div>

                  <div>
                    <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                      Confirmar Senha *
                    </label>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required={!id}
                    />
                  </div>
                </>
              )}

              {id && (
                <div>
                  <label className="block font-paragraph text-sm font-medium text-foreground mb-2">
                    Nova Senha (deixe em branco para manter)
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              onClick={() => navigate('/admin-professionals')}
              variant="outline"
              className="border-secondary/20"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSaving ? 'Salvando...' : id ? 'Atualizar' : 'Criar Profissional'}
            </Button>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
