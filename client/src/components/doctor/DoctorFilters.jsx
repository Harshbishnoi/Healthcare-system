import React from 'react';
import { Search, MapPin, Stethoscope, Video, RotateCcw } from 'lucide-react';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { SPECIALIZATIONS, CITIES, CONSULTATION_MODES } from '../../utils/constants';

export const DoctorFilters = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResults = 0,
}) => {
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4">
      {/* Top Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Search by doctor name, hospital, condition, or keyword..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={onResetFilters}
            icon={RotateCcw}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Filter Selectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
        <div>
          <Select
            label="Specialization"
            value={filters.specialization || 'All Specializations'}
            onChange={(e) =>
              onFilterChange(
                'specialization',
                e.target.value === 'All Specializations' ? '' : e.target.value
              )
            }
            options={SPECIALIZATIONS}
          />
        </div>

        <div>
          <Select
            label="City / Location"
            value={filters.city || 'All Cities'}
            onChange={(e) =>
              onFilterChange('city', e.target.value === 'All Cities' ? '' : e.target.value)
            }
            options={CITIES}
          />
        </div>

        <div>
          <Select
            label="Consultation Mode"
            value={filters.mode || 'all'}
            onChange={(e) => onFilterChange('mode', e.target.value)}
            options={CONSULTATION_MODES}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>
          Showing <strong className="text-slate-900">{totalResults}</strong> verified doctors
        </span>
        {filters.specialization && (
          <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-medium">
            Filtering by: {filters.specialization}
          </span>
        )}
      </div>
    </div>
  );
};
