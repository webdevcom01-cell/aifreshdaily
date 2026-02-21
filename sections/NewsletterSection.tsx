"use client"
import { useState, useEffect } from 'react';
import { Mail, ArrowRight, CheckCircle2, Loader2, AlertCircle, Users } from 'lucide-react';
import { subscribeEmail, fetchNewsletterStats } from '@/lib/supabase';

export default function NewsletterSection() {
  const [email,       setEmail]       = useState('');
  const [status,      setStatus]      = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errMsg,      setErrMsg]      = useState('');
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [subCount,    setSubCount]    = useState<number | null>(null);

  // Persist success across page reloads
  useEffect(() => {
    if (localStorage.getItem('ai_fresh_daily_subscribed') === 'true') {
      setAlreadyDone(true);
    }
  }, []);

  // Fetch subscriber count for social proof
  useEffect(() => {
    fetchNewsletterStats()
      .then(({ total }) => { if (total > 0) setSubCount(total); })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrMsg('Please enter a valid email address.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrMsg('');

    const err = await subscribeEmail(email);
    if (err) {
      setErrMsg('Something went wrong. Please try again.');
      setStatus('error');
      return;
    }

    setStatus('success');
    localStorage.setItem('ai_fresh_daily_subscribed', 'true');
    // Optimistically bump the count
    setSubCount((prev) => (prev !== null ? prev + 1 : null));
    setTimeout(() => setAlreadyDone(true), 3000);
  };

  if (alreadyDone) return null;

  const formattedCount = subCount !== null
    ? subCount >= 1000
      ? `${(subCount / 1000).toFixed(1)}K`
      : subCount.toString()
    : null;

  return (
    <section className="py-12 bg-ai-purple/5 border-y border-ai-purple/10">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ai-purple/10 text-ai-purple mb-6 animate-bounce-subtle">
          <Mail className="w-8 h-8" />
        </div>

        <h2 className="text-3xl font-black font-heading text-gray-900 dark:text-white mb-4 uppercase tracking-tight">
          Neural <span className="ai-gradient-text">Intelligence</span> Digest
        </h2>

        {/* Social proof — subscriber count */}
        {formattedCount && (
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-white dark:bg-ai-space-light border border-ai-purple/20 shadow-sm">
            <Users className="w-4 h-4 text-ai-purple" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Join <span className="text-ai-purple font-bold">{formattedCount}</span> readers already subscribed
            </span>
          </div>
        )}

        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto font-mono-ai">
          Join our community of AI enthusiasts. Get the week&apos;s most critical breakthroughs delivered to your inbox.
        </p>

        <form onSubmit={handleSubmit} className="relative max-w-md mx-auto">
          {status === 'success' ? (
            <div className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl animate-in zoom-in-95 duration-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-bold">Subscribed! Welcome to the future.</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
                  disabled={status === 'loading'}
                  placeholder="Enter your email..."
                  className={`w-full px-5 py-4 bg-white dark:bg-ai-space-light border ${
                    status === 'error' ? 'border-red-500' : 'border-gray-200 dark:border-ai-space-medium'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-ai-purple transition-all dark:text-white`}
                />
                {status === 'error' && errMsg && (
                  <p className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-red-500 font-bold">
                    <AlertCircle className="w-3 h-3" />{errMsg}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-8 py-4 ai-gradient-bg text-white font-bold rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Saving...</>
                ) : (
                  <>Subscribe<ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          )}
        </form>

        <p className="mt-8 text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-widest font-mono-ai">
          Zero noise. No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
