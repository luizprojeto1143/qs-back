import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const analyzeInclusionData = async (data: any) => {
    // 1. Mock Mode (Fallback)
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'pending') {
        console.warn('⚠️ OpenAI API Key missing or pending. Using MOCK data.');

        // Wait 1.5s to simulate network request
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            analysis: "⚠️ [MODO DEMONSTRAÇÃO] A empresa demonstra um compromisso inicial com a inclusão, refletido na estrutura de cargos. No entanto, observa-se uma concentração de denúncias relacionadas à comunicação não-verbal, sugerindo barreiras para colaboradores surdos. O Score atual de 780 indica uma maturidade média, com potencial de crescimento rápido mediante ações corretivas.",
            riskLevel: "MEDIO",
            priorityActions: [
                "Implementar Workshop de LIBRAS para gestores (Crítico)",
                "Revisar política de acessibilidade digital na intranet",
                "Estabelecer comitê de diversidade para monitoramento mensal"
            ],
            positivePoints: [
                "Alta retenção de talentos PCD nos últimos 12 meses",
                "Canal de denúncias ativo e utilizado"
            ],
            recommendation: "Investir na cultura de pertencimento através de lideranças inclusivas é o próximo passo para elevar o Score acima de 850."
        };
    }

    try {
        const prompt = `
            Você é um especialista em Diversidade e Inclusão Corporativa.
            Analise os seguintes dados de uma empresa e forneça insights estratégicos.
            
            DADOS:
            ${JSON.stringify(data, null, 2)}
            
            RETORNE APENAS UM JSON VÁLIDO COM O SEGUINTE FORMATO:
            {
                "analysis": "Texto resumido em 1 parágrafo sobre a situação atual.",
                "riskLevel": "BAIXO" | "MEDIO" | "ALTO",
                "priorityActions": ["Ação 1", "Ação 2", "Ação 3"],
                "positivePoints": ["Ponto 1", "Ponto 2"],
                "recommendation": "Uma recomendação final de impacto."
            }
        `;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Analista de Diversidade e Inclusão Sênior AI." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        const content = response.choices[0].message.content;

        // Tenta fazer o parse do JSON, tratando possíveis markdowns
        try {
            const cleanContent = content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
            return JSON.parse(cleanContent);
        } catch (e) {
            console.error('Error parsing AI response:', e);
            return { error: 'Failed to parse AI analysis', raw: content };
        }

    } catch (error: any) {
        console.error('Error calling OpenAI:', error);

        // Check for specific OpenAI error codes
        if (error.status === 401) {
            throw new Error('Erro de Autenticação: Chave de API inválida ou ausente no servidor.');
        } else if (error.status === 429) {
            throw new Error('Limite de Requisições Excedido (Quota). Verifique seu plano OpenAI.');
        } else if (error.status === 500) {
            throw new Error('Erro nos servidores da OpenAI. Tente novamente em alguns instantes.');
        }

        throw new Error(`Falha na análise: ${error.message || 'Erro desconhecido'}`);
    }
};

export const generateSmartAlerts = async (complaints: any[], score: number) => {
    // Implementação futura para alertas proativos
    return [];
};
