import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, ArrowRight, ShieldAlert, Stethoscope, Search } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { aiService } from '../../services/aiService';
import { useToast } from '../../context/ToastContext';

export const AiSearchAssistantDrawer = ({ isOpen, onClose, onApplySpecialization }) => {
  const { showError } = useToast();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  if (!isOpen) return null;

  const handleAiSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      showError('Please describe your symptoms or health question.');
      return;
    }

    setLoading(true);
    try {
      const res = await aiService.searchDoctorAssistant({ query, city });
      if (res.success && res.data) {
        setAiResult(res.data);
      }
    } catch (err) {
      showError(err.message || 'Could not process search assistance request.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpecialist = (spec) => {
    if (onApplySpecialization) {
      onApplySpecialization(spec, city);
    } else {
      navigate(`/doctors?specialization=${encodeURIComponent(spec)}&city=${encodeURIComponent(city)}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-fade-in">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-600 to-sky-600 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base">AI Doctor Matcher</h3>
                <p className="text-[11px] text-white/80">Symptom-to-Specialist Discovery</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* Safety Notice */}
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Medical Notice:</strong> This AI assists in finding relevant doctor categories. It <strong>never diagnoses</strong> or prescribes treatments.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAiSearch} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Describe Your Symptoms in Plain Words
                </label>
                <textarea
                  rows={3}
                  required
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. I have had a red itchy skin rash on my arms for 4 days, with mild swelling..."
                  className="block w-full rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-teal-500/20 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 resize-none"
                />
              </div>

              <Input
                label="City / Location (Optional)"
                placeholder="e.g. New York, Chicago, Austin..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />

              <Button
                type="submit"
                variant="teal"
                className="w-full"
                isLoading={loading}
                icon={Sparkles}
              >
                Find Recommended Specialists
              </Button>
            </form>

            {/* AI Results Section */}
            {aiResult && (
              <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-4 animate-fade-in text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700 block mb-1">
                    AI Guidance & Specialist Match
                  </span>
                  <p className="text-teal-950 leading-relaxed font-medium">
                    {aiResult.guidance}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-800 block">
                    Recommended Categories:
                  </span>
                  <div className="flex flex-col gap-2">
                    {aiResult.recommendedSpecializations?.map((spec) => (
                      <button
                        key={spec}
                        type="button"
                        onClick={() => handleSelectSpecialist(spec)}
                        className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-teal-300/80 hover:border-teal-600 hover:shadow-sm text-teal-950 font-semibold transition-all group text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-teal-600" />
                          <span>{spec}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-teal-700 italic border-t border-teal-200/60 pt-2">
                  {aiResult.safetyDisclaimer}
                </p>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
            <p className="text-[11px] text-slate-400">
              DocPulse AI Engine • Safe Healthcare Intelligence
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
