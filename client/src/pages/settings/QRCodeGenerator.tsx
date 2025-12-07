import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { useCompany } from '../../contexts/CompanyContext';
import { api } from '../../lib/api';
import { Download, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const QRCodeGenerator = () => {
    const { companies: contextCompanies } = useCompany();
    const [companies, setCompanies] = useState<any[]>(contextCompanies);
    const [selectedCompanyId, setSelectedCompanyId] = useState('');

    useEffect(() => {
        const fetchCompanies = async () => {
            if (contextCompanies.length === 0) {
                try {
                    const res = await api.get('/companies');
                    setCompanies(res.data);
                } catch (error) {
                    console.error('Error fetching companies', error);
                }
            }
        };
        fetchCompanies();
    }, [contextCompanies]);

    const registrationLink = selectedCompanyId
        ? `${window.location.origin}/register/collaborator?companyId=${selectedCompanyId}`
        : '';
    const handleCopyLink = () => {
        navigator.clipboard.writeText(registrationLink);
        toast.success('Link copiado para a área de transferência!');
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Gerador de QR Code</h1>
            <p className="text-gray-500">Gere um QR Code para que os colaboradores possam realizar o auto-cadastro na empresa.</p>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selecione a Empresa</label>
                        <select
                            className="input-field"
                            value={selectedCompanyId}
                            onChange={e => setSelectedCompanyId(e.target.value)}
                        >
                            <option value="">Selecione...</option>
                            {companies.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedCompanyId && (
                        <div className="mt-8 flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100">
                                <QRCode
                                    id="QRCode"
                                    value={registrationLink}
                                    size={256}
                                    level="H"
                                />
                            </div>

                            <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200 break-all text-center text-sm text-gray-600 font-mono">
                                {registrationLink}
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center w-full">
                                <button
                                    onClick={handleCopyLink}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <Copy size={18} />
                                    Copiar Link
                                </button>
                                <a
                                    href={registrationLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <ExternalLink size={18} />
                                    Abrir Link
                                </a>
                                <button
                                    onClick={() => window.print()}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Download size={18} />
                                    Imprimir / Salvar PDF
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QRCodeGenerator;
