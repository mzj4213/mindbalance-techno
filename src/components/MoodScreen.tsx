import React, { useState } from 'react';
import { Heart, Moon, Zap, Brain, AlertTriangle, ChevronDown, Sparkles, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { MoodType, User as UserType, MoodCheckInEntry } from '../types';

interface MoodScreenProps {
  user: UserType;
  onUpdateUser: (updated: UserType) => void;
  currentMood: MoodType;
  moodIntensity: number;
  moodCheckIns: Record<string, MoodCheckInEntry[]>;
  setMoodCheckIns: React.Dispatch<React.SetStateAction<Record<string, MoodCheckInEntry[]>>>;
  heartRate: number;
  energyReserves: number;
}

export default function MoodScreen({
  user,
  onUpdateUser,
  currentMood,
  moodIntensity,
  moodCheckIns,
  setMoodCheckIns,
  heartRate,
  energyReserves
}: MoodScreenProps) {
  // Calendar monthly navigation helper state
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(2026, 5, 1)); // defaults to June 2026

  const handleMonthNav = (direction: 'prev' | 'next') => {
    const nextMonth = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + (direction === 'prev' ? -1 : 1), 1);
    setCurrentMonthDate(nextMonth);
  };

  const [expandedInsights, setExpandedInsights] = useState<Record<string, boolean>>({
    consistency: false,
    sleep: false
  });
  const [showUpsellNotice, setShowUpsellNotice] = useState(false);

  const toggleInsight = (id: string) => {
    setExpandedInsights((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;

  // Pre-seeded values for the current calendar month (June 2026) to make it visually attractive and accurate
  const defaultCalendarLogs: Record<string, number> = {
    '2026-06-01': 50, // blue (okay)
    '2026-06-02': 80, // dark green (focused)
    '2026-06-03': 65, // light green (good)
    '2026-06-04': 40, // red (sad)
    '2026-06-05': 90, // yellow (energized)
    '2026-06-08': 75, // dark green (focused)
    '2026-06-09': 48, // blue (okay)
    '2026-06-10': 68, // light green (good)
    '2026-06-12': 38, // red (sad)
    '2026-06-14': 85, // dark green (focused)
  };

  const mergedLogs: Record<string, MoodCheckInEntry[]> = {};
  Object.entries(defaultCalendarLogs).forEach(([key, val]) => {
    mergedLogs[key] = [{ value: val, time: '09:30 AM', date: key }];
  });
  Object.entries(moodCheckIns).forEach(([key, vals]) => {
    mergedLogs[key] = vals;
  });
  const [selectedDayDay, setSelectedDayDay] = useState<number | null>(15);

  const getMoodDetails = (val: number | undefined) => {
    if (val === undefined) return { label: 'Unlogged', colorClass: 'bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-300' };
    
    if (val <= 45) {
      return { label: 'Sad', colorClass: 'bg-rose-500 hover:bg-rose-600 border border-rose-600 text-white' };
    } else if (val <= 55) {
      return { label: 'Okay', colorClass: 'bg-blue-500 hover:bg-blue-600 border border-blue-600 text-white' };
    } else if (val <= 70) {
      return { label: 'Good', colorClass: 'bg-emerald-300 hover:bg-emerald-400 border border-emerald-400 text-emerald-950 font-extrabold' };
    } else if (val <= 85) {
      return { label: 'Focused', colorClass: 'bg-emerald-700 hover:bg-emerald-800 border border-emerald-800 text-white font-extrabold' };
    } else {
      return { label: 'Energized', colorClass: 'bg-amber-400 hover:bg-amber-500 border border-amber-500 text-amber-950 font-extrabold' };
    }
  };

  return (
    <div className="space-y-6 select-none animate-fade-in text-on-surface">
      
      {/* Responsive layout shell: dual-pane widescreen, stacked mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left main pane: Trend charts & telemetry cards list */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Dynamic Mood Journal Calendar with Month Switching Navigation */}
          <section>
            <div className="glass-card p-6 rounded-3xl shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-outline mb-1 uppercase tracking-wider">Mood Calendar</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button 
                      type="button"
                      onClick={() => handleMonthNav('prev')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-outline hover:text-on-surface cursor-pointer select-none"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-lg font-black text-on-surface">
                      {monthNames[month]} {year}
                    </h2>
                    <button 
                      type="button"
                      onClick={() => handleMonthNav('next')}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-outline hover:text-on-surface cursor-pointer select-none"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">
                  Monthly View
                </span>
              </div>

              <p className="text-[11px] text-outline leading-tight">
                Each calendar box is color-coded by that day's mood logs. Click any logged cell to inspect details below.
              </p>

              {/* Day headers Mon - Sun */}
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-extrabold text-outline uppercase tracking-wider bg-slate-50 p-2 rounded-xl border border-slate-100">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>

              {/* Monthly Days Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for weekday offset */}
                {Array.from({ length: firstDayIndex }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="h-11 rounded-xl bg-slate-50/20 border border-dashed border-slate-150/10" />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const dayNum = index + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const loggedVals = mergedLogs[dateStr];
                  const loggedEntry = loggedVals && loggedVals.length > 0 ? loggedVals[loggedVals.length - 1] : undefined;
                  const loggedVal = loggedEntry ? loggedEntry.value : undefined;
                  const { label, colorClass } = getMoodDetails(loggedVal);
                  const isSelected = selectedDayDay === dayNum;

                  return (
                    <button
                      key={dayNum}
                      onClick={() => setSelectedDayDay(dayNum)}
                      className={`h-11 rounded-xl flex flex-col justify-between p-1.5 transition-all outline-none cursor-pointer ${colorClass} ${
                        isSelected ? 'ring-2 ring-primary ring-offset-2 scale-102 shadow-sm' : ''
                      }`}
                      title={`${monthNames[month]} ${dayNum}, ${year}: ${label}`}
                    >
                      <span className="text-[9px] font-bold block leading-none antialiased">
                        {dayNum}
                      </span>
                      {loggedVal !== undefined && (
                        <span className="text-[7.5px] font-black uppercase tracking-tight block text-center truncate max-w-full leading-none mt-auto">
                          {label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Calendar Legend & Selected Detail inspect panel */}
              <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
                {/* Mood Color Legend */}
                <div className="flex flex-wrap gap-2.5">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0" />
                    <span className="text-[10px] font-bold text-outline uppercase">Sad</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-blue-500 shrink-0" />
                    <span className="text-[10px] font-bold text-outline uppercase">Okay</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-300 shrink-0" />
                    <span className="text-[10px] font-bold text-outline uppercase">Good</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-700 shrink-0" />
                    <span className="text-[10px] font-bold text-outline uppercase">Focused</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-400 shrink-0" />
                    <span className="text-[10px] font-bold text-outline uppercase">Energized</span>
                  </div>
                </div>

                {/* Selected Day details */}
                {selectedDayDay !== null && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-[10.5px] text-outline font-semibold text-left">
                      {monthNames[month]} {selectedDayDay}:{' '}
                      {(() => {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDayDay).padStart(2, '0')}`;
                        const loggedVals = mergedLogs[dateStr];
                        if (loggedVals && loggedVals.length > 0) {
                          const latestVal = loggedVals[loggedVals.length - 1];
                          const { label } = getMoodDetails(latestVal.value);
                          return (
                            <span className="font-extrabold text-on-surface">
                              {label} ({latestVal.value}% intensity)
                            </span>
                          );
                        }
                        return <span className="italic">No recorded logs</span>;
                      })()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Daily Mood Log Details Section */}
          {selectedDayDay !== null && (
            <section className="glass-card p-6 rounded-3xl shadow-sm space-y-4 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[10px] font-black text-outline uppercase tracking-wider">Daily Mood Log</p>
                  <p className="text-sm font-black text-on-surface mt-0.5">
                    {monthNames[month]} {selectedDayDay}, {year}
                  </p>
                </div>
                <span className="text-[9px] bg-[#daf2ff] text-primary font-black uppercase px-2 py-0.5 rounded-full select-none">
                  Check-ins Log
                </span>
              </div>

              {(() => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDayDay).padStart(2, '0')}`;
                const loggedVals = mergedLogs[dateStr];

                if (!loggedVals || loggedVals.length === 0) {
                  return (
                    <div className="py-6 text-center text-outline text-xs italic">
                      No recorded emotion check-ins for this day yet. Track your current state on the Home Dashboard to populate this log!
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {loggedVals.map((entry, logIdx) => {
                      const { label } = getMoodDetails(entry.value);
                      const times = ["09:30 AM", "01:15 PM", "04:45 PM", "07:30 PM", "09:15 PM"];
                      const timeStr = entry.time || times[logIdx % times.length];
                      const note = entry.value > 80 ? "Feeling highly driven, deep work session progressing ahead of schedule." :
                                   entry.value > 60 ? "Productive environment, steady pace with quiet workspace focus." :
                                   entry.value > 45 ? "Standard baseline, completed team standup meeting successfully." :
                                   "A bit drained. Low stamina vibes from early sessions. Activating mindful deep breathing.";

                      return (
                        <div 
                          key={logIdx} 
                          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-150 flex items-start justify-between gap-4 transition-all hover:bg-slate-100/50"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-10 rounded-full shrink-0 ${
                              entry.value <= 45 ? 'bg-rose-500' :
                              entry.value <= 55 ? 'bg-blue-500' :
                              entry.value <= 70 ? 'bg-emerald-300' :
                              entry.value <= 85 ? 'bg-emerald-700' : 'bg-amber-400'
                            }`} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-on-surface">{label}</span>
                                <span className="text-[10px] font-semibold text-outline">{timeStr}</span>
                              </div>
                              <p className="text-[11.5px] text-[#2c3d52]/90 dark:text-white mt-1 leading-relaxed">
                                {note}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-primary block">{entry.value}%</span>
                            <span className="text-[8px] font-extrabold text-outline uppercase tracking-wider block">Intensity</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>
          )}

        </div>

        {/* Right side pane: Mood Metrics and Mindful Insights */}
        <div className="lg:col-span-4 space-y-6">

          {/* New Mood Metrics section */}
          <section className="space-y-3">
            <h3 className="text-xs font-black uppercase text-outline tracking-wider px-1">Mood Metrics</h3>
            <div className="grid grid-cols-1 gap-4">

              {/* Energy Reserves Card */}
              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 group hover:shadow-md transition-all bg-white/60">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 h-7 rounded-full bg-[#ecfdf5] text-[#059669] flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5 fill-current" />
                    </span>
                    <span className="text-[9px] text-outline font-extrabold uppercase tracking-wider">Energy Reserves</span>
                  </div>
                  {/* Minimal loader indicator bar */}
                  <div className="w-12 h-1 bg-[#f1f5f9] rounded-full overflow-hidden self-center shrink-0 font-sans">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${energyReserves}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-on-surface tracking-tight">
                      {energyReserves}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant">%</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/80 font-semibold mt-1">Energy capacity optimal</p>
                </div>
              </div>

              {/* Heart Rate card */}
              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-all bg-white/60">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                      <Heart className="w-3.5 h-3.5 fill-current animate-pulse" />
                    </span>
                    <span className="text-[9px] text-outline font-extrabold uppercase tracking-wider">Heart Rate</span>
                  </div>
                  <span className="text-[8px] font-black uppercase text-outline shrink-0">Live</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-on-surface tracking-tight">
                      {heartRate}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant">BPM</span>
                  </div>
                  <p className="text-[10px] text-on-surface-variant/80 font-semibold mt-1">Resting averages</p>
                </div>
              </div>

              {/* Sleep Status Card */}
              <div className="glass-card p-5 rounded-2xl flex flex-col justify-between h-32 group hover:shadow-md transition-all bg-white/60">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    <span className="w-7 h-7 rounded-full bg-indigo-50 text-[#8455ef] flex items-center justify-center shrink-0">
                      <Moon className="w-3.5 h-3.5 fill-current" />
                    </span>
                    <span className="text-[9px] text-outline font-extrabold uppercase tracking-wider">Sleep Status</span>
                  </div>
                  <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase shrink-0">Opt</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-on-surface tracking-tight">7.5</span>
                    <span className="text-[10px] font-bold text-on-surface-variant">Hrs</span>
                  </div>
                  <p className="text-[10px] text-[#2c3d52]/80 dark:text-slate-300 font-semibold mt-1">Optimal REM recovery</p>
                </div>
              </div>

            </div>
          </section>

          {/* Mindful Insights expandable accordions */}
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase text-outline tracking-wider px-1">Mindful Insights</h3>
          
          <div className="space-y-4">
            {/* Insight 1: Consistency */}
        <div 
          onClick={() => toggleInsight('consistency')}
          className="glass-card p-5 rounded-3xl flex gap-4 items-start border-l-4 border-l-primary-container cursor-pointer hover:bg-slate-55 transition-all"
        >
          <div className="p-3 bg-sky-50 text-primary rounded-2xl shrink-0">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-1 overflow-hidden w-full">
            <h4 className="text-sm font-bold text-on-surface flex justify-between items-center w-full">
              <span>Meditation Consistency</span>
              <ChevronDown className={`w-4 h-4 text-outline transition-transform duration-300 ${
                expandedInsights.consistency ? 'rotate-180' : ''
              }`} />
            </h4>
            
            <div className={`transition-all duration-500 overflow-hidden text-xs text-on-surface-variant/95 leading-relaxed ${
              expandedInsights.consistency ? 'max-h-40 mt-2 opacity-100' : 'max-h-5 opacity-80'
            }`}>
              <p>
                Your focus is highest after <span className="font-bold text-primary">20m of morning meditation</span>. Maintaining this streak improves afternoon cognitive stamina and overall mental resilience. Users with similar patterns report 15% better stress management.
              </p>
            </div>
          </div>
        </div>

        {/* Insight 2: Sleep Quality Alert */}
        <div 
          onClick={() => {
            if (user.tier === 'freemium') {
              setShowUpsellNotice(true);
            } else {
              toggleInsight('sleep');
            }
          }}
          className="glass-card p-5 rounded-3xl flex gap-4 items-start border-l-4 border-l-error/40 cursor-pointer hover:bg-slate-55 transition-all relative overflow-hidden select-none"
        >
          {user.tier === 'freemium' && (
            <div className="absolute inset-0 bg-[#fbfbfe]/95 backdrop-blur-[2px] p-4 flex items-center justify-between z-10 select-none">
              <div className="flex items-center gap-2.5 text-left">
                <span className="text-base shrink-0">🔒</span>
                <div>
                  <span className="text-xs font-black text-on-surface block">Circadian Insights Locked</span>
                  <p className="text-[9.5px] text-outline leading-tight mt-0.5">Renew sleep tracking on Student Plan</p>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUpsellNotice(true);
                }}
                className="px-3 py-1.5 bg-primary text-white text-[9px] font-black rounded-lg uppercase tracking-wider shrink-0 cursor-pointer"
              >
                Upgrade
              </button>
            </div>
          )}
          <div className="p-3 bg-red-50 text-error rounded-2xl shrink-0">
            <AlertTriangle className="w-5 h-5 text-error" />
          </div>
          <div className="space-y-1 overflow-hidden w-full">
            <h4 className="text-sm font-bold text-on-surface flex justify-between items-center w-full">
              <span>Circadian Reset</span>
              <ChevronDown className={`w-4 h-4 text-outline transition-transform duration-300 ${
                expandedInsights.sleep ? 'rotate-180' : ''
              }`} />
            </h4>
            
            <div className={`transition-all duration-500 overflow-hidden text-xs text-on-surface-variant/95 leading-relaxed ${
              expandedInsights.sleep ? 'max-h-40 mt-2 opacity-100' : 'max-h-5 opacity-80'
            }`}>
              <p>
                Late night blue screens affect <span className="font-bold text-secondary text-indigo-700">REM sleep</span>. Try reading a physical journal book 30m before bed to reset core melatonin receptors. Melatonin recovery score rose by 8% upon regular practice.
              </p>
            </div>
          </div>
        </div>
      </div>
      </section>
    </div>
  </div>

  {/* Upsell modal */}
  {showUpsellNotice && (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 space-y-5 shadow-2xl border border-slate-100 animate-scale-up">
        <div className="flex justify-between items-center">
          <span className="bg-indigo-50 text-indigo-700 text-[9.5px] font-black uppercase px-2.5 py-1 rounded-full">
            🎓 Student Plan Feature
          </span>
          <button 
            onClick={() => setShowUpsellNotice(false)}
            className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase cursor-pointer"
          >
            Dismiss
          </button>
        </div>

        <div className="space-y-2 text-left">
          <h4 className="text-lg font-black text-on-surface">Unlock Circadian Sleep Analytics</h4>
          <p className="text-xs text-outline leading-relaxed">
            Viewing premium circadian sleep reports, daily REM indicators, and actionable cognitive load schedules requires upgrading to the <strong>Student Plan</strong> (RM 10/month).
          </p>
        </div>

        <div className="flex gap-2 pt-1.5">
          <button
            onClick={() => setShowUpsellNotice(false)}
            className="flex-grow py-3 text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-extrabold rounded-2xl cursor-pointer"
          >
            Stay standard
          </button>
          <button
            onClick={() => {
              setShowUpsellNotice(false);
              alert("Please head over to the 'Bracket Settings' tab on your Profile panel to quickly adjust your restorative tier anytime!");
            }}
            className="flex-grow py-3 text-xs bg-[#8455ef] hover:bg-[#7244de] text-white font-black rounded-2xl cursor-pointer shadow-md text-center"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  )}

</div>
  );
}
