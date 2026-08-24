import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Home } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center">
        <Stethoscope className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
      <h2 className="text-lg font-bold text-slate-700">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm">
        The healthcare page or doctor profile you requested cannot be located.
      </p>
      <Link to="/">
        <Button variant="primary" icon={Home} size="sm">
          Return to Homepage
        </Button>
      </Link>
    </div>
  );
};
