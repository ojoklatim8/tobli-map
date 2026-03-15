import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { 
  BarChart3, List, Settings, CreditCard, 
  MapPin, Power, Plus, Upload, Trash2, 
  Save, Eye, CheckCircle2, AlertTriangle,
  Loader2, X, Phone, Globe, Instagram, Send
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session, business, loading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !session?.user) {
      navigate('/login');
    }
  }, [session, authLoading, navigate]);

  // Fetch Business Data from authStore (already loaded)
  const businessLoading = authLoading;

  // Fetch Listings via Supabase
  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('business_id', business.id);
      if (error) throw error;
      return { results: data };
    },
    enabled: !!business?.id
  });

  // Mutations
  const { signOut } = useAuthStore();
  const toggleOpen = useMutation({
    mutationFn: async () => {
      const newVal = !business.is_open;
      const { error } = await supabase
        .from('businesses')
        .update({ is_open: newVal, updated_at: new Date() })
        .eq('id', business.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-business']);
    }
  });

  if (businessLoading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#080A0F]">
      <Loader2 className="animate-spin text-white w-12 h-12" />
    </div>
  );
  if (!business) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#080A0F] text-white flex-col gap-4">
      <Loader2 className="animate-spin w-12 h-12" />
      <p className="text-neutral-400">No business found. Please contact support.</p>
    </div>
  );

  const isSubActive = business.subscription_status === 'active';

  return (
    <div className="min-h-screen bg-[#080A0F] text-white font-sans flex flex-col">
      {/* Topbar */}
      <header className="border-b border-white/5 bg-neutral-900/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Top Left: Business Name */}
          <div className="text-xl font-syne font-extrabold tracking-tighter text-white">
            {business.name}
          </div>
          
          <div className="flex items-center gap-6">
            {/* Top Center/Right: Colored Toggle */}
            <div className="flex items-center gap-2 bg-neutral-900/50 p-1 rounded-full border border-white/5">
              <span className={`text-[9px] uppercase font-bold tracking-widest pl-2 ${business.is_open ? 'text-green-500' : 'text-neutral-500'}`}>
                {business.is_open ? 'Open' : 'Closed'}
              </span>
              <button 
                onClick={() => toggleOpen.mutate()}
                className={`w-10 h-5 rounded-full relative transition-colors ${business.is_open ? 'bg-green-500' : 'bg-neutral-800'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${business.is_open ? 'left-5.5' : 'left-0.5'}`} />
              </button>
            </div>
            
            {/* Far Top Right: Logout */}
            <button 
              onClick={() => signOut()} 
              className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition-colors font-bold text-xs uppercase"
            >
              <Power size={14} /> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Subscription Notice */}
      {!isSubActive && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 py-3 text-center text-sm font-medium px-6">
          <AlertTriangle size={16} className="inline mr-2" />
          Subscription inactive. Your business is hidden from search results. 
          <button onClick={() => setActiveTab('subscription')} className="underline ml-2 font-bold">Renew Access</button>
        </div>
      )}

      {/* Dashboard Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'listings', label: 'Listings', icon: List },
            { id: 'info', label: 'Business Info', icon: Settings },
            { id: 'subscription', label: 'Subscription', icon: CreditCard },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${activeTab === tab.id ? 'bg-white text-black font-bold' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <section className="flex-1 bg-neutral-900/30 rounded-[32px] border border-white/5 p-8 relative min-h-[600px]">
          {activeTab === 'overview' && <OverviewTab business={business} listingsCount={listings?.results?.length || 0} />}
          {activeTab === 'listings' && <ListingsTab listings={listings?.results || []} loading={listingsLoading} queryClient={queryClient} />}
          {activeTab === 'info' && <InfoTab business={business} queryClient={queryClient} />}
          {activeTab === 'subscription' && <SubscriptionTab business={business} />}
        </section>
      </main>
    </div>
  );
}

function OverviewTab({ business, listingsCount }) {
  return (
    <div className="space-y-8">
      <h2 className="text-xl font-syne font-bold">Performance Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-neutral-900 border border-white/5 p-6 rounded-3xl">
          <div className="text-neutral-500 text-xs uppercase tracking-widest font-bold mb-2">Subscription</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${business.subscription_status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xl font-bold">{business.subscription_status === 'active' ? 'Active' : 'Expired'}</span>
          </div>
        </div>

        <div className="bg-neutral-900 border border-white/5 p-6 rounded-3xl">
          <div className="text-neutral-500 text-xs uppercase tracking-widest font-bold mb-2">Status</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${business.is_open ? 'bg-green-500' : 'bg-neutral-500'}`} />
            <span className="text-xl font-bold">{business.is_open ? 'Open' : 'Closed'}</span>
          </div>
        </div>
        
        <div className="bg-neutral-900 border border-white/5 p-6 rounded-3xl">
          <div className="text-neutral-500 text-xs uppercase tracking-widest font-bold mb-2">Goods / Services</div>
          <div className="text-2xl font-syne font-bold">{listingsCount}</div>
        </div>

        <div className="bg-neutral-900 border border-white/5 p-6 rounded-3xl">
          <div className="text-neutral-500 text-xs uppercase tracking-widest font-bold mb-2">Map Appearances</div>
          <div className="text-2xl font-syne font-bold font-mono">248</div>
        </div>
      </div>
    </div>
  );
}

function CheckBox({ isChecked }) {
  return (
    <div className={`w-3 h-3 rounded-full ${isChecked ? 'bg-green-500' : 'bg-neutral-700'}`} />
  );
}

function ListingsTab({ listings, loading, queryClient }) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'product', price: '', available: true });
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const addMutation = useMutation({
    mutationFn: async (data) => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      const { error } = await supabase
        .from('items')
        .insert([{ business_id: uid, ...data }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-listings']);
      setShowAdd(false);
      setFormData({ name: '', type: 'product', price: '', available: true });
    }
  });

  const toggleStatus = useMutation({
    mutationFn: async ({ id, key }) => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      const update = {};
      update[key] = true; // value doesn't matter, we will flip server side
      // We'll fetch current value and flip
      const { data: item, error: fetchErr } = await supabase
        .from('items')
        .select(key)
        .eq('id', id)
        .eq('business_id', uid)
        .single();
      if (fetchErr) throw fetchErr;
      const newVal = !item[key];
      const { error } = await supabase
        .from('items')
        .update({ [key]: newVal })
        .eq('id', id)
        .eq('business_id', uid);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['my-listings'])
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id)
        .eq('business_id', uid);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['my-listings'])
  });

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      setIsBulkLoading(true);
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      
      // prepare rows with defaults
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      const rows = json.map(r => ({
        business_id: uid,
        name: r['Item Name'] || r.name || '',
        price: r['Price'] || r.price || null,
        type: r['Type'] || r.type || null,
        available: true,
      }));
      const { error } = await supabase.from('items').insert(rows);
      if (error) console.error('bulk insert error', error);
      queryClient.invalidateQueries(['my-listings']);
      setIsBulkLoading(false);
    };
    reader.readAsArrayBuffer(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } });

  const exportTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { 'Item Name': 'Example Product', 'Type': 'product', 'Price': 50000 },
      { 'Item Name': 'Example Service', 'Type': 'service', 'Price': 150000 }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Tobli_Listings_Template.xlsx');
  };

  const filteredListings = listings.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32}/></div>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-syne font-bold">Listings</h2>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search listings..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-neutral-800 border-none rounded-2xl px-4 py-2 text-sm w-full md:w-48"
          />
          <button onClick={exportTemplate} className="bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-full font-bold text-xs transition-colors">
            Export Template
          </button>
          <div {...getRootProps()} className="cursor-pointer bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-full flex items-center gap-2 font-bold text-xs transition-colors">
            <input {...getInputProps()} />
            {isBulkLoading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} Upload Excel
          </div>
          <button onClick={() => setShowAdd(true)} className="bg-white text-black px-4 py-2 rounded-full flex items-center gap-2 font-bold text-xs hover:bg-neutral-200 transition-colors">
            <Plus size={16} /> Add Listing
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 mb-8 animate-in slide-in-from-top-4">
          <div className="flex justify-between mb-6">
            <h3 className="font-bold">New Offering</h3>
            <button onClick={() => setShowAdd(false)}><X size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <input placeholder="Name" className="bg-neutral-800 border-none rounded-2xl p-4" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <select className="bg-neutral-800 border-none rounded-2xl p-4" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
              <option value="product">Product</option>
              <option value="service">Service</option>
            </select>
            <input placeholder="Price (UGX)" className="bg-neutral-800 border-none rounded-2xl p-4 font-mono" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            <button onClick={() => addMutation.mutate(formData)} className="bg-white text-black font-bold rounded-2xl p-4">Add →</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left">
          <thead>
            <tr className="text-neutral-500 text-xs uppercase tracking-widest border-b border-white/5">
              <th className="pb-4 font-bold">Name</th>
              <th className="pb-4 font-bold">Type</th>
              <th className="pb-4 font-bold text-right">Price</th>
              <th className="pb-4 font-bold text-center">Available</th>
              <th className="pb-4 font-bold text-center">Featured</th>
              <th className="pb-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredListings.length > 0 ? (
              filteredListings.map(item => (
                <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4 font-medium">{item.name}</td>
                  <td className="py-4 text-sm text-neutral-400 uppercase tracking-tighter">{item.type}</td>
                  <td className="py-4 text-right font-mono text-white/80">UGX {item.price?.toLocaleString()}</td>
                  <td className="py-4 text-center">
                    <button onClick={() => toggleStatus.mutate({ id: item.id, key: 'available' })} className={`w-8 h-4 rounded-full relative ${item.available ? 'bg-green-500' : 'bg-neutral-800'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${item.available ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="py-4 text-center">
                    <button onClick={() => toggleStatus.mutate({ id: item.id, key: 'featured' })} className={`w-8 h-4 rounded-full relative ${item.featured ? 'bg-indigo-500' : 'bg-neutral-800'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${item.featured ? 'left-4.5' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="py-4 text-right pr-4">
                    <button onClick={() => deleteMutation.mutate(item.id)} className="text-neutral-500 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-8 text-center text-neutral-500">No items found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InfoTab({ business, queryClient }) {
  const [form, setForm] = useState({ ...business });
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setForm({ ...business });
  }, [business]);
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState(null);

  const update = useMutation({
    mutationFn: async (data) => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      const { error } = await supabase
        .from('businesses')
        .update({ ...data, updated_at: new Date() })
        .eq('id', uid);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      setMsg('Saved successfully');
      queryClient.invalidateQueries(['my-business']);
    },
    onError: (e) => {
      setMsg(e.message);
    }
  });

  const getGeo = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      setForm({ ...form, lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  const changePassword = async () => {
    setPwdMsg(null);
    if (newPwd !== confirmPwd) {
      setPwdMsg('Passwords do not match');
      return;
    }
    try {
      const { data: session } = await supabase.auth.getSession();
      const email = session?.user?.email;
      // verify current password
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password: currentPwd });
      if (signErr) throw signErr;
      const { error: updErr } = await supabase.auth.updateUser({ password: newPwd });
      if (updErr) throw updErr;
      setPwdMsg('Password updated');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (e) {
      setPwdMsg(e.message);
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-syne font-bold">Business Info</h2>
        <button onClick={() => update.mutate(form)} className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-neutral-200 flex items-center gap-2">
          <Save size={16} /> Save Changes
        </button>
      </div>
      {msg && <div className="text-sm text-green-500 mt-2">{msg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Identity</h3>
          <div className="space-y-4">
            <InputField label="Public Business Name" value={form.name} onChange={v => setForm({...form, name: v})} />
            <InputField label="Owner / Manager" value={form.owner_name} onChange={v => setForm({...form, owner_name: v})} />
            <div>
              <label className="block text-xs uppercase text-neutral-500 font-bold mb-2 ml-1">Bio / Description</label>
              <textarea 
                className="w-full bg-neutral-900 border border-white/5 rounded-2xl p-4 font-sans text-sm focus:border-white focus:outline-none h-24"
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Links & Contact</h3>
          <div className="space-y-4">
            <InputField label="WhatsApp (e.g. 256...)" value={form.whatsapp} onChange={v => setForm({...form, whatsapp: v})} icon={<Send size={16}/>} />
            <InputField label="Phone Number" value={form.phone} onChange={v => setForm({...form, phone: v})} icon={<Phone size={16}/>} />
            <InputField label="Instagram User" value={form.instagram} onChange={v => setForm({...form, instagram: v})} icon={<Instagram size={16}/>} />
            <InputField label="X / Twitter" value={form.x_handle} onChange={v => setForm({...form, x_handle: v})} />
            <InputField label="Website (e.g. example.com)" value={form.website} onChange={v => setForm({...form, website: v})} icon={<Globe size={16}/>} />
          </div>
        </div>
      </div>

      <div className="bg-neutral-900 p-8 rounded-[32px] border border-white/5">
        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-6 font-syne">Pinned Location</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-black p-4 rounded-xl font-mono text-sm text-neutral-400">
            {form.lat?.toFixed(4)}, {form.lng?.toFixed(4)}
          </div>
          <button onClick={getGeo} className="bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-colors flex items-center gap-2">
            <MapPin size={18} /> Pin Current Location
          </button>
        </div>
      </div>

      {/* password change section */}
      <div className="mt-12 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">Change Password</h3>
        {pwdMsg && <div className="text-sm text-red-500">{pwdMsg}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="password"
            placeholder="Current password"
            className="bg-neutral-900 border border-white/5 rounded-2xl p-4"
            value={currentPwd}
            onChange={e => setCurrentPwd(e.target.value)}
          />
          <input
            type="password"
            placeholder="New password"
            className="bg-neutral-900 border border-white/5 rounded-2xl p-4"
            value={newPwd}
            onChange={e => setNewPwd(e.target.value)}
          />
          <input
            type="password"
            placeholder="Confirm new password"
            className="bg-neutral-900 border border-white/5 rounded-2xl p-4"
            value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
          />
        </div>
        <button onClick={changePassword} className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-neutral-200 transition-colors">
          Change Password
        </button>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, icon }) {
  return (
    <div>
      <label className="block text-xs uppercase text-neutral-500 font-bold mb-2 ml-1">{label}</label>
      <div className="relative">
        <input 
          type="text"
          className="w-full bg-neutral-900 border border-white/5 rounded-2xl p-4 pl-12 font-sans text-sm focus:border-white focus:outline-none"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
        <div className="absolute left-4 inset-y-0 flex items-center text-neutral-600">
          {icon || <Globe size={16} />}
        </div>
      </div>
    </div>
  );
}

