import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { User, Mail, Lock, Briefcase, Building2, CheckCircle, Clock, Accessibility } from 'lucide-react';

const CollaboratorRegistration = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const companyId = searchParams.get('companyId');

    const [areas, setAreas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        matricula: '',
        areaId: '',
        companyId: companyId || '',
        shift: '1_TURNO',
        disabilityType: 'NENHUMA',
        needsDescription: ''
    });

    useEffect(() => {
        if (companyId) {
            const fetchAreas = async () => {
                try {
                    const res = await api.get(`/public/areas/${companyId}`);
                    setAreas(res.data);
                } catch (error) {
                    console.error('Error fetching areas', error);
                    toast.error('Erro ao carregar áreas da empresa.');
                }
            };
            fetchAreas();
        }
    }, [companyId]);

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }

        if (!formData.areaId) {
            toast.error('Selecione uma área.');
            return;
        }

        if (!avatarFile) {
            toast.error('A foto de perfil é obrigatória.');
            return;
        }

        setLoading(true);
        try {
            // 1. Upload Photo
            const uploadFormData = new FormData();
            uploadFormData.append('file', avatarFile);

            const uploadRes = await api.post('/upload', uploadFormData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const avatarUrl = uploadRes.data.url;

            // 2. Register User with Avatar URL
            await api.post('/auth/register-collaborator', {
                ...formData,
                avatar: avatarUrl
            });

            setSuccess(true);
            toast.success('Cadastro realizado com sucesso!');
        } catch (error: any) {
            console.error('Registration error', error);
            toast.error(error.response?.data?.error || 'Erro ao realizar cadastro.');
        } finally {
            setLoading(false);
        }
    };

    if (!companyId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
                    <h1 className="text-xl font-bold text-red-600 mb-2">Link Inválido</h1>
                    <p className="text-gray-600">Este link de cadastro precisa estar vinculado a uma empresa.</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Cadastro Realizado!</h1>
                    <p className="text-gray-600 mb-6">Seu cadastro foi enviado com sucesso. Você já pode acessar o aplicativo.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-primary w-full"
                    >
                        Ir para Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Cadastro de Colaborador</h1>
                    <p className="text-gray-500 text-sm mt-1">Preencha seus dados para se cadastrar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 bg-gray-100 rounded-full mb-2 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 relative">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <User className="h-10 w-10 text-gray-400" />
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500">Toque para adicionar foto (Obrigatório)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                className="input-field pl-10"
                                placeholder="Seu nome"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                required
                                className="input-field pl-10"
                                placeholder="seu@email.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Briefcase className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                className="input-field pl-10"
                                placeholder="Sua matrícula"
                                value={formData.matricula}
                                onChange={e => setFormData({ ...formData, matricula: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Área / Setor</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Building2 className="h-5 w-5 text-gray-400" />
                            </div>
                            <select
                                required
                                className="input-field pl-10"
                                value={formData.areaId}
                                onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                            >
                                <option value="">Selecione sua área...</option>
                                {areas.map(area => (
                                    <option key={area.id} value={area.id}>
                                        {area.name} ({area.sector?.name})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Clock className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    required
                                    className="input-field pl-10"
                                    value={formData.shift}
                                    onChange={e => setFormData({ ...formData, shift: e.target.value })}
                                >
                                    <option value="1_TURNO">1º Turno</option>
                                    <option value="2_TURNO">2º Turno</option>
                                    <option value="3_TURNO">3º Turno</option>
                                    <option value="ESCALA_12X36">Escala 12x36</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Deficiência</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Accessibility className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    required
                                    className="input-field pl-10"
                                    value={formData.disabilityType}
                                    onChange={e => setFormData({ ...formData, disabilityType: e.target.value })}
                                >
                                    <option value="NENHUMA">Nenhuma</option>
                                    <option value="FISICA">Física</option>
                                    <option value="AUDITIVA">Auditiva</option>
                                    <option value="VISUAL">Visual</option>
                                    <option value="INTELECTUAL">Intelectual</option>
                                    <option value="MULTIPLA">Múltipla</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {formData.disabilityType !== 'NENHUMA' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Necessidades Específicas</label>
                            <textarea
                                className="input-field"
                                rows={3}
                                placeholder="Descreva suas necessidades específicas..."
                                value={formData.needsDescription}
                                onChange={e => setFormData({ ...formData, needsDescription: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="input-field pl-10"
                                    placeholder="******"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    className="input-field pl-10"
                                    placeholder="******"
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex justify-center mt-6"
                    >
                        {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CollaboratorRegistration;
