import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set) => ({
  session: null,
  business: null,
  isAdmin: false,
  loading: true,

  loadSession: async () => {
    set({ loading: true });
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('loadSession:', error);
    }

    set({ session });

    if (session?.user) {
      const { data, error: errB } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (errB) console.error('loadSession business fetch:', errB);
      if (data) {
        set({ business: data, isAdmin: data.is_admin || false });
      }
    }

    set({ loading: false });
  },

  signUp: async (name, owner_name, sector, phone, email, password) => {
    const {
      data: { user },
      error,
    } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    await supabase.from('businesses').insert({
      id: user.id,
      name,
      owner_name,
      sector,
      phone,
      email,
      subscription_status: 'inactive',
      is_open: false,
      is_admin: false,
      is_suspended: false,
    });

    return user;
  },

  signIn: async (email, password) => {
    const {
      data: { session },
      error,
    } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    set({ session, loading: true });

    const { data, error: errB } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', session.user.id)
      .single();
    if (errB) {
      console.error('signIn business fetch:', errB);
    }
    if (data) {
      set({ business: data, isAdmin: data.is_admin || false });
    }

    set({ loading: false });
    return session;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, business: null, isAdmin: false });
  },
}));

// keep session in sync with Supabase auth state
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.setState({ session });
  if (session?.user) {
    supabase
      .from('businesses')
      .select('*')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          useAuthStore.setState({ business: data, isAdmin: data.is_admin || false });
        }
      });
  } else {
    useAuthStore.setState({ business: null, isAdmin: false });
  }
});
