import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import { 
  Activity, Users, CreditCard, ShieldAlert, 
  Search, Power, CheckCircle2, XCircle, 
  ChevronDown, ArrowUpRight, Loader2, Calendar
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { session } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Protect Route + verify admin flag
  useEffect(() => {
    if (!session?.user) {
      navigate('/login');
      return;
    }
    // check is_admin using service role key
    supabaseAdmin.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id;
      if (!uid) return;
      supabaseAdmin
        .from('businesses')
        .select('is_admin')
        .eq('id', uid)
        .single()
        .then(({ data, error }) => {
          if (error || !data?.is_admin) {
            navigate('/dashboard');
          }
        });
    });
  }, [session, navigate]);

  // Queries
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      // using service role key
      const [{ data: totalRes }, { data: activeRes }, { data: suspendedRes }, { data: subs }] = await Promise.all([
        supabaseAdmin.from('businesses').select('id', { count: 'exact' }).neq('is_admin', true),
        supabaseAdmin
          .from('businesses')
          .select('id', { count: 'exact' })
          .eq('subscription_status', 'active')
          .neq('is_admin', true),
        supabaseAdmin.from('businesses').select('id', { count: 'exact' }).eq('is_suspended', true),
        supabaseAdmin
          .from('subscriptions')
          .select('amount')
          .gte('paid_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      ]);
      const total = totalRes?.count || 0;
      const active = activeRes?.count || 0;
      const suspended = suspendedRes?.count || 0;
      const revenue = (subs?.data || []).reduce((sum, r) => sum + (r.amount || 0), 0);
      return {
        stats: [
          { id: 'total', label: 'Total businesses', value: total, color: 'text-white' },
          { id: 'active', label: 'Active', value: active, color: 'text-green-500' },
          { id: 'suspended', label: 'Suspended', value: suspended, color: 'text-red-500' },
          { id: 'revenue', label: 'Revenue this month', value: revenue, color: 'text-indigo-400' },
        ]
      };
    }
  });

  const { data: businesses, isLoading: busLoading } = useQuery({
    queryKey: ['admin-businesses'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('businesses')
        .select('*')
        .neq('is_admin', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { results: data };
    }
  });

  const { data: payments, isLoading: payLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*, businesses(name)')
        .order('paid_at', { ascending: false });
      if (error) throw error;
      const results = (data || []).map(r => ({ ...r, business_name: r.businesses.name }));
      const monthlyTotal = results.reduce((sum, r) => {
        const paid = new Date(r.paid_at);
        const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        if (paid >= start) return sum + (r.amount || 0);
        return sum;
      }, 0);
      return { results, monthlyTotal };
    }
  });

  const businessMutation = useMutation({
    mutationFn: async ({ id, changes }) => {
      const { error } = await supabaseAdmin
        .from('businesses')
        .update(changes)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(['admin-businesses', 'admin-stats'])
  });

  if (statsLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#080A0F]">
      <Loader2 className="animate-spin text-white w-12 h-12" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080A0F] text-white font-sans">
      {/* Topbar */}
      <nav className="border-b border-white/5 bg-neutral-900/10 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-2xl font-syne font-extrabold tracking-tighter">TOBLI</Link>
            <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest border border-red-500/20">
              Admin
            </span>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
            Business Dashboard →
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-12">
        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-neutral-900/50 p-1.5 rounded-2xl border border-white/5 w-fit">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Activity size={18}/>} label="Overview" />
          <TabButton active={activeTab === 'businesses'} onClick={() => setActiveTab('businesses')} icon={<Users size={18}/>} label="Businesses" />
          <TabButton active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} icon={<CreditCard size={18}/>} label="Payments" />
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsData.stats.map(stat => (
                <StatCard key={stat.id} {...stat} />
              ))}
            </div>
            {/* Drills Downs (Simple Placeholder) */}
            <div className="bg-neutral-900/50 rounded-[40px] border border-white/5 p-12 text-center">
              <ShieldAlert className="mx-auto text-neutral-700 mb-4" size={48} />
              <h3 className="text-xl font-bold text-neutral-500">Select a card to expand platform analytics</h3>
            </div>
          </div>
        )}

        {activeTab === 'businesses' && (
          busLoading ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32} /></div>
          ) : (
          <div className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
              <input 
                placeholder="Search businesses..." 
                className="w-full bg-neutral-900 border border-white/5 rounded-2xl p-4 pl-12 focus:border-white transition-colors outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="bg-neutral-900/30 rounded-[32px] border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-neutral-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-white/5">
                    <th className="p-6">Business Name</th>
                    <th className="p-6">Status</th>
                    <th className="p-6">Paid Until</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(businesses?.results || []).filter(b => {
                        const term = searchTerm.toLowerCase();
                        return b.name.toLowerCase().includes(term) ||
                               (b.email || '').toLowerCase().includes(term) ||
                               (b.phone || '').toLowerCase().includes(term);
                      }).map(b => (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-6 font-medium">{b.name}</td>
                      <td className="p-6">
                        {b.is_suspended ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-500">
                            Suspended
                          </span>
                        ) : b.subscription_status === 'active' ? (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-green-500/20 text-green-500">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-neutral-500/20 text-neutral-500">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-6 text-sm text-neutral-400 font-mono">
                        {b.subscription_expires_at ? new Date(b.subscription_expires_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-6 text-right flex justify-end gap-2">
                        {/* suspend/unsuspend */}
                        <button
                          onClick={() => businessMutation.mutate({ id: b.id, changes: { is_suspended: !b.is_suspended } })}
                          className={`p-2 rounded-xl border transition-colors ${b.is_suspended ? 'border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white' : 'border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'}`}
                        >
                          {b.is_suspended ? <CheckCircle2 size={18}/> : <ShieldAlert size={18}/>}
                        </button>
                        {/* activate/deactivate */}
                        <button
                          onClick={() => {
                            if (b.subscription_status === 'active') {
                              businessMutation.mutate({ id: b.id, changes: { subscription_status: 'inactive' } });
                            } else {
                              businessMutation.mutate({ id: b.id, changes: { subscription_status: 'active', subscription_expires_at: new Date(new Date().getTime() + 30*24*60*60*1000) } });
                            }
                          }}
                          className={`p-2 rounded-xl border transition-colors ${b.subscription_status === 'active' ? 'border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' : 'border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'}`}
                        >
                          {b.subscription_status === 'active' ? <XCircle size={18}/> : <CheckCircle2 size={18}/>}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
        )}

        {activeTab === 'payments' && (
          payLoading ? (
            <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-white" size={32} /></div>
          ) : (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
               <div>
                 <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-500 mb-1">Total This Month</h2>
                 <p className="text-4xl font-syne font-bold">UGX {(payments?.monthlyTotal || 0).toLocaleString()}</p>
               </div>
               <button
                 onClick={() => {
                   if (!payments?.results) return;
                   const header = ['Business Name','Amount','Paid At','Method','Reference'];
                   const rows = payments.results.map(p => [p.business_name, p.amount, p.paid_at, p.method, p.pesapal_reference]);
                   const csv = [header, ...rows].map(r => r.join(',')).join('\n');
                   const blob = new Blob([csv], { type: 'text/csv' });
                   const url = URL.createObjectURL(blob);
                   const a = document.createElement('a');
                   a.href = url;
                   a.download = 'payments.csv';
                   a.click();
                   URL.revokeObjectURL(url);
                 }}
                 className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-neutral-200 transition-colors"
               >
                 Export CSV
               </button>
            </div>
            <div className="bg-neutral-900/30 rounded-[32px] border border-white/5 overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-neutral-500 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-white/5">
                    <th className="p-6">Business</th>
                    <th className="p-6">Amount</th>
                    <th className="p-6">Date</th>
                    <th className="p-6">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(payments?.results || []).map(p => (
                    <tr key={p.id}>
                      <td className="p-6 font-medium">{p.business_name}</td>
                      <td className="p-6 font-mono text-indigo-400">UGX {p.amount.toLocaleString()}</td>
                      <td className="p-6 text-xs text-neutral-400">{new Date(p.paid_at).toLocaleString()}</td>
                      <td className="p-6 text-[10px] font-mono text-neutral-600 uppercase tracking-tighter">{p.pesapal_reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${active ? 'bg-white text-black font-bold' : 'text-neutral-500 hover:text-white'}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-neutral-900 border border-white/5 p-8 rounded-[32px] hover:border-white/20 transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-4">
        <div className="text-neutral-500 text-[10px] uppercase font-black tracking-widest">{label}</div>
        <ChevronDown size={14} className="text-neutral-700 group-hover:text-white transition-colors" />
      </div>
      <div className={`text-3xl font-syne font-black ${color}`}>{value}</div>
    </div>
  );
}
