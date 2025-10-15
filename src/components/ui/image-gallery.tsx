"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { cn } from "@/lib/utils";

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  photographer?: string;
  category?: string;
}

interface ImageGalleryProps {
  images: GalleryImage[];
  title?: string;
  className?: string;
}

export function ImageGallery({ images, title, className }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const openImage = (index: number) => {
    setSelectedImageIndex(index);
    setIsZoomed(false);
  };

  const closeImage = () => {
    setSelectedImageIndex(null);
    setIsZoomed(false);
  };

  const goToPrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
      setIsZoomed(false);
    }
  };

  const goToNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
      setIsZoomed(false);
    }
  };

  const selectedImage = selectedImageIndex !== null ? images[selectedImageIndex] : null;

  // Suporte para navegação por teclado
  const handleKeyDown = (event: KeyboardEvent) => {
    if (selectedImageIndex === null) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        goToNext();
        break;
      case 'Escape':
        event.preventDefault();
        closeImage();
        break;
      case ' ':
        event.preventDefault();
        setIsZoomed(!isZoomed);
        break;
    }
  };

  // Adicionar/remover event listener para teclado
  useEffect(() => {
    if (selectedImageIndex !== null) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedImageIndex, isZoomed]);

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {images.length} {images.length === 1 ? 'foto' : 'fotos'}
          </Badge>
        </div>
      )}

      {/* Grid de Thumbnails */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {images.map((image, index) => (
                      <div
              key={image.id}
              className="relative group cursor-pointer overflow-hidden rounded-lg bg-gray-100 aspect-square"
              onClick={() => openImage(index)}
              role="button"
              tabIndex={0}
              aria-label={`Visualizar imagem: ${image.alt}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openImage(index);
                }
              }}
            >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              loading="lazy"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            
            {/* Zoom Icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ZoomIn className="h-6 w-6 text-white" />
            </div>

            {/* Category Badge */}
            {image.category && (
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Badge variant="secondary" className="text-xs bg-white/90 text-gray-900">
                  {image.category}
                </Badge>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Visualização */}
      <Dialog open={selectedImageIndex !== null} onOpenChange={() => closeImage()}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black">
          <VisuallyHidden>
            <DialogTitle>
              {selectedImage ? `Visualizando imagem: ${selectedImage.alt}` : "Galeria de imagens"}
            </DialogTitle>
          </VisuallyHidden>
          {selectedImage && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Imagem Principal */}
              <div className={cn(
                "relative transition-transform duration-300",
                isZoomed ? "scale-150" : "scale-100"
              )}>
                <Image
                  src={selectedImage.src}
                  alt={selectedImage.alt}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-full object-contain"
                  priority
                />
              </div>

              {/* Controles */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  aria-label={isZoomed ? "Reduzir zoom" : "Aumentar zoom"}
                >
                  {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={closeImage}
                  className="bg-white/90 hover:bg-white text-gray-900 shadow-lg"
                  aria-label="Fechar galeria"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Navegação */}
              {selectedImageIndex !== null && selectedImageIndex > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  aria-label="Imagem anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}

              {selectedImageIndex !== null && selectedImageIndex < images.length - 1 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  aria-label="Próxima imagem"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}

              {/* Informações da Imagem */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
                <h4 className="font-medium text-lg">{selectedImage.alt}</h4>
                {selectedImage.caption && (
                  <p className="text-sm text-gray-200 mt-1">{selectedImage.caption}</p>
                )}
                {selectedImage.photographer && (
                  <p className="text-xs text-gray-300 mt-2">
                    Foto: {selectedImage.photographer}
                  </p>
                )}
                
                {/* Contador */}
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-300">
                    {selectedImageIndex !== null ? selectedImageIndex + 1 : 0} de {images.length}
                  </span>
                  {selectedImage.category && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedImage.category}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Thumbnails na parte inferior */}
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 backdrop-blur-sm rounded-lg p-2">
                {selectedImageIndex !== null && images.slice(Math.max(0, selectedImageIndex - 2), selectedImageIndex + 3).map((img, index) => {
                  const actualIndex = Math.max(0, selectedImageIndex - 2) + index;
                  return (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImageIndex(actualIndex)}
                      className={cn(
                        "relative w-12 h-12 rounded overflow-hidden transition-all",
                        actualIndex === selectedImageIndex 
                          ? "ring-2 ring-white scale-110" 
                          : "opacity-70 hover:opacity-100"
                      )}
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 