import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Loader2, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { safeFetch } from '../lib/api';

export default function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch("password");

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await safeFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: data.business_name,
          owner_name: data.owner_name,
          sector: data.business_type,
          phone: data.phone,
          email: data.email,
          password: data.password
        }),
      });

      // Navigate to early-access with form data as state
      navigate('/early-access', { state: { ...data, ...result } });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080A0F] text-white font-sans flex flex-col">
      {/* Topbar */}
      <div className="p-6 flex justify-between items-center">
        <Link to="/" className="text-xl font-syne font-extrabold tracking-tighter text-white">
          TOBLI
        </Link>
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-neutral-900/40 backdrop-blur-xl border border-neutral-800 p-8 md:p-12 rounded-[32px]">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-syne font-bold mb-2 tracking-tight">Create your business account</h1>
            <p className="text-neutral-500">Join the premium business network.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Business Name</label>
                <input
                  {...register('business_name', { required: 'Required' })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="Enter business name"
                />
                {errors.business_name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.business_name.message}</p>}
              </div>

              {/* Owner's Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Owner's Name</label>
                <input
                  {...register('owner_name', { required: 'Required' })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="Full name"
                />
                {errors.owner_name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.owner_name.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Business Type</label>
                <select
                  {...register('business_type', { required: 'Required' })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors appearance-none cursor-pointer"
                >
                  <option value="">Select Category</option>
                  <option value="Goods">Goods</option>
                  <option value="Services">Services</option>
                  <option value="Both">Both</option>
                </select>
                {errors.business_type && <p className="text-red-500 text-xs mt-1 ml-1">{errors.business_type.message}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Phone Number</label>
                <input
                  {...register('phone', { required: 'Required' })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="07..."
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Email</label>
              <input
                {...register('email', { 
                  required: 'Required',
                  pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                })}
                type="email"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors"
                placeholder="email@example.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Password</label>
                <input
                  {...register('password', { 
                    required: 'Required',
                    minLength: { value: 6, message: 'Min 6 characters' }
                  })}
                  type="password"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2 ml-1">Confirm Password</label>
                <input
                  {...register('confirm_password', { 
                    required: 'Required',
                    validate: (val) => val === password || "Passwords do not match"
                  })}
                  type="password"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-white focus:outline-none focus:border-white transition-colors"
                  placeholder="••••••••"
                />
                {errors.confirm_password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirm_password.message}</p>}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-center gap-3 ml-1">
              <input
                {...register('terms', { required: 'You must accept the terms' })}
                type="checkbox"
                id="terms"
                className="w-8 h-8 accent-black bg-white border-2 border-black rounded focus:ring-2 focus:ring-black transition-colors"
              />
              <label htmlFor="terms" className="text-sm text-neutral-200 cursor-pointer">
                I agree to the <Link to="/terms" className="text-white hover:underline">Terms and Conditions</Link>
              </label>
            </div>
            {errors.terms && <p className="text-red-500 text-xs mt-1 ml-1">{errors.terms.message}</p>}

            <div className="flex justify-end pt-4">
              <button
                disabled={isLoading}
                type="submit"
                className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-sans font-bold text-base hover:bg-neutral-200 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin text-sm" /> : <>Sign Up <ArrowRight size={18} /></>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
