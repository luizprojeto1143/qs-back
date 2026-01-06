import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const analyzeInclusionData = async (data: unknown) => {
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

    } catch (error) { // Removed : any
        const err = error as Error;
        console.error('Error calling OpenAI (Falling back to mock):', err.message);

        // Fallback to Mock Data smoothly instead of breaking the UI
        return {
            analysis: "⚠️ [MODO OFFLINE/FALLBACK] Não foi possível conectar ao serviço de IA no momento (Erro de Chave ou Conexão). Exibindo dados de exemplo: A empresa apresenta indicadores estáveis, mas requer atenção na acessibilidade comunicacional. O engajamento com treinamentos de inclusão subiu 15% no último trimestre.",
            riskLevel: "BAIXO",
            priorityActions: [
                "Verificar configuração da API Key (Backend)",
                "Monitorar logs de conexão do servidor",
                "Revisar cotas da OpenAI"
            ],
            positivePoints: [
                "Sistema de Fallback Ativado com Sucesso",
                "Dados históricos preservados"
            ],
            recommendation: "Realize a configuração correta da variável OPENAI_API_KEY no painel de hospedagem ou .env para ativar a análise em tempo real."
        };
    }
};

export const generateSmartAlerts = async (complaints: Array<unknown>, score: number) => {
    // Implementação futura para alertas proativos
    return [];
};
