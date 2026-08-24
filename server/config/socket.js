const { Server } = require('socket.io');

let io = null;

function initializeSocket(httpServer, clientUrl) {
  io = new Server(httpServer, {
    cors: {
      origin: clientUrl || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    // Join private room based on user role or ID
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
    });

    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

function getIO() {
  return io;
}

/**
 * Emit real-time notification to a specific user room
 */
function emitToUser(userId, event, payload) {
  if (io) {
    io.to(userId.toString()).emit(event, payload);
    io.emit(event, payload); // Broadcast fallback
  }
}

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
};
