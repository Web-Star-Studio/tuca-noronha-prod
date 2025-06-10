"use client";

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Utensils, HomeIcon, Activity, Star, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from '@/components/ui/label';
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cardStyles, imageEffects } from "@/lib/ui-config";
import { toast } from "sonner";
import { RecommendationCardProps } from '../types/dashboard';

const RecommendationCard: React.FC<RecommendationCardProps> = ({ item }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isActive, setIsActive] = useState(item.isActive ?? true);
  const [isFeatured, setIsFeatured] = useState(item.isFeatured ?? false);
  const { type, name, description, rating, tags, imageUrl } = item;

  const getIconByType = () => {
    switch (type) {
      case 'restaurant':
        return <Utensils className="h-5 w-5" />;
      case 'accommodation':
        return <HomeIcon className="h-5 w-5" />;
      case 'activity':
        return <Activity className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getTypeLabel = () => {
    switch (type) {
      case 'restaurant':
        return 'Restaurante';
      case 'accommodation':
        return 'Hospedagem';
      case 'activity':
        return 'Atividade';
      default:
        return 'Recomendação';
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'restaurant':
        return 'bg-orange-100';
      case 'accommodation':
        return 'bg-blue-100';
      case 'activity':
        return 'bg-green-100';
      default:
        return 'bg-purple-100';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'restaurant':
        return 'text-orange-700';
      case 'accommodation':
        return 'text-blue-700';
      case 'activity':
        return 'text-green-700';
      default:
        return 'text-purple-700';
    }
  };

  const handleActiveToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsActive(!isActive);
    toast.success(`${name} ${!isActive ? 'ativado' : 'desativado'} com sucesso`);
  };

  const handleFeaturedToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFeatured(!isFeatured);
    toast.success(`${name} ${!isFeatured ? 'definido como destaque' : 'removido dos destaques'}`);
  };

  const handleCardClick = () => {
    setIsEditing(true);
  };

  return (
    <>
      <motion.div
        className={`${cardStyles.base} ${cardStyles.hover.scale} overflow-hidden flex flex-col h-full cursor-pointer`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleCardClick}
      >
        <div className="h-40 bg-gray-200 relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={imageUrl || `https://placehold.co/600x400/E2E8F0/A0AEC0?text=${encodeURIComponent(name)}`} 
            alt={`Imagem de ${name}`} 
            className={`w-full h-full object-cover ${imageEffects.hover.scale}`}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "https://placehold.co/600x400/E2E8F0/A0AEC0?text=Imagem+Indisponível";
            }}
          />
          <div className={imageEffects.overlay.dark} />
          <div className="absolute top-2 left-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getBgColor()} ${getTextColor()} text-xs font-medium`}>
              {getIconByType()}
              <span>{getTypeLabel()}</span>
            </div>
          </div>
          <div className="absolute top-2 right-2">
            <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-white text-yellow-500 text-xs font-medium shadow-sm">
              <Star className="h-3 w-3 fill-current" />
              <span>{rating}</span>
            </div>
          </div>
          <div className="absolute bottom-2 right-2 flex space-x-2">
            <Badge 
              variant={isActive ? "success" : "outline"}
              onClick={handleActiveToggle}
              className="cursor-pointer"
            >
              {isActive ? 'Ativo' : 'Inativo'}
            </Badge>
            <Badge 
              variant={isFeatured ? "warning" : "outline"}
              onClick={handleFeaturedToggle}
              className="cursor-pointer"
            >
              {isFeatured ? 'Destaque' : 'Normal'}
            </Badge>
          </div>
        </div>
        <div className={`${cardStyles.content.spacious} flex-1 flex flex-col`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
          <p className="text-sm text-gray-500 mb-3 flex-1">{description}</p>
          <div className="flex flex-wrap gap-1 mt-auto">
            {tags.map((tag) => (
              <Badge key={`${name}-${tag}`} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className={`${cardStyles.footer.default} flex justify-between items-center`}>
          <Button variant="ghost" className="text-sm text-blue-600 flex items-center space-x-1 hover:text-blue-800" onClick={handleCardClick}>
            <span>Editar</span>
          </Button>
          <Button variant="ghost" className="text-sm text-gray-500 flex items-center space-x-1 hover:text-gray-700">
            <Heart className="h-4 w-4" />
            <span>Salvar</span>
          </Button>
        </div>
      </motion.div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar {getTypeLabel()}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`edit-name-${item.id}`} className="text-right">
                Nome
              </Label>
              <Input id={`edit-name-${item.id}`} defaultValue={name} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`edit-description-${item.id}`} className="text-right">
                Descrição
              </Label>
              <Input id={`edit-description-${item.id}`} defaultValue={description} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor={`edit-rating-${item.id}`} className="text-right">
                Avaliação
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id={`edit-rating-${item.id}`}
                  defaultValue={rating}
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  className="w-20"
                />
                <div className="flex text-yellow-500">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={`rating-star-${item.id}-${star}`}
                      className={`h-5 w-5 ${star <= Math.round(rating) ? 'fill-current' : 'stroke-current fill-transparent'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Tags</Label>
              <div className="col-span-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={`tag-edit-${item.id}-${tag}`} variant="secondary" className="px-3 py-1">
                      {tag}
                      <X className="h-3 w-3 ml-2 cursor-pointer" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input placeholder="Adicionar tag..." className="flex-1" />
                  <Button>Adicionar</Button>
                </div>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`edit-active-${item.id}`} className="flex-1">Ativo</Label>
                  <Switch id={`edit-active-${item.id}`} checked={isActive} onCheckedChange={setIsActive} />
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor={`edit-featured-${item.id}`} className="flex-1">Destaque</Label>
                  <Switch id={`edit-featured-${item.id}`} checked={isFeatured} onCheckedChange={setIsFeatured} />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={() => {
              setIsEditing(false);
              toast.success(`${name} atualizado com sucesso!`);
            }}>
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RecommendationCard; 