import React, { useState } from 'react';
import { Sparkles, Play, Activity, Calendar, ArrowRight, Smile, Meh, Frown, Compass, Check, AlertCircle, RefreshCw, Smartphone, Heart, X } from 'lucide-react';
import { User, MoodType, ScheduleItem, TaskItem, MoodCheckInEntry } from '../types';

interface HomeScreenProps {
  user: User;
  onUpdateUser: (updated: User) => void;
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
  moodCheckIns: Record<string, MoodCheckInEntry[]>;
  setMoodCheckIns: React.Dispatch<React.SetStateAction<Record<string, MoodCheckInEntry[]>>>;
  tasks: TaskItem[];
}

export default function HomeScreen({
  user,
  onUpdateUser,
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
  setMoodCheckIns,
  tasks
}: HomeScreenProps) {
  const [journalText, setJournalText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  // Find completed tasks and compute focus hour total
  const completedTasks = tasks.filter(t => t.completed);
  
  const parseFocusDuration = (duration: string): number => {
    if (!duration) return 0;
    const hourMatch = duration.match(/(\d+(?:\.\d+)?)\s*h/i);
    if (hourMatch) return parseFloat(hourMatch[1]);
    
    const minMatch = duration.match(/(\d+)\s*m/i);
    if (minMatch) return parseInt(minMatch[1], 10) / 60;
    
    const matchHoursText = duration.toLowerCase().match(/(\d+(?:\.\d+)?)\s*hour/);
    if (matchHoursText) return parseFloat(matchHoursText[1]);
    
    const matchMinsText = duration.toLowerCase().match(/(\d+)\s*min/);
    if (matchMinsText) return parseInt(matchMinsText[1], 10) / 60;
    
    const rawNumMatch = duration.match(/^(\d+(?:\.\d+)?)$/);
    if (rawNumMatch) return parseFloat(rawNumMatch[1]);
    
    return 0;
  };

  const totalFocusHours = completedTasks.reduce((acc, t) => {
    return acc + parseFocusDuration(t.focusDuration);
  }, 0);

  const formattedHoursValue = Number(totalFocusHours.toFixed(2));

  // Daily Score Calculation logic (from ProfileScreen)
  const tasksDone = tasks.filter(t => t.completed).length;
  
  const parseTimeToMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    
    let [_, hours, minutes, ampm] = match;
    let h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    
    if (ampm.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (ampm.toUpperCase() === 'AM' && h === 12) h = 0;
    
    return h * 60 + m;
  };

  const calculateFocusHours = (onlyCompleted: boolean) => {
    let totalMinutes = 0;
    scheduleItems.forEach(item => {
      if (!onlyCompleted || item.completed) {
        const start = parseTimeToMinutes(item.startTime);
        const end = parseTimeToMinutes(item.endTime);
        let diff = 0;
        if (end > start) {
          diff = end - start;
        } else if (end < start) {
          diff = (1440 - start) + end;
        }
        totalMinutes += diff;
      }
    });
    return Number((totalMinutes / 60).toFixed(1));
  };

  const completedFocusHours = calculateFocusHours(true);
  const totalFocusHoursScheduled = calculateFocusHours(false);

  // Dynamic Daily Score: 25 points per tasksDone, 20 points per completedFocusHours, always caps nicely at 100%
  const generatedDailyScore = Math.min(100, Math.round(
    (tasksDone * 25) + 
    (completedFocusHours * 20) + 
    (totalFocusHoursScheduled > 0 ? 5 : 0)
  ));
  
  // Premium upsell and locks states
  const [showBillingNotice, setShowBillingNotice] = useState<string | null>(null);
  const [cheeredPeers, setCheeredPeers] = useState<string[]>([]);
  const [coachingInput, setCoachingInput] = useState('');
  const [coachingResponse, setCoachingResponse] = useState<string | null>(null);
  const [coachingLoading, setCoachingLoading] = useState(false);

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
                  const loggedCount = user.moodLogCountToday || 0;
                  if (user.tier === 'freemium' && loggedCount >= 3) {
                    setShowBillingNotice('mood_limit');
                    return;
                  }

                  // Record Check-In in the lifted moodCheckIns state
                  let finalVal = 50; // default Okay
                  if (currentMood === 'Sad') {
                    finalVal = Math.round((moodIntensity / 100) * 45);
                  } else if (currentMood === 'Okay') {
                    finalVal = Math.round(46 + (moodIntensity / 100) * 9);
                  } else if (currentMood === 'Good') {
                    finalVal = Math.round(56 + (moodIntensity / 100) * 14);
                  } else if (currentMood === 'Focused') {
                    finalVal = Math.round(71 + (moodIntensity / 100) * 14);
                  } else if (currentMood === 'Energized') {
                    finalVal = Math.round(86 + (moodIntensity / 100) * 14);
                  }

                  const today = new Date();
                  const yearStr = today.getFullYear();
                  const monthStr = String(today.getMonth() + 1).padStart(2, '0');
                  const dayStr = String(today.getDate()).padStart(2, '0');
                  const dateKey = `${yearStr}-${monthStr}-${dayStr}`;

                  let hours = today.getHours();
                  const minutes = String(today.getMinutes()).padStart(2, '0');
                  const ampm = hours >= 12 ? 'PM' : 'AM';
                  const displayHours = hours % 12 || 12;
                  const timeStr = `${displayHours}:${minutes} ${ampm}`;

                  const newEntry: MoodCheckInEntry = {
                    value: finalVal,
                    time: timeStr,
                    date: dateKey
                  };

                  setMoodCheckIns(prev => {
                    const currentList = prev[dateKey] || [];
                    return {
                      ...prev,
                      [dateKey]: [...currentList, newEntry]
                    };
                  });
                  
                  // Dynamically adjust Stress Level based on selected emotion
                  if (currentMood === 'Sad') setStressLevel(65);
                  else if (currentMood === 'Okay') setStressLevel(45);
                  else if (currentMood === 'Good') setStressLevel(35);
                  else if (currentMood === 'Focused') setStressLevel(25);
                  else if (currentMood === 'Energized') setStressLevel(20);

                  // Update logged quota
                  onUpdateUser({
                    ...user,
                    moodLogCountToday: loggedCount + 1
                  });

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
              {user.tier === 'freemium' && (
                <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-bold text-outline uppercase tracking-wider">
                    Freemium Tier Limits
                  </p>
                  <p className="text-[11px] font-extrabold text-primary mt-0.5">
                    {user.moodLogCountToday || 0} / 3 daily mood logs recorded today
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* AI Restorative Coaching Hub (Professional Plan Feature) */}
          <section className="glass-card rounded-3xl p-6 space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] tracking-widest text-emerald-600 font-extrabold uppercase block">Professional Sync</span>
                <h3 className="text-base font-black text-on-surface mt-0.5">AI Coaching Hub</h3>
              </div>
              <span className="text-[9.5px] bg-emerald-50 text-emerald-700 font-extrabold uppercase px-2 py-0.5 rounded-full select-none">
                AI Assistant
              </span>
            </div>

            {user.tier !== 'professional' ? (
              <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-[2px] p-6 flex flex-col justify-center items-center text-center space-y-3 z-10 selection:bg-transparent">
                <span className="text-lg">🔒</span>
                <h4 className="text-sm font-black text-on-surface">AI Coaching Hub Locked</h4>
                <p className="text-[11px] text-outline max-w-sm leading-relaxed">
                  Get real-time restorative coaching, predictive stress mitigation suggestions, and specialized physical energy budgets matching your tasks. Placed with RM 30 Working Professional plan.
                </p>
                <button 
                  onClick={() => onSelectTab('profile')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Upgrade to Professional Plan
                </button>
              </div>
            ) : (
              <div className="space-y-4 select-none">
                <p className="text-xs text-outline leading-tight">
                  Brief your coach about any overwhelming deadlines, and receive personalized pacing suggestions instantly.
                </p>
                <div className="space-y-2">
                  <textarea
                    value={coachingInput}
                    onChange={(e) => setCoachingInput(e.target.value)}
                    placeholder="e.g., I have 3 exam design reviews today and feel highly fatigued..."
                    className="w-full h-20 p-3 bg-white border border-slate-200 rounded-xl text-xs text-on-surface focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-slate-400"
                  />
                  <button
                    onClick={() => {
                      if (!coachingInput.trim()) return;
                      setCoachingLoading(true);
                      setCoachingResponse(null);
                      setTimeout(() => {
                        setCoachingLoading(false);
                        setCoachingResponse("Restorative Coach Suggestions: Your Cognitive Load is high! I suggest completing UX reviews first inside 25m focus blocks, and spacing segments with 5m breathing pacing loops. Restrict peripheral devices usage.");
                      }, 1800);
                    }}
                    disabled={coachingLoading}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {coachingLoading ? 'Consulting Coach...' : 'Seek Coach Council'}
                  </button>
                </div>

                {coachingResponse && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 animate-fade-in">
                    <p className="text-[11.5px] text-emerald-800 leading-relaxed font-semibold italic">
                      {coachingResponse}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Tangible Wins Dashboard (Student & Professional Feature) */}
          <section className="glass-card rounded-3xl p-6 space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-on-surface">Tangible Wins Dashboard</h3>
              </div>
              <span className="text-[9.5px] bg-indigo-50 text-indigo-700 font-extrabold uppercase px-2 py-0.5 rounded-full select-none">
                Achievements
              </span>
            </div>

            {user.tier === 'freemium' ? (
              <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-[2px] p-6 flex flex-col justify-center items-center text-center space-y-3 z-10 select-none">
                <span className="text-lg">🔒</span>
                <h4 className="text-sm font-black text-on-surface">Tangible Wins Locked</h4>
                <p className="text-[11px] text-outline max-w-sm leading-relaxed">
                  Earn points, complete daily balanced streaks, and track historic focus achievements! Unlocks on Student (RM 10) and Working Professional tiers.
                </p>
                <button 
                  onClick={() => onSelectTab('profile')}
                  className="px-4 py-2 bg-[#8455ef] hover:bg-[#7244de] text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  Upgrade to Student Plan
                </button>
              </div>
            ) : (
              <div className="space-y-4 select-none">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between h-24 hover:border-slate-200 transition-colors">
                    <span className="text-[9.5px] text-purple-700 dark:text-purple-400 uppercase font-black tracking-wider block">Finished Tasks</span>
                    <div>
                      <span className="text-2xl font-black text-purple-900 dark:text-purple-300 block">{completedTasks.length}</span>
                      <p className="text-[10px] text-outline mt-0.5 leading-none">Completed focus goals.</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col justify-between h-24 hover:border-slate-200 transition-colors">
                    <span className="text-[9.5px] text-sky-700 dark:text-sky-400 uppercase font-black tracking-wider block">Recorded Run Time</span>
                    <div>
                      <span className="text-2xl font-black text-primary dark:text-sky-300 block">
                        {formattedHoursValue} {formattedHoursValue === 1 ? 'hr' : 'hrs'}
                      </span>
                      <p className="text-[10px] text-outline mt-0.5 leading-none">Actual focus log sum.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold text-outline uppercase tracking-wider block mb-1">
                    Completed Focus Record
                  </h4>
                  {completedTasks.length === 0 ? (
                    <div className="py-5 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-center space-y-2">
                      <p className="text-[11px] text-outline leading-tight max-w-xs mx-auto">
                        No completed tasks on record yet. Complete and log focus timers under tasks to see items populated here.
                      </p>
                      <button
                        onClick={() => onSelectTab('tasks')}
                        className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                      >
                        Start Focus Tasks
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {completedTasks.map((task) => (
                        <div 
                          key={task.id} 
                          className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center justify-between text-xs hover:border-slate-200 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-on-surface block truncate max-w-[150px] md:max-w-[220px]">{task.title}</span>
                              <span className="text-[9px] text-outline uppercase font-extrabold tracking-wider">
                                {task.priority} • {task.classification}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/10 shrink-0">
                            {task.focusDuration}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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
          <div className="grid grid-cols-2 gap-4">
            
            {/* Cognitive Load Meter - leads to Schedule page */}
            <div 
              onClick={() => onSelectTab('schedule')}
              className="glass-card p-5 rounded-2xl flex flex-col items-center justify-between min-h-[250px] text-center cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
            >
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

            {/* Stress Trend meter - leads to Mood page */}
            <div 
              onClick={() => onSelectTab('mood')}
              className="glass-card p-5 rounded-2xl flex flex-col justify-between min-h-[250px] text-center cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all"
            >
              <div className="flex justify-between items-start w-full">
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-outline">Stress Trend</h3>
                <span className="text-[10px] font-black text-primary bg-primary-container/20 px-2 py-0.5 rounded-full">
                  {stressLevel}%
                </span>
              </div>

              {/* Interactive weekly stress graph */}
              <div className="flex items-end justify-between h-24 my-1.5 px-0.5">
                {[
                  { label: 'Sun', val: 25 },
                  { label: 'Mon', val: 45 },
                  { label: 'Tue', val: 50 },
                  { label: 'Wed', val: stressLevel },
                  { label: 'Thu', val: 55 },
                  { label: 'Fri', val: 40 },
                  { label: 'Sat', val: 30 }
                ].map((d) => {
                  const isActive = d.label === 'Wed';
                  return (
                    <button
                      key={d.label}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
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

              {/* Status info spacer to align bento layout perfectly */}
              <div className="text-left border-t border-slate-100 pt-1.5 mt-1.5 min-h-[30px]" />
            </div>

            {/* Next activity details - spans 2 columns in small metrics grid */}
            <div 
              onClick={() => onSelectTab('schedule')}
              className="col-span-2 glass-card p-5 rounded-2xl flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors border border-dashed border-slate-200"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-container/10 text-primary flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-grow">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-outline">Up Next</h4>
                <p className="text-sm font-bold text-on-surface">UX Design Review</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-on-surface">1:00 PM</span>
                <p className="text-[9px] text-outline font-extrabold tracking-wider">60 MIN</p>
              </div>
            </div>

            {/* Community Leaderboard (Resized to fit inside Right Column Bento below Up Next) */}
            <div className="col-span-2 glass-card rounded-2xl p-5 space-y-3 relative overflow-hidden bg-white/70">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-black text-on-surface">Community Leaderboard</h3>
                </div>
                <span className="text-[9px] bg-[#daf2ff] text-primary font-black uppercase px-2 py-0.5 rounded-full select-none">
                  Weekly Rankings
                </span>
              </div>

              {user.tier === 'freemium' ? (
                <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-[2px] p-6 flex flex-col justify-center items-center text-center space-y-2 z-10 select-none">
                  <span className="text-base">🔒</span>
                  <h4 className="text-xs font-black text-on-surface">Leaderboard Locked</h4>
                  <p className="text-[10px] text-outline max-w-sm leading-relaxed">
                    Join structural university cohorts, cheer study peers, and earn focus points in real-time. Unlocks with Student Plan (RM 10/mo) or above.
                  </p>
                  <button 
                    onClick={() => onSelectTab('profile')}
                    className="px-3.5 py-1.5 bg-[#8455ef] hover:bg-[#7244de] text-white rounded-xl text-[10px] font-bold shadow-md transition-all cursor-pointer"
                  >
                    Unlock Leaderboards
                  </button>
                </div>
              ) : (
                <div className="space-y-2 font-sans select-none text-[11px]">
                  <p className="text-[10px] text-outline leading-tight">
                    Complete focus scheduled timers to upgrade score bounds. Cheer peers to support mutual productivity.
                  </p>
                  
                  <div className="space-y-2">
                    {[
                      { id: 'maya', name: 'Maya S.', plan: 'Student', points: 88, avatar: 'M' },
                      { id: 'ethan', name: 'Ethan R.', plan: 'Professional', points: 74, avatar: 'E' },
                      { id: 'you', name: 'You', plan: user.tier === 'student' ? 'Student' : 'Professional', points: generatedDailyScore, avatar: 'Y' },
                      { id: 'sarah', name: 'Sarah L.', plan: 'Student', points: 62, avatar: 'S' }
                    ].sort((a, b) => b.points - a.points).map((row, index) => {
                      const isYou = row.id === 'you';
                      const alreadyCheered = cheeredPeers.includes(row.id);
                      return (
                        <div 
                          key={row.id} 
                          className={`p-2.5 rounded-xl flex items-center justify-between border transition-all ${
                            isYou 
                              ? 'border-primary/20 bg-primary/5 font-bold shadow-xs' 
                              : 'border-slate-100 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-extrabold text-primary text-[9px] w-3">{index + 1}</span>
                            <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-black text-[10px] text-white shrink-0 ${
                              isYou ? 'bg-primary shadow-sm' : 'bg-slate-300'
                            }`}>
                              {row.avatar}
                            </div>
                            <div>
                              <span className="text-[11px] text-on-surface block leading-tight font-bold">{row.name}</span>
                              <span className="text-[8px] text-outline uppercase tracking-wider font-extrabold">{row.plan} Tier</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-extrabold text-[#006591] tabular-nums text-[10px]">{row.points} Points</span>
                            {!isYou && (
                              <button
                                onClick={() => {
                                  if (alreadyCheered) return;
                                  setCheeredPeers(prev => [...prev, row.id]);
                                  alert(`Cheered ${row.name}! REST & Flow points boosted +25 XP to their balance.`);
                                }}
                                className={`h-6 px-2.5 rounded-lg text-[8.5px] font-black uppercase transition-all tracking-wider shrink-0 cursor-pointer ${
                                  alreadyCheered 
                                    ? 'bg-emerald-50 text-emerald-700 font-extrabold' 
                                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                                }`}
                              >
                                {alreadyCheered ? '✓ Cheered' : 'Cheer'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Freemium limit warning modal */}
      {showBillingNotice === 'mood_limit' && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-start">
              <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-black px-3 py-1 rounded-full">
                ⚠️ Quota Limit Reached
              </span>
              <button 
                onClick={() => setShowBillingNotice(null)}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-black text-on-surface">Upgrade to Unlock Full Mood Logging</h4>
              <p className="text-xs text-outline leading-relaxed">
                You have reached the Freemium Plan quota of <strong>3 mood check-ins</strong> today. Upgrade to the <strong>Student Plan</strong> (RM 10/mo) or <strong>Professional Plan</strong> (RM 30/mo) for unlimited logging, detailed trends, peer leaderboards, and AI coaching.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowBillingNotice(null)}
                className="flex-1 py-3 text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-extrabold rounded-xl transition-all cursor-pointer text-center"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowBillingNotice(null);
                  onSelectTab('profile'); // Send them to the selection widget
                }}
                className="flex-1 py-3 text-xs bg-[#8455ef]/90 hover:bg-[#8455ef] text-white font-extrabold rounded-xl transition-all cursor-pointer text-center shadow-lg shadow-indigo-150"
              >
                View Pricing Plans
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
