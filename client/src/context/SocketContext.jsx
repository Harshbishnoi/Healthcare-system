import React, { createContext, useContext, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { showSuccess, showInfo } = useToast();

  useEffect(() => {
    if (user && user.id) {
      socketService.connect(user.id);

      // Real-Time Appointment Booked Handler
      const handleApptBooked = (data) => {
        if (user.role === 'doctor') {
          showInfo(`New Appointment Request: ${data.patientName || 'Patient'} booked slot for ${data.date || 'upcoming date'}.`);
        }
      };

      // Real-Time Status Change Handler
      const handleStatusChanged = (data) => {
        showSuccess(`Appointment Update: Your appointment status is now "${data.status}".`);
      };

      socketService.on('appointment:booked', handleApptBooked);
      socketService.on('appointment:status_changed', handleStatusChanged);

      return () => {
        socketService.off('appointment:booked', handleApptBooked);
        socketService.off('appointment:status_changed', handleStatusChanged);
        socketService.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socketService }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context;
};
