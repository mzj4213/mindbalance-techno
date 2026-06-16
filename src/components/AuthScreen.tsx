import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle, Loader2, Flower } from 'lucide-react';
import { User as UserType } from '../types';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthScreenProps {
  onLoginSuccess: (user: UserType) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Local storage fake registered DB seed
  const getRegisteredUsers = (): Record<string, { name: string; pass: string }> => {
    const list = localStorage.getItem('mb_registered_users');
    if (!list) {
      // Default Alex Rivers account seed as referenced in designs
      const defaults = {
        'alex@mindbalance.com': { name: 'Alex Rivers', pass: 'mindbalance123' },
        'mzj4213@gmail.com': { name: 'Alex Rivers', pass: 'password123' },
      };
      localStorage.setItem('mb_registered_users', JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(list);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) return setError('Please enter your full name');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email address');
    if (password.length < 8) return setError('Password must be at least 8 characters long');

    setLoading(true);
    setLoadingMessage('Creating your tranquil space...');

    if (isSupabaseConfigured()) {
      try {
        const sb = getSupabase();
        const { data, error } = await sb.auth.signUp({
          email: email.toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        setLoading(false);
        setIsLogin(true);
        setError('');
        alert(`Account created! ${data.user?.identities?.length === 0 ? 'An account already exists under this email.' : 'Welcome to the focus community! Please log in above.'}`);
        return;
      } catch (err: any) {
        setError(err.message || 'An error occurred during sign up.');
        setLoading(false);
        return;
      }
    }

    // Local Storage mock registration
    setTimeout(() => {
      const users = getRegisteredUsers();
      if (users[email.toLowerCase()]) {
        setError('An account with this email already exists.');
        setLoading(false);
        return;
      }

      users[email.toLowerCase()] = { name: fullName, pass: password };
      localStorage.setItem('mb_registered_users', JSON.stringify(users));

      setLoading(false);
      setIsLogin(true);
      setError('');
    }, 1500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email address');
    if (!password) return setError('Please enter your password');

    setLoading(true);
    setLoadingMessage('Restoring digital harmony...');

    if (isSupabaseConfigured()) {
      try {
        const sb = getSupabase();
        const { data, error } = await sb.auth.signInWithPassword({
          email: email.toLowerCase(),
          password
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        if (data.user) {
          const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
          
          const activeUser: UserType = {
            id: data.user.id,
            email: data.user.email || email.toLowerCase(),
            fullName: profile?.full_name || data.user.user_metadata?.full_name || fullName || 'Zen User',
            role: profile?.role || (data.user.email === 'mzj4213@gmail.com' ? 'Product Designer' : 'Mindfulness Practitioner'),
            avatarUrl: profile?.avatar_url || (data.user.email === 'mzj4213@gmail.com' 
              ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMQI6QRQM2WRt-f3v3S9YdBc-x8RoIs5zdQBforjynBvi_7wirk6gqq0nXVhqAsORolDf1ayoXYxVQfF8x066FI8ZunaRn2lRq1yQljsvEdMRywCgfV0q2sw61An1VoNRltV2nFHFo60FfKqZOo1mS8_O5lxa4PZfqmysWa5k_GCYQxo1OlrxBDCTQ21qWDQ4T2p01UDFeMwBShzKJH3M3vifKvoYzcngLUIB1uNmFYZVLi4SpUInWfv8PKZNfxrk34sVBN_Rv2tQ'
              : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCN6vpkGJsWL0rn_CuT7aCl8m9xd-UyPSgMhAkgEUljpgbK_ZgY21sxEyd6ahiB6oqeyUTpQuAGGj99GpW-bvoSKujfF9sjVTKjc43N4OCh-GI6r9QgeHqKIll3c4ziTa5sY8vo3IJ8dUceq_HqdDscbeKAbFyLIdNStGtvw80mwnO97Nec2_Izo1MT7BAQp5b4g_Xy59PQb-yjeer-bdv98zIx1utRFFwF3pYNz0n4XXBGbmTjlpabw0nREHg7ECpQkHyLAsOSJ4'),
            balanceScore: profile?.balance_score || 94,
            focusStreak: profile?.focus_streak || 5,
            burnoutRisk: profile?.burnout_risk || 12,
            tier: 'freemium',
            moodLogCountToday: 1
          };

          setLoading(false);
          onLoginSuccess(activeUser);
          return;
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred during log in.');
        setLoading(false);
        return;
      }
    }

    // Local Storage mock login
    setTimeout(() => {
      const users = getRegisteredUsers();
      const matched = users[email.toLowerCase()];

      if (!matched || matched.pass !== password) {
        setError('Invalid credentials. Remember, authentication only accepts registered users.');
        setLoading(false);
        return;
      }

      const activeUser: UserType = {
        id: email.toLowerCase(),
        email: email.toLowerCase(),
        fullName: matched.name,
        role: email.toLowerCase() === 'mzj4213@gmail.com' ? 'Product Designer' : 'Mindfulness Practitioner',
        avatarUrl: email.toLowerCase() === 'mzj4213@gmail.com' 
          ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMQI6QRQM2WRt-f3v3S9YdBc-x8RoIs5zdQBforjynBvi_7wirk6gqq0nXVhqAsORolDf1ayoXYxVQfF8x066FI8ZunaRn2lRq1yQljsvEdMRywCgfV0q2sw61An1VoNRltV2nFHFo60FfKqZOo1mS8_O5lxa4PZfqmysWa5k_GCYQxo1OlrxBDCTQ21qWDQ4T2p01UDFeMwBShzKJH3M3vifKvoYzcngLUIB1uNmFYZVLi4SpUInWfv8PKZNfxrk34sVBN_Rv2tQ'
          : 'https://lh3.googleusercontent.com/aida-public/AB6AXuCCN6vpkGJsWL0rn_CuT7aCl8m9xd-UyPSgMhAkgEUljpgbK_ZgY21sxEyd6ahiB6oqeyUTpQuAGGj99GpW-bvoSKujfF9sjVTKjc43N4OCh-GI6r9QgeHqKIll3c4ziTa5sY8vo3IJ8dUceq_HqdDscbeKAbFyLIdNStGtvw80mwnO97Nec2_Izo1MT7BAQp5b4g_Xy59PQb-yjeer-bdv98zIx1utRFFwF3pYNz0n4XXBGbmTjlpabw0nREHg7ECpQkHyLAsOSJ4',
        balanceScore: 94,
        focusStreak: 5,
        burnoutRisk: 12,
        tier: 'freemium',
        moodLogCountToday: 1
      };

      setLoading(false);
      onLoginSuccess(activeUser);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-mesh text-on-surface flex flex-col items-center justify-center p-6 select-none relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="fixed top-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full bg-secondary/5 blur-[100px] -z-10" />

      {/* Main Content Area */}
      <main className="w-full max-w-[440px] flex flex-col items-center z-10 transition-all duration-700">
        
        {/* Branding Title Block */}
        <header className="flex flex-col items-center mb-8 w-full text-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/15 animate-float">
            <Flower className="text-white w-9 h-9" />
          </div>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-primary">MindBalance</h1>
          <p className="text-sm font-medium tracking-[0.15em] text-outline uppercase mt-2">Restoring Digital Harmony</p>
        </header>

        {/* Card Form */}
        <section className="glass-card rounded-3xl p-8 w-full">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-on-surface">
              {isLogin ? 'Welcome Back' : 'Start Your Journey'}
            </h2>
            <p className="text-sm text-on-surface-variant/80 mt-1">
              {isLogin 
                ? 'Enter your credentials to restore your calm.' 
                : 'Create an account to begin your mental wellness experience.'}
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-error-container text-error text-xs font-semibold rounded-xl border border-error/10 leading-relaxed">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-primary font-medium">{loadingMessage}</p>
            </div>
          ) : (
            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
              
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold tracking-wider text-on-surface-variant/70 uppercase ml-1" htmlFor="fullName">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5 pointer-events-none" />
                    <input
                      id="fullName"
                      type="text"
                      placeholder="Alex Rivers"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-14 pl-12 pr-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface placeholder:text-outline-variant"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-bold tracking-wider text-on-surface-variant/70 uppercase ml-1" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5 pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    placeholder="alex@mindbalance.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface placeholder:text-outline-variant"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold tracking-wider text-on-surface-variant/70 uppercase" htmlFor="password">
                    Password
                  </label>
                  {isLogin && (
                    <button 
                      type="button" 
                      onClick={() => setError('Please contact Alex for registration reset or use password123 / mindbalance123')} 
                      className="text-[11px] font-semibold text-primary hover:opacity-80 transition-opacity"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-outline w-5 h-5 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-14 pl-12 pr-12 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface placeholder:text-outline-variant"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-[10px] text-outline tracking-wide ml-1 mt-1">Must be at least 8 characters.</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full h-14 mt-2 bg-primary text-white font-semibold text-base rounded-full shadow-lg shadow-primary/20 hover:bg-primary/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLogin ? 'Log In' : 'Create Account'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-6 select-none">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/35" />
            </div>
            <div className="relative flex justify-center text-[10px] font-bold tracking-wider uppercase">
              <span className="px-3 bg-white/40 backdrop-blur-sm text-outline">or continue with</span>
            </div>
          </div>

          {/* Social Signups */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button" 
              onClick={() => {
                setError('Social signup is currently simulated. Please register first below to satisfy safety rules!');
              }}
              className="h-14 flex items-center justify-center gap-2 rounded-2xl ring-1 ring-outline-variant/30 bg-surface-container-lowest hover:bg-white/50 cursor-pointer active:scale-95 transition-all"
            >
              <img 
                alt="Google" 
                className="w-5 h-5" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJ03WiFQa6JXQrE4vvoDZ7-ZlGdpH20c9eAnZKCoPCHweJq35bzrj6zWTRFWDa-YGWEn6q38YEt0SvJYg2JCQGHcNRaH-ka8OugSAlHWIHwKW2fE40fqH2AAtxQqsJEdyZy6iOF2DSkjF5dHAyEM3UFNaqHV_Jn2yUiL6dDbs1TnC_dd65zE34cRia49uLBjsEWrnj4HtXjUCcsNEElyTp30IOB_02t2Tm6ejI7PiUlccYr-5ouJR67qp21lDKCd0v63j7IxYigs0" 
              />
              <span className="text-xs font-semibold text-on-surface">Google</span>
            </button>
            <button 
              type="button" 
              onClick={() => {
                setError('Social signup is currently simulated. Please register first below to satisfy safety rules!');
              }}
              className="h-14 flex items-center justify-center gap-2 rounded-2xl ring-1 ring-outline-variant/30 bg-surface-container-lowest hover:bg-white/50 cursor-pointer active:scale-95 transition-all"
            >
              <span className="text-sm font-bold text-on-surface">iOS Apple</span>
            </button>
          </div>
        </section>

        {/* Navigation Switch Link */}
        <p className="mt-6 text-center text-sm text-on-surface-variant">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-primary font-bold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>

        {/* Technical Safety Note */}
        <p className="mt-8 text-center text-[11px] tracking-wide text-outline max-w-[320px] leading-relaxed select-none uppercase">
          Authorized User Gateway • Sandbox Database Enforced
        </p>
      </main>
    </div>
  );
}