function SubscriptionTab({ business }) {
  const { data: subscription } = useQuery({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('business_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!business
  });

  const record = subscription || business;
  const isExpired = record.subscription_expires_at && new Date(record.subscription_expires_at) < new Date();

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-syne font-bold">Subscription</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-neutral-900 border border-white/5 p-8 rounded-[32px] space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-neutral-500 text-xs uppercase tracking-widest font-bold mb-1">Current Plan</div>
              <h3 className="text-2xl font-bold">Premium Early Access</h3>
            </div>
            <div className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isExpired ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
              {record.subscription_status}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
            <div>
              <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">Last Payment</div>
              <div className="font-mono text-sm">{record.paid_at ? new Date(record.paid_at).toLocaleDateString() : new Date(record.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest mb-1">Expires On</div>
              <div className="font-mono text-sm">{record.expires_at ? new Date(record.expires_at).toLocaleDateString() : 'N/A'}</div>
            </div>
          </div>

          <button
            onClick={() => window.alert('Online renewals will be available soon. Please contact support to renew your subscription.')}
            className="w-full bg-white text-black font-extrabold py-3.5 rounded-xl hover:bg-neutral-200 transition-colors text-sm"
          >
            Renew / Extend Subscription
          </button>
        </div>

        <div className="bg-white/5 p-8 rounded-[32px] border border-dashed border-white/10 flex flex-col justify-center items-center text-center">
          <CreditCard size={48} className="text-neutral-600 mb-4" />
          <h4 className="font-bold text-neutral-400">Payment History coming soon.</h4>
          <p className="text-xs text-neutral-600 max-w-[200px] mt-2">All transactions are securely processed via Pesapal.</p>
        </div>
      </div>
    </div>
  );
}
