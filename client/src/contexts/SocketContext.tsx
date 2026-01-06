import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useCompany } from './CompanyContext';

interface SocketContextType {
    socket: Socket | null;
    isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { user } = useAuth();
    const { selectedCompanyId } = useCompany();

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        if (!apiUrl) console.warn('Socket URL missing (VITE_API_URL)');

        // Only connect if user is logged in
        if (!user) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io(apiUrl, {
            withCredentials: true,
            autoConnect: true,
            reconnection: true,
        });

        newSocket.on('connect', () => {
            console.log('Socket Connected');
            setIsConnected(true);

            // Join specific rooms
            if (selectedCompanyId) {
                newSocket.emit('join_company', selectedCompanyId);
            }
        });

        newSocket.on('disconnect', () => {
            console.log('Socket Disconnected');
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user?.id, selectedCompanyId]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
