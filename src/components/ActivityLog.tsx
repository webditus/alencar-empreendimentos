import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, ChevronLeft, ChevronRight, RotateCcw,
  UserPlus, UserCog, ShieldCheck, KeyRound, UserX, Filter,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminLogEntry {
  id: string;
  performed_by: string;
  performer_email: string | null;
  action: string;
  target_user_id: string | null;
  target_email: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

const PAGE_SIZE = 15;

const ACTION_OPTIONS = [
  { value: '', label: 'Todas as acoes' },
  { value: 'create_user', label: 'Usuario criado' },
  { value: 'update_role', label: 'Funcao alterada' },
  { value: 'change_password', label: 'Senha alterada' },
  { value: 'deactivate_user', label: 'Usuario desativado' },
];

const ACTION_CONFIG: Record<string, { label: string; icon: React.ElementType; colorClass: string }> = {
  create_user: { label: 'Usuario criado', icon: UserPlus, colorClass: 'bg-green-100 text-green-700' },
  update_role: { label: 'Funcao alterada', icon: ShieldCheck, colorClass: 'bg-blue-100 text-blue-700' },
  change_password: { label: 'Senha alterada', icon: KeyRound, colorClass: 'bg-amber-100 text-amber-700' },
  deactivate_user: { label: 'Usuario desativado', icon: UserX, colorClass: 'bg-red-100 text-red-700' },
  delete_user: { label: 'Usuario excluido', icon: UserX, colorClass: 'bg-red-100 text-red-700' },
};

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function getActionDescription(entry: AdminLogEntry): string {
  const meta = entry.metadata || {};

  switch (entry.action) {
    case 'create_user':
      return `Criou o usuario ${meta.name || entry.target_email || ''} com funcao ${meta.role || 'viewer'}`;
    case 'update_role':
      return `Alterou funcao de ${entry.target_email || ''}: ${meta.old_role || '?'} → ${meta.new_role || '?'}`;
    case 'change_password':
      return `Redefiniu a senha de ${entry.target_email || ''}`;
    case 'deactivate_user':
      return `Desativou o usuario ${meta.deactivated_user_name || entry.target_email || ''}`;
    case 'delete_user':
      return `Excluiu o usuario ${meta.deleted_user_name || entry.target_email || ''}`;
    default:
      return entry.action;
  }
}

export const ActivityLog: React.FC = () => {
  const [logs, setLogs] = useState<AdminLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [actionFilter, setActionFilter] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let countQuery = supabase
        .from('admin_logs')
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (actionFilter) {
        countQuery = countQuery.eq('action', actionFilter);
        dataQuery = dataQuery.eq('action', actionFilter);
      }

      const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

      setTotalCount(countResult.count || 0);

      if (dataResult.error) {
        console.error('Error loading logs:', dataResult.error);
        setLogs([]);
      } else {
        setLogs(dataResult.data || []);
      }
    } catch (err) {
      console.error('Error loading logs:', err);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = (value: string) => {
    setActionFilter(value);
    setPage(0);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ClipboardList className="text-alencar-green" size={24} />
          <h2 className="text-xl font-semibold text-alencar-dark">Log de Atividades</h2>
        </div>
        <button
          onClick={loadLogs}
          disabled={isLoading}
          className="flex items-center gap-2 text-alencar-green hover:text-alencar-hover transition-colors disabled:opacity-50"
        >
          <RotateCcw size={16} className={isLoading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-500" />
          <select
            value={actionFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:border-alencar-green focus:ring-1 focus:ring-alencar-green focus:outline-none"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-gray-500">
          {totalCount} {totalCount === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-alencar-green mx-auto mb-4"></div>
            <p className="text-gray-500">Carregando logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <ClipboardList size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">Nenhum registro encontrado</p>
            <p className="text-sm text-gray-400">
              {actionFilter ? 'Tente alterar o filtro selecionado' : 'As acoes administrativas aparecerrao aqui'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acao
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Realizado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descricao
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((entry) => {
                  const config = ACTION_CONFIG[entry.action] || {
                    label: entry.action,
                    icon: UserCog,
                    colorClass: 'bg-gray-100 text-gray-700',
                  };
                  const Icon = config.icon;

                  return (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(entry.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.colorClass}`}>
                          <Icon size={13} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {entry.performer_email || entry.performed_by.slice(0, 8) + '...'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                        {getActionDescription(entry)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Pagina {page + 1} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1 || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proximo
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
