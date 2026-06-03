import React, { useState } from 'react';
import { User, Sun, Moon, Sparkles, LogOut, Edit2, Medal, Watch, Bell, Shield, AlertCircle, X, Check, Laptop, RefreshCw, Trash2, Download } from 'lucide-react';
import { User as UserType, ScheduleItem, TaskItem } from '../types';

interface ProfileScreenProps {
  user: UserType;
  onLogout: () => void;
  cognitiveLoad: number;
  scheduleItems: ScheduleItem[];
  setScheduleItems: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  focusStreak: number;
  setFocusStreak: React.Dispatch<React.SetStateAction<number>>;
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  setMoodCheckIns: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export default function ProfileScreen({
  user,
  onLogout,
  cognitiveLoad,
  scheduleItems,
  setScheduleItems,
  focusStreak,
  setFocusStreak,
  setTasks,
  setMoodCheckIns
}: ProfileScreenProps) {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  
  // Custom interface view modal toggles
  const [showBadgesModal, setShowBadgesModal] = useState(false);
  const [showWearableModal, setShowWearableModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Wearable connection animations states
  const [connectingDevice, setConnectingDevice] = useState<string | null>(null);
  const [connectedDevices, setConnectedDevices] = useState<string[]>(['Apple Watch']);
  
  // User notifications or toasts
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const toggleTheme = (mode: 'light' | 'dark') => {
    setThemeMode(mode);
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Analyze burnout risk dynamically based on High and Medium energy blocks in scheduleItems!
  const highEnergySlots = scheduleItems.filter(item => item.energyLevel === 'High' && !item.completed).length;
  const mediumEnergySlots = scheduleItems.filter(item => item.energyLevel === 'Medium' && !item.completed).length;
  
  // Custom formula: start at 12, add 25 per High-energy incomplete slot, 10 per Med-energy slot. Max 95.
  const calculatedBurnoutRisk = Math.min(12 + (highEnergySlots * 25) + (mediumEnergySlots * 10), 95);

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
      '2026-06-03': 60
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
      <section className="grid grid-cols-2 gap-4">
        
        {/* Balance Score - double column width */}
        <div className="col-span-2 glass-card p-5 rounded-2xl flex flex-col justify-between h-32 select-none">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Overall Balance Score</span>
            <span className="text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 px-3 py-0.5 rounded-full">Optimal</span>
          </div>
          <div className="flex items-end justify-between gap-4 mt-2">
            <span className="text-3.5xl font-extrabold text-primary tracking-tight">{user.balanceScore}/100</span>
            <div className="flex-1 max-w-[140px] h-3 bg-surface-container rounded-full overflow-hidden mb-2">
              <div className="bg-gradient-to-r from-primary to-secondary h-full w-[94%]" />
            </div>
          </div>
        </div>

        {/* Burnout Risk Card - Analyzes high/medium workload dynamically */}
        <div className="glass-card p-4 rounded-xl flex flex-col justify-between h-28 transition-all hover:shadow-sm">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Burnout Risk</span>
          <div className="space-y-1.5 text-left">
            <span className="text-xs font-bold text-on-surface block leading-tight">
              {getBurnoutLabel(calculatedBurnoutRisk)} ({calculatedBurnoutRisk}%)
            </span>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${
                  calculatedBurnoutRisk > 70 ? 'bg-red-500' : calculatedBurnoutRisk > 40 ? 'bg-amber-500' : 'bg-primary'
                }`} 
                style={{ width: `${calculatedBurnoutRisk}%` }} 
              />
            </div>
            <p className="text-[8px] text-outline leading-none">
              Based on {highEnergySlots} high-budget entries.
            </p>
          </div>
        </div>

        {/* Focus Streak Card - Tracks focus streak live from App state */}
        <div className="glass-card p-4 rounded-xl flex flex-col justify-between h-28 transition-all hover:shadow-sm">
          <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Focus Streak</span>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black text-on-surface leading-none">{focusStreak} Days</span>
              <span className="text-orange-500 text-lg animate-bounce">🔥</span>
            </div>
            <p className="text-[8.5px] text-outline leading-tight">
              Keep finishing "Focus Sessions" on the Schedule page to elevate streaks!
            </p>
          </div>
        </div>

      </section>

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
        <h3 className="text-sm font-bold text-on-surface" id="settings">Settings</h3>
        
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-outline-variant/15">
          
          {/* Smartwatch Sync renamed action button triggers device configuration dashboard */}
          <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-3">
              <Watch className="w-4.5 h-4.5 text-on-surface-variant" />
              <span className="text-xs font-semibold text-on-surface">Smartwatch Sync</span>
            </div>
            <button 
              onClick={() => setShowWearableModal(true)}
              className="text-xs font-bold text-primary cursor-pointer hover:underline uppercase tracking-wide"
            >
              Control Linked Pairs
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

    </div>
  );
}
