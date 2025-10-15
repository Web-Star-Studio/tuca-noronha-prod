"use client";

import React, { useState } from 'react';
import { Calendar, User, CreditCard, Mail, Phone, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ParticipantData {
  fullName: string;
  birthDate: string;
  cpf: string;
  email?: string;
  phone?: string;
}

interface ParticipantsDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (participants: ParticipantData[]) => void;
  numberOfParticipants: number;
  proposalTitle: string;
}

export function ParticipantsDataModal({
  isOpen,
  onClose,
  onConfirm,
  numberOfParticipants,
  proposalTitle,
}: ParticipantsDataModalProps) {
  const [participants, setParticipants] = useState<ParticipantData[]>(
    Array(numberOfParticipants).fill(null).map(() => ({
      fullName: '',
      birthDate: '',
      cpf: '',
      email: '',
      phone: '',
    }))
  );
  const [errors, setErrors] = useState<string[]>([]);

  const handleParticipantChange = (index: number, field: keyof ParticipantData, value: string) => {
    const newParticipants = [...participants];
    newParticipants[index] = {
      ...newParticipants[index],
      [field]: value,
    };
    setParticipants(newParticipants);
    
    // Limpar erros quando o usuário começar a editar
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  // Verificar se um CPF está duplicado em tempo real
  const isCPFDuplicated = (currentIndex: number, cpf: string): boolean => {
    if (!cpf || cpf.replace(/\D/g, '').length < 11) return false;
    
    const normalizedCPF = cpf.replace(/\D/g, '');
    return participants.some((p, idx) => 
      idx !== currentIndex && 
      p.cpf.replace(/\D/g, '') === normalizedCPF &&
      p.cpf.replace(/\D/g, '').length === 11
    );
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return false;
    
    // Basic CPF validation
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    return true;
  };

  // Verificar se há CPFs duplicados no formulário
  const hasDuplicateCPFs = () => {
    const cpfs = participants
      .map(p => p.cpf.replace(/\D/g, ''))
      .filter(cpf => cpf.length === 11);
    
    return cpfs.length !== new Set(cpfs).size;
  };

  const handleSubmit = () => {
    const newErrors: string[] = [];
    
    // Map para rastrear CPFs e detectar duplicados
    const cpfMap = new Map<string, number[]>(); // CPF -> índices dos participantes
    
    participants.forEach((participant, index) => {
      if (!participant.fullName.trim()) {
        newErrors.push(`Nome completo do participante ${index + 1} é obrigatório`);
      }
      if (!participant.birthDate) {
        newErrors.push(`Data de nascimento do participante ${index + 1} é obrigatória`);
      }
      if (!participant.cpf || !validateCPF(participant.cpf)) {
        newErrors.push(`CPF válido do participante ${index + 1} é obrigatório`);
      } else {
        // Normalizar CPF (remover formatação) para comparação
        const normalizedCPF = participant.cpf.replace(/\D/g, '');
        if (cpfMap.has(normalizedCPF)) {
          cpfMap.get(normalizedCPF)!.push(index + 1);
        } else {
          cpfMap.set(normalizedCPF, [index + 1]);
        }
      }
      if (participant.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(participant.email)) {
        newErrors.push(`E-mail inválido para o participante ${index + 1}`);
      }
    });

    // Verificar CPFs duplicados
    cpfMap.forEach((indices) => {
      if (indices.length > 1) {
        newErrors.push(`❌ CPF duplicado detectado nos participantes ${indices.join(', ')}. Cada participante deve ter um CPF único.`);
      }
    });

    if (newErrors.length > 0) {
      setErrors(newErrors);
      // Scroll to top to show errors
      const dialogContent = document.querySelector('[role="dialog"]');
      if (dialogContent) {
        dialogContent.scrollTop = 0;
      }
      return;
    }

    setErrors([]);
    onConfirm(participants);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dados dos Participantes</DialogTitle>
          <DialogDescription>
            Para aceitar a proposta &ldquo;{proposalTitle}&rdquo;, precisamos dos dados de todos os participantes da viagem.
            Preencha as informações abaixo com atenção.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc ml-4 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {participants.map((participant, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Participante {index + 1}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nome Completo *
                  </Label>
                  <Input
                    id={`name-${index}`}
                    value={participant.fullName}
                    onChange={(e) => handleParticipantChange(index, 'fullName', e.target.value)}
                    placeholder="João da Silva"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`birth-${index}`} className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de Nascimento *
                  </Label>
                  <Input
                    id={`birth-${index}`}
                    type="date"
                    value={participant.birthDate}
                    onChange={(e) => handleParticipantChange(index, 'birthDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`cpf-${index}`} className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    CPF *
                  </Label>
                  <Input
                    id={`cpf-${index}`}
                    value={participant.cpf}
                    onChange={(e) => handleParticipantChange(index, 'cpf', formatCPF(e.target.value))}
                    placeholder="123.456.789-00"
                    maxLength={14}
                    required
                    className={isCPFDuplicated(index, participant.cpf) ? 'border-red-500 focus:ring-red-500 bg-red-50' : ''}
                  />
                  {isCPFDuplicated(index, participant.cpf) && (
                    <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      ⚠️ Este CPF já foi informado para outro participante. Cada pessoa deve ter um CPF único.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`email-${index}`} className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail
                  </Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    value={participant.email}
                    onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                    placeholder="joao@email.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`phone-${index}`} className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone
                  </Label>
                  <Input
                    id={`phone-${index}`}
                    value={participant.phone}
                    onChange={(e) => handleParticipantChange(index, 'phone', formatPhone(e.target.value))}
                    placeholder="(11) 98765-4321"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>
          ))}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Certifique-se de que todos os dados estão corretos, 
              especialmente o CPF e a data de nascimento, pois serão utilizados para emissão 
              de passagens e documentos de viagem.
              <br />
              <strong className="text-red-600">⚠️ Atenção:</strong> Cada participante deve ter um CPF único. 
              Não é permitido cadastrar o mesmo CPF para pessoas diferentes.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {hasDuplicateCPFs() && (
            <p className="text-sm text-red-600 flex items-center gap-1 w-full">
              <AlertCircle className="h-4 w-4" />
              Corrija os CPFs duplicados para continuar
            </p>
          )}
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={hasDuplicateCPFs()}
            >
              Confirmar e Aceitar Proposta
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
