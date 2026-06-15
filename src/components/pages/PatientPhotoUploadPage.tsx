import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Activity, ArrowLeft, Camera, Upload, AlertCircle, CheckCircle, X, Maximize2, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { BaseCrudService } from '@/integrations';
import type { ChecklistsDirios } from '@/entities';
import { Image } from '@/components/ui/image';
import { validateImage, compressImage, formatFileSize } from '@/lib/imageCompression';
import { useChecklistFlow } from '@/hooks/useChecklistFlow';
import { logger } from '@/lib/logger';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';

export default function PatientPhotoUploadPage() {
  const { checklistId } = useParams<{ checklistId: string }>();
  const navigate = useNavigate();
  const { tempChecklistData, clearChecklistFlow } = useChecklistFlow();
  
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'gallery' | 'camera' | null>(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  // Maintain session persistence
  useSessionPersistence();

  // Validate that we have checklist data
  useEffect(() => {
    if (!checklistId || !tempChecklistData) {
      logger.warn('PatientPhotoUpload', 'useEffect', 'Missing checklist data or ID', {
        hasChecklistId: !!checklistId,
        hasTempData: !!tempChecklistData,
      });
      navigate('/patient-checklist');
    } else {
      logger.info('PatientPhotoUpload', 'useEffect', 'Photo upload page initialized', {
        checklistId: checklistId.substring(0, 8),
      });
    }
  }, [checklistId, tempChecklistData, navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setErrorMessage('');
      setSuccessMessage('');
      setUploadProgress('');

      logger.info('PatientPhotoUpload', 'handleFileChange', 'File selected', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      // Validate file
      const validation = validateImage(file);
      if (!validation.isValid) {
        const errorMsg = validation.error || 'Erro ao validar imagem';
        logger.warn('PatientPhotoUpload', 'handleFileChange', 'Image validation failed', { error: errorMsg });
        setErrorMessage(errorMsg);
        return;
      }

      // Start compression
      setIsCompressing(true);
      setUploadProgress('Processando imagem...');

      try {
        logger.info('PatientPhotoUpload', 'handleFileChange', 'Starting image compression');
        const compression = await compressImage(file);

        // Check if compressed size is still too large
        if (compression.compressedSize > 5 * 1024 * 1024) {
          const errorMsg = 'Imagem ainda muito grande após compressão. Tente uma foto diferente.';
          logger.warn('PatientPhotoUpload', 'handleFileChange', 'Compressed image too large', {
            compressedSize: compression.compressedSize,
          });
          setErrorMessage(errorMsg);
          setIsCompressing(false);
          return;
        }

        setSelectedFile(file);
        setPreviewUrl(compression.compressedBase64);
        setSuccessMessage(
          `Imagem processada com sucesso. Reduzida em ${compression.compressionRatio}%.`
        );
        setUploadProgress('');
        
        logger.info('PatientPhotoUpload', 'handleFileChange', 'Image compressed successfully', {
          compressionRatio: compression.compressionRatio,
          originalSize: file.size,
          compressedSize: compression.compressedSize,
        });
      } catch (error) {
        const errorMsg = 'Erro ao processar imagem. Por favor, tente novamente.';
        logger.error('PatientPhotoUpload', 'handleFileChange', 'Image compression error', error);
        setErrorMessage(errorMsg);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      const errorMsg = 'É necessário enviar uma foto para concluir o acompanhamento diário.';
      logger.warn('PatientPhotoUpload', 'handleSubmit', errorMsg);
      setErrorMessage(errorMsg);
      return;
    }

    if (!checklistId || !tempChecklistData) {
      const errorMsg = 'Erro: Checklist não identificado. Por favor, volte e tente novamente.';
      logger.error('PatientPhotoUpload', 'handleSubmit', errorMsg, {
        hasChecklistId: !!checklistId,
        hasTempData: !!tempChecklistData,
      });
      setErrorMessage(errorMsg);
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    setUploadProgress('Enviando imagem...');

    try {
      logger.info('PatientPhotoUpload', 'handleSubmit', 'Starting photo upload', {
        checklistId: checklistId.substring(0, 8),
      });

      // Create the complete checklist with photo
      const completeChecklist: ChecklistsDirios = {
        ...tempChecklistData,
        _id: checklistId,
        scarPhoto: previewUrl,
      };

      // Save the complete checklist to database
      await BaseCrudService.create('checklistsdiarios', completeChecklist);

      setUploadProgress('');
      setSuccessMessage('Acompanhamento enviado com sucesso!');
      
      logger.info('PatientPhotoUpload', 'handleSubmit', 'Checklist saved successfully', {
        checklistId: checklistId.substring(0, 8),
      });
      
      // Clear the temporary data
      clearChecklistFlow();
      
      // Navigate after a short delay to show success message
      setTimeout(() => {
        navigate('/patient-dashboard');
      }, 1500);
    } catch (error: any) {
      const errorMsg = error?.message || 'Erro desconhecido ao enviar foto';
      
      logger.error('PatientPhotoUpload', 'handleSubmit', 'Error uploading photo', error, {
        checklistId: checklistId?.substring(0, 8),
        errorMessage: errorMsg,
      });
      
      // Handle specific error codes
      if (errorMsg.includes('WDE0109') || errorMsg.includes('Payload is too large')) {
        setErrorMessage('Imagem muito grande. Tente novamente com uma foto menor.');
      } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
        setErrorMessage('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        setErrorMessage('Erro ao enviar foto. Por favor, tente novamente.');
      }
      
      setUploadProgress('');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fullscreen Image Modal */}
      {isFullscreenOpen && previewUrl && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setIsFullscreenOpen(false)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors z-10"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <Image
              src={previewUrl}
              alt="Visualização em tela cheia"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-secondary/30 flex-shrink-0">
        <div className="max-w-[120rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-4">
            <Link to="/patient-dashboard" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-heading text-lg sm:text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-xs sm:text-sm text-foreground/60">Envio de Foto</p>
              </div>
            </Link>
            <Link to="/patient-dashboard" className="flex-shrink-0">
              <Button variant="outline" className="flex items-center gap-1 sm:gap-2 font-paragraph text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="w-full max-w-2xl">
          <div className="mb-6 sm:mb-8 text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Enviar Foto da Cicatriz
            </h2>
            <p className="font-paragraph text-base sm:text-lg text-foreground/70">
              Etapa 3 de 3: Finalize seu acompanhamento diário
            </p>
          </div>

          {/* Info Alert */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 flex gap-3 sm:gap-4">
            <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-paragraph font-semibold text-foreground mb-1 text-sm sm:text-base">
                Foto Obrigatória
              </p>
              <p className="font-paragraph text-xs sm:text-sm text-foreground/70">
                É necessário enviar uma foto para concluir o acompanhamento diário.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 flex gap-3 sm:gap-4">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-paragraph font-semibold text-destructive mb-1 text-sm sm:text-base">
                  Erro
                </p>
                <p className="font-paragraph text-xs sm:text-sm text-destructive/80">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-stable/10 border border-stable/20 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 flex gap-3 sm:gap-4">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-stable flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-paragraph font-semibold text-stable mb-1 text-sm sm:text-base">
                  Sucesso
                </p>
                <p className="font-paragraph text-xs sm:text-sm text-stable/80">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploadProgress && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 flex gap-3 sm:gap-4 items-center">
              <Loader className="w-5 h-5 sm:w-6 sm:h-6 text-primary flex-shrink-0 animate-spin" />
              <p className="font-paragraph text-sm sm:text-base text-primary">
                {uploadProgress}
              </p>
            </div>
          )}

          {/* Upload Options */}
          {!uploadMethod ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
              <button
                onClick={() => setUploadMethod('camera')}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-secondary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground mb-2">
                  Tirar Foto Agora
                </h3>
                <p className="font-paragraph text-xs sm:text-sm text-foreground/70">
                  Use a câmera do seu dispositivo
                </p>
              </button>

              <button
                onClick={() => setUploadMethod('gallery')}
                className="bg-white rounded-2xl p-6 sm:p-8 border border-secondary/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <Upload className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground mb-2">
                  Escolher da Galeria
                </h3>
                <p className="font-paragraph text-xs sm:text-sm text-foreground/70">
                  Selecione uma foto existente
                </p>
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-secondary/20 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => {
                    setUploadMethod(null);
                    setPreviewUrl('');
                    setSelectedFile(null);
                    setErrorMessage('');
                    setSuccessMessage('');
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
                  disabled={isCompressing || isSaving}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isCompressing || isSaving}
                />

                {/* Upload Area */}
                <div>
                  <Label className="font-paragraph text-sm sm:text-base font-semibold text-foreground mb-4 block text-center">
                    {uploadMethod === 'camera' ? 'Tirar Foto' : 'Selecionar Foto'}
                  </Label>
                  <div className="border-2 border-dashed border-secondary rounded-xl p-6 sm:p-8 text-center bg-background/50">
                    {previewUrl ? (
                      <div className="space-y-4 sm:space-y-6">
                        {/* Image Preview Container - Centered and Responsive */}
                        <div className="flex items-center justify-center bg-white rounded-lg p-3 sm:p-4 min-h-64 sm:min-h-80 max-h-96">
                          <Image 
                            src={previewUrl} 
                            alt="Preview da foto" 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        
                        {/* Action Buttons - Centered and Stacked on Mobile */}
                        <div className="flex flex-col gap-3 sm:gap-4 justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsFullscreenOpen(true)}
                            disabled={isCompressing || isSaving}
                            className="font-paragraph flex items-center justify-center gap-2 w-full sm:w-auto sm:mx-auto"
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
                              setSuccessMessage('');
                              if (uploadMethod === 'camera') {
                                cameraInputRef.current?.click();
                              } else {
                                fileInputRef.current?.click();
                              }
                            }}
                            disabled={isCompressing || isSaving}
                            className="font-paragraph w-full sm:w-auto sm:mx-auto"
                          >
                            Trocar Foto
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center">
                          <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
                        </div>
                        <div>
                          <p className="font-paragraph text-sm sm:text-base font-semibold text-foreground mb-1">
                            {uploadMethod === 'camera' 
                              ? 'Clique para tirar uma foto' 
                              : 'Clique para selecionar uma foto'}
                          </p>
                          <p className="font-paragraph text-xs sm:text-sm text-foreground/60">
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
                          disabled={isCompressing || isSaving}
                          className="bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold"
                        >
                          {isCompressing ? (
                            <>
                              <Loader className="w-4 h-4 mr-2 animate-spin" />
                              Processando...
                            </>
                          ) : (
                            uploadMethod === 'camera' ? 'Abrir Câmera' : 'Abrir Galeria'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!selectedFile || isSaving || isCompressing}
                  className="w-full bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold py-4 sm:py-6 rounded-lg text-base sm:text-lg disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
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
