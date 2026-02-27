import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../prisma';
import { createRoom } from './dailyController';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

// Request a call (Collaborator)
export const requestCall = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Use transaction to prevent race conditions (double booking)
        const result = await prisma.$transaction(async (prisma) => {
            // Check if there is already a pending call for this user
            const existingCall = await prisma.librasCall.findFirst({
                where: {
                    requesterId: user.userId,
                    status: { in: ['WAITING', 'IN_PROGRESS'] } // Check both statuses
                }
            });

            if (existingCall) {
                return { call: existingCall, message: 'Already waiting or in progress' };
            }

            const call = await prisma.librasCall.create({
                data: {
                    companyId: user.companyId!,
                    requesterId: user.userId,
                    status: 'WAITING'
                }
            });

            return { call };
        });


        if (result.call.status === 'WAITING') {
            const io = req.app.get('io');
            if (io) {
                io.to(`company:${user.companyId}`).emit('new_libras_call', result.call);
            }
        }

        res.json(result);
    } catch (error) {
        sendError500(res, ERROR_CODES.LIBRAS_CALL_REQUEST, error);
    }
};

// Check status of a call (Collaborator polling)
export const checkCallStatus = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const callId = req.params.id;

        const call = await prisma.librasCall.findFirst({
            where: { id: callId }
        });

        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }

        // If accepted, we need the room URL
        let roomUrl = null;
        if (call.status === 'IN_PROGRESS') {
            // Generate room URL same way as before
            // Ideally this should be stored in the DB when the call is accepted to ensure consistency
            // But for now we reconstruct it based on company ID logic
            roomUrl = `https://qs-inclusao.daily.co/qs-libras-${user.companyId.substring(0, 8)}`;
        }

        res.json({ status: call.status, roomUrl });
    } catch (error) {
        sendError500(res, ERROR_CODES.LIBRAS_CALL_STATUS, error);
    }
};

// List pending calls (Master)
export const listPendingCalls = async (req: Request, res: Response) => {
    try {
        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        const calls = await prisma.librasCall.findMany({
            where: {
                companyId: user.companyId,
                status: { in: ['WAITING', 'IN_PROGRESS'] }
            },
            include: {
                requester: {
                    select: {
                        name: true,
                        email: true,
                        collaboratorProfile: {
                            select: {
                                matricula: true,
                                area: { select: { name: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ calls });
    } catch (error) {
        sendError500(res, ERROR_CODES.LIBRAS_CALL_LIST, error);
    }
};

// Accept call (Master)
export const acceptCall = async (req: Request, res: Response) => {
    try {
        const callId = req.params.id;

        const call = await prisma.librasCall.update({
            where: { id: callId },
            data: {
                status: 'IN_PROGRESS',
                acceptedAt: new Date()
            }
        });


        // Emitir evento via Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(`company:${call.companyId}`).emit('libras_call_accepted', call);
        }

        res.json({ call });
    } catch (error) {
        sendError500(res, ERROR_CODES.LIBRAS_CALL_UPDATE, error);
    }
};

// Cancel/Finish call
export const updateCallStatus = async (req: Request, res: Response) => {
    try {
        const callId = req.params.id;
        const { status } = req.body; // FINISHED, CANCELED

        const call = await prisma.librasCall.update({
            where: { id: callId },
            data: {
                status,
                finishedAt: status === 'FINISHED' ? new Date() : undefined
            }
        });

        res.json({ call });
    } catch (error) {
        sendError500(res, ERROR_CODES.LIBRAS_CALL_UPDATE, error);
    }
};

// Invite specialist (Hub of Attention)
import { sendInviteEmail } from '../services/mailService';

export const inviteToCall = async (req: Request, res: Response) => {
    try {
        const callId = req.params.id;
        const { email, name } = req.body;

        const call = await prisma.librasCall.findFirst({
            where: { id: callId },
            include: {
                requester: {
                    include: {
                        collaboratorProfile: {
                            include: { area: true }
                        }
                    }
                }
            }
        });

        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }

        // Construct collaborator info
        const collaboratorInfo = {
            name: call.requester.name,
            matricula: call.requester.collaboratorProfile?.matricula || 'N/A',
            area: call.requester.collaboratorProfile?.area?.name || 'N/A',
            shift: call.requester.collaboratorProfile?.shift || 'N/A'
        };

        // Generate room URL (assuming standard format)
        const roomUrl = `https://qs-inclusao.daily.co/qs-libras-${call.companyId.substring(0, 8)}`;

        await sendInviteEmail(email, roomUrl, collaboratorInfo);

        res.json({ message: 'Invite sent successfully' });
    } catch (error) {
        sendError500(res, ERROR_CODES.LIBRAS_CALL_UPDATE, error);
    }
};
