import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { sendError500, ERROR_CODES } from '../utils/errorUtils';

const DAILY_API_KEY = process.env.DAILY_API_KEY;

export const createRoom = async (req: Request, res: Response) => {
    try {
        if (!DAILY_API_KEY) {
            return sendError500(res, ERROR_CODES.DAILY_ROOM, new Error('DAILY_API_KEY not configured'));
        }

        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Unique room name per company to ensure isolation
        const roomName = `qs-libras-${user.companyId.substring(0, 8)}`;
        let roomUrl = '';

        // 1. Check if room exists
        const checkResponse = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${DAILY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (checkResponse.ok) {
            const roomData = await checkResponse.json();
            roomUrl = roomData.url;
        } else {
            // 2. If not, create it
            const createResponse = await fetch('https://api.daily.co/v1/rooms', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DAILY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: roomName,
                    privacy: 'private',
                    properties: {
                        start_audio_off: true,
                        start_video_off: true,
                        enable_chat: true,
                        enable_people_ui: true,
                        enable_screenshare: true
                    }
                })
            });

            if (!createResponse.ok) {
                const errorData = await createResponse.json();
                return sendError500(res, ERROR_CODES.DAILY_ROOM, new Error(JSON.stringify(errorData)));
            }

            const newRoomData = await createResponse.json();
            roomUrl = newRoomData.url;
        }

        // 3. Generate a meeting token
        const tokenResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DAILY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    room_name: roomName,
                    is_owner: true,
                    enable_recording: "cloud",
                    user_name: 'Usuário QS',
                    exp: Math.floor(Date.now() / 1000) + 3600
                }
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            return sendError500(res, ERROR_CODES.DAILY_ROOM, new Error(JSON.stringify(errorData)));
        }

        const tokenData = await tokenResponse.json();

        res.json({ url: roomUrl, token: tokenData.token });

    } catch (error) {
        sendError500(res, ERROR_CODES.DAILY_ROOM, error);
    }
};
