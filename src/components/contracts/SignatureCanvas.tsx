import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Trash2, Download, Pen } from 'lucide-react';

interface SignatureCanvasProps {
  width?: number;
  height?: number;
  onSignatureChange: (signatureData: string | null) => void;
  disabled?: boolean;
  initialSignature?: string;
  className?: string;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  width = 400,
  height = 200,
  onSignatureChange,
  disabled = false,
  initialSignature,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);

  // Configurar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar contexto
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    // Fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Carregar assinatura inicial se fornecida
    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, width, height);
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
        setCanvasReady(true);
      };
      img.src = initialSignature;
    } else {
      setCanvasReady(true);
    }
  }, [width, height, initialSignature]);

  // Obter coordenadas do mouse/touch
  const getCoordinates = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      // Touch event
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    } else {
      // Mouse event
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  }, []);

  // Iniciar desenho
  const startDrawing = useCallback((e: MouseEvent | TouchEvent) => {
    if (disabled || !canvasReady) return;
    
    e.preventDefault();
    isDrawingRef.current = true;
    
    const coords = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  }, [disabled, canvasReady, getCoordinates]);

  // Desenhar
  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawingRef.current || disabled || !canvasReady) return;
    
    e.preventDefault();
    const coords = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setIsEmpty(false);
    }
  }, [disabled, canvasReady, getCoordinates]);

  // Parar desenho
  const stopDrawing = useCallback((e?: MouseEvent | TouchEvent) => {
    if (!isDrawingRef.current) return;
    
    e?.preventDefault();
    isDrawingRef.current = false;
    
    // Notificar mudança na assinatura
    if (!isEmpty) {
      const canvas = canvasRef.current;
      if (canvas) {
        const signatureData = canvas.toDataURL('image/png');
        onSignatureChange(signatureData);
      }
    }
  }, [isEmpty, onSignatureChange]);

  // Event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => startDrawing(e);
    const handleMouseMove = (e: MouseEvent) => draw(e);
    const handleMouseUp = (e: MouseEvent) => stopDrawing(e);
    const handleMouseLeave = (e: MouseEvent) => stopDrawing(e);

    // Touch events
    const handleTouchStart = (e: TouchEvent) => startDrawing(e);
    const handleTouchMove = (e: TouchEvent) => draw(e);
    const handleTouchEnd = (e: TouchEvent) => stopDrawing(e);

    // Adicionar event listeners
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      // Cleanup
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [startDrawing, draw, stopDrawing]);

  // Limpar canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (canvas && ctx) {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      setIsEmpty(true);
      onSignatureChange(null);
    }
  }, [width, height, onSignatureChange]);

  // Download da assinatura
  const downloadSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas && !isEmpty) {
      const link = document.createElement('a');
      link.download = 'assinatura.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  }, [isEmpty]);

  return (
    <div className={`signature-canvas-container ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
          <Pen className="w-5 h-5 text-alencar-green" />
          Assinatura Digital
        </h3>
        <p className="text-sm text-gray-600">
          {disabled 
            ? 'Assinatura desabilitada'
            : 'Desenhe sua assinatura no espaço abaixo usando o mouse ou toque.'
          }
        </p>
      </div>

      <div className="relative inline-block">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className={`border-2 border-gray-300 rounded-lg bg-white ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-crosshair hover:border-alencar-green'
          } ${!canvasReady ? 'opacity-50' : ''}`}
          style={{ 
            touchAction: 'none',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
        
        {!canvasReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            <div className="text-gray-500">Carregando...</div>
          </div>
        )}
      </div>

      {/* Controles */}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={clearCanvas}
          disabled={disabled || isEmpty || !canvasReady}
          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Limpar
        </button>
        
        <button
          type="button"
          onClick={downloadSignature}
          disabled={disabled || isEmpty || !canvasReady}
          className="btn-secondary flex items-center gap-2 px-3 py-2 text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          Baixar
        </button>
      </div>

      {/* Status */}
      {canvasReady && (
        <div className="mt-2 text-xs text-gray-500">
          Status: {isEmpty ? 'Vazio' : 'Assinatura capturada'} 
          {!disabled && ' • Clique e arraste para desenhar'}
        </div>
      )}
    </div>
  );
};

export default SignatureCanvas;
