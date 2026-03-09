import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ContractSigningService } from '../services/contractSigningService';
import { PDFGenerator } from '../services/pdfGenerator';
import { GeneratedContract, ContractSignatory } from '../types/contractSigning';
import { formatDate } from '../utils/formatters';
import { CheckCircle, AlertCircle, PenTool, Shield, Users, FileText, Download } from 'lucide-react';
import SignatureCanvas from '../components/contracts/SignatureCanvas';

const PublicContractSigning: React.FC = () => {
  const { signingLink } = useParams<{ signingLink: string }>();
  const [contract, setContract] = useState<GeneratedContract | null>(null);
  const [signatories, setSignatories] = useState<ContractSignatory[]>([]);
  const [currentSignatoryIndex, setCurrentSignatoryIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSigningForm, setShowSigningForm] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [signingData, setSigningData] = useState({
    name: '',
    email: '',
    signature: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [signatureValid, setSignatureValid] = useState(false);

  useEffect(() => {
    if (signingLink) {
      loadContractData();
    }
  }, [signingLink]);

  const loadContractData = async () => {
    try {
      setLoading(true);
      setError(null);

      const contractData = await ContractSigningService.getContractBySigningLink(signingLink!);

      if (!contractData) {
        setError('Contrato não encontrado ou link inválido');
        return;
      }

      setContract(contractData.contract);
      setSignatories(contractData.signatories);

      setEmailVerified(false);
      setCurrentSignatoryIndex(null);
      setEmailError('');

    } catch (err) {
      console.error('Error loading contract:', err);
      setError('Erro ao carregar dados do contrato');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureChange = (signatureData: string | null) => {
    setSigningData(prev => ({ ...prev, signature: signatureData || '' }));
    setSignatureValid(!!signatureData);
  };

  const handleEmailVerification = () => {
    if (!emailInput.trim()) {
      setEmailError('Por favor, digite seu email');
      return;
    }

    const signatory = signatories.find(s =>
      s.email.toLowerCase() === emailInput.toLowerCase().trim() &&
      s.status === 'available_to_sign' &&
      !s.signedAt
    );

    if (signatory) {
      const index = signatories.findIndex(s => s.id === signatory.id);
      setCurrentSignatoryIndex(index);
      setSigningData({
        name: signatory.name,
        email: signatory.email,
        signature: ''
      });
      setEmailVerified(true);
      setEmailError('');
    } else {
      const existingSignatory = signatories.find(s =>
        s.email.toLowerCase() === emailInput.toLowerCase().trim()
      );

      if (existingSignatory && existingSignatory.signedAt) {
        setEmailError('Este email já assinou o contrato.');
      } else {
        setEmailError('Email não encontrado na lista de signatários. Entre em contato com o administrador do contrato.');
      }
      setEmailVerified(false);
      setCurrentSignatoryIndex(null);
    }
  };

  const handleSignContract = async () => {
    if (!contract || currentSignatoryIndex === null || !signatureValid) return;

    const currentSignatory = signatories[currentSignatoryIndex];
    if (!currentSignatory) return;

    setSubmitting(true);

    try {
      await ContractSigningService.signContract(signingLink!, {
        signatoryId: currentSignatory.id,
        name: signingData.name,
        email: signingData.email,
        signature: signingData.signature
      });

      await loadContractData();

      setShowSigningForm(false);
      setSigningData({ name: '', email: '', signature: '' });
      setSignatureValid(false);
      setEmailVerified(false);
      setEmailInput('');

    } catch (err) {
      console.error('Error signing contract:', err);
      setError('Erro ao assinar contrato. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const canCurrentUserSign = () => {
    return emailVerified &&
           currentSignatoryIndex !== null &&
           signatories[currentSignatoryIndex]?.status === 'available_to_sign';
  };

  const downloadPDF = async () => {
    if (!contract) return;

    try {
      await PDFGenerator.generateContractPDF(contract, signatories);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setError('Erro ao gerar PDF. Tente novamente.');
      setTimeout(() => setError(null), 5000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-alencar-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-alencar-green mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando contrato...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-alencar-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Contrato não encontrado'}
          </h2>
          <p className="text-gray-600">
            O link pode estar expirado ou inválido. Verifique com quem enviou o contrato.
          </p>
        </div>
      </div>
    );
  }

  const allSigned = signatories.every(s => s.status === 'signed');

  return (
    <div className="min-h-screen bg-alencar-bg">
      <div className="bg-alencar-dark border-b border-white/10 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-3">
            <div className="bg-alencar-green/20 p-2 rounded-lg">
              <FileText className="w-6 h-6 text-alencar-green-light" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{contract.title}</h1>
              <p className="text-sm text-gray-400">
                Assinatura Digital &bull; {formatDate(contract.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="card-base-no-accent mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-alencar-green" />
              Assinaturas Concluídas
            </h2>
            {allSigned && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4 mr-2" />
                Contrato Finalizado
              </span>
            )}
          </div>

          <div className="space-y-4">
            {signatories
              .filter(signatory => signatory.status === 'signed' && signatory.signedAt)
              .map((signatory) => (
                <div key={signatory.id} className="flex items-center space-x-4 p-4 rounded-lg border bg-green-50 border-green-200 text-green-800">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {signatory.name}
                          {signatory.isCreator && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-alencar-bg text-alencar-green">
                              Criador
                            </span>
                          )}
                        </p>
                        <p className="text-sm opacity-75">{signatory.email}</p>
                      </div>

                      <span className="text-sm font-medium">
                        Assinado
                      </span>
                    </div>

                    <p className="text-xs mt-1 opacity-75">
                      Assinado em {formatDate(signatory.signedAt!)}
                    </p>
                  </div>
                </div>
              ))}

            {signatories.filter(s => s.status === 'signed' && s.signedAt).length === 0 && (
              <p className="text-gray-500 text-center py-4">
                Nenhuma assinatura foi concluída ainda.
              </p>
            )}
          </div>
        </div>

        {!allSigned && !emailVerified && (
          <div className="card-base-no-accent mb-8">
            <div className="text-center mb-6">
              <PenTool className="w-12 h-12 text-alencar-green mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Acesso para Assinatura</h3>
              <p className="text-gray-600">
                Digite seu email para verificar se você tem permissão para assinar este contrato
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email do Signatário
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEmailVerification()}
                  placeholder="Digite seu email..."
                  className="input-base"
                />
              </div>

              {emailError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{emailError}</p>
                  {emailError.includes('administrador') && (
                    <p className="text-xs text-red-500 mt-1">
                      Apenas emails autorizados pelo criador do contrato podem assinar.
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleEmailVerification}
                className="w-full btn-primary"
              >
                Verificar Email
              </button>
            </div>
          </div>
        )}

        {emailVerified && canCurrentUserSign() && !showSigningForm && (
          <div className="card-base-no-accent mb-8 text-center">
            <div className="mb-4">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900">Email Verificado</h3>
              <p className="text-gray-600">
                Você foi identificado como: <strong>{signatories[currentSignatoryIndex!]?.name}</strong>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Agora você pode prosseguir com a assinatura do contrato.
              </p>
            </div>

            <button
              onClick={() => setShowSigningForm(true)}
              className="btn-primary px-8 py-3 flex items-center mx-auto"
            >
              <PenTool className="w-5 h-5 mr-2" />
              Assinar Contrato
            </button>
          </div>
        )}

        {showSigningForm && emailVerified && canCurrentUserSign() && (
          <div className="card-base-no-accent mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <PenTool className="w-5 h-5 mr-2 text-alencar-green" />
              Assinar Contrato
            </h3>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={signingData.name}
                    onChange={(e) => setSigningData(prev => ({ ...prev, name: e.target.value }))}
                    className="input-base"
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={signingData.email}
                    onChange={(e) => setSigningData(prev => ({ ...prev, email: e.target.value }))}
                    className="input-base"
                    placeholder="Digite seu email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assinatura Digital
                </label>
                <SignatureCanvas
                  onSignatureChange={handleSignatureChange}
                  width={600}
                  height={200}
                />
              </div>

              <div className="flex items-center space-x-2 p-3 bg-alencar-bg rounded-lg">
                <Shield className="w-5 h-5 text-alencar-green" />
                <p className="text-sm text-alencar-green">
                  Sua assinatura será registrada com data, hora e IP para fins de auditoria.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSigningForm(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleSignContract}
                  disabled={!signatureValid || !signingData.name || !signingData.email || submitting}
                  className={`px-6 py-2 rounded-button font-medium flex items-center ${
                    signatureValid && signingData.name && signingData.email && !submitting
                      ? 'btn-primary'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {submitting ? 'Assinando...' : 'Confirmar Assinatura'}
                </button>
              </div>
            </div>
          </div>
        )}

        {allSigned && (
          <div className="bg-green-50 border border-green-200 rounded-card p-6 text-center mb-8">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-green-900">Contrato Finalizado</h3>
            <p className="text-green-700">
              Todas as partes assinaram o contrato. O processo foi concluído com sucesso.
            </p>
            {contract.allSignedAt && (
              <p className="text-sm text-green-600 mt-2">
                Finalizado em {formatDate(contract.allSignedAt)}
              </p>
            )}
          </div>
        )}

        <div className="card-base-no-accent">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-alencar-green" />
              Conteúdo do Contrato
            </h3>

            <button
              onClick={downloadPDF}
              className="btn-primary flex items-center"
              title="Baixar contrato em PDF com assinaturas"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </button>
          </div>

          <div
            className="prose max-w-none border rounded-lg p-6 bg-gray-50 mb-6"
            dangerouslySetInnerHTML={{ __html: contract.content || '<p>Carregando conteúdo do contrato...</p>' }}
          />

          <div className="border-t pt-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Assinaturas Digitais</h4>

            {signatories
              .filter(signatory => signatory.status === 'signed' && signatory.signatureData)
              .map((signatory, index) => (
                <div key={signatory.id} className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <p><strong>Data/Hora:</strong> {formatDate(signatory.signedAt!)}</p>
                        <p><strong>ID da Assinatura:</strong>
                          <span className="font-mono text-xs bg-white px-2 py-1 rounded border ml-2">
                            {signatory.id}
                          </span>
                        </p>
                        {signatory.ipAddress && (
                          <p><strong>IP:</strong> {signatory.ipAddress}</p>
                        )}
                      </div>
                    </div>

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

                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center text-xs text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        Assinatura criptograficamente verificada
                      </span>
                      <span className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Validação temporal confirmada
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            {signatories.filter(s => s.status === 'signed' && s.signatureData).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <PenTool className="w-12 h-12 text-gray-300 mx-auto mb-3" />
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
  );
};

export default PublicContractSigning;
