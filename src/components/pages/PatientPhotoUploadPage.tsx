import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Activity, ArrowLeft, Camera, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BaseCrudService } from '@/integrations';
import type { ChecklistsDirios } from '@/entities';
import { Image } from '@/components/ui/image';

export default function PatientPhotoUploadPage() {
  const { checklistId } = useParams<{ checklistId: string }>();
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'gallery' | 'camera' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      alert('É necessário enviar uma foto para concluir o acompanhamento diário.');
      return;
    }

    if (!checklistId) {
      alert('Erro: Checklist não identificado');
      return;
    }

    setIsSaving(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoUrl = reader.result as string;
        
        try {
          // Update the checklist with the photo
          await BaseCrudService.update<ChecklistsDirios>('checklistsdiarios', {
            _id: checklistId,
            scarPhoto: photoUrl,
          });

          alert('Acompanhamento diário concluído com sucesso!');
          navigate('/patient-dashboard');
        } catch (error) {
          alert('Erro ao enviar foto');
          setIsSaving(false);
        }
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      alert('Erro ao processar foto');
      setIsSaving(false);
    }
  };

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
                <p className="font-paragraph text-sm text-foreground/60">Envio de Foto</p>
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h2 className="font-heading text-4xl font-bold text-foreground mb-2">
              Enviar Foto da Cicatriz
            </h2>
            <p className="font-paragraph text-lg text-foreground/70">
              Etapa 3 de 3: Finalize seu acompanhamento diário enviando uma foto
            </p>
          </div>

          {/* Info Alert */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 mb-8 flex gap-4">
            <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-paragraph font-semibold text-foreground mb-1">
                Foto Obrigatória
              </p>
              <p className="font-paragraph text-sm text-foreground/70">
                É necessário enviar uma foto para concluir o acompanhamento diário. A foto será vinculada ao seu checklist de hoje.
              </p>
            </div>
          </div>

          {/* Upload Options */}
          {!uploadMethod ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => setUploadMethod('camera')}
                className="bg-white rounded-2xl p-8 border border-secondary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                  Tirar Foto Agora
                </h3>
                <p className="font-paragraph text-sm text-foreground/70">
                  Abra a câmera do seu dispositivo para registrar uma foto em tempo real
                </p>
              </button>

              <button
                onClick={() => setUploadMethod('gallery')}
                className="bg-white rounded-2xl p-8 border border-secondary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-bold text-foreground mb-2">
                  Escolher da Galeria
                </h3>
                <p className="font-paragraph text-sm text-foreground/70">
                  Selecione uma foto existente no seu celular ou computador
                </p>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-secondary/20 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => {
                    setUploadMethod(null);
                    setPreviewUrl('');
                    setSelectedFile(null);
                  }}
                  className="text-primary hover:underline font-paragraph text-sm"
                >
                  ← Voltar
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Upload Area */}
                <div>
                  <Label className="font-paragraph text-base font-semibold text-foreground mb-4 block">
                    {uploadMethod === 'camera' ? 'Tirar Foto' : 'Selecionar Foto'}
                  </Label>
                  <div className="border-2 border-dashed border-secondary rounded-xl p-8 text-center">
                    {previewUrl ? (
                      <div className="space-y-4">
                        <Image 
                          src={previewUrl} 
                          alt="Preview da foto" 
                          className="max-w-md mx-auto rounded-lg max-h-96 object-cover"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl('');
                            if (uploadMethod === 'camera') {
                              cameraInputRef.current?.click();
                            } else {
                              fileInputRef.current?.click();
                            }
                          }}
                          className="font-paragraph"
                        >
                          Trocar foto
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                          <Camera className="w-10 h-10 text-primary" />
                        </div>
                        <div>
                          <p className="font-paragraph text-base font-semibold text-foreground mb-1">
                            {uploadMethod === 'camera' 
                              ? 'Clique para tirar uma foto' 
                              : 'Clique para selecionar uma foto'}
                          </p>
                          <p className="font-paragraph text-sm text-foreground/60">
                            {uploadMethod === 'camera'
                              ? 'Use a câmera do seu dispositivo'
                              : 'Escolha uma foto da sua galeria'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            if (uploadMethod === 'camera') {
                              cameraInputRef.current?.click();
                            } else {
                              fileInputRef.current?.click();
                            }
                          }}
                          className="bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold"
                        >
                          {uploadMethod === 'camera' ? 'Abrir Câmera' : 'Abrir Galeria'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!selectedFile || isSaving}
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-6 rounded-lg text-lg disabled:opacity-50"
                >
                  {isSaving ? (
                    'Finalizando...'
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Finalizar Acompanhamento
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
