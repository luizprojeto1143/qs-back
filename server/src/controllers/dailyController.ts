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
                    is_owner: true, // Give owner privileges to control the call
                    enable_recording: "cloud", // Optional: allow recording
                    user_name: user.name || 'Usuário QS',
                    exp: Math.floor(Date.now() / 1000) + 3600 // Token valid for 1 hour
                }
            })
        });

        if (!tokenResponse.ok) {
            const errorData = await tokenResponse.json();
            console.error('Daily.co token error:', errorData);
            // Fallback: try to return URL without token, but it might fail for private rooms
            // Better to fail here so we know something is wrong
            return res.status(500).json({ error: 'Failed to generate video token' });
        }

        const tokenData = await tokenResponse.json();

        // Return both URL and Token
        const finalUrl = checkResponse.ok ? (await checkResponse.json()).url : newRoomData.url;
        res.json({ url: finalUrl, token: tokenData.token });

    } catch (error) {
        console.error('Error in createRoom:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
