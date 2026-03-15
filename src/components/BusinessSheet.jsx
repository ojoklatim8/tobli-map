import React from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Instagram, Navigation, Send, Twitter, ExternalLink, Loader2, Tag, CheckCircle2, Sparkles, MessageCircle, Globe, ChevronRight } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useQuery } from '@tanstack/react-query';

export default function BusinessSheet() {
  const { selectedBusiness, setSelectedBusiness, searchResults, userLocation, currentIndex, setCurrentIndex } = useStore();

  const { data: _details, isLoading: _isLoading } = useQuery({
    queryKey: ['business-details', selectedBusiness?.business_id || selectedBusiness?.id],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${selectedBusiness.business_id}`);
      return res.json();
    },
    enabled: !!selectedBusiness?.business_id,
  });

  if (!selectedBusiness) return null;

  const business = {
    business_name: selectedBusiness.business_name || selectedBusiness.name,
    sector: selectedBusiness.sector,
    description: selectedBusiness.description,
    whatsapp: selectedBusiness.whatsapp,
    phone: selectedBusiness.phone,
    instagram: selectedBusiness.instagram,
    x_handle: selectedBusiness.x_handle,
    website: selectedBusiness.website,
    lat: selectedBusiness.lat,
    lng: selectedBusiness.lng,
  };
  
  const product_name = selectedBusiness.item_name;
  const product_price = selectedBusiness.price;
  const alternativesCount = Math.max(0, searchResults.length - 1);


  return (
    <AnimatePresence>
      {selectedBusiness && (
        <Motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 inset-x-0 z-[2000] bg-neutral-900/95 backdrop-blur-2xl border-t border-neutral-800 rounded-t-[32px] max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl"
        >
          <div className="sticky top-0 p-6 pb-2 bg-neutral-900/50 backdrop-blur-md flex justify-between items-start z-10">
            <div>
              <h2 className="text-xl font-syne font-bold tracking-tight text-white mb-1">
                {product_name || "Offer"}
              </h2>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-lg text-indigo-400">
                  {product_price ? `UGX ${product_price.toLocaleString()}` : 'Price on request'}
                </span>
              </div>
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-sans uppercase tracking-widest text-neutral-400 inline-block">
                {business.business_name}
              </div>
            </div>
            <button 
              onClick={() => setSelectedBusiness(null)}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="px-6 pb-12 pt-4">
            <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-3">Contact Provider</h3>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-xl font-sans font-bold text-sm hover:bg-neutral-200 transition-colors">
                  <Phone size={16} /> Call
                </a>
              )}
              {business.whatsapp && (
                <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-xl font-sans font-bold text-sm hover:opacity-90 transition-opacity">
                  <Send size={16} /> WhatsApp
                </a>
              )}
              {business.instagram && (
                <a href={`https://instagram.com/${business.instagram}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white py-2.5 rounded-xl font-sans font-bold text-sm hover:opacity-90 transition-opacity">
                  <Instagram size={16} /> Insta
                </a>
              )}
              {business.x_handle && (
                <a href={`https://x.com/${business.x_handle}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-black border border-white/10 text-white py-2.5 rounded-xl font-sans font-bold text-sm hover:bg-neutral-900 transition-colors">
                  <Twitter size={16} /> X
                </a>
              )}
              {business.website && (
                <a href={business.website.startsWith('http') ? business.website : `https://${business.website}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[100px] flex items-center justify-center gap-2 bg-neutral-800 text-white py-2.5 rounded-xl font-sans font-bold text-sm hover:bg-neutral-700 transition-colors">
                  <Globe size={16} /> Web
                </a>
              )}
            </div>

            <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-3">Location & Routing</h3>
            <div className="flex gap-3 mb-8">
              {(business.lat != null && business.lng != null && userLocation) && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${business.lat},${business.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white py-3 rounded-xl font-sans font-bold text-sm hover:bg-white/10 transition-colors"
                >
                  <Navigation size={18} /> Get Directions
                </a>
              )}
            </div>

            {/* Alternative Cycling */}
            {alternativesCount > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-bold text-sm">Next Best Alternative</div>
                    <div className="text-neutral-500 text-xs mt-0.5">{alternativesCount} other option{alternativesCount > 1 ? 's' : ''} nearby</div>
                  </div>
                  <button
                    onClick={() => {
                      if (currentIndex < searchResults.length - 1) {
                        const next = currentIndex + 1;
                        setCurrentIndex(next);
                        setSelectedBusiness(searchResults[next]);
                      } else {
                        // Loop back to start
                        setCurrentIndex(0);
                        setSelectedBusiness(searchResults[0]);
                      }
                    }}
                    className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold text-xs hover:bg-neutral-200 transition-colors"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
