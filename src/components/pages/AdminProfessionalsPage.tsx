import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseCrudService } from '@/integrations';
import type { Profissionais, Especialidades, Hospitais, Setores } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, Eye, ToggleRight, ToggleLeft } from 'lucide-react';
import ProfessionalProfileHeader from '@/components/ProfessionalProfileHeader';
import AdminSidebar from '@/components/AdminSidebar';
import { Image } from '@/components/ui/image';

interface ProfessionalWithDetails extends Profissionais {
  hospitalName?: string;
  setorName?: string;
  especialidadeName?: string;
}

export default function AdminProfessionalsPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [professional, setProfessional] = useState<Profissionais | null>(null);
  const [professionals, setProfessionals] = useState<ProfessionalWithDetails[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<ProfessionalWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [hospitals, setHospitals] = useState<Hospitais[]>([]);
  const [setores, setSetores] = useState<Setores[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidades[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSearchProfessionals();
  }, [professionals, searchTerm, filterType, filterStatus]);

  const loadData = async () => {
    try {
      const professionalId = localStorage.getItem('professionalId');
      if (!professionalId) {
        navigate('/professional-login');
        return;
      }

      const professionalData = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
      setProfessional(professionalData);

      const { items: profsList } = await BaseCrudService.getAll<Profissionais>('profissionais');
      const { items: hospList } = await BaseCrudService.getAll<Hospitais>('hospitais');
      const { items: setorList } = await BaseCrudService.getAll<Setores>('setores');
      const { items: espList } = await BaseCrudService.getAll<Especialidades>('especialidades');

      setHospitals(hospList);
      setSetores(setorList);
      setEspecialidades(espList);

      const enrichedProfessionals = profsList.map(prof => ({
        ...prof,
        hospitalName: hospList.find(h => h._id === prof.hospital)?.name,
        setorName: setorList.find(s => s._id === prof.specialty)?.name,
        especialidadeName: espList.find(e => e._id === prof.specialty)?.name,
      }));

      setProfessionals(enrichedProfessionals);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSearchProfessionals = () => {
    let filtered = professionals;

    // Filter by type
    if (filterType !== 'todos') {
      filtered = filtered.filter(p => p.profile === filterType);
    }

    // Filter by status
    if (filterStatus !== 'todos') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.fullName?.toLowerCase().includes(term) ||
        p.email?.toLowerCase().includes(term) ||
        p.registroProfissional?.toLowerCase().includes(term)
      );
    }

    setFilteredProfessionals(filtered);
    setCurrentPage(1);
  };

  const handleToggleStatus = async (prof: Profissionais) => {
    try {
      const newStatus = prof.status === 'Ativo' ? 'Inativo' : 'Ativo';
      await BaseCrudService.update('profissionais', {
        _id: prof._id,
        status: newStatus,
      });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (profId: string) => {
    if (confirm('Tem certeza que deseja excluir este profissional?')) {
      try {
        await BaseCrudService.delete('profissionais', profId);
        loadData();
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

  const paginatedProfessionals = filteredProfessionals.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProfessionals.length / itemsPerPage);

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
        professional={professional}
        dashboardLink="/admin-dashboard"
        profileLink="/admin-profile"
        onLogout={handleLogout}
      />

      <div className="flex">
        <AdminSidebar onLogout={handleLogout} />

        {/* Main Content */}
        <div className="flex-1 ml-64 px-8 py-12">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="font-heading text-4xl font-bold text-foreground mb-2">
              Gestão de Profissionais
            </h2>
            <p className="font-paragraph text-lg text-foreground/70">
              Administre todos os profissionais do sistema
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin-professional-form')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Profissional
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl p-6 border border-secondary/20 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-foreground/50" />
              <Input
                placeholder="Pesquisar por nome, email ou registro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="todos">Todos os Tipos</option>
              <option value="Médico">Médicos</option>
              <option value="Enfermeiro">Enfermeiros</option>
              <option value="Administrador">Administradores</option>
            </Select>

            <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="todos">Todos os Status</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
              <option value="Férias">Férias</option>
              <option value="Licença">Licença</option>
            </Select>

            <Button
              onClick={loadData}
              variant="outline"
              className="border-secondary/20"
            >
              Atualizar
            </Button>
          </div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-secondary/20 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background border-b border-secondary/20">
                <tr>
                  <th className="px-6 py-4 text-left font-heading font-bold text-foreground">Foto</th>
                  <th className="px-6 py-4 text-left font-heading font-bold text-foreground">Nome</th>
                  <th className="px-6 py-4 text-left font-heading font-bold text-foreground">Tipo</th>
                  <th className="px-6 py-4 text-left font-heading font-bold text-foreground">Especialidade</th>
                  <th className="px-6 py-4 text-left font-heading font-bold text-foreground">Hospital</th>
                  <th className="px-6 py-4 text-left font-heading font-bold text-foreground">Email</th>
                  <th className="px-6 py-4 text-left font-heading font-bold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left font-heading font-bold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProfessionals.length > 0 ? (
                  paginatedProfessionals.map((prof) => (
                    <tr key={prof._id} className="border-b border-secondary/10 hover:bg-background/50 transition">
                      <td className="px-6 py-4">
                        {prof.profilePhoto ? (
                          <Image
                            src={prof.profilePhoto}
                            alt={prof.fullName || 'Professional'}
                            width={40}
                            height={40}
                            className="rounded-full w-10 h-10 object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">
                              {prof.fullName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-paragraph text-foreground">{prof.fullName}</td>
                      <td className="px-6 py-4">
                        <Badge className={`${
                          prof.profile === 'Médico' ? 'bg-blue-100 text-blue-800' :
                          prof.profile === 'Enfermeiro' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {prof.profile}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-paragraph text-foreground text-sm">
                        {prof.specialty || '-'}
                      </td>
                      <td className="px-6 py-4 font-paragraph text-foreground text-sm">
                        {prof.hospital || '-'}
                      </td>
                      <td className="px-6 py-4 font-paragraph text-foreground text-sm">{prof.email}</td>
                      <td className="px-6 py-4">
                        <Badge className={`${
                          prof.status === 'Ativo' ? 'bg-stable/20 text-stable' :
                          prof.status === 'Inativo' ? 'bg-destructive/20 text-destructive' :
                          'bg-attention/20 text-attention'
                        }`}>
                          {prof.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/admin-professional-view/${prof._id}`)}
                            className="p-2 hover:bg-primary/10 rounded-lg transition"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin-professional-form/${prof._id}`)}
                            className="p-2 hover:bg-primary/10 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4 text-primary" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(prof)}
                            className="p-2 hover:bg-primary/10 rounded-lg transition"
                            title={prof.status === 'Ativo' ? 'Desativar' : 'Ativar'}
                          >
                            {prof.status === 'Ativo' ? (
                              <ToggleRight className="w-4 h-4 text-stable" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-destructive" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(prof._id)}
                            className="p-2 hover:bg-destructive/10 rounded-lg transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <p className="font-paragraph text-foreground/60">Nenhum profissional encontrado</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 p-6 border-t border-secondary/20">
              <Button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                variant="outline"
              >
                Anterior
              </Button>
              <span className="font-paragraph text-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
              >
                Próxima
              </Button>
            </div>
          )}
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-secondary/20"
          >
            <p className="font-paragraph text-sm text-foreground/60 mb-2">Total de Profissionais</p>
            <p className="font-heading text-3xl font-bold text-foreground">{professionals.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-secondary/20"
          >
            <p className="font-paragraph text-sm text-foreground/60 mb-2">Médicos</p>
            <p className="font-heading text-3xl font-bold text-foreground">
              {professionals.filter(p => p.profile === 'Médico').length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-secondary/20"
          >
            <p className="font-paragraph text-sm text-foreground/60 mb-2">Enfermeiros</p>
            <p className="font-heading text-3xl font-bold text-foreground">
              {professionals.filter(p => p.profile === 'Enfermeiro').length}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 border border-secondary/20"
          >
            <p className="font-paragraph text-sm text-foreground/60 mb-2">Ativos</p>
            <p className="font-heading text-3xl font-bold text-foreground">
              {professionals.filter(p => p.status === 'Ativo').length}
            </p>
          </motion.div>
        </div>
        </div>
      </div>
    </div>
  );
}
