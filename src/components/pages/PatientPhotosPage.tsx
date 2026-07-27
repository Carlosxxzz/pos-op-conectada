import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, Camera, Upload, AlertCircle, Maximize2, X } from 'lucide-react';
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
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

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
      // Filter checklists by patient ID and that have photos
      const checklistsWithPhotos = items.filter(c => c.patientId === patientId && c.scarPhoto);
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Por favor, selecione um arquivo de imagem válido.');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('A imagem deve ter no máximo 10MB.');
        return;
      }

      setErrorMessage('');
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
      setErrorMessage('Por favor, selecione uma foto');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const patientId = localStorage.getItem('patientId');
      if (!patientId) {
        setErrorMessage('Erro: Paciente não identificado. Por favor, faça login novamente.');
        setIsSaving(false);
        return;
      }

      // Convert file to base64 data URL
      const reader = new FileReader();
      reader.onerror = () => {
        setErrorMessage('Erro ao ler o arquivo. Por favor, tente novamente.');
        setIsSaving(false);
      };
      reader.onloadend = async () => {
        try {
          const photoUrl = reader.result as string;
          
          const newChecklist: ChecklistsDirios = {
            _id: crypto.randomUUID(),
            checklistDate: new Date().toISOString(),
            patientId: patientId,
            scarPhoto: photoUrl,
            riskLevel: 'stable',
          };

          await BaseCrudService.create('checklistsdiarios', newChecklist);
          alert('Foto enviada com sucesso!');
          setSelectedFile(null);
          setPreviewUrl('');
          loadData();
        } catch (error: any) {
          const errorMsg = error?.message || 'Erro desconhecido ao enviar foto';
          setErrorMessage(`Erro ao enviar foto: ${errorMsg}. Por favor, verifique sua conexão e tente novamente.`);
          console.error('Erro ao salvar foto:', error);
          setIsSaving(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      const errorMsg = error?.message || 'Erro desconhecido';
      setErrorMessage(`Erro ao processar foto: ${errorMsg}`);
      console.error('Erro ao processar foto:', error);
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
      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <Image
              src={fullscreenImage}
              alt="Visualização em tela cheia"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-secondary/30">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/patient-dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">AcompanhaMed</h1>
                <p className="font-paragraph text-sm text-foreground/60">Fotos da Área Avaliada</p>
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
              Enviar Foto da Área Avaliada
            </h2>
            <p className="font-paragraph text-lg text-foreground/70">
              Envie fotos regularmente para acompanhamento visual da sua evolução
            </p>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-secondary/20 mb-12">
            <div className="space-y-6">
              {/* Error Message */}
              {errorMessage && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 flex gap-4">
                  <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-paragraph font-semibold text-destructive mb-1">
                      Erro
                    </p>
                    <p className="font-paragraph text-sm text-destructive/80">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label className="font-paragraph text-base font-semibold text-foreground mb-4 block">
                  Selecione uma foto
                </Label>
                <div className="border-2 border-dashed border-secondary rounded-xl p-8 text-center bg-background/50">
                  {previewUrl ? (
                    <div className="space-y-4">
                      {/* Image Preview Container - Centered and Responsive */}
                      <div className="flex items-center justify-center bg-white rounded-lg p-4 min-h-64 max-h-96">
                        <Image 
                          src={previewUrl} 
                          alt="Preview da foto" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFullscreenImage(previewUrl)}
                          className="font-paragraph flex items-center justify-center gap-2"
                        >
                          <Maximize2 className="w-4 h-4" />
                          Visualizar em Tela Cheia
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl('');
                            setErrorMessage('');
                          }}
                          className="font-paragraph"
                        >
                          Trocar Foto
                        </Button>
                      </div>
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
                className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-6 rounded-lg text-lg disabled:opacity-50"
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {checklists.map((checklist) => (
                  <div key={checklist._id} className="border border-secondary/20 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    {checklist.scarPhoto && (
                      <div className="relative group">
                        <div className="flex items-center justify-center bg-background h-64 overflow-hidden">
                          <Image
                            src={checklist.scarPhoto}
                            alt="Foto da cicatriz"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <button
                          onClick={() => setFullscreenImage(checklist.scarPhoto!)}
                          className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Maximize2 className="w-8 h-8 text-white" />
                        </button>
                      </div>
                    )}
                    <div className="p-4 bg-background">
                      <p className="font-paragraph text-sm text-foreground/70">
                        {new Date(checklist.checklistDate || '').toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
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
