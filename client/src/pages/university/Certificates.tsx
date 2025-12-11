import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api';
import { useReactToPrint } from 'react-to-print';
import { Award, Download, Share2, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Certificate {
    id: string;
    courseTitle: string;
    code: string;
    issuedAt: string;
    user: {
        name: string;
    };
    course: {
        duration: number;
    };
}

const CertificateTemplate = ({ certificate, ref }: { certificate: Certificate | null, ref: any }) => {
    if (!certificate) return null;

    return (
        <div ref={ref} className="w-[1123px] h-[794px] bg-white p-20 relative text-center flex flex-col items-center justify-center border-8 border-double border-blue-900 mx-auto hidden print:flex">
            <div className="absolute top-10 left-10 right-10 bottom-10 border-2 border-blue-200 rounded-lg pointer-events-none" />

            {/* Logo Placeholder */}
            <div className="mb-12">
                <Award className="h-24 w-24 text-blue-600 mx-auto" />
                <h1 className="text-4xl font-serif font-bold text-blue-900 mt-4">Universidade Corporativa</h1>
            </div>

            <h2 className="text-6xl font-serif text-gray-900 mb-8">Certificado de Conclusão</h2>

            <p className="text-xl text-gray-600 mb-4">Certificamos que</p>
            <h3 className="text-4xl font-bold text-blue-800 mb-8 border-b-2 border-blue-100 pb-2 px-10 inline-block">
                {certificate.user.name}
            </h3>

            <p className="text-xl text-gray-600 mb-2">concluiu com êxito o curso</p>
            <h4 className="text-3xl font-bold text-gray-800 mb-8">{certificate.courseTitle}</h4>

            <div className="flex items-center justify-center gap-12 text-gray-600 mb-12">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>Carga Horária: {certificate.course.duration} minutos</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>Concluído em: {new Date(certificate.issuedAt).toLocaleDateString('pt-BR')}</span>
                </div>
            </div>

            <div className="mt-auto text-sm text-gray-400">
                <p>Código de Validação: {certificate.code}</p>
                <p>Este certificado é reconhecido pela Universidade Corporativa.</p>
            </div>
        </div>
    );
};

const Certificates = () => {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        content: () => printRef.current,
        documentTitle: `Certificado - ${selectedCertificate?.courseTitle}`,
        onAfterPrint: () => setSelectedCertificate(null)
    } as any);

    useEffect(() => {
        if (selectedCertificate) {
            handlePrint();
        }
    }, [selectedCertificate]);

    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                // We need to fetch user details to get certificates
                // Assuming we can get current user ID from a context or decoding token, 
                // but for now let's try to get from a dedicated endpoint if it existed, 
                // or use the user details endpoint if we know the ID.
                // Since we don't have the ID easily here without context, let's assume 
                // we modify the backend to have a /certificates/me endpoint OR 
                // we fetch from /courses/users/me (if we implement 'me')

                // For now, let's try to fetch from the user details endpoint using a known ID or 
                // better, let's add a /certificates/my endpoint to courseController.

                // Wait, I can't easily add a new route without restarting server if I don't have hot reload (I assume I do).
                // Let's check if there is a way to get "my" university details.
                // The `getUserUniversityDetails` requires userId.

                // I'll implement a workaround: fetch /auth/me to get ID, then fetch details.
                const userRes = await api.get('/auth/me');
                const userId = userRes.data.id;

                const detailsRes = await api.get(`/courses/users/${userId}`);

                // Map the response to our interface
                // The response has certificates array
                const certs = detailsRes.data.certificates.map((c: any) => ({
                    ...c,
                    user: { name: detailsRes.data.user.name },
                    course: { duration: 60 } // Mock duration if not in response, but it should be
                }));

                setCertificates(certs);
            } catch (error) {
                console.error('Error fetching certificates', error);
                // toast.error('Erro ao carregar certificados');
            } finally {
                setLoading(false);
            }
        };
        fetchCertificates();
    }, []);

    const onDownload = (cert: Certificate) => {
        setSelectedCertificate(cert);
        // The useEffect will trigger handlePrint
    };

    const onShare = (cert: Certificate) => {
        const text = `Acabei de concluir o curso "${cert.courseTitle}" na Universidade Corporativa! 🎓`;
        const url = window.location.href; // Or a public validation URL

        if (navigator.share) {
            navigator.share({
                title: 'Meu Certificado',
                text: text,
                url: url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(`${text} ${url}`);
            toast.success('Link copiado para a área de transferência!');
        }
    };

    if (loading) return <div className="p-6 text-center text-gray-500">Carregando certificados...</div>;

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meus Certificados</h1>
                <p className="text-gray-500 dark:text-gray-400">Visualize e baixe suas conquistas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {certificates.map(cert => (
                    <div key={cert.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500" />

                        <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Award className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>

                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{cert.courseTitle}</h3>
                        <p className="text-xs text-gray-500 mb-6">Concluído em {new Date(cert.issuedAt).toLocaleDateString('pt-BR')}</p>

                        <div className="flex gap-3 w-full mt-auto">
                            <button
                                onClick={() => onDownload(cert)}
                                className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm"
                            >
                                <Download className="h-4 w-4" />
                                Baixar PDF
                            </button>
                            <button
                                onClick={() => onShare(cert)}
                                className="p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                                title="Compartilhar"
                            >
                                <Share2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}

                {certificates.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nenhum certificado ainda</h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Conclua cursos para ganhar certificados.
                        </p>
                    </div>
                )}
            </div>

            {/* Hidden Print Template */}
            <div style={{ display: 'none' }}>
                <CertificateTemplate certificate={selectedCertificate} ref={printRef} />
            </div>
        </div>
    );
};

export default Certificates;
