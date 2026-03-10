import React, { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export default function SearchOverlay() {
  const [text, setText] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lat, setLat] = useState(0.3476);
  const [lng, setLng] = useState(32.5825);
  const [noResultsMessage, setNoResultsMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // prompt updated per request
  const fullText = "Looking for something?";
  
  const {
    setSelectedBusiness,
    setSearchResults,
    setCurrentIndex,
    searchResults,
    currentIndex,
  } = useStore();

  useEffect(() => {
    let currentPos = 0;
    // slow down typing a touch for smoother feel
    const interval = setInterval(() => {
      setText(fullText.slice(0, currentPos + 1));
      currentPos++;
      if (currentPos === fullText.length) {
        clearInterval(interval);
        setTimeout(() => {
          setTimeout(() => {
            setShowSearchInput(true);
          }, 1200);
        }, 55);
      }
    }, 60);
    return () => clearInterval(interval);
  }, []);

  // geolocation for search
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => {
        // leave defaults
      }
    );
  }, []);

  // perform search with radius fallback
  useEffect(() => {
    const doSearch = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        setNoResultsMessage('');
        return;
      }

      setIsLoading(true);
      let results = [];
      for (const radius of [5, 10, 20]) {
        const { data, error } = await supabase.rpc('search_items', {
          search_query: searchTerm,
          user_lat: lat,
          user_lng: lng,
          radius_km: radius,
        });
        if (error) {
          console.error('search_items error', error);
          break;
        }
        if (data && data.length > 0) {
          results = data;
          break;
        }
      }

      if (results.length === 0) {
        setNoResultsMessage('Nothing found near you');
      } else {
        setNoResultsMessage('');
      }

      setSearchResults(results);
      setCurrentIndex(0);
      setIsLoading(false);
    };

    const handler = setTimeout(doSearch, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, lat, lng, setSearchResults, setCurrentIndex]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none flex flex-col items-center">
      <AnimatePresence>
        {!showSearchInput && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-screen w-full bg-[#080A0F]/50 backdrop-blur-sm pointer-events-auto"
          >
            <h1 className="text-xl md:text-3xl font-syne font-extrabold text-white tracking-tighter">
              {text}
              <span className="animate-pulse">|</span>
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {showSearchInput && (
        <motion.div 
          layoutId="searchBar"
          initial={{ y: "45vh", scale: 1.2, opacity: 0 }}
          animate={{ y: 80, scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-xl px-4 pointer-events-auto"
        >
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-neutral-500 group-focus-within:text-white transition-colors" />
            </div>
            <input
              type="text"
              autoFocus
              placeholder="Search products or services..."
              className="w-full bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-full py-3 pl-10 pr-4 text-white text-sm font-sans focus:outline-none focus:border-white transition-all shadow-2xl"
              onChange={handleSearchChange}
            />
            
            {/* Results Dropdown */}
            {(searchTerm.length >= 2 && (isLoading || searchResults)) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 w-full bg-neutral-900/95 backdrop-blur-xl border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl max-h-[60vh] overflow-y-auto no-scrollbar"
              >
                {isLoading ? (
                  <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-white" /></div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((res, idx) => (
                    <button
                      key={`${res.business_id}-${res.item_id}`}
                      onClick={() => {
                        setSelectedBusiness(res);
                        setSearchTerm('');
                        setCurrentIndex(idx);
                      }}
                      className="w-full p-4 flex items-center justify-between hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors text-left"
                    >
                      <div>
                        <div className="text-white font-medium">{res.item_name}</div>
                        <div className="text-neutral-500 text-sm">
                          {res.business_name} • {res.sector}
                          {res.distance_km != null && (
                            <span className="ml-2">{res.distance_km.toFixed(1)}km</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono">{res.price ? `UGX ${res.price.toLocaleString()}` : '—'}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-neutral-500 font-sans">
                    {noResultsMessage || 'Nothing found near you'}
                  </div>
                )}

                {/* footer with counter and next */}
                {searchResults.length > 0 && (
                  <div className="p-4 flex justify-between items-center bg-neutral-900/80">
                    <span className="text-neutral-400 text-sm">
                      {currentIndex + 1} of {searchResults.length}
                    </span>
                    <button
                      onClick={() => {
                        if (currentIndex < searchResults.length - 1) {
                          const next = currentIndex + 1;
                          setCurrentIndex(next);
                          setSelectedBusiness(searchResults[next]);
                        }
                      }}
                      className="text-white text-sm font-bold"
                    >
                      Next
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
