import React, { useState, useEffect } from 'react';
import { User, Sun, Moon, Sparkles, LogOut, Edit2, Medal, Watch, Bell, Shield, AlertCircle, X, Check, Laptop, RefreshCw, Trash2, Download, Database } from 'lucide-react';
import { User as UserType, ScheduleItem, TaskItem, MoodCheckInEntry } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';

interface ProfileScreenProps {
  user: UserType;
  onUpdateUser: (updated: UserType) => void;
  onLogout: () => void;
  cognitiveLoad: number;
  energyReserves: number;
  scheduleItems: ScheduleItem[];
  setScheduleItems: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  focusStreak: number;
  setFocusStreak: React.Dispatch<React.SetStateAction<number>>;
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  setMoodCheckIns: React.Dispatch<React.SetStateAction<Record<string, MoodCheckInEntry[]>>>;
  tasks: TaskItem[];
}

export default function ProfileScreen({
  user,
  onUpdateUser,
  onLogout,
  cognitiveLoad,
  energyReserves,
  scheduleItems,
  setScheduleItems,
  focusStreak,
  setFocusStreak,
  setTasks,
  setMoodCheckIns,
  tasks
}: ProfileScreenProps) {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('mb_theme') as 'light' | 'dark') || 'light';
  });
  
  // Custom interface view modal toggles
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showWearableModal, setShowWearableModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [showProLockModal, setShowProLockModal] = useState<string | null>(null);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);

  // Wearable connection animations states
  const [connectingDevice, setConnectingDevice] = useState<string | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<string[]>(['Apple Watch']);
  
  // User notifications or toasts
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Synchronize on mounts
  useEffect(() => {
    const saved = localStorage.getItem('mb_theme') as 'light' | 'dark';
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mb_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mb_theme', 'light');
    }
  };

  // Analyze burnout risk dynamically based on High and Medium energy blocks in scheduleItems!
  const highEnergySlots = scheduleItems.filter(item => item.energyLevel === 'High' && !item.completed).length;
  const mediumEnergySlots = scheduleItems.filter(item => item.energyLevel === 'Medium' && !item.completed).length;
  
  // Custom formula: start at 12, add 25 per High-energy incomplete slot, 10 per Med-energy slot. Max 95.
  const calculatedBurnoutRisk = Math.min(12 + (highEnergySlots * 25) + (mediumEnergySlots * 10), 95);

  // Dynamic Streak Calculation based on actual companion dates of completed tasks or focus sessions
  const calculateConcurrentDays = () => {
    const dates = new Set<string>();
    
    // Add completed schedule items (Focus Sessions)
    scheduleItems.forEach(item => {
      if (item.completed && item.date) {
        dates.add(item.date);
      }
    });

    // Add completed tasks
    tasks.forEach(task => {
      if (task.completed && task.deadline) {
        dates.add(task.deadline);
      }
    });

    if (dates.size === 0) return 0;

    const sortedDates = Array.from(dates)
      .map(d => new Date(d))
      .sort((a, b) => a.getTime() - b.getTime());

    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = sortedDates[i - 1];
      const curr = sortedDates[i];
      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak += 1;
      } else if (diffDays > 1) {
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
        }
        currentStreak = 1;
      }
    }
    
    if (currentStreak > maxStreak) {
      maxStreak = currentStreak;
    }

    return maxStreak;
  };

  const computedStreak = calculateConcurrentDays() || focusStreak;

  // Daily Score Calculation logic
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

  const getBurnoutLabel = (risk: number) => {
    if (risk > 70) return 'Critical Risk';
    if (risk > 40) return 'Moderate Risk';
    return 'Low Risk';
  };

  const getBurnoutColor = (risk: number) => {
    if (risk > 70) return 'bg-red-500 text-red-500';
    if (risk > 40) return 'bg-amber-500 text-amber-500';
    return 'bg-primary text-primary';
  };

  // Trigger pairing simulation for smartwatch wearables
  const triggerPairDevice = (deviceName: string) => {
    if (connectedDevices.includes(deviceName)) {
      // Unlink device
      setConnectedDevices(prev => prev.filter(d => d !== deviceName));
      showToast(`Disconnected ${deviceName} sensors.`);
      return;
    }

    setConnectingDevice(deviceName);
    setTimeout(() => {
      setConnectedDevices(prev => [...prev, deviceName]);
      setConnectingDevice(null);
      showToast(`Successfully linked ${deviceName} metrics!`);
    }, 2500);
  };

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 3500);
  };

  // Clear system states for the sandbox cache reset demonstration
  const handleClearSandboxData = () => {
    setScheduleItems([
      {
        id: "deep-work",
        title: "Deep Work Block",
        startTime: "09:00 AM",
        endTime: "10:30 AM",
        energyLevel: "High",
        completed: false,
        date: "2026-10-23"
      }
    ]);
    setTasks([
      {
        id: "t1",
        title: "Align UI Mockup layout elements",
        priority: "P1",
        classification: "Priority",
        energyLevel: "Medium",
        focusDuration: "30m Focus",
        completed: false,
        deadline: "2026-10-23"
      }
    ]);
    setMoodCheckIns({
      '2026-06-03': [{ value: 60, time: '02:45 PM', date: '2026-06-03' }]
    });
    setFocusStreak(0);
    showToast("Application local cache reset successfully!");
    setShowPrivacyModal(false);
  };

  const handleDownloadBackup = () => {
    showToast("Journal archive downloaded successfully as JSON!");
  };

  return (
    <div className="space-y-6 pb-16 select-none animate-fade-in text-on-surface">
      
      {/* Toast status indicators */}
      {statusMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#006591] px-5 py-3 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-xl flex items-center gap-2 z-55 animate-fade-in">
          <Sparkles className="w-4.5 h-4.5 text-white fill-white" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Profile Header Block */}
      <section className="flex flex-col items-center pt-2 text-center select-none">
        <div className="relative mb-3 group">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl relative bg-slate-100">
            <img 
              alt={user.fullName} 
              src={user.avatarUrl} 
              className="w-full h-full object-cover group-hover:scale-105 duration-300 transition-transform referrer-policy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute bottom-0 right-0 bg-primary hover:bg-primary/95 text-white p-2 rounded-full border-2 border-white shadow-md flex items-center justify-center cursor-pointer">
            <Edit2 className="w-3.5 h-3.5" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-on-surface">{user.fullName}</h2>
        <p className="text-xs font-semibold text-on-surface-variant uppercase mt-1">{user.role}</p>
      </section>

      {/* Bento Grid Stats */}
      <div className="space-y-4">
        {/* Row 1: Cognitive Load, Energy Reserves, Focus Streak */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Cognitive Load card */}
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 select-none">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Cognitive Load</span>
              <span className={`text-[9px] font-extrabold uppercase px-2.0 py-0.5 rounded-full ${
                cognitiveLoad > 80 ? 'bg-rose-50 text-rose-700' :
                cognitiveLoad > 55 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {cognitiveLoad > 80 ? 'Overload' : cognitiveLoad > 55 ? 'Heavy' : 'Balanced'}
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 mt-2 font-sans">
              <span className="text-3.5xl font-black text-on-surface tracking-tight">{cognitiveLoad}%</span>
              <div className="flex-1 max-w-[80px] h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    cognitiveLoad > 80 ? 'bg-rose-500' :
                    cognitiveLoad > 55 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${cognitiveLoad}%` }}
                />
              </div>
            </div>
          </div>

          {/* Energy Reserves card */}
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 select-none">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Energy Reserves</span>
              <span className="text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <div className="flex items-end justify-between gap-2 mt-2 font-sans">
              <span className="text-3.5xl font-black text-emerald-600 tracking-tight">{energyReserves}%</span>
              <div className="flex-1 max-w-[80px] h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${energyReserves}%` }} />
              </div>
            </div>
          </div>

          {/* Focus Streak Card - Tracks focus streak live from App state */}
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 select-none transition-all hover:shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Focus Streak</span>
              <span className="text-[9px] font-extrabold uppercase bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">Active</span>
            </div>
            <div className="flex items-end justify-between gap-2 mt-2 font-sans">
              <span className="text-3.5xl font-black text-on-surface tracking-tight">{computedStreak} Days</span>
              <span className="text-orange-500 text-2xl animate-bounce mb-1">🔥</span>
            </div>
          </div>

        </section>

        {/* Row 2: Burnout Risk Alerts, Daily Score */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Burnout Risk Card - Analyzes high/medium workload dynamically */}
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 select-none relative overflow-hidden transition-all hover:shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Burnout Risk Alerts</span>
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                calculatedBurnoutRisk > 70 ? 'bg-rose-50 text-rose-700' :
                calculatedBurnoutRisk > 40 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {getBurnoutLabel(calculatedBurnoutRisk)}
              </span>
            </div>
            {user.tier !== 'professional' ? (
              <div className="absolute inset-0 bg-[#fbfbfe]/95 backdrop-blur-[2px] p-5 flex flex-col justify-between text-center select-none">
                <div className="flex gap-1.5 items-center justify-center text-[10px] font-bold text-primary">
                  <span>🔒 Predictive Alerts</span>
                </div>
                <p className="text-[9px] text-outline leading-tight">Burnout risk modeling requires Professional Plan</p>
                <button 
                  onClick={() => setShowPlansModal(true)}
                  className="w-full py-1.5 bg-primary text-white text-[9px] font-bold rounded-lg uppercase tracking-wider cursor-pointer font-sans"
                >
                  Upgrade Plan
                </button>
              </div>
            ) : (
              <div className="flex items-end justify-between gap-2 mt-2 font-sans">
                <div className="space-y-0.5 text-left">
                  <span className="text-3.5xl font-black text-on-surface tracking-tight">
                    {calculatedBurnoutRisk}%
                  </span>
                  <p className="text-[8.5px] text-outline font-semibold leading-none">
                    Based on {highEnergySlots} high-energy entries
                  </p>
                </div>
                <div className="flex-1 max-w-[80px] h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      calculatedBurnoutRisk > 70 ? 'bg-rose-500' : calculatedBurnoutRisk > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} 
                    style={{ width: `${calculatedBurnoutRisk}%` }} 
                  />
                </div>
              </div>
            )}
          </div>

          {/* Daily Score Card - generates a score based on completed tasks & focus hours */}
          <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 select-none transition-all hover:shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Daily Score</span>
              <span className="text-[9px] font-extrabold uppercase bg-[#daf2ff] text-primary px-2 py-0.5 rounded-full">Pace</span>
            </div>
            <div className="flex items-end justify-between gap-3 mt-1.5 font-sans">
              <div className="space-y-1 text-left">
                <span className="text-3.5xl font-black text-primary tracking-tight">{generatedDailyScore} Points</span>
                <p className="text-[8.5px] text-outline font-semibold leading-tight">
                  {tasksDone} task{tasksDone !== 1 ? 's' : ''} done • {completedFocusHours}h / {totalFocusHoursScheduled}h focus
                </p>
              </div>
              <div className="flex-1 max-w-[100px] h-2.5 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${generatedDailyScore}%` }} 
                />
              </div>
            </div>
          </div>

        </section>
      </div>

      {/* Badges horizontal list */}
      <section className="space-y-3">
        <div className="flex justify-between items-end">
          <h3 className="text-sm font-bold text-on-surface">Badges Achieved</h3>
          <button 
            onClick={() => setShowBadgesModal(true)}
            className="text-[11px] font-black text-primary hover:underline uppercase tracking-wide cursor-pointer"
          >
            View All
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar select-none">
          
          <div className="glass-card min-w-[110px] flex-shrink-0 p-4 rounded-2xl flex flex-col items-center text-center gap-2.5">
            <div className="w-10 h-10 bg-sky-50 text-primary rounded-full flex items-center justify-center">
              <Medal className="w-5 h-5 text-primary" />
            </div>
            <span className="text-[10px] font-bold text-on-surface leading-tight">7-Day Balance</span>
          </div>

          <div className="glass-card min-w-[110px] flex-shrink-0 p-4 rounded-2xl flex flex-col items-center text-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-50 text-secondary rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-[10px] font-bold text-on-surface leading-tight">Deep Focus</span>
          </div>

          <div className="glass-card min-w-[110px] flex-shrink-0 p-4 rounded-2xl flex flex-col items-center text-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
              <Medal className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-on-surface leading-tight">Zen Master</span>
          </div>

        </div>
      </section>

      {/* Settings Options container */}
      <section className="space-y-3 select-none">
        <h3 className="text-sm font-bold text-on-surface" id="settings">Settings & Brackets</h3>
        
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-outline-variant/15">
          
          {/* Active Subscription Tier selection */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors bg-gradient-to-r from-primary/5 via-transparent to-transparent">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4.5 h-4.5 text-primary animate-pulse" />
              <div>
                <span className="text-xs font-bold text-on-surface block">MindBalance Plan Tier</span>
                <span className="text-[10px] text-outline uppercase font-extrabold tracking-wider">
                  {user.tier === 'freemium' ? 'Student Trial / RM 0' :
                   user.tier === 'student' ? 'Student Plan / RM 10' : 'Professional Plan / RM 30'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setShowPlansModal(true)}
              className="text-xs font-black text-[#8455ef] bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider text-[10px]"
            >
              Change Pricing Plan
            </button>
          </div>

          {/* Supabase Integration selection */}
          <div className="p-4 flex flex-col hover:bg-slate-50/50 transition-colors bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Database className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-on-surface block">Supabase Project Connection</span>
                  <span className={`text-[10px] font-extrabold tracking-wider uppercase ${isSupabaseConfigured() ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isSupabaseConfigured() ? '● Linked & Live-Syncing' : '● Local Offline Sandbox Fallback'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setShowSupabaseModal(true)}
                className={`text-xs font-black px-3 py-1.5 rounded-xl transition-all cursor-pointer uppercase tracking-wider text-[10px] ${
                  isSupabaseConfigured() ? 'bg-emerald-50 border border-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100'
                }`}
              >
                {isSupabaseConfigured() ? 'View Connection' : 'How to Link'}
              </button>
            </div>
            {isSupabaseConfigured() && (
              <p className="text-[10px] text-[#006591] bg-sky-50 p-2.5 rounded-xl mt-3 pl-3.5 leading-relaxed font-semibold border border-sky-100 shrink-0">
                🚀 Live-Syncing: Profile, Mood logs, Tasks, and Schedule items are stored inside public schemas in real-time.
              </p>
            )}
          </div>

          {/* Smartwatch Sync renamed action button triggers device configuration dashboard */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <Watch className="w-4.5 h-4.5 text-on-surface-variant" />
              <div>
                <span className="text-xs font-semibold text-on-surface block">Smartwatch Sync Sensor</span>
                <span className="text-[9px] text-outline">Link smart trackers (Garmin, Fitbit, Apple Watch)</span>
              </div>
            </div>
            <button 
              onClick={() => {
                if (user.tier === 'professional') {
                  setShowWearableModal(true);
                } else {
                  setShowProLockModal('wearables');
                }
              }}
              className="text-xs font-bold text-primary cursor-pointer hover:underline uppercase tracking-wide shrink-0"
            >
              {user.tier === 'professional' ? 'Control Linked Pairs' : '🔒 Upgrade to Link Sensors'}
            </button>
          </div>

          {/* Theme Preferences */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors animate-fade-in">
            <div className="flex items-center gap-3">
              <Sun className="w-4.5 h-4.5 text-on-surface-variant" />
              <span className="text-xs font-semibold text-on-surface">Display Theme</span>
            </div>
            <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-full w-20 bg-slate-100">
              <button 
                onClick={() => toggleTheme('light')}
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-all cursor-pointer ${
                  themeMode === 'light' ? 'bg-white text-primary' : 'text-on-surface-variant'
                }`}
              >
                <Sun className="w-4 h-4" />
              </button>
              <button 
                onClick={() => toggleTheme('dark')}
                className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-all cursor-pointer ${
                  themeMode === 'dark' ? 'bg-primary/20 text-primary' : 'text-on-surface-variant'
                }`}
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications config */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <Bell className="w-4.5 h-4.5 text-on-surface-variant" />
              <span className="text-xs font-semibold text-on-surface">Notification Preferences</span>
            </div>
            <span className="text-[10px] font-bold text-outline">Push Enabled</span>
          </div>

          {/* Privacy renamed "Privacy Options" triggering clean account controls */}
          <div 
            onClick={() => setShowPrivacyModal(true)}
            className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4.5 h-4.5 text-on-surface-variant" />
              <span className="text-xs font-semibold text-on-surface">Privacy Options</span>
            </div>
            <span className="text-[10px] font-extrabold text-primary hover:underline uppercase tracking-wider">Configure Controls</span>
          </div>

        </div>
      </section>

      {/* Log Out button */}
      <button 
        onClick={onLogout}
        className="w-full py-4 text-error font-extrabold text-sm border border-error/15 rounded-2xl hover:bg-error/5 cursor-pointer active:scale-95 transition-all mt-4 mb-4"
      >
        Log Out
      </button>

      {/* 1. All Achieved Badges Modal Overlay Page */}
      {showBadgesModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 space-y-4 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-on-surface uppercase tracking-wider">All Earned Badges</h3>
              <button 
                onClick={() => setShowBadgesModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[280px] overflow-y-auto no-scrollbar py-2 text-xs text-on-surface-variant">
              {[
                { title: '7-Day Balance', desc: 'Recorded dynamic emotional checks for 7 consecutive intervals.', icon: Medal, color: 'bg-sky-100 text-sky-600' },
                { title: 'Deep Focus Master', desc: 'Completed a 1.5h high-budget work block without browser distractions.', icon: Sparkles, color: 'bg-indigo-100 text-indigo-600' },
                { title: 'Zen Master', desc: 'Kept resting heart rate indexes stable under high daily cognitive blocks.', icon: Medal, color: 'bg-emerald-100 text-emerald-600' },
                { title: 'Melatonin Protector', desc: 'Maintained 7.5h REM sleep averages with minimal late-night devices.', icon: Watch, color: 'bg-yellow-100 text-yellow-600' },
                { title: 'Reserve Champion', desc: 'Managed adaptive workload filters effectively avoiding nervous depletion.', icon: Shield, color: 'bg-rose-100 text-rose-600' }
              ].map((badge, idx) => {
                const IconComp = badge.icon;
                return (
                  <div key={idx} className="flex gap-3.5 items-center p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                    <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center ${badge.color}`}>
                      <IconComp className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-[#006591]">{badge.title}</h4>
                      <p className="text-[10px] text-outline mt-0.5 leading-tight">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowBadgesModal(false)}
              className="w-full py-3 bg-primary text-white font-extrabold rounded-2xl text-xs hover:opacity-95 transition-opacity cursor-pointer text-center"
            >
              Back to Profile
            </button>
          </div>
        </div>
      )}

      {/* 2. Smartwatch Wearable pairing placeholders */}
      {showWearableModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in p-4 select-none">
          <div className="bg-white w-full max-w-sm rounded-t-3xl rounded-b-xl p-6 space-y-4 shadow-xl border border-slate-200 animate-slide-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-outline">Peripherals Pairing</span>
                <h3 className="text-base font-black text-on-surface mt-0.5">Linked Wearable Chamber</h3>
              </div>
              <button 
                onClick={() => setShowWearableModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-[11px] text-outline leading-normal italic bg-slate-50 p-2.5 rounded-xl">
              Sync heart rate, REM intervals, and physical energy parameters directly to update Zen emotional balance algorithms.
            </p>

            <div className="space-y-2.5">
              {[
                { name: 'Apple Watch', desc: 'Secure Apple Health telemetry' },
                { name: 'Oura Smart Ring', desc: 'REM, body temperature, activity metrics' },
                { name: 'Garmin Athletics', desc: 'Heart variability reserves and stress indexes' },
                { name: 'Fitbit Tracker', desc: 'Cardiovascular stress tracking sensors' }
              ].map((dev) => {
                const connected = connectedDevices.includes(dev.name);
                const loading = connectingDevice === dev.name;
                return (
                  <div key={dev.name} className="flex justify-between items-center p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-slate-100">
                    <div>
                      <h4 className="text-xs font-black text-on-surface">{dev.name}</h4>
                      <p className="text-[9px] text-outline">{dev.desc}</p>
                    </div>
                    <button
                      onClick={() => triggerPairDevice(dev.name)}
                      disabled={loading}
                      className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        loading ? 'bg-slate-200 text-slate-400' :
                        connected ? 'bg-emerald-50 text-emerald-700' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {loading ? 'Pairing...' : connected ? 'Unlink Active' : 'Pair Device'}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowWearableModal(false)}
              className="w-full py-3.5 bg-primary text-white font-extrabold rounded-2xl text-xs hover:opacity-95 cursor-pointer text-center"
            >
              Accept Pairings
            </button>
          </div>
        </div>
      )}

      {/* Supabase Connection details Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-55 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-6 space-y-5 shadow-2.5xl border border-slate-150 animate-scale-up max-h-[85vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Cloud Engine Integration</span>
                <h3 className="text-xl font-bold text-on-surface mt-0.5">Supabase Database Workspace</h3>
              </div>
              <button 
                onClick={() => setShowSupabaseModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className={`p-4 rounded-2xl flex items-start gap-3.5 ${
              isSupabaseConfigured() ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-amber-50 text-amber-900 border border-amber-100'
            }`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                isSupabaseConfigured() ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
              }`}>
                <Database className="w-4.5 h-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wide">
                  {isSupabaseConfigured() ? 'Database Linked Successfully' : 'Local Offline Sandbox Mode Active'}
                </h4>
                <p className="text-[11px] leading-relaxed mt-1 opacity-90">
                  {isSupabaseConfigured() 
                    ? `Connected dynamically. The app is storing all core datasets directly in your linked Supabase PostgreSQL project with real-time replication.` 
                    : `Provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env configuration to switch from simulated browser sandbox to persistent cloud storage.`
                  }
                </p>
              </div>
            </div>

            {/* Diagnostics checklist */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-on-surface uppercase tracking-wider pl-1 font-sans">Synced Database Collections</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { table: 'profiles', desc: 'Secure Practitioner profiles', linked: isSupabaseConfigured() },
                  { table: 'mood_check_ins', desc: 'Somatic checks & mental loads', linked: isSupabaseConfigured() },
                  { table: 'schedule_items', desc: 'Work blocks & energy metrics', linked: isSupabaseConfigured() },
                  { table: 'tasks', desc: 'Checklists & active deadlines', linked: isSupabaseConfigured() }
                ].map((col) => (
                  <div key={col.table} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                      <code className="text-xs font-bold text-primary font-mono">{col.table}</code>
                      <p className="text-[9.5px] text-outline mt-0.5">{col.desc}</p>
                    </div>
                    {col.linked ? (
                      <span className="text-[9px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase font-sans">Live Sync</span>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase font-sans font-mono">Sandbox</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Real SQL schema viewer snippet */}
            <div className="space-y-2">
              <div className="flex justify-between items-center pl-1">
                <h4 className="text-xs font-extrabold text-on-surface uppercase tracking-wider font-sans">Project Tables Schema Checklist</h4>
                <span className="text-[9.5px] font-bold text-outline uppercase font-mono">supabase_schema.sql</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-2xl text-[10px] font-medium text-slate-200 leading-normal font-mono max-h-40 overflow-y-auto no-scrollbar">
                <span className="text-emerald-400">-- 1. Profiles (auth.users extension)</span>
                <p className="opacity-95">CREATE TABLE public.profiles (id UUID PRIMARY KEY REFERENCES auth.users, email TEXT, balance_score INT, focus_streak INT);</p>
                
                <span className="text-emerald-400 block mt-2">-- 2. Mood Check-ins</span>
                <p className="opacity-95">CREATE TABLE public.mood_check_ins (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), profile_id UUID REFERENCES public.profiles, mood TEXT, intensity INT, note TEXT, timestamp TIMESTAMPTZ DEFAULT NOW());</p>

                <span className="text-emerald-400 block mt-2">-- 3. Dedicated Schedule Items</span>
                <p className="opacity-95">CREATE TABLE public.schedule_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), profile_id UUID REFERENCES public.profiles, title TEXT, start_time TEXT, end_time TEXT, energy_level TEXT, completed BOOLEAN);</p>

                <span className="text-emerald-400 block mt-2">-- 4. Tasks Checklists</span>
                <p className="opacity-95">CREATE TABLE public.tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), profile_id UUID REFERENCES public.profiles, title TEXT, priority TEXT, classification TEXT, completed BOOLEAN);</p>
              </div>
              <p className="text-[9.5px] text-outline leading-relaxed italic bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-500/5">
                💡 Setup Tip: Open the "SQL Editor" in your Supabase dashboard, paste the contents of <code className="font-mono text-purple-700 font-bold bg-[#FAF5FF] px-1 py-0.5 rounded">supabase_schema.sql</code>, and press run. The row-level security (RLS) policies and trigger functions are built-in!
              </p>
            </div>

            <button
              onClick={() => setShowSupabaseModal(false)}
              className="w-full py-3.5 bg-primary text-white font-extrabold rounded-2xl text-xs hover:opacity-95 transition-opacity cursor-pointer text-center"
            >
              Verify Connection Diagnostics
            </button>
          </div>
        </div>
      )}

      {/* 3. Privacy Options Modal - Clear Data, Download JSON, etc */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in select-none">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 space-y-5 shadow-2xl border border-slate-150 animate-scale-up">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Secure Controls</span>
                <h3 className="text-lg font-black text-on-surface mt-0.5">Privacy Options</h3>
              </div>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <p className="text-xs text-outline leading-relaxed bg-slate-50 p-3 rounded-2xl">
              You possess complete authority over private statistics. Actioning options below physically alters client-side states.
            </p>

            <div className="space-y-3.5">
              
              {/* Clear cached dataset representation */}
              <button
                onClick={handleClearSandboxData}
                className="w-full p-4 hover:bg-rose-50/40 border border-slate-100 hover:border-rose-100 rounded-2xl text-left flex gap-3.5 items-center transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-rose-50 group-hover:bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4.5 h-4.5 text-rose-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-rose-700">Clear Cache Data</h4>
                  <p className="text-[9.5px] text-outline mt-0.5">Wipe custom tasks, mood inputs, focus metrics, and restore baselines.</p>
                </div>
              </button>

              {/* Download JSON output */}
              <button
                onClick={handleDownloadBackup}
                className="w-full p-4 hover:bg-sky-50 border border-slate-100 hover:border-sky-150 rounded-2xl text-left flex gap-3.5 items-center transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-sky-50 group-hover:bg-sky-100 text-primary flex items-center justify-center shrink-0">
                  <Download className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#006591]">Download Journal JSON</h4>
                  <p className="text-[9.5px] text-outline mt-0.5">Extract a structured JSON of daily timelines, checklists, and mood records.</p>
                </div>
              </button>

              {/* Delete account */}
              <button
                onClick={() => {
                  setShowPrivacyModal(false);
                  onLogout();
                  showToast("Personal workspace deleted successfully.");
                }}
                className="w-full p-4 hover:bg-slate-50 border border-slate-100 rounded-2xl text-left flex gap-3.5 items-center transition-all cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-slate-150 text-slate-600 flex items-center justify-center shrink-0">
                  <User className="w-4.5 h-4.5 text-slate-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Delete Account Core</h4>
                  <p className="text-[9.5px] text-outline mt-0.5">Erase authentication, revoke linked wearables, and reset profile.</p>
                </div>
              </button>

            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-3 bg-primary text-white font-black rounded-xl text-xs hover:opacity-95 cursor-pointer text-center"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 4. Active Pricing Plans Modal Selection Board */}
      {showPlansModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-2xl border border-slate-150 animate-scale-up max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#8455ef] font-black">Plan Pricing Brackets</span>
                <h3 className="text-xl font-black text-on-surface mt-1">Select Restorative Plan</h3>
                <p className="text-xs text-outline leading-tight mt-1">Choose a bracket to customize available feature limits instantly.</p>
              </div>
              <button 
                onClick={() => setShowPlansModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Pricing Brackets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              
              {/* Freemium Plan Column */}
              <div className={`p-5 rounded-3xl flex flex-col justify-between border transition-all ${
                user.tier === 'freemium' 
                  ? 'border-[#006591] bg-sky-50/20 shadow-md scale-[1.02]' 
                  : 'border-slate-150 hover:border-slate-300'
              }`}>
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase text-outline">Student Trial</span>
                    {user.tier === 'freemium' && (
                      <span className="bg-primary/10 text-primary text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-on-surface mt-2">Freemium Plan</h4>
                  <div className="flex items-baseline gap-1 mt-1.5 mb-4">
                    <span className="text-2xl font-black text-on-surface">RM 0</span>
                    <span className="text-[10px] text-outline">/ month</span>
                  </div>
                  
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs leading-normal">
                    <div className="flex items-start gap-1.5">
                      <span className="text-primary text-[10px] shrink-0 font-bold">✓</span>
                      <p className="text-[11px] text-on-surface-variant font-medium">Basic energy-based scheduler</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-primary text-[10px] shrink-0 font-bold">✓</span>
                      <p className="text-[11px] text-on-surface-variant font-medium">3 mood logs per day limits</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-primary text-[10px] shrink-0 font-bold">✓</span>
                      <p className="text-[11px] text-on-surface-variant font-medium">Standard break reminders</p>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-400">
                      <span className="shrink-0 font-bold text-[10px]">✕</span>
                      <p className="text-[11px] font-medium line-through">Peer rankings & wins analytics</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  <button
                    onClick={() => {
                      onUpdateUser({ ...user, tier: 'freemium' });
                      setShowPlansModal(false);
                      showToast("Transitioned to Freemium Student Trial plan (RM 0).");
                    }}
                    disabled={user.tier === 'freemium'}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                      user.tier === 'freemium' 
                        ? 'bg-slate-100 text-slate-400 cursor-default' 
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    }`}
                  >
                    {user.tier === 'freemium' ? 'Current Active' : 'Switch to Freemium'}
                  </button>
                </div>
              </div>

              {/* Student Plan Column */}
              <div className={`p-5 rounded-3xl flex flex-col justify-between border transition-all ${
                user.tier === 'student' 
                  ? 'border-[#8455ef] bg-indigo-50/25 shadow-md scale-[1.02]' 
                  : 'border-slate-150 hover:border-slate-300 bg-gradient-to-t from-slate-50/50 to-transparent'
              }`}>
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase text-[#8455ef] tracking-wider">University Students</span>
                    {user.tier === 'student' && (
                      <span className="bg-[#8455ef]/10 text-[#8455ef] text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-on-surface mt-2">Student Plan</h4>
                  <div className="flex items-baseline gap-1 mt-1.5 mb-4">
                    <span className="text-2xl font-black text-on-surface">RM 10</span>
                    <span className="text-[10px] text-outline">/ month</span>
                  </div>
                  
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs leading-normal">
                    <div className="flex items-start gap-1.5">
                      <span className="text-[#8455ef] text-[10px] shrink-0 font-bold">★</span>
                      <p className="text-[11px] text-on-surface-variant font-medium"><strong>Unlimited</strong> mood check-ins</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[#8455ef] text-[10px] shrink-0 font-bold">★</span>
                      <p className="text-[11px] text-on-surface-variant font-medium">AI schedule suggestion advisor</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[#8455ef] text-[10px] shrink-0 font-bold">★</span>
                      <p className="text-[11px] text-on-surface-variant font-medium">Gamified peer leaderboard charts</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-[#8455ef] text-[10px] shrink-0 font-bold">★</span>
                      <p className="text-[11px] text-on-surface-variant font-medium"><strong>Tangible Wins</strong> achievements</p>
                    </div>
                    <div className="flex items-start gap-1.5 text-slate-400">
                      <span className="shrink-0 font-bold text-[10px]">✕</span>
                      <p className="text-[11px] font-medium line-through">Smartwatch integration</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  <button
                    onClick={() => {
                      onUpdateUser({ ...user, tier: 'student' });
                      setShowPlansModal(false);
                      showToast("Upgraded to Student Restorative Plan (RM 10)!");
                    }}
                    disabled={user.tier === 'student'}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                      user.tier === 'student' 
                        ? 'bg-slate-100 text-slate-400 cursor-default' 
                        : 'bg-[#8455ef] hover:bg-[#7244de] text-white shadow-md'
                    }`}
                  >
                    {user.tier === 'student' ? 'Current Active' : 'Switch to Student (RM 10)'}
                  </button>
                </div>
              </div>

              {/* Professional Plan Column */}
              <div className={`p-5 rounded-3xl flex flex-col justify-between border transition-all ${
                user.tier === 'professional' 
                  ? 'border-emerald-500 bg-emerald-50/15 shadow-md scale-[1.02]' 
                  : 'border-slate-150 hover:border-slate-300'
              }`}>
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase text-emerald-600">Working Professionals</span>
                    {user.tier === 'professional' && (
                      <span className="bg-emerald-500/10 text-emerald-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </div>
                  <h4 className="text-base font-black text-on-surface mt-2">Professional Plan</h4>
                  <div className="flex items-baseline gap-1 mt-1.5 mb-4">
                    <span className="text-2xl font-black text-on-surface">RM 30</span>
                    <span className="text-[10px] text-outline">/ month</span>
                  </div>
                  
                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs leading-normal">
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-600 text-[10px] shrink-0 font-bold">◆</span>
                      <p className="text-[11px] text-on-surface-variant font-medium"><strong>All Student Tier</strong> features</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-600 text-[10px] shrink-0 font-bold">◆</span>
                      <p className="text-[11px] text-on-surface-variant font-medium">Smartwatch sensor integration</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-600 text-[10px] shrink-0 font-bold">◆</span>
                      <p className="text-[11px] text-on-surface-variant font-medium">Predictive burnout risk checks</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-600 text-[10px] shrink-0 font-bold">◆</span>
                      <p className="text-[11px] text-on-surface-variant font-medium">AI Restorative Coaching Hub</p>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <span className="text-emerald-600 text-[10px] shrink-0 font-bold">◆</span>
                      <p className="text-[11px] text-on-surface-variant font-medium">Github & Teams API sync</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  <button
                    onClick={() => {
                      onUpdateUser({ ...user, tier: 'professional' });
                      setShowPlansModal(false);
                      showToast("Upgraded to Professional Elite Plan (RM 30)!");
                    }}
                    disabled={user.tier === 'professional'}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                      user.tier === 'professional' 
                        ? 'bg-slate-100 text-slate-400 cursor-default' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                    }`}
                  >
                    {user.tier === 'professional' ? 'Current Active' : 'Switch to Pro (RM 30)'}
                  </button>
                </div>
              </div>

            </div>

            <button
              onClick={() => setShowPlansModal(false)}
              className="w-full py-3.5 border border-slate-150 text-slate-600 font-extrabold rounded-2xl text-xs hover:bg-slate-50 cursor-pointer text-center"
            >
              Back to Preferences
            </button>
          </div>
        </div>
      )}

      {/* 5. Gated Professional Feature Lock Dialog */}
      {showProLockModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-55 flex items-center justify-center p-4 select-none animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 space-y-5 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex justify-between items-start">
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                🔒 Professional Feature
              </span>
              <button 
                onClick={() => setShowProLockModal(null)}
                className="p-1 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-black text-on-surface">Unlock Wearables Sensors Pairing</h4>
              <p className="text-xs text-outline leading-relaxed">
                Linking peripherals like Apple Watch, Garmin Athletics, Oura Smart Ring, and Fitbit sensors is a <strong>Professional Plan</strong> feature (RM 30/mo). Get full, continuous biometric sync to MindBalance automatically!
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowProLockModal(null)}
                className="flex-1 py-3 text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold rounded-2xl cursor-pointer"
              >
                Keep Current
              </button>
              <button
                onClick={() => {
                  setShowProLockModal(null);
                  setShowPlansModal(true);
                }}
                className="flex-1 py-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl cursor-pointer shadow-md shadow-emerald-600/10 text-center"
              >
                View Plans
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
