import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface AnalysisResult {
    patterns: string[];
    risks: string[];
    recommendations: string[];
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    confidence: number;
}

export interface PatternAnalysisInput {
    companyId: string;
    areaName: string;
    data: {
        pendingItems: number;
        resolvedItems: number;
        visits: number;
        complaints: number;
        averageResolutionDays: number;
        lastVisitDays: number;
        recentConflicts: string[];
    };
}

export const aiService = {
    // Analisar padrões em uma área
    async analyzePatterns(input: PatternAnalysisInput): Promise<AnalysisResult> {
        try {
            const prompt = `Você é um especialista em inclusão de pessoas com deficiência no ambiente de trabalho.
      
Analise os seguintes dados da área "${input.areaName}" e identifique:
1. Padrões preocupantes (reincidência, silêncio perigoso, tendências)
2. Riscos potenciais
3. Recomendações de ação

Dados:
- Pendências abertas: ${input.data.pendingItems}
- Pendências resolvidas: ${input.data.resolvedItems}
- Visitas técnicas recentes: ${input.data.visits}
- Denúncias: ${input.data.complaints}
- Tempo médio de resolução: ${input.data.averageResolutionDays} dias
- Dias desde última visita: ${input.data.lastVisitDays}
- Conflitos recentes: ${input.data.recentConflicts.join(', ') || 'Nenhum'}

Responda APENAS em JSON válido no formato:
{
  "patterns": ["padrão 1", "padrão 2"],
  "risks": ["risco 1", "risco 2"],
  "recommendations": ["recomendação 1", "recomendação 2"],
  "severity": "INFO" | "WARNING" | "CRITICAL",
  "confidence": 0.0 a 1.0
}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Você é um especialista em inclusão de PCD. Responda APENAS em JSON válido.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 1000,
            });

            const content = response.choices[0]?.message?.content || '{}';

            // Parse JSON response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return {
                patterns: [],
                risks: ['Não foi possível analisar os dados'],
                recommendations: ['Revisar dados manualmente'],
                severity: 'INFO',
                confidence: 0.5,
            };
        } catch (error) {
            console.error('OpenAI analysis error:', error);
            return {
                patterns: [],
                risks: ['Erro na análise de IA'],
                recommendations: ['Verifique a configuração da OpenAI'],
                severity: 'INFO',
                confidence: 0,
            };
        }
    },

    // Gerar sugestão de prioridades
    async generatePriorities(areasData: any[]): Promise<any[]> {
        try {
            const prompt = `Você é um consultor de inclusão de PCD.
      
Analise estas áreas e determine quais 2-3 são prioritárias para ação imediata:

${areasData.map((a, i) => `
Área ${i + 1}: ${a.name}
- Score: ${a.score}
- Pendências: ${a.pendingItems}
- Denúncias: ${a.complaints}
- Última visita: ${a.lastVisitDays} dias
`).join('\n')}

Responda APENAS em JSON válido:
{
  "priorities": [
    {"areaName": "nome", "reason": "motivo", "urgency": "ALTA" | "MEDIA" | "BAIXA"}
  ]
}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Você é um consultor de inclusão. Responda APENAS em JSON válido.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 500,
            });

            const content = response.choices[0]?.message?.content || '{}';
            const jsonMatch = content.match(/\{[\s\S]*\}/);

            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return result.priorities || [];
            }

            return [];
        } catch (error) {
            console.error('OpenAI priorities error:', error);
            return [];
        }
    },

    // Analisar dados de inclusão (Legacy from openaiService)
    async analyzeInclusionData(data: any): Promise<any> {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'pending') {
            console.warn('⚠️ OpenAI API Key missing or pending. Using MOCK data.');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return {
                analysis: "⚠️ [MODO DEMONSTRAÇÃO] A empresa demonstra um compromisso inicial com a inclusão. No entanto, observa-se uma concentração de denúncias relacionadas à comunicação.",
                riskLevel: "MEDIO",
                priorityActions: ["Workshop de LIBRAS", "Revisão de acessibilidade digital"],
                positivePoints: ["Alta retenção de talentos PCD", "Canal de denúncias ativo"],
                recommendation: "Investir na cultura de pertencimento."
            };
        }

        try {
            const prompt = `Você é um especialista em Diversidade e Inclusão Corporativa. Analise: ${JSON.stringify(data, null, 2)}
            RETORNE APENAS JSON: { "analysis": "...", "riskLevel": "BAIXO"|"MEDIO"|"ALTO", "priorityActions": [], "positivePoints": [], "recommendation": "..." }`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Analista de Diversidade e Inclusão Sênior AI.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
            });

            const content = response.choices[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
            return JSON.parse(content);
        } catch (error) {
            console.error('AI generic analysis error:', error);
            return { error: 'Failed to parse AI analysis' };
        }
    },

    // Traduzir descrição de denúncia de LIBRAS para texto (simulação)
    async translateLibrasDescription(videoUrl: string, context?: string): Promise<string> {
        // Nota: Em produção, isso seria integrado com um serviço de tradução de LIBRAS
        // Por ora, retorna um placeholder
        return `[Tradução pendente - Vídeo: ${videoUrl}]`;
    },

    // Gerar resumo executivo
    async generateExecutiveSummary(companyData: any): Promise<string> {
        try {
            const prompt = `Gere um resumo executivo CURTO (máximo 3 parágrafos) sobre a situação de inclusão desta empresa:

- Score geral: ${companyData.score}
- Áreas: ${companyData.areasCount}
- Colaboradores PCD: ${companyData.collaboratorsCount}
- Pendências abertas: ${companyData.pendingItems}
- Denúncias em aberto: ${companyData.openComplaints}
- Última visita: ${companyData.lastVisitDate}

Foque em pontos principais e recomendações.`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'Você é um consultor de inclusão. Seja conciso e objetivo.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.5,
                max_tokens: 300,
            });

            return response.choices[0]?.message?.content || 'Resumo não disponível';
        } catch (error) {
            console.error('OpenAI summary error:', error);
            return 'Erro ao gerar resumo executivo';
        }
    },

    // Alertas inteligentes (Legacy from openaiService)
    async generateSmartAlerts(complaints: any[], score: number) {
        return [];
    }
};
