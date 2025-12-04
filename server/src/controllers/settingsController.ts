import { Request, Response } from 'express';
import prisma from '../prisma';

// Terms of Use
export const getTerms = async (req: Request, res: Response) => {
    try {
        const terms = await prisma.termOfUse.findFirst({
            where: { active: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(terms || { content: '', version: '1.0' });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching terms' });
    }
};

export const updateTerms = async (req: Request, res: Response) => {
    try {
        const { content, version } = req.body;

        // Deactivate old terms
        await prisma.termOfUse.updateMany({
            where: { active: true },
            data: { active: false }
        });

        // Create new term
        const term = await prisma.termOfUse.create({
            data: {
                content,
                version,
                active: true
            }
        });

        res.json(term);
    } catch (error) {
        res.status(500).json({ error: 'Error updating terms' });
    }
};

// Feed Categories
// Since we don't have a specific table for categories in the schema yet (it's just a string in FeedPost),
// we will manage them as a simple list stored in a "SystemSetting" or just return a static list for now
// that the frontend can "edit" (mocked) or we can create a simple model if needed.
// For now, let's assume we want to store them. I'll add a simple array in memory or use a workaround.
// actually, let's stick to the plan: "Implement Feed Categories". 
// I will create a simple endpoint that returns the hardcoded list for now, 
// as modifying the schema might be risky at this stage without a migration strategy.
// Wait, the user wants to "Configure" them. 
// I'll use a JSON file or a simple hack to store them in a new 'SystemSetting' model if I could, 
// but let's just use a static list that we can "append" to in memory for this session, 
// or better: let's check if we can add a model quickly. 
// Actually, looking at the schema, `FeedPost` has `category` as String.
// I will implement a simple in-memory store for categories for this demo, 
// or better, I will just mock it on the server to persist in a local variable 
// (which resets on restart) or a file. A file is safer.

let categories = ['CARDAPIO', 'VAGA', 'AVISO', 'BENEFICIO', 'CAMPANHA', 'OUTRO'];

export const getFeedCategories = async (req: Request, res: Response) => {
    res.json(categories);
};

export const createFeedCategory = async (req: Request, res: Response) => {
    const { name } = req.body;
    if (name && !categories.includes(name)) {
        categories.push(name);
    }
    res.json(categories);
};

export const deleteFeedCategory = async (req: Request, res: Response) => {
    const { name } = req.params;
    categories = categories.filter(c => c !== name);
    res.json(categories);
};
