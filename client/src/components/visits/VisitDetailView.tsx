import { TrendingUp, FileText } from 'lucide-react';

interface VisitDetailViewProps {
    data: any;
    index?: number;
}

export const VisitDetailView = ({ data, index }: VisitDetailViewProps) => {
    return (
        <div className="space-y-8 print:break-inside-avoid print:break-after-auto mb-12 border-b-4 border-gray-100 pb-12 last:border-0">
            {/* Header com Index se existir */}
            <div className={`bg-gray-50 p-6 rounded-xl border border-gray-200 ${index !== undefined ? 'flex items-start gap-4' : ''}`}>
                {index !== undefined && (
                    <div className="bg-primary text-white h-10 w-10 flex items-center justify-center rounded-lg font-bold text-lg shrink-0">
                        #{index}
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div>
                        <p className="text-sm text-gray-500 uppercase font-bold">Data da Visita</p>
                        <p className="text-lg font-medium">
                            {data.date ? new Date(data.date).toLocaleDateString() : '-'} às {data.date ? new Date(data.date).toLocaleTimeString() : '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 uppercase font-bold">Área / Setor</p>
                        <p className="text-lg font-medium">{data.area?.name} / {data.area?.sector?.name || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 uppercase font-bold">Consultor Responsável</p>
                        <p className="text-lg font-medium">{data.master?.name || 'Consultor QS'}</p>
                    </div>
                    {data.company && (
                        <div>
                            <p className="text-sm text-gray-500 uppercase font-bold">Empresa</p>
                            <p className="text-lg font-medium">{data.company?.name}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Colaboradores */}
            {data.collaborators && data.collaborators.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Colaboradores Acompanhados
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.collaborators.map((c: any) => (
                            <div key={c.id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    {c.user?.avatar && <img src={c.user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />}
                                    <div>
                                        <p className="font-bold text-lg">{c.user?.name || 'Colaborador'}</p>
                                        <p className="text-xs text-gray-400">{c.user?.email}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500">Matrícula: {c.matricula || '-'}</p>
                                <p className="text-sm text-gray-500">Turno: {c.shift || '-'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Relatos */}
            <div className="space-y-6">
                {data.relatoLideranca && (
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-lg font-bold text-blue-900 mb-2">Relato da Liderança</h3>
                        <p className="text-blue-800 whitespace-pre-wrap">{data.relatoLideranca}</p>
                    </div>
                )}

                {data.relatoColaborador && (
                    <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                        <h3 className="text-lg font-bold text-green-900 mb-2">Relato do Colaborador (Geral)</h3>
                        <p className="text-green-800 whitespace-pre-wrap">{data.relatoColaborador}</p>
                    </div>
                )}

                {data.relatoConsultoria && (
                    <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                        <h3 className="text-lg font-bold text-purple-900 mb-2">Relato da Consultoria</h3>
                        <p className="text-purple-800 whitespace-pre-wrap">{data.relatoConsultoria}</p>
                    </div>
                )}

                {data.observacoesMaster && (
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Observações da Consultoria</h3>
                        <p className="text-gray-800 whitespace-pre-wrap">{data.observacoesMaster}</p>
                    </div>
                )}
            </div>

            {/* Notas Individuais */}
            {data.notes && data.notes.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-4 border-b pb-2 mt-8">Notas Individuais</h3>
                    <div className="space-y-4">
                        {data.notes.map((note: any) => (
                            <div key={note.id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-yellow-900">{note.collaborator?.user?.name || 'Colaborador'}</p>
                                    <span className="text-xs text-yellow-600">{note.createdAt ? new Date(note.createdAt).toLocaleDateString() : '-'}</span>
                                </div>
                                <p className="text-yellow-800">{note.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pendências Geradas */}
            {data.generatedPendencies && data.generatedPendencies.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold mb-4 border-b pb-2 mt-8">Pendências Geradas</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 border">Descrição</th>
                                    <th className="p-3 border">Responsável</th>
                                    <th className="p-3 border">Prioridade</th>
                                    <th className="p-3 border">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.generatedPendencies.map((p: any) => (
                                    <tr key={p.id}>
                                        <td className="p-3 border">{p.description}</td>
                                        <td className="p-3 border">{p.responsible}</td>
                                        <td className={`p-3 border font-bold ${p.priority === 'ALTA' ? 'text-red-600' : 'text-yellow-600'}`}>{p.priority}</td>
                                        <td className="p-3 border">{p.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Anexos */}
            {data.attachments && data.attachments.length > 0 && (
                <div className="mt-8 break-inside-avoid">
                    <h3 className="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-gray-500" />
                        Anexos
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {data.attachments.map((file: any) => (
                            <div key={file.id} className="border rounded-lg p-2">
                                {file.type?.startsWith('image/') ? (
                                    <img src={file.url} alt={file.name} className="w-full h-48 object-cover rounded" />
                                ) : (
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 break-all p-4">
                                        <FileText className="h-4 w-4" />
                                        {file.name}
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
