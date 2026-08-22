import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://frontend-task-chatapp.onrender.com';

let socket: Socket | null = null;

export const getSocket = (): Socket | null => socket;

export const connectSocket = (token: string): Socket => {
  if (socket) {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
