import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class SocketService {
  socket = null;

  connect(token) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  joinProject(projectId) {
    this.emit('join:project', projectId);
  }

  leaveProject(projectId) {
    this.emit('leave:project', projectId);
  }
}

const socketService = new SocketService();

/**
 * Returns the raw socket instance for direct event binding in components.
 * Components should use socketService.on/off, but deployment log viewer
 * needs direct access to the underlying socket for room subscriptions.
 */
export function getSocket() {
  return socketService;
}

export default socketService;
