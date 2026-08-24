import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Stethoscope } from 'lucide-react';
import { DoctorCard } from '../../components/doctor/DoctorCard';
import { DoctorFilters } from '../../components/doctor/DoctorFilters';
import { BookAppointmentModal } from '../../components/appointment/BookAppointmentModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/common/Button';
import { AiSearchAssistantDrawer } from '../../components/ai/AiSearchAssistantDrawer';
import { doctorService } from '../../services/doctorService';
import { useDebounce } from '../../hooks/useDebounce';

export const DoctorSearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    specialization: searchParams.get('specialization') || '',
    city: searchParams.get('city') || '',
    mode: searchParams.get('mode') || 'all',
  });

  const debouncedSearch = useDebounce(filters.search, 400);

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  // Sync URL search params
  useEffect(() => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.specialization) params.specialization = filters.specialization;
    if (filters.city) params.city = filters.city;
    if (filters.mode && filters.mode !== 'all') params.mode = filters.mode;
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Fetch doctors whenever filters change
  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const query = {
          search: debouncedSearch,
          specialization: filters.specialization,
          city: filters.city,
          mode: filters.mode,
        };
        const res = await doctorService.getDoctors(query);
        if (res.success) {
          setDoctors(res.data || []);
          if (res.meta) setPagination(res.meta);
        }
      } catch (err) {
        console.warn('Error fetching doctors:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [debouncedSearch, filters.specialization, filters.city, filters.mode]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      specialization: '',
      city: '',
      mode: 'all',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Find & Book Doctors</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse verified medical practitioners by disease, specialization, and availability
          </p>
        </div>

        <Button
          variant="teal"
          onClick={() => setAiDrawerOpen(true)}
          icon={Sparkles}
          size="md"
        >
          AI Match Symptoms to Doctor
        </Button>
      </div>

      {/* Filter Toolbar */}
      <DoctorFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResults={pagination.total || doctors.length}
      />

      {/* Doctors Grid */}
      {loading ? (
        <LoadingSpinner fullPage label="Finding verified doctors matching your criteria..." />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors found"
          description="Try broadening your search criteria or resetting filters to view all doctors."
          actionLabel="Reset All Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id || doctor.doctorId}
              doctor={doctor}
              onBookClick={(doc) => setSelectedDoctorForBooking(doc)}
            />
          ))}
        </div>
      )}

      {/* Appointment Booking Modal */}
      {selectedDoctorForBooking && (
        <BookAppointmentModal
          doctor={selectedDoctorForBooking}
          isOpen={!!selectedDoctorForBooking}
          onClose={() => setSelectedDoctorForBooking(null)}
        />
      )}

      {/* AI Search Drawer */}
      <AiSearchAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        onApplySpecialization={(spec, city) => {
          setFilters((prev) => ({
            ...prev,
            specialization: spec,
            ...(city ? { city } : {}),
          }));
        }}
      />
    </div>
  );
};
