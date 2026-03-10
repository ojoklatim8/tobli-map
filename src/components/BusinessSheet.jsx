import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { X, Phone, Instagram, Send, ExternalLink, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../store/useStore';

export default function BusinessSheet() {
  const { selectedBusiness, setSelectedBusiness, searchResults, userLocation } = useStore();

  useQuery({
    queryKey: ['business-details', selectedBusiness?.business_id],
    queryFn: async () => {
      const res = await fetch(`/api/businesses/${selectedBusiness.business_id}`);
      return res.json();
    },
    enabled: !!selectedBusiness?.business_id,
  });

  if (!selectedBusiness) return null;

  // construct business info from selectedBusiness (which came from search_results)
  const business = {
    business_name: selectedBusiness.business_name || selectedBusiness.name,
    sector: selectedBusiness.sector,
    description: selectedBusiness.description,
    whatsapp: selectedBusiness.whatsapp,
    phone: selectedBusiness.phone,
    instagram: selectedBusiness.instagram,
    x_handle: selectedBusiness.x_handle,
    lat: selectedBusiness.lat,
    lng: selectedBusiness.lng,
  };

  // all items matching this business from the last search
  const items = searchResults
    .filter((r) => r.business_id === selectedBusiness.business_id)
    .map((r) => ({ id: r.item_id, name: r.item_name, type: r.type, price: r.price }));

  return (
    <AnimatePresence>
      {selectedBusiness && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 inset-x-0 z-[2000] bg-neutral-900/95 backdrop-blur-2xl border-t border-neutral-800 rounded-t-[32px] max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl"
        >
          <div className="sticky top-0 p-6 pb-2 bg-neutral-900/50 backdrop-blur-md flex justify-between items-start z-10">
            <div>
              <h2 className="text-xl font-syne font-bold tracking-tight text-white mb-1">
                {business.business_name || business.name}
              </h2>
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-sans uppercase tracking-widest text-neutral-400">
                {business.sector}
              </span>
            </div>
            <button 
              onClick={() => setSelectedBusiness(null)}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="px-6 pb-12">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 my-6">
              {business.phone && (
                <a href={`tel:${business.phone}`} className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-sans font-bold text-sm hover:bg-neutral-200 transition-colors">
                  <Phone size={18} /> Call
                </a>
              )}
              {business.whatsapp && (
                <a href={`https://wa.me/${business.whatsapp}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-xl font-sans font-bold text-sm hover:opacity-90 transition-opacity">
                  <Send size={18} /> WhatsApp
                </a>
              )}
              {(business.lat != null && business.lng != null && userLocation) && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${business.lat},${business.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-sans font-bold text-sm hover:bg-neutral-200 transition-colors"
                >
                  <ExternalLink size={18} /> Directions
                </a>
              )}
            </div>

            {/* Socials */}
            {(business.instagram || business.x_handle) && (
              <div className="flex gap-4 mb-8">
                {business.instagram && (
                  <a href={`https://instagram.com/${business.instagram}`} target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <Instagram size={18} className="text-white" />
                  </a>
                )}
                {business.x_handle && (
                  <a href={`https://x.com/${business.x_handle}`} target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
              </div>
            )}

            {/* Items List */}
            <div className="space-y-4">
              <h3 className="font-syne text-xl font-bold text-white/50 uppercase tracking-widest text-sm">Offerings</h3>
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                      <div className="text-white font-medium mb-1 font-sans">{item.name}</div>
                      <div className="text-neutral-500 text-xs uppercase tracking-tighter">{item.type}</div>
                    </div>
                    <div className="text-white font-mono font-medium">
                      {item.price ? `UGX ${item.price.toLocaleString()}` : 'Contact for price'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-neutral-600 italic font-sans">No items listed yet</div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
