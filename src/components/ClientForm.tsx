import React, { useState } from 'react';
import { UseFormRegister, UseFormSetValue, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Customer } from '../types';
import { applyPhoneMask, applyCepMask, removeMask } from '../utils/maskUtils';
import { fetchCEP } from '../services/cepService';

const PURPOSE_OPTIONS = ['Pessoal', 'Comercial', 'Locação para Airbnb', 'Outro'];

const INSTALLATION_LOCATION_OPTIONS = [
  'Terreno residencial',
  'Terreno comercial',
  'Área rural',
  'Obra em andamento',
  'Outro',
];

const TIMELINE_OPTIONS = [
  'Imediato',
  'Nos próximos 30 dias',
  'Em até 3 meses',
  'Ainda estou planejando',
];

interface ClientFormProps {
  register: UseFormRegister<Customer>;
  errors: FieldErrors<Customer>;
  setValue: UseFormSetValue<Customer>;
  watch: UseFormWatch<Customer>;
  onAddressInfoChange: (info: { city: string; state: string }) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  register,
  errors,
  setValue,
  watch,
  onAddressInfoChange,
}) => {
  const [noPropertyNumber, setNoPropertyNumber] = useState(false);
  const watchedPurpose = watch('purpose');
  const watchedInstallationLocation = watch('installationLocation');

  const handleCEPChange = async (cep: string) => {
    if (cep.replace(/\D/g, '').length === 8) {
      const cepData = await fetchCEP(cep);
      if (cepData) {
        const fullAddress = `${cepData.logradouro}, ${cepData.bairro}, ${cepData.localidade}/${cepData.uf}`;
        setValue('address', fullAddress);
        onAddressInfoChange({ city: cepData.localidade, state: cepData.uf });
      }
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Informações pessoais</p>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Nome completo *
        </label>
        <input
          type="text"
          {...register('name', { required: 'Nome é obrigatório' })}
          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
          placeholder="Digite seu nome completo"
        />
        {errors.name && (
          <p className="text-red-300 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Telefone com DDD *
        </label>
        <input
          type="tel"
          {...register('phone', { required: 'Telefone é obrigatório' })}
          onChange={(e) => {
            const maskedValue = applyPhoneMask(e.target.value);
            e.target.value = maskedValue;
            setValue('phone', removeMask(e.target.value));
          }}
          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
          placeholder="(11) 99999-9999"
          maxLength={15}
        />
        {errors.phone && (
          <p className="text-red-300 text-sm mt-1">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          E-mail *
        </label>
        <input
          type="email"
          {...register('email', {
            required: 'E-mail é obrigatório',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'E-mail inválido'
            }
          })}
          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
          placeholder="seu@email.com"
        />
        {errors.email && (
          <p className="text-red-300 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="border-t border-white/10 pt-5">
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-2">Localização do projeto</p>
        <p className="text-sm text-white/60 mb-3">Essas informações ajudam a calcular logística, transporte e instalação do container.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          CEP *
        </label>
        <input
          type="text"
          {...register('cep', { required: 'CEP é obrigatório' })}
          onChange={(e) => {
            const maskedValue = applyCepMask(e.target.value);
            e.target.value = maskedValue;
            setValue('cep', maskedValue);
            handleCEPChange(maskedValue);
          }}
          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
          placeholder="00000-000"
          maxLength={9}
        />
        {errors.cep && (
          <p className="text-red-300 text-sm mt-1">{errors.cep.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Endereço da instalação *
        </label>
        <input
          type="text"
          {...register('address', { required: 'Endereço é obrigatório' })}
          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
          placeholder="Endereço será preenchido automaticamente"
          readOnly
        />
        {errors.address && (
          <p className="text-red-300 text-sm mt-1">{errors.address.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Número da propriedade
        </label>
        <input
          type="text"
          {...register('propertyNumber')}
          disabled={noPropertyNumber}
          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
          placeholder="Casa 12 / Lote 8 / Unidade B"
        />
        <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={noPropertyNumber}
            onChange={(e) => {
              setNoPropertyNumber(e.target.checked);
              if (e.target.checked) {
                setValue('propertyNumber', 'Sem número');
              } else {
                setValue('propertyNumber', '');
              }
            }}
            className="w-3.5 h-3.5 text-alencar-green rounded focus:ring-alencar-green accent-alencar-green"
          />
          <span className="text-xs text-white/50">Sem número</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Complemento
        </label>
        <input
          type="text"
          {...register('addressComplement')}
          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
          placeholder="Apartamento, Fundos, Portão lateral, Bloco B"
        />
      </div>

      <div className="border-t border-white/10 pt-5">
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-semibold mb-4">Contexto do projeto</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Onde o container será instalado?
        </label>
        <select
          {...register('installationLocation')}
          className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent [&>option]:bg-[#0d2b25] [&>option]:text-white"
        >
          <option value="">Selecione o local</option>
          {INSTALLATION_LOCATION_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {watchedInstallationLocation === 'Outro' && (
          <div className="mt-2">
            <input
              type="text"
              {...register('installationLocationOther')}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
              placeholder="Exemplo: estacionamento de evento, terreno industrial, apoio de obra"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Prazo para iniciar o projeto
        </label>
        <select
          {...register('projectStartTimeline')}
          className="w-full bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent [&>option]:bg-[#0d2b25] [&>option]:text-white"
        >
          <option value="">Selecione o prazo</option>
          {TIMELINE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div className="w-full max-w-full">
        <label className="block text-sm font-medium text-white/70 mb-1">
          Data prevista para o projeto *
        </label>
        <input
          type="date"
          {...register('projectDate', { required: 'Data é obrigatória' })}
          min={new Date().toISOString().split('T')[0]}
          className="w-full min-w-0 max-w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent [color-scheme:dark]"
        />
        {errors.projectDate && (
          <p className="text-red-300 text-sm mt-1">{errors.projectDate.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Finalidade de uso do container * (múltipla escolha)
        </label>
        <div className="space-y-2">
          {PURPOSE_OPTIONS.map((purpose) => (
            <label key={purpose} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value={purpose}
                {...register('purpose', { required: 'Selecione pelo menos uma finalidade' })}
                className="w-4 h-4 text-alencar-green rounded focus:ring-alencar-green accent-alencar-green"
              />
              <span className="text-sm text-white/70">{purpose}</span>
            </label>
          ))}
        </div>
        {Array.isArray(watchedPurpose) && watchedPurpose.includes('Outro') && (
          <div className="mt-2">
            <input
              type="text"
              {...register('purposeOther')}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent"
              placeholder="Exemplo: estúdio de gravação, escritório temporário, apoio de obra."
            />
          </div>
        )}
        {errors.purpose && (
          <p className="text-red-300 text-sm mt-1">{errors.purpose.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Observações gerais
        </label>
        <textarea
          {...register('generalNotes')}
          rows={3}
          className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-alencar-green-light focus:border-transparent resize-none"
          placeholder="Informações adicionais que possam ajudar no entendimento do projeto."
        />
      </div>
    </div>
  );
};
