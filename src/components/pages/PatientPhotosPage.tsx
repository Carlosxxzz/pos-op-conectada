import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BaseCrudService } from '@/integrations';
import type { ChecklistsDirios } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Image } from '@/components/ui/image';

export default function PatientPhotosPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [checklists, setChecklists] = useState<ChecklistsDirios[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const patientId = localStorage.getItem('patientId');
    if (!patientId) {
      navigate('/patient-login');
      return;
    }

    try {
      const { items } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
      const checklistsWithPhotos = items.filter(c => c.scarPhoto);
      setChecklists(checklistsWithPhotos.sort((a, b) => 
        new Date(b.checklistDate || 0).getTime() - new Date(a.checklistDate || 0).getTime()
      ));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Por favor, selecione uma foto');
      return;
    }

    setIsSaving(true);

    try {
      const photoUrl = 'https://static.wixstatic.com/media/2621fb_918d61134adb41a3ad5a4261e4bc9778~mv2.png?originWidth=768&originHeight=576';
      
      const newChecklist: ChecklistsDirios = {
        _id: crypto.randomUUID(),
        checklistDate: new Date().toISOString(),
        scarPhoto: photoUrl,
        riskLevel: 'stable',
      };

      await BaseCrudService.create('checklistsdiarios', newChecklist);
      alert('Foto enviada com sucesso!');
      setSelectedFile(null);
      setPreviewUrl('');
      loadData();
    } catch (error) {
      alert('Erro ao enviar foto');
    } finally {
      setIsSaving(false);
    }
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
      {/* Header */}
      <header className="bg-white border-b border-secondary/30">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/patient-dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Fotos da Cicatriz</p>
              </div>
            </Link>
            <Link to="/patient-dashboard">
              <Button variant="outline" className="flex items-center gap-2 font-paragraph">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="font-heading text-4xl font-bold text-foreground mb-2">
              Enviar Foto da Cicatriz
            </h2>
            <p className="font-paragraph text-lg text-foreground/70">
              Envie fotos regularmente para acompanhamento visual da sua recuperação
            </p>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-secondary/20 mb-12">
            <div className="space-y-6">
              <div>
                <Label className="font-paragraph text-base font-semibold text-foreground mb-4 block">
                  Selecione uma foto
                </Label>
                <div className="border-2 border-dashed border-secondary rounded-xl p-8 text-center">
                  {previewUrl ? (
                    <div className="space-y-4">
                      <Image src={previewUrl} alt="Preview" className="max-w-md mx-auto rounded-lg" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl('');
                        }}
                        className="font-paragraph"
                      >
                        Trocar foto
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                          <Camera className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                          <p className="font-paragraph text-base font-semibold text-foreground mb-1">
                            Clique para selecionar uma foto
                          </p>
                          <p className="font-paragraph text-sm text-foreground/60">
                            ou tire uma foto com a câmera
                          </p>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={!selectedFile || isSaving}
                className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-6 rounded-lg text-lg"
              >
                {isSaving ? (
                  'Enviando...'
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Enviar Foto
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Photo History */}
          <div className="bg-white rounded-2xl p-8 border border-secondary/20">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
              Histórico de Fotos
            </h3>
            {checklists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {checklists.map((checklist) => (
                  <div key={checklist._id} className="border border-secondary/20 rounded-xl overflow-hidden">
                    <Image
                      src={checklist.scarPhoto || ''}
                      alt="Foto da cicatriz"
                      width={400}
                      className="w-full h-64 object-cover"
                    />
                    <div className="p-4 bg-background">
                      <p className="font-paragraph text-sm text-foreground/70">
                        {new Date(checklist.checklistDate || '').toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Camera className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                <p className="font-paragraph text-base text-foreground/60">
                  Nenhuma foto enviada ainda
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
