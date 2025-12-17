import React, { useState, useEffect } from 'react';
import { Search, MapPin, Award, ArrowRight, X, Phone, Star, CheckCircle, Navigation } from 'lucide-react';
import { Doctor } from '../types';
import { fetchDoctors } from '../services/apiService';

interface PublicViewProps {
  onLoginRequest: () => void;
}

export const PublicView: React.FC<PublicViewProps> = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const [filters, setFilters] = useState({
    search: '',
    state: '',
    specialization: '',
    hospital: ''
  });

  useEffect(() => {
    // Fetch doctors (pass location if available to sort by distance)
    fetchDoctors(userLocation || undefined).then(setDoctors);
  }, [userLocation]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocationStatus('loading');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationStatus('success');
      },
      (error) => {
        console.error("Error getting location:", error);
        setLocationStatus('error');
        // Fallback or alert
      }
    );
  };

  const filteredDoctors = doctors.filter(doc => {
    return (
      (filters.search === '' || doc.name.toLowerCase().includes(filters.search.toLowerCase()) || doc.hospital.toLowerCase().includes(filters.search.toLowerCase())) &&
      (filters.state === '' || doc.location.state === filters.state) &&
      (filters.specialization === '' || doc.specialization === filters.specialization) &&
      (filters.hospital === '' || doc.hospital === filters.hospital)
    );
  });

  // Extract unique values for filters
  const states = Array.from(new Set(doctors.map(d => d.location.state)));
  const specs = Array.from(new Set(doctors.map(d => d.specialization)));
  const hospitals = Array.from(new Set(doctors.map(d => d.hospital)));

  return (
    <div className="pb-12">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Find the Right Care, Right Now.
          </h1>
          <p className="text-primary-100 text-lg md:text-xl max-w-2xl mx-auto">
            Search top-rated doctors, clinics, and hospitals verified by leading insurance providers.
          </p>
          
          <div className="relative max-w-2xl mx-auto mt-8 flex flex-col md:flex-row gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search doctors, hospitals, or specialties..."
                className="w-full py-4 pl-12 pr-4 rounded-full md:rounded-r-none md:rounded-l-full text-slate-800 shadow-lg focus:outline-none focus:ring-4 focus:ring-primary-500/30 transition-shadow"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
            </div>
            
            <button 
              onClick={handleGetLocation}
              className={`flex items-center justify-center gap-2 px-6 py-4 rounded-full md:rounded-l-none md:rounded-r-full font-medium shadow-lg transition-all ${
                locationStatus === 'success' 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
               {locationStatus === 'loading' ? (
                 <span>Locating...</span>
               ) : locationStatus === 'success' ? (
                 <>
                   <CheckCircle size={20} /> Near Me
                 </>
               ) : (
                 <>
                   <Navigation size={20} /> Use My Location
                 </>
               )}
            </button>
          </div>
          {locationStatus === 'success' && (
             <p className="text-sm text-emerald-200 animate-fadeIn">
               Showing doctors sorted by distance to your current location.
             </p>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <span className="font-semibold text-slate-700 whitespace-nowrap">Filter By:</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <select 
                className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border"
                value={filters.state}
                onChange={(e) => setFilters({...filters, state: e.target.value})}
              >
                <option value="">All States</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border">
                 <option value="">Any Area</option>
                 <option value="downtown">Downtown</option>
                 <option value="suburbs">Suburbs</option>
              </select>

              <select 
                className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border"
                value={filters.specialization}
                onChange={(e) => setFilters({...filters, specialization: e.target.value})}
              >
                <option value="">All Specialists</option>
                {specs.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select 
                className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border"
                value={filters.hospital}
                onChange={(e) => setFilters({...filters, hospital: e.target.value})}
              >
                <option value="">All Hospitals</option>
                {hospitals.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Top Rated Doctors</h2>
          <span className="text-slate-500">{filteredDoctors.length} results found</span>
        </div>

        {filteredDoctors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDoctors.map(doctor => (
              <div 
                key={doctor.id} 
                onClick={() => setSelectedDoctor(doctor)}
                className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-lg hover:border-primary-200 transition-all cursor-pointer group flex flex-col"
              >
                <div className="p-6 flex flex-col items-center text-center flex-grow">
                  <div className="relative mb-4">
                    <img src={doctor.imageUrl} alt={doctor.name} className="w-24 h-24 rounded-full object-cover border-4 border-slate-50 group-hover:border-primary-50 transition-colors" />
                    {doctor.isVerified && (
                      <div className="absolute bottom-0 right-0 bg-secondary-500 text-white p-1 rounded-full shadow-sm" title="Verified">
                        <CheckCircle size={14} fill="currentColor" className="text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{doctor.name}</h3>
                  <p className="text-primary-600 font-medium text-sm mb-2">{doctor.specialization}</p>
                  <p className="text-slate-500 text-sm mb-4 line-clamp-1">{doctor.hospital}</p>
                  
                  {/* Distance badge if location is active and distance is calculated */}
                  {(doctor as any).distance && (doctor as any).distance < 10000 && (
                    <div className="mb-3 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium flex items-center gap-1">
                      <MapPin size={10} />
                      {Math.round((doctor as any).distance)} km away
                    </div>
                  )}

                  <div className="flex items-center space-x-1 bg-amber-50 px-2 py-1 rounded text-amber-700 text-sm font-semibold mt-auto">
                    <Star size={14} fill="currentColor" />
                    <span>{doctor.rating}</span>
                    <span className="text-amber-400 font-normal">({doctor.reviewCount})</span>
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center rounded-b-xl">
                  <span className="text-xs text-slate-500 flex items-center">
                    <MapPin size={12} className="mr-1" /> {doctor.location.city}
                  </span>
                  <span className="text-primary-600 text-sm font-medium flex items-center group-hover:translate-x-1 transition-transform">
                    View <ArrowRight size={14} className="ml-1" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-500 text-lg">No doctors found matching your filters.</p>
            <button 
              onClick={() => setFilters({ search: '', state: '', specialization: '', hospital: '' })}
              className="mt-4 text-primary-600 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Doctor Profile Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="relative">
              <button 
                onClick={() => setSelectedDoctor(null)}
                className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full text-slate-500 hover:text-red-500 transition-colors z-10"
              >
                <X size={24} />
              </button>
              
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 h-40 rounded-t-2xl"></div>
              
              <div className="px-8 pb-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="-mt-16 flex-shrink-0">
                    <img 
                      src={selectedDoctor.imageUrl} 
                      alt={selectedDoctor.name} 
                      className="w-32 h-32 rounded-xl object-cover border-4 border-white shadow-lg"
                    />
                  </div>
                  
                  <div className="pt-4 flex-grow">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-bold text-slate-900">{selectedDoctor.name}</h2>
                          {selectedDoctor.isVerified && <CheckCircle className="text-secondary-500" size={20} fill="currentColor" stroke="white" />}
                        </div>
                        <p className="text-lg text-primary-600 font-medium">{selectedDoctor.specialization}</p>
                        <p className="text-slate-600 flex items-center mt-1">
                          <Award size={16} className="mr-1" /> {selectedDoctor.hospital}
                        </p>
                      </div>
                      <div className="mt-4 md:mt-0 flex gap-3">
                        <button className="flex items-center px-4 py-2 bg-primary-50 text-primary-700 rounded-lg font-medium hover:bg-primary-100">
                          <Phone size={18} className="mr-2" /> {selectedDoctor.contact}
                        </button>
                        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 shadow-md">
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
                  <div className="col-span-2 space-y-8">
                    <section>
                      <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2">About & Treatments</h3>
                      <p className="text-slate-600 mb-4 leading-relaxed">
                        Dr. {selectedDoctor.name.split(' ')[1]} is a highly experienced {selectedDoctor.specialization.toLowerCase()} with over 15 years of practice. 
                        Dedicated to providing comprehensive care using the latest medical technologies.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDoctor.treatments.map(t => (
                          <span key={t} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-lg font-bold text-slate-900 mb-3 border-b pb-2">Reviews</h3>
                       <div className="bg-amber-50 p-4 rounded-lg flex items-center gap-4">
                          <div className="text-4xl font-bold text-amber-500">{selectedDoctor.rating}</div>
                          <div>
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < Math.floor(selectedDoctor.rating) ? "currentColor" : "none"} />)}
                            </div>
                            <p className="text-amber-800 text-sm font-medium mt-1">Based on {selectedDoctor.reviewCount} patient reviews</p>
                          </div>
                       </div>
                    </section>
                  </div>

                  <div className="col-span-1 space-y-6">
                    <section>
                       <h3 className="text-lg font-bold text-slate-900 mb-3">Location</h3>
                       <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-600 space-y-2">
                          <p className="font-semibold text-slate-800">{selectedDoctor.location.address}</p>
                          <p>{selectedDoctor.location.town}, {selectedDoctor.location.city}</p>
                          <p>{selectedDoctor.location.state}</p>
                       </div>
                       {/* Map Placeholder */}
                       <div className="bg-slate-200 h-48 rounded-lg mt-4 flex items-center justify-center relative overflow-hidden group">
                          <MapPin size={32} className="text-slate-400 mb-2" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                             <span className="text-xs font-semibold text-slate-700 bg-white px-2 py-1 rounded shadow-sm">View on Maps</span>
                          </div>
                       </div>
                    </section>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};