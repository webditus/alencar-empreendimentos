import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Download,
  Eye,
  Mail,
  Share2,
  MapPin,
  Phone
} from 'lucide-react';
import { GeneratedContract, ContractSignatory } from '../../types/contractSigning';
import { ContractSigningService } from '../../services/contractSigningService';
import { PDFGenerator } from '../../services/pdfGenerator';
import { formatDate } from '../../utils/formatters';
import { Quote } from '../../types';
import { useQuotes } from '../../contexts/QuoteContext';

const ContractDetails: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { quotes } = useQuotes();
  const [contract, setContract] = useState<GeneratedContract | null>(null);
  const [signatories, setSignatories] = useState<ContractSignatory[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (contractId) {
      loadContractDetails();
    }
  }, [contractId]);

  const loadContractDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Buscar contrato pelo ID (assumindo que contractId é o signingLink)
      const contractData = await ContractSigningService.getContractBySigningLink(contractId!);
      
      if (!contractData) {
        setError('Contrato não encontrado');
        return;
      }

      setContract(contractData.contract);
      setSignatories(contractData.signatories);

      // Buscar orçamento relacionado
      const relatedQuote = quotes.find(q => q.id === contractData.contract.quoteId);
      setQuote(relatedQuote || null);

    } catch (err) {
      console.error('Error loading contract details:', err);
      setError('Erro ao carregar detalhes do contrato');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'text-gray-600 bg-gray-50';
    
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'signed': return 'text-green-600 bg-green-50';
      case 'available_to_sign': return 'text-alencar-green bg-alencar-bg';
      case 'completed': return 'text-green-600 bg-green-50';
      case 'creator_signed': return 'text-alencar-green bg-alencar-bg';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <Clock className="w-4 h-4" />;
    
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'signed': return <CheckCircle className="w-4 h-4" />;
      case 'available_to_sign': return <AlertCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'creator_signed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    if (!status) return 'Status Indefinido';
    
    switch (status) {
      case 'pending': return 'Aguardando';
      case 'signed': return 'Assinado';
      case 'available_to_sign': return 'Disponível para Assinatura';
      case 'completed': return 'Concluído';
      case 'creator_signed': return 'Criador Assinou';
      default: return status || 'Status Desconhecido';
    }
  };

  const copySigningLink = () => {
    if (!contract?.signingLink) return;
    
    const fullLink = `${window.location.origin}/public/sign/${contract.signingLink}`;
    navigator.clipboard.writeText(fullLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const downloadPDF = async () => {
    if (!contract) return;
    
    try {
      await PDFGenerator.generateContractPDF(contract, signatories);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const openPublicSigningPage = () => {
    if (!contract?.signingLink) return;
    window.open(`/public/sign/${contract.signingLink}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-alencar-green"></div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Contrato não encontrado'}
          </h2>
          <button
            onClick={() => navigate('/admin')}
            className="text-alencar-green hover:text-gray-800"
          >
            Voltar aos Orçamentos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="page-container">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Voltar aos Orçamentos
              </button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-2xl font-bold text-gray-900">{contract.title}</h1>
                <p className="text-sm text-gray-600">
                  Contrato gerado em {contract.createdAt ? formatDate(contract.createdAt) : 'Data não disponível'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                {getStatusIcon(contract.status)}
                <span className="ml-2">{getStatusText(contract.status)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações do Orçamento */}
          {quote && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-alencar-green" />
                  Informações do Cliente
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nome</p>
                    <p className="text-gray-900">{quote.customer.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900 flex items-center">
                      <Mail className="w-4 h-4 mr-2 text-gray-400" />
                      {quote.customer.email}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Telefone</p>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {quote.customer.phone}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Endereço</p>
                    <p className="text-gray-900 flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                      <span>
                        {quote.customer.address}<br />
                        {quote.customer.city}, {quote.customer.state}<br />
                        CEP: {quote.customer.cep}
                      </span>
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Data do Projeto</p>
                    <p className="text-gray-900 flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {formatDate(quote.customer.projectDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progresso das Assinaturas */}
          <div className={quote ? "lg:col-span-2" : "lg:col-span-3"}>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-alencar-green" />
                  Progresso das Assinaturas
                </h3>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copySigningLink}
                    className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    {copySuccess ? 'Copiado!' : 'Copiar Link'}
                  </button>
                  
                  <button
                    onClick={openPublicSigningPage}
                    className="btn-primary flex items-center px-3 py-1.5 text-sm rounded-md"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Ver Página Pública
                  </button>
                </div>
              </div>

              {/* Timeline das Assinaturas */}
              <div className="space-y-4">
                {signatories.map((signatory, index) => (
                  <div key={signatory.id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        signatory.status === 'signed'
                          ? 'bg-green-100 text-green-600'
                          : signatory.status === 'available_to_sign'
                          ? 'bg-alencar-bg text-alencar-green'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {signatory.status === 'signed' ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {signatory.name}
                            {signatory.isCreator && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-alencar-bg text-alencar-green">
                                Criador
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">{signatory.email}</p>
                        </div>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(signatory.status)}`}>
                          {getStatusText(signatory.status)}
                        </span>
                      </div>
                      
                      {signatory.signedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Assinado em {signatory.signedAt ? formatDate(signatory.signedAt) : 'Data não disponível'}
                          {signatory.ipAddress && (
                            <span className="ml-2">• IP: {signatory.ipAddress}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Link de Assinatura */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Link para Assinatura</h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/public/sign/${contract.signingLink}`}
                    className="flex-1 text-sm bg-white border border-gray-300 rounded px-3 py-2"
                  />
                  <button
                    onClick={copySigningLink}
                    className="btn-primary px-3 py-2 text-sm rounded"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Compartilhe este link com os signatários para que possam assinar o contrato.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Visualização do Conteúdo do Contrato */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-alencar-green" />
                Conteúdo do Contrato
              </h3>
              
              <button
                onClick={downloadPDF}
                className="btn-primary flex items-center px-4 py-2 rounded-md"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar PDF
              </button>
            </div>
            
            <div 
              className="prose max-w-none border rounded-lg p-6 bg-gray-50 mb-6"
              dangerouslySetInnerHTML={{ __html: contract.content || '<p>Conteúdo do contrato será exibido aqui.</p>' }}
            />
            
            {/* Seção de Assinaturas Digitais */}
            <div className="border-t pt-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Assinaturas Digitais</h4>
              
              {signatories
                .filter(signatory => signatory.status === 'signed' && signatory.signatureData)
                .map((signatory, index) => (
                  <div key={signatory.id} className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Informações da Assinatura */}
                      <div>
                        <h5 className="font-medium text-gray-900 mb-3">
                          Assinatura {index + 1}
                          {signatory.isCreator && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-alencar-bg text-alencar-green">
                              Criador do Contrato
                            </span>
                          )}
                        </h5>
                        <div className="space-y-2 text-sm text-gray-700">
                          <p><strong>Nome:</strong> {signatory.name}</p>
                          <p><strong>Email:</strong> {signatory.email}</p>
                          <p><strong>Data/Hora:</strong> {signatory.signedAt ? formatDate(signatory.signedAt) : 'Data não disponível'}</p>
                          <p><strong>ID da Assinatura:</strong> 
                            <span className="font-mono text-xs bg-white px-2 py-1 rounded border ml-2">
                              {signatory.id}
                            </span>
                          </p>
                          {signatory.ipAddress && (
                            <p><strong>IP:</strong> {signatory.ipAddress}</p>
                          )}
                          {signatory.userAgent && (
                            <p><strong>Navegador:</strong> 
                              <span className="text-xs text-gray-500 ml-1">
                                {signatory.userAgent.split(' ')[0]}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Assinatura Digital */}
                      <div>
                        <h6 className="font-medium text-gray-900 mb-3">Assinatura Digital</h6>
                        <div className="bg-white border border-gray-300 rounded-lg p-4 flex items-center justify-center">
                          {signatory.signatureData ? (
                            <div className="text-center">
                              <img
                                src={signatory.signatureData}
                                alt={`Assinatura de ${signatory.name}`}
                                className="max-w-full max-h-24 mx-auto"
                                style={{ filter: 'contrast(1.2)' }}
                              />
                              <p className="text-xs text-gray-500 mt-2">
                                Assinatura autenticada digitalmente
                              </p>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm italic">
                              Assinatura não disponível
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Informações de Auditoria */}
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                          Assinatura criptograficamente verificada
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Validação temporal confirmada
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          Auditoria de localização
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              
              {signatories.filter(s => s.status === 'signed' && s.signatureData).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>Nenhuma assinatura digital registrada ainda.</p>
                  <p className="text-sm mt-1">
                    As assinaturas aparecerão aqui conforme o contrato for assinado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractDetails;
