import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';

export function useSocket() {
  const token = useAuthStore((state) => state.token);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [socket, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      setSocketInstance(null);
      setIsConnected(false);
      setIsReconnecting(false);
      return;
    }

    const s = connectSocket(token);
    setSocketInstance(s);
    setIsConnected(s.connected);

    const onConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
    };

    const onDisconnect = (reason: string) => {
      setIsConnected(false);
      if (reason !== 'io client disconnect') {
        setIsReconnecting(true);
      }
    };

    const onConnectError = () => {
      setIsConnected(false);
      setIsReconnecting(true);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);

    // Initial check in case it connected synchronously or was already connected
    if (s.connected) {
      setIsConnected(true);
      setIsReconnecting(false);
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
    };
  }, [token]);

  return { socket: socket || getSocket(), isConnected, isReconnecting };
}
