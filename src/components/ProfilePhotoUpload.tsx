import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, X, RotateCw } from 'lucide-react';
import { compressImage } from '@/lib/imageCompression';

interface ProfilePhotoUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
  currentPhoto?: string;
  onRemove?: () => void;
}

export default function ProfilePhotoUpload({
  isOpen,
  onClose,
  onSave,
  currentPhoto,
  onRemove,
}: ProfilePhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [step, setStep] = useState<'menu' | 'upload' | 'crop'>('menu');
  const [error, setError] = useState('');

  const CIRCLE_RADIUS = 120;
  const CANVAS_SIZE = 240;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Formato inválido. Aceite: JPG, PNG ou WEBP');
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo: 5MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setSelectedImage(e.target?.result as string);
          setScale(1);
          setOffsetX(0);
          setOffsetY(0);
          setStep('crop');
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Erro ao processar imagem');
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(Math.max(1, Math.min(3, scale + delta)));
  };

  const handleCenter = () => {
    setOffsetX(0);
    setOffsetY(0);
  };

  const handleReset = () => {
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
  };

  const drawPreview = () => {
    if (!canvasRef.current || !selectedImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Desenhar imagem com transformações
      ctx.save();
      ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
      ctx.scale(scale, scale);
      ctx.translate(offsetX / scale, offsetY / scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();

      // Desenhar círculo de preview
      ctx.strokeStyle = '#00BFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CIRCLE_RADIUS, 0, Math.PI * 2);
      ctx.stroke();
    };
    img.src = selectedImage;
  };

  React.useEffect(() => {
    drawPreview();
  }, [selectedImage, scale, offsetX, offsetY]);

  const handleSaveCrop = () => {
    if (!canvasRef.current || !selectedImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Criar canvas circular
    const circleCanvas = document.createElement('canvas');
    circleCanvas.width = CIRCLE_RADIUS * 2;
    circleCanvas.height = CIRCLE_RADIUS * 2;
    const circleCtx = circleCanvas.getContext('2d');
    if (!circleCtx) return;

    const img = new Image();
    img.onload = () => {
      // Desenhar imagem no canvas circular
      circleCtx.save();
      circleCtx.translate(CIRCLE_RADIUS, CIRCLE_RADIUS);
      circleCtx.scale(scale, scale);
      circleCtx.translate(offsetX / scale, offsetY / scale);
      circleCtx.drawImage(img, -img.width / 2, -img.height / 2);
      circleCtx.restore();

      // Aplicar máscara circular
      circleCtx.globalCompositeOperation = 'destination-in';
      circleCtx.beginPath();
      circleCtx.arc(CIRCLE_RADIUS, CIRCLE_RADIUS, CIRCLE_RADIUS, 0, Math.PI * 2);
      circleCtx.fill();

      const croppedImage = circleCanvas.toDataURL('image/png');
      onSave(croppedImage);
      handleClose();
    };
    img.src = selectedImage;
  };

  const handleClose = () => {
    setSelectedImage(null);
    setStep('menu');
    setError('');
    setScale(1);
    setOffsetX(0);
    setOffsetY(0);
    onClose();
  };

  const handleRemove = () => {
    onRemove?.();
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'menu' && 'Foto de Perfil'}
            {step === 'upload' && 'Selecionar Foto'}
            {step === 'crop' && 'Ajustar Foto'}
          </DialogTitle>
        </DialogHeader>

        {/* Menu Principal */}
        {step === 'menu' && (
          <div className="space-y-3">
            <Button
              onClick={() => setStep('upload')}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Alterar Foto de Perfil
            </Button>
            {currentPhoto && (
              <Button
                onClick={handleRemove}
                variant="outline"
                className="w-full text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4 mr-2" />
                Remover Foto Atual
              </Button>
            )}
            <Button onClick={handleClose} variant="outline" className="w-full">
              Cancelar
            </Button>
          </div>
        )}

        {/* Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-primary rounded-lg p-8 text-center cursor-pointer hover:bg-primary/5 transition"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">Clique para selecionar</p>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG ou WEBP até 5MB</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button onClick={() => setStep('menu')} variant="outline" className="w-full">
              Voltar
            </Button>
          </div>
        )}

        {/* Crop */}
        {step === 'crop' && selectedImage && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                className="border-2 border-primary rounded-lg cursor-move bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium">Zoom</label>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCenter}
                variant="outline"
                className="flex-1 text-xs"
              >
                Centralizar
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="flex-1 text-xs"
              >
                <RotateCw className="w-3 h-3 mr-1" />
                Resetar
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep('upload')}
                variant="outline"
                className="flex-1"
              >
                Voltar
              </Button>
              <Button onClick={handleSaveCrop} className="flex-1 bg-primary hover:bg-primary/90">
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
