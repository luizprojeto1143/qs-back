import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

const DAILY_API_KEY = process.env.DAILY_API_KEY;

export const createRoom = async (req: Request, res: Response) => {
    try {
        if (!DAILY_API_KEY) {
            console.error('DAILY_API_KEY not configured');
            return res.status(500).json({ error: 'Video service not configured' });
        }

        const user = (req as AuthRequest).user;
        if (!user || !user.companyId) {
            return res.status(400).json({ error: 'User or Company not found' });
        }

        // Unique room name per company to ensure isolation
        // We use a sanitized version of the company ID
        const roomName = `qs-libras-${user.companyId.substring(0, 8)}`;

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
            return res.json({ url: roomData.url });
        }

        // 2. If not, create it
        const createResponse = await fetch('https://api.daily.co/v1/rooms', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DAILY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: roomName,
                privacy: 'private', // CHANGED TO PRIVATE for security
                properties: {
                    start_audio_off: true,
                    start_video_off: true,
                    enable_chat: true,
                    enable_people_ui: true,
                    enable_screenshare: true,
                    // enable_knocking: true // Allow users to ask to join
                }
            })
        });

        if (!createResponse.ok) {
            const errorData = await createResponse.json();
            console.error('Daily.co creation error:', errorData);
            return res.status(500).json({ error: 'Failed to create video room' });
        }

        const newRoomData = await createResponse.json();
        res.json({ url: newRoomData.url });

    } catch (error) {
        console.error('Error in createRoom:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
