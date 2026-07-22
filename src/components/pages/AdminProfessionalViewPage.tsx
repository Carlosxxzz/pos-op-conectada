import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import type { Profissionais, Especialidades, Hospitais } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import ProfessionalProfileHeader from '@/components/ProfessionalProfileHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { ArrowLeft, Edit2, Trash2, ToggleRight, ToggleLeft } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function AdminProfessionalViewPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [professional, setProfessional] = useState<Profissionais | null>(null);
  const [adminUser, setAdminUser] = useState<Profissionais | null>(null);
  const [hospital, setHospital] = useState<Hospitais | null>(null);
  const [especialidade, setEspecialidade] = useState<Especialidades | null>(null);

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

      if (id) {
        const profData = await BaseCrudService.getById<Profissionais>('profissionais', id);
        setProfessional(profData);

        if (profData?.hospital) {
          const hospData = await BaseCrudService.getById<Hospitais>('hospitais', profData.hospital);
          setHospital(hospData);
        }

        if (profData?.specialty) {
          const espData = await BaseCrudService.getById<Especialidades>('especialidades', profData.specialty);
          setEspecialidade(espData);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!professional) return;
    try {
      const newStatus = professional.status === 'Ativo' ? 'Inativo' : 'Ativo';
      await BaseCrudService.update('profissionais', {
        _id: professional._id,
        status: newStatus,
      });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async () => {
    if (!professional) return;
    if (confirm('Tem certeza que deseja excluir este profissional?')) {
      try {
        await BaseCrudService.delete('profissionais', professional._id);
        navigate('/admin-professionals');
      } catch (error) {
        console.error('Error deleting professional:', error);
      }
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

  if (!professional) {
    return (
      <div className="min-h-screen bg-background">
        <ProfessionalProfileHeader
          professional={adminUser}
          dashboardLink="/admin-dashboard"
          profileLink="/admin-profile"
          onLogout={handleLogout}
        />
        <div className="max-w-4xl mx-auto px-8 py-12 text-center">
          <p className="font-paragraph text-lg text-foreground/60">Profissional não encontrado</p>
          <Button
            onClick={() => navigate('/admin-professionals')}
            className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Voltar para Profissionais
          </Button>
        </div>
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

      <div className="flex">
        <AdminSidebar onLogout={handleLogout} />

        {/* Main Content */}
        <div className="flex-1 ml-64 px-8 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin-professionals')}
              className="p-2 hover:bg-primary/10 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-primary" />
            </button>
            <div>
              <h2 className="font-heading text-4xl font-bold text-foreground">
                {professional.fullName}
              </h2>
              <p className="font-paragraph text-lg text-foreground/70 mt-2">
                Visualizar Profissional
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate(`/admin-professional-form/${professional._id}`)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Edit2 className="w-5 h-5 mr-2" />
              Editar
            </Button>
            <Button
              onClick={handleToggleStatus}
              variant="outline"
              className="border-secondary/20"
            >
              {professional.status === 'Ativo' ? (
                <>
                  <ToggleRight className="w-5 h-5 mr-2 text-stable" />
                  Desativar
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 mr-2 text-destructive" />
                  Ativar
                </>
              )}
            </Button>
            <Button
              onClick={handleDelete}
              variant="outline"
              className="border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Excluir
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 border border-secondary/20 mb-8"
        >
          <div className="flex gap-8 mb-8">
            {professional.profilePhoto ? (
              <Image
                src={professional.profilePhoto}
                alt={professional.fullName || 'Professional'}
                width={150}
                height={150}
                className="rounded-2xl w-32 h-32 object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-4xl font-bold text-primary">
                  {professional.fullName?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Tipo de Profissional</p>
                  <Badge className={`${
                    professional.profile === 'Médico' ? 'bg-blue-100 text-blue-800' :
                    professional.profile === 'Enfermeiro' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {professional.profile}
                  </Badge>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Status</p>
                  <Badge className={`${
                    professional.status === 'Ativo' ? 'bg-stable/20 text-stable' :
                    professional.status === 'Inativo' ? 'bg-destructive/20 text-destructive' :
                    'bg-attention/20 text-attention'
                  }`}>
                    {professional.status}
                  </Badge>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Email</p>
                  <p className="font-paragraph text-foreground">{professional.email}</p>
                </div>
                <div>
                  <p className="font-paragraph text-sm text-foreground/60 mb-1">Telefone</p>
                  <p className="font-paragraph text-foreground">{professional.telefone || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Personal Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-8 border border-secondary/20 mb-8"
        >
          <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Dados Pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">CPF</p>
              <p className="font-paragraph text-foreground">{professional.cpf || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Data de Nascimento</p>
              <p className="font-paragraph text-foreground">
                {professional.dataNascimento ? new Date(professional.dataNascimento).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Sexo</p>
              <p className="font-paragraph text-foreground">{professional.sexo || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">WhatsApp</p>
              <p className="font-paragraph text-foreground">{professional.whatsapp || '-'}</p>
            </div>
          </div>
        </motion.div>

        {/* Address */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-8 border border-secondary/20 mb-8"
        >
          <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Endereço</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">CEP</p>
              <p className="font-paragraph text-foreground">{professional.cep || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Estado</p>
              <p className="font-paragraph text-foreground">{professional.estado || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Cidade</p>
              <p className="font-paragraph text-foreground">{professional.cidade || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Endereço</p>
              <p className="font-paragraph text-foreground">{professional.endereco || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Número</p>
              <p className="font-paragraph text-foreground">{professional.numero || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Complemento</p>
              <p className="font-paragraph text-foreground">{professional.complemento || '-'}</p>
            </div>
          </div>
        </motion.div>

        {/* Professional Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-8 border border-secondary/20 mb-8"
        >
          <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Dados Profissionais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Hospital</p>
              <p className="font-paragraph text-foreground">{hospital?.name || professional.hospital || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Especialidade</p>
              <p className="font-paragraph text-foreground">{especialidade?.name || professional.specialty || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Registro Profissional</p>
              <p className="font-paragraph text-foreground">{professional.registroProfissional || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Turno</p>
              <p className="font-paragraph text-foreground">{professional.turno || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Carga Horária</p>
              <p className="font-paragraph text-foreground">{professional.cargaHoraria || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Data de Admissão</p>
              <p className="font-paragraph text-foreground">
                {professional.dataAdmissao ? new Date(professional.dataAdmissao).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* System Data */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-8 border border-secondary/20"
        >
          <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Dados do Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Criado Por</p>
              <p className="font-paragraph text-foreground">{professional.criadoPor || '-'}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Data de Criação</p>
              <p className="font-paragraph text-foreground">
                {professional._createdDate ? new Date(professional._createdDate).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Último Acesso</p>
              <p className="font-paragraph text-foreground">
                {professional.ultimoAcesso ? new Date(professional.ultimoAcesso).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">ID</p>
              <p className="font-paragraph text-foreground text-xs break-all">{professional._id}</p>
            </div>
          </div>
        </motion.div>
        </div>
      </div>
    </div>
  );
}
