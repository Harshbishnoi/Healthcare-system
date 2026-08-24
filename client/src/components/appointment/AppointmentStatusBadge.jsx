import React from 'react';
import { APPOINTMENT_STATUS_CONFIG } from '../../utils/constants';

export const AppointmentStatusBadge = ({ status = 'pending' }) => {
  const config = APPOINTMENT_STATUS_CONFIG[status] || APPOINTMENT_STATUS_CONFIG.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};
