import { Request, Response } from 'express';
import prisma from '../prisma';
import { z } from 'zod';
import { sendInterpreterRequestStatusEmail } from '../services/mailService';

export const interpreterController = {
    createRequest: async (req: Request, res: Response) => {
        try {
            const {
                companyId,
                requesterId,
                requesterName,
                date,
                startTime,
                duration,
                theme,
                modality,
                description
            } = req.body;

            const request = await prisma.interpreterRequest.create({
                data: {
                    companyId,
                    requesterId: requesterId || null,
                    requesterName,
                    date: new Date(date),
                    startTime,
                    duration: Number(duration),
                    theme,
                    modality,
                    description,
                    status: 'PENDENTE',
                },
            });

            // Optional: Send email to Admins about new request?
            // For now, adhering to plan: only status updates trigger email to client.

            return res.status(201).json(request);
        } catch (error) {
            console.error('Error creating interpreter request:', error);
            return res.status(500).json({ error: 'Failed to create request' });
        }
    },

    listRequests: async (req: Request, res: Response) => {
        try {
            const { companyId, status } = req.query;
            const user = (req as any).user;

            // If user is RH (not Master), force companyId filter
            // Assuming 'user' is populated by authMiddleware and has role/companyId
            let whereClause: any = {};

            if (user && user.role !== 'MASTER') {
                if (user.companyId) {
                    whereClause.companyId = user.companyId;
                } else {
                    // If not master and no company, shouldn't see anything? Or everything?
                    // Safest is nothing.
                    return res.status(403).json({ error: 'Unauthorized' });
                }
            } else if (companyId) {
                whereClause.companyId = String(companyId);
            }

            if (status) {
                whereClause.status = String(status);
            }

            const requests = await prisma.interpreterRequest.findMany({
                where: whereClause,
                include: {
                    company: {
                        select: { name: true }
                    },
                    requester: {
                        select: { name: true, email: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            return res.json(requests);
        } catch (error) {
            console.error('Error listing interpreter requests:', error);
            return res.status(500).json({ error: 'Failed to list requests' });
        }
    },

    updateRequestStatus: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { status, adminNotes, meetingLink } = req.body;

            const request = await prisma.interpreterRequest.update({
                where: { id },
                data: {
                    status,
                    adminNotes,
                    meetingLink
                },
                include: {
                    company: {
                        include: {
                            users: {
                                where: {
                                    role: { in: ['RH', 'LIDER', 'MASTER'] }, // RH/Lider/Master of that company
                                    active: true
                                }
                            }
                        }
                    },
                    requester: true
                }
            });

            // Send Email Notification
            // 1. If requesterId exists, send to requester.
            // 2. If requesterId is null (Public Link), send to RH/Liders of the company.
            // Actually plan says: "busca automaticamente o e-mail do cliente cadastrado (usuários RH/Líder da empresa)"

            let recipients: string[] = [];

            if (request.requester && request.requester.email) {
                recipients.push(request.requester.email);
            }

            // Also add Company Admins (RH/Lider) regardless? Or solely if public?
            // User said: "o email, precisa ser enviado para o cliente, que eu cadastrei, no sistema"
            // This implies the registered user (requester) OR the contact person for that company if public.
            if (request.company && request.company.users) {
                const companyEmails = request.company.users.map((u: any) => u.email);
                recipients = [...recipients, ...companyEmails];
            }

            // Deduplicate
            recipients = [...new Set(recipients)];

            if (recipients.length > 0) {
                await sendInterpreterRequestStatusEmail(recipients, status, request);
            }

            return res.json(request);
        } catch (error) {
            console.error('Error updating interpreter request:', error);
            return res.status(500).json({ error: 'Failed to update request' });
        }
    },

    getPublicRequestConfig: async (req: Request, res: Response) => {
        try {
            const { companyId } = req.params;
            // Verify if company exists and has this feature enabled?
            // For now just return company name to show on form
            const company = await prisma.company.findUnique({
                where: { id: companyId },
                select: { name: true, id: true }
            });

            if (!company) {
                return res.status(404).json({ error: 'Empresa não encontrada' });
            }

            return res.json(company);
        } catch (error) {
            console.error('Error getting public config:', error);
            return res.status(500).json({ error: 'Failed to get config' });
        }
    }
};
