import React, { useState } from 'react';
import { Sparkles, Play, Activity, Calendar, ArrowRight, Smile, Meh, Frown, Compass, Check, AlertCircle, RefreshCw, Smartphone, Heart } from 'lucide-react';
import { User, MoodType, ScheduleItem } from '../types';

interface HomeScreenProps {
  user: User;
  onSelectTab: (tab: string) => void;
  cognitiveLoad: number;
  setCognitiveLoad: (val: number) => void;
  stressLevel: number;
  setStressLevel: (val: number) => void;
  currentMood: MoodType;
  setCurrentMood: (mood: MoodType) => void;
  moodIntensity: number;
  setMoodIntensity: (val: number) => void;
  scheduleItems: ScheduleItem[];
  moodCheckIns: Record<string, number>;
  setMoodCheckIns: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export default function HomeScreen({
  user,
  onSelectTab,
  cognitiveLoad,
  setCognitiveLoad,
  stressLevel,
  setStressLevel,
  currentMood,
  setCurrentMood,
  moodIntensity,
  setMoodIntensity,
  scheduleItems,
  moodCheckIns,
  setMoodCheckIns
}: HomeScreenProps) {
  const [journalText, setJournalText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  // Breathing Recovery Mode state
  const [recoveryActive, setRecoveryActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCounter, setBreathCounter] = useState(4);

  // Start breathing cycle loop
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (recoveryActive) {
      timer = setInterval(() => {
        setBreathCounter((prev) => {
          if (prev <= 1) {
            // Transition phase
            setBreathPhase((current) => {
              if (current === 'inhale') return 'hold';
              if (current === 'hold') return 'exhale';
              return 'inhale';
            });
            return 4; // Reset to 4 seconds
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [recoveryActive, breathPhase]);

  const handleApplyJournal = async () => {
    if (!journalText.trim()) return;
    setAnalyzing(true);
    setAiMessage(null);

    try {
      const res = await fetch('/api/analyze-sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: journalText })
      });
      if (res.ok) {
        const data = await res.json();
        // Update user's state metrics using server triggers!
        if (data.mood) setCurrentMood(data.mood);
        if (data.intensity) setMoodIntensity(data.intensity);
        if (data.cognitiveLoad) setCognitiveLoad(data.cognitiveLoad);
        if (data.stressLevel) setStressLevel(data.stressLevel);
        if (data.aiRemedy) setAiMessage(data.aiRemedy);
        
        if (data.recoveryModeSuggested) {
          setAiMessage((prev) => `${prev} AI suggests entering Recovery Mode below.`);
        }
      }
    } catch {
      setAiMessage("Zen Connection paused. Standard restorative defaults calculated.");
    } finally {
      setAnalyzing(false);
    }
  };

  const selectColorByMood = (m: MoodType) => {
    switch (m) {
      case 'Sad': return 'text-amber-600 bg-amber-100 hover:bg-amber-200';
      case 'Okay': return 'text-slate-600 bg-slate-100 hover:bg-slate-200';
      case 'Good': return 'text-sky-600 bg-sky-100 hover:bg-sky-200';
      case 'Focused': return 'text-purple-600 bg-purple-100 hover:bg-purple-200';
      case 'Energized': return 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Recovery Overlay (Zen Breathing Engine) */}
      {recoveryActive && (
        <div className="fixed inset-0 bg-[#f8f9ff] z-50 flex flex-col items-center justify-between p-8 animation-fade-in text-center animate-fade-in select-none">
          {/* Top spacer */}
          <div className="pt-12">
            <h3 className="text-xl font-bold text-primary tracking-tight">Focus Recovery Chamber</h3>
            <p className="text-xs text-outline mt-1 uppercase tracking-widest">Slowing down your nervous system</p>
          </div>

          {/* Central Breathing Ring */}
          <div className="flex flex-col items-center justify-center space-y-8">
            <div 
              className={`w-64 h-64 rounded-full flex items-center justify-center bg-primary-container/10 border border-primary-container/20 transition-all duration-1000 transform relative ${
                breathPhase === 'inhale' 
                  ? 'scale-125 bg-primary-container/20 shadow-[0_0_80px_rgba(14,165,233,0.3)]' 
                  : breathPhase === 'hold'
                    ? 'scale-125 bg-secondary-container/15 shadow-[0_0_80px_rgba(132,85,239,0.25)]'
                    : 'scale-90 bg-primary-container/5 shadow-none'
              }`}
            >
              <div className="absolute inset-0 bg-primary/5 rounded-full blur-[40px] pointer-events-none" />
              <div className="flex flex-col items-center space-y-1 z-10">
                <span className="text-lg font-bold tracking-widest text-primary uppercase transition-all duration-500">
                  {breathPhase === 'inhale' && 'Breathe In'}
                  {breathPhase === 'hold' && 'Hold'}
                  {breathPhase === 'exhale' && 'Breathe Out'}
                </span>
                <span className="text-4xl font-extrabold text-on-surface/90">{breathCounter}</span>
              </div>
            </div>
            <p className="max-w-[280px] text-xs text-on-surface-variant leading-relaxed italic">
              {breathPhase === 'inhale' && "Feel the restorative energy fill your chest slowly."}
              {breathPhase === 'hold' && "Let the calm settle, releasing cognitive static."}
              {breathPhase === 'exhale' && "Let your shoulders fall. Blow out any remnant tension."}
            </p>
          </div>

          {/* Cancel button */}
          <button 
            onClick={() => setRecoveryActive(false)}
            className="mb-12 border border-outline-variant hover:bg-slate-100 text-on-surface-variant px-8 py-3 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            End Recovery Pacing
          </button>
        </div>
      )}

      {/* Primary Daily Vibe and Telemetry layout structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Introspective activities (Check-In & Gemini Journal) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Primary Daily Vibe Panel */}
          <section className="glass-card rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-black text-on-surface uppercase tracking-wider">Daily Vibe Check-in</h2>
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Self Reflection</span>
            </div>

            {/* Emotion selectors */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold tracking-wider text-outline uppercase ml-1">How are you feeling?</p>
              <div className="grid grid-cols-5 gap-2">
                {(['Sad', 'Okay', 'Good', 'Focused', 'Energized'] as MoodType[]).map((m) => {
                  const active = currentMood === m;
                  return (
                    <button
                      key={m}
                      onClick={() => {
                        setCurrentMood(m);
                        // Update intensity logic default
                        if (m === 'Sad') setMoodIntensity(70);
                        if (m === 'Okay') setMoodIntensity(40);
                        if (m === 'Good') setMoodIntensity(65);
                        if (m === 'Focused') setMoodIntensity(80);
                        if (m === 'Energized') setMoodIntensity(90);
                      }}
                      className={`flex flex-col items-center py-3 rounded-2xl transition-all cursor-pointer ${
                        active 
                          ? 'bg-primary-container/20 border border-primary/20 scale-105' 
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className={`w-10 h-10 flex items-center justify-center rounded-full mb-1 transition-all ${
                        active ? 'bg-primary text-white scale-110 shadow-sm' : 'text-on-surface-variant/70'
                      }`}>
                        {m === 'Sad' && <Frown className="w-5 h-5 animate-pulse" />}
                        {m === 'Okay' && <Meh className="w-5 h-5" />}
                        {m === 'Good' && <Smile className="w-5 h-5" />}
                        {m === 'Focused' && <Compass className="w-5 h-5" />}
                        {m === 'Energized' && <Activity className="w-5 h-5" />}
                      </div>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${
                        active ? 'text-primary font-extrabold' : 'text-outline'
                      }`}>
                        {m}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Intensity slider */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-baseline px-1">
                <p className="text-[11px] font-bold tracking-wider text-outline uppercase">Intensity Range</p>
                <span className="text-on-surface font-extrabold text-sm">
                  {moodIntensity > 80 ? 'High Intensity' : moodIntensity > 40 ? 'Moderate' : 'Gentle'} ({moodIntensity}%)
                </span>
              </div>
              <div className="relative flex items-center h-8">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={moodIntensity}
                  onChange={(e) => setMoodIntensity(parseInt(e.target.value))}
                  className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer focus:outline-none accent-primary"
                />
              </div>
            </div>

            {/* Emotion Check-In Record Action Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  // Record Check-In in the lifted moodCheckIns state
                  setMoodCheckIns(prev => ({
                    ...prev,
                    '2026-06-03': moodIntensity
                  }));
                  
                  // Dynamically adjust Stress Level based on selected emotion
                  if (currentMood === 'Sad') setStressLevel(65);
                  else if (currentMood === 'Okay') setStressLevel(45);
                  else if (currentMood === 'Good') setStressLevel(35);
                  else if (currentMood === 'Focused') setStressLevel(25);
                  else if (currentMood === 'Energized') setStressLevel(20);

                  setCheckInSuccess(true);
                  setTimeout(() => setCheckInSuccess(false), 3500);
                }}
                className="w-full py-3 bg-primary text-white font-bold text-xs rounded-2xl hover:bg-primary/95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm relative overflow-hidden"
              >
                {checkInSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white animate-bounce" />
                    <span>Checked In Successfully!</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Emotion Check-In</span>
                  </>
                )}
              </button>
              {checkInSuccess && (
                <p className="text-[10px] text-emerald-600 font-semibold text-center mt-1.5 animate-fade-in">
                  Trend data recorded. Visual metrics updated in analytics.
                </p>
              )}
            </div>
          </section>

          {/* Gemini Live Sentiment Micro-Journal Box */}
          <section className="glass-card rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Restorative Intel (Gemini)
              </h3>
              <span className="text-[9px] font-bold bg-[#daf2ff] text-primary px-2 py-0.5 rounded-full">Real-time triggers</span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Scribble your current mental state, workload feelings, or friction points. MindBalance AI will update your wellness pacing metrics immediately.
            </p>

            <div className="space-y-3">
              <textarea
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                placeholder="I am feeling overwhelmed by coding deadlines and need a mental break..."
                rows={3}
                className="w-full p-4 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none text-on-surface placeholder:text-outline-variant leading-relaxed"
              />

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setJournalText("Ready for flow work! I feel highly energized, focused, and positive today.");
                  }}
                  className="text-[10.5px] font-black text-outline hover:text-primary transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Preset Positive Vibe
                </button>
                <button
                  onClick={handleApplyJournal}
                  disabled={analyzing || !journalText.trim()}
                  className="bg-primary text-white font-bold text-xs px-5 py-2.5 rounded-full hover:bg-primary/95 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sensing...</span>
                    </>
                  ) : (
                    <>
                      <span>Analyze Vibe</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {aiMessage && (
                <div className="p-3 bg-primary-container/10 border-l-2 border-primary rounded-xl text-xs text-primary leading-relaxed flex items-start gap-2 animate-fade-in mt-2">
                  <span className="font-bold shrink-0">Zen Remedy:</span>
                  <p>{aiMessage}</p>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right Column: Workload Telemetry Meters & Actions */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Recovery Mode Trigger Card */}
          <button 
            type="button"
            onClick={() => {
              setBreathPhase('inhale');
              setBreathCounter(4);
              setRecoveryActive(true);
            }}
            className="w-full h-20 glass-card hover:bg-slate-50 text-on-surface rounded-3xl font-semibold text-sm flex items-center justify-between px-6 hover:shadow-md transition-all duration-300 group cursor-pointer border border-[#006591]/10 bg-gradient-to-br from-[#006591]/5 via-transparent to-transparent"
          >
            <div>
              <span className="text-xs font-black text-primary block uppercase tracking-widest text-left">Nervous Reset</span>
              <p className="text-sm font-bold text-on-surface mt-0.5">Enter Focus Recovery Chamber</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
              <Play className="w-4 h-4 text-primary fill-primary" />
            </div>
          </button>

          {/* Core Bento widgets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            
            {/* Cognitive Load Meter */}
            <div className="glass-card p-5 rounded-2xl flex flex-col items-center justify-between min-h-[250px] text-center">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-outline w-full text-center">Cognitive Load</h3>
              
              <div className="relative w-24 h-24 my-2.5 rounded-full flex items-center justify-center shrink-0">
                <svg className="absolute w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="38" stroke="#eff4ff" strokeWidth="8" fill="none" />
                  <circle 
                    cx="48" 
                    cy="48" 
                    r="38" 
                    stroke="#006591" 
                    strokeWidth="8" 
                    fill="none" 
                    strokeDasharray={239}
                    strokeDashoffset={239 - (239 * cognitiveLoad) / 100}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-3 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                  <span className="text-base font-extrabold text-on-surface">{cognitiveLoad}%</span>
                  <span className="text-[7px] text-outline font-extrabold tracking-widest">
                    {cognitiveLoad > 80 ? 'CRITICAL' : cognitiveLoad > 50 ? 'OPTIMAL' : 'LIGHT'}
                  </span>
                </div>
              </div>
              
              {/* Real breakdowns dynamically populated from schedule page */}
              <div className="w-full mt-1.5 pt-2 border-t border-slate-100 text-left">
                <span className="text-[8px] font-extrabold uppercase tracking-widest text-outline block mb-1">Active Blocks</span>
                <div className="max-h-[64px] overflow-y-auto no-scrollbar space-y-1">
                  {scheduleItems.filter(item => item.date === "2026-10-23" && !item.completed).length === 0 ? (
                    <p className="text-[9px] text-outline italic text-center leading-normal">No active load blocks.</p>
                  ) : (
                    scheduleItems.filter(item => item.date === "2026-10-23" && !item.completed).map(item => (
                      <div key={item.id} className="flex justify-between items-center text-[9px] text-on-surface-variant/90 leading-tight">
                        <span className="truncate max-w-[90px] font-medium">• {item.title}</span>
                        <span className="font-extrabold text-primary shrink-0">
                          {item.energyLevel === 'High' ? '30%' : item.energyLevel === 'Medium' ? '15%' : '5%'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Stress Trend meter */}
            <div className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-[250px] text-center">
              <div className="flex justify-between items-start w-full">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-outline">Stress Trend</h3>
                <span className="text-[10px] font-black text-primary bg-primary-container/20 px-2 py-0.5 rounded-full">
                  {stressLevel}%
                </span>
              </div>

              {/* Interactive weekly stress graph */}
              <div className="flex items-end justify-between h-24 my-1.5 px-0.5">
                {[
                  { label: 'Thu', val: 55 },
                  { label: 'Fri', val: 40 },
                  { label: 'Sat', val: 30 },
                  { label: 'Sun', val: 25 },
                  { label: 'Mon', val: 45 },
                  { label: 'Tue', val: 50 },
                  { label: 'Wed', val: stressLevel }
                ].map((d) => {
                  const isActive = d.label === 'Wed';
                  return (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => {
                        setStressLevel(d.val);
                      }}
                      className="flex flex-col items-center flex-1 group focus:outline-none cursor-pointer"
                      title={`Stress on ${d.label}: ${d.val}%`}
                    >
                      <div className="w-full px-1 flex items-end h-16">
                        <div 
                          style={{ height: `${d.val}%` }}
                          className={`w-full rounded-t-full transition-all duration-300 ${
                            isActive 
                              ? 'bg-primary shadow-[0_0_8px_rgba(0,101,145,0.4)]' 
                              : 'bg-outline-variant/40 group-hover:bg-primary-container/60'
                          }`}
                        />
                      </div>
                      <span className={`text-[8px] font-bold mt-1.5 uppercase ${
                        isActive ? 'text-primary font-black' : 'text-outline'
                      }`}>
                        {d.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="text-left border-t border-slate-100 pt-1.5">
                <p className="text-[9px] font-bold text-on-surface">Interactive Trend</p>
                <p className="text-[8px] text-outline leading-tight mt-0.5">Click bars to calibrate stress reserves.</p>
              </div>
            </div>

            {/* Next activity details - spans 2 columns in small metrics grid */}
            <div 
              onClick={() => onSelectTab('schedule')}
              className="sm:col-span-2 glass-card p-5 rounded-2xl flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors border border-dashed border-slate-200"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-container/10 text-primary flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-grow">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline">Up Next</h4>
                <p className="text-base font-bold text-on-surface">UX Design Review</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-on-surface">1:00 PM</span>
                <p className="text-[9px] text-outline font-extrabold tracking-wider">60 MIN</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
