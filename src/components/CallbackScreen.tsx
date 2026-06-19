import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export default function CallbackScreen() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Exchanging secure credentials with Supabase...');

  useEffect(() => {
    const processCallback = async () => {
      if (!isSupabaseConfigured()) {
        setStatus('error');
        setMessage('Supabase connection parameters are not configured.');
        return;
      }

      try {
        const sb = getSupabase();
        if (!sb) {
          throw new Error('Could not access Supabase connection.');
        }

        // Supabase JS SDK automatically parses the hash fragment during initialization,
        // but if it is PKCE (?code=...), we should exchange code for session manually.
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          setMessage('Authenticating your Google Account session...');
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
        }

        // Double check session is successfully stored
        const { data: { session } } = await sb.auth.getSession();
        if (!session?.user) {
          // Sometimes the SDK is still writing state or we have access token inside hash. Let's do a short retry delay.
          await new Promise((resolve) => setTimeout(resolve, 800));
          const { data: { session: retrySession } } = await sb.auth.getSession();
          if (!retrySession?.user) {
            throw new Error('Supabase session was not established successfully.');
          }
        }

        setStatus('success');
        setMessage('Vibe aligned! Redirecting you back to your workspace...');

        // Post success message to parent iframe/window to let it fetch session
        if (window.opener) {
          window.opener.postMessage({ type: 'SUPABASE_AUTH_SUCCESS' }, '*');
          // Give postMessage a moment to dispatch before closing the popup window
          setTimeout(() => {
            window.close();
          }, 600);
        } else {
          // If no opener, redirect directly to origin
          setTimeout(() => {
            window.location.href = window.location.origin;
          }, 1200);
        }

      } catch (err: any) {
        console.error('Supabase auth callback handle failure:', err);
        setStatus('error');
        setMessage(err.message || 'An error occurred during credentials validation.');
      }
    };

    processCallback();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col items-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          {status === 'loading' && <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />}
          {status === 'success' && <CheckCircle className="w-8 h-8 text-emerald-400" />}
          {status === 'error' && <AlertCircle className="w-8 h-8 text-rose-400" />}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">
            {status === 'loading' && 'Establishing Harmony'}
            {status === 'success' && 'Connection Aligned'}
            {status === 'error' && 'Alignment Interrupted'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {status === 'error' && (
          <button
            onClick={() => {
              if (window.opener) window.close();
              else window.location.href = window.location.origin;
            }}
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all text-xs font-bold rounded-xl cursor-pointer"
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
}
