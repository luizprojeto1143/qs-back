import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const analyzeInclusionData = async (data: any) => {
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

    } catch (error) {
        console.error('Error calling OpenAI:', error);
        throw new Error('Failed to analyze data');
    }
};

export const generateSmartAlerts = async (complaints: any[], score: number) => {
    // Implementação futura para alertas proativos
    return [];
};
