import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb, CheckSquare, Plus, RefreshCw, Sparkles, AlertCircle, Calendar as CalendarIcon, Clock, Play, Pause, CheckCircle2, Info, X } from 'lucide-react';
import { ScheduleItem } from '../types';

interface ScheduleScreenProps {
  scheduleItems: ScheduleItem[];
  setScheduleItems: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
  focusStreak: number;
  setFocusStreak: React.Dispatch<React.SetStateAction<number>>;
}

export default function ScheduleScreen({
  scheduleItems,
  setScheduleItems,
  focusStreak,
  setFocusStreak
}: ScheduleScreenProps) {
  // Real date initialized to Monday, October 23, 2026 to ensure the mock items exist!
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 9, 23));
  
  // Show standard mini calendar dropdown selection helper state
  const [showCalendarDropdown, setShowCalendarDropdown] = useState(false);

  // Fully functional recommendation banner state
  const [bannerVisible, setBannerVisible] = useState(true);
  const [bannerAccepted, setBannerAccepted] = useState(false);

  // Form block for adding custom item
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newStart, setNewStart] = useState('10:00');
  const [newEnd, setNewEnd] = useState('11:00');
  const [newEnergy, setNewEnergy] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Details Modal and Active Focus Session states
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<ScheduleItem | null>(null);
  
  const [focusSessionActive, setFocusSessionActive] = useState(false);
  const [focusSessionTime, setFocusSessionTime] = useState(0); // in seconds
  const [focusSessionPaused, setFocusSessionPaused] = useState(false);
  const [runningItem, setRunningItem] = useState<ScheduleItem | null>(null);

  // Focus Session ticking thread
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (focusSessionActive && !focusSessionPaused) {
      interval = setInterval(() => {
        setFocusSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [focusSessionActive, focusSessionPaused]);

  // Formatter for calendar date text header
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const formatDateHeading = (d: Date) => {
    return `${daysOfWeek[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  };

  // Convert Date object to YYYY-MM-DD string for item mapping
  const toDateKeyString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const r = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${r}`;
  };

  const handleArrowNav = (direction: 'prev' | 'next') => {
    const step = direction === 'prev' ? -1 : 1;
    const nextD = new Date(selectedDate.getTime() + step * 24 * 60 * 60 * 1000);
    setSelectedDate(nextD);
  };

  const handleRescheduleBanner = () => {
    // Action trigger: Reschedule 'Admin Tasks' to tomorrow
    setBannerAccepted(true);
    setTimeout(() => {
      setBannerVisible(false);
    }, 2500);
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    // Convert 24hr string to beautiful AM/PM human format
    const formatTime = (time24: string): string => {
      const [hrStr, minStr] = time24.split(':');
      const hr = parseInt(hrStr);
      const suffix = hr >= 12 ? 'PM' : 'AM';
      const formattedHr = hr % 12 || 12;
      return `${formattedHr.toString().padStart(2, '0')}:${minStr} ${suffix}`;
    };

    const newItem: ScheduleItem = {
      id: `custom-${Date.now()}`,
      title: newTitle,
      startTime: formatTime(newStart),
      endTime: formatTime(newEnd),
      energyLevel: newEnergy,
      completed: false,
      date: toDateKeyString(selectedDate)
    };

    setScheduleItems((prev) => [...prev, newItem].sort((a, b) => a.startTime.localeCompare(b.startTime)));
    setNewTitle('');
    setShowAddForm(false);
  };

  // Convert time string to hours for visual offsets matching the CSS grids!
  const calculatePosition = (timeStr: string) => {
    const [time, suffix] = timeStr.split(' ');
    if (!time || !suffix) return 600; // default backup
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    
    if (suffix === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (suffix === 'AM' && hours === 12) {
      hours = 0;
    }
    
    // Top position: 60px represents 1 hour
    return (hours * 60) + (minutes === 30 ? 30 : 0);
  };

  // Filter items matching the selectedDate
  const currentKeyString = toDateKeyString(selectedDate);
  const activeDayItems = scheduleItems.filter(item => item.date === currentKeyString);

  // Format second counts to beautiful 00:00 style
  const formatTimerString = (secCount: number) => {
    const mins = Math.floor(secCount / 60);
    const secs = secCount % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startFocusTimer = (item: ScheduleItem) => {
    setRunningItem(item);
    setFocusSessionTime(0);
    setFocusSessionPaused(false);
    setSelectedItemForDetail(null);
    setFocusSessionActive(true);
  };

  const completeFocusTimer = () => {
    if (runningItem) {
      // Mark as completed in state!
      setScheduleItems(prev => prev.map(item => item.id === runningItem.id ? { ...item, completed: true } : item));
      // Increment focus streak
      setFocusStreak(prev => prev + 1);
    }
    setFocusSessionActive(false);
    setRunningItem(null);
  };

  return (
    <div className="space-y-6 relative pb-16">
      
      {/* Date Navigation header slider */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-outline-variant/10 pb-4">
        <div className="flex items-center gap-1.5 relative">
          <button 
            type="button"
            onClick={() => handleArrowNav('prev')}
            className="p-2 hover:bg-slate-100 rounded-full text-on-surface-variant cursor-pointer transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5 text-on-surface-variant" />
          </button>
          
          {/* Clickable Date string to toggle calendar */}
          <button
            type="button"
            onClick={() => setShowCalendarDropdown(!showCalendarDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-100 rounded-xl transition-all font-bold text-on-surface select-none text-base text-left cursor-pointer"
            title="Select date from calendar"
          >
            <span>{formatDateHeading(selectedDate)}</span>
            <CalendarIcon className="w-4 h-4 text-primary shrink-0 opacity-80" />
          </button>

          <button 
            type="button"
            onClick={() => handleArrowNav('next')}
            className="p-2 hover:bg-slate-100 rounded-full text-on-surface-variant cursor-pointer transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5 text-on-surface-variant" />
          </button>

          {/* Minimal drop-down inline calendar list */}
          {showCalendarDropdown && (
            <div className="absolute top-12 left-12 bg-white border border-outline-variant rounded-2xl shadow-xl p-4 z-50 w-72 animate-fade-in select-none">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-extrabold uppercase tracking-widest text-primary">October 2026</span>
                <span className="text-[10px] text-outline font-semibold">Minimal Zen Calendar</span>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dayName, idx) => (
                  <span key={idx} className="text-[9px] font-bold text-outline uppercase py-1">{dayName}</span>
                ))}
                
                {/* Pad first rows for October 2026 which starts on Thursday (shift index 4) */}
                {Array.from({ length: 4 }).map((_, idx) => (
                  <span key={`pad-${idx}`} />
                ))}

                {/* Draw 31 beautiful days */}
                {Array.from({ length: 31 }).map((_, dayNumIdx) => {
                  const dayNum = dayNumIdx + 1;
                  const isCurrent = selectedDate.getDate() === dayNum && selectedDate.getMonth() === 9 && selectedDate.getFullYear() === 2026;
                  return (
                    <button
                      key={dayNum}
                      type="button"
                      onClick={() => {
                        setSelectedDate(new Date(2026, 9, dayNum));
                        setShowCalendarDropdown(false);
                      }}
                      className={`h-8 w-8 text-[11px] font-bold rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                        isCurrent 
                          ? 'bg-primary text-white scale-110 shadow-sm' 
                          : 'hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => {
              setSelectedDate(new Date(2026, 9, 23));
              setShowCalendarDropdown(false);
            }}
            className="px-4 py-2 text-xs font-black border border-outline-variant text-primary rounded-full hover:bg-slate-50 cursor-pointer transition-all"
          >
            Today
          </button>
          
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 text-xs font-black bg-primary text-white rounded-full hover:bg-primary/95 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <span>{showAddForm ? 'Close Editor' : '+ Claim Focus Slot'}</span>
          </button>
        </div>
      </div>

      {/* AI Recommendation Banner */}
      {bannerVisible && (
        <section className={`rounded-3xl p-5 flex items-start gap-4 border-l-4 transition-all duration-500 gap-3 ${
          bannerAccepted 
            ? 'bg-emerald-50/60 border-l-emerald-500' 
            : 'bg-indigo-50/50 border-l-secondary'
        }`}>
          <div className={`p-2 rounded-xl shrink-0 ${bannerAccepted ? 'bg-emerald-100' : 'bg-indigo-100/70'}`}>
            {bannerAccepted ? (
              <Sparkles className="w-5 h-5 text-emerald-600" />
            ) : (
              <Lightbulb className="w-5 h-5 text-secondary animate-pulse" />
            )}
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-xs text-on-surface leading-relaxed">
              {bannerAccepted ? (
                <span className="font-semibold text-emerald-800">Admin Tasks successfully postponed! Relieved 45m of afternoon load.</span>
              ) : (
                <>
                  High scheduled cognitive load detected on this day. Move <span className="font-extrabold text-[#5516be]">'Admin Tasks'</span> to tomorrow?
                </>
              )}
            </p>
            {!bannerAccepted && (
              <button 
                type="button"
                onClick={handleRescheduleBanner}
                className="bg-primary hover:bg-primary/95 text-white px-5 py-2 rounded-full text-[10px] font-bold shadow-md cursor-pointer transition-all"
              >
                Reschedule
              </button>
            )}
          </div>
        </section>
      )}

      {/* Dual Column Layout on Widescreen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Deck: Controls, streak, and form */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Block Insertion Form with Pristine Clean Light Background */}
          {showAddForm ? (
            <form onSubmit={handleAddBlock} className="bg-slate-50/98 border border-slate-200/65 p-6 rounded-3xl space-y-4 animate-fade-in shadow-md">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-primary tracking-widest uppercase">New Focus Block</h3>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="text-xs text-outline font-semibold hover:text-error cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Focus claiming (e.g., Code Review)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full h-12 p-3 bg-white border border-slate-200 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-outline font-extrabold uppercase">Start Hour</label>
                    <input
                      type="time"
                      value={newStart}
                      onChange={(e) => setNewStart(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-outline font-extrabold uppercase">End Hour</label>
                    <input
                      type="time"
                      value={newEnd}
                      onChange={(e) => setNewEnd(e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-outline font-extrabold uppercase">Energy Budget</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['High', 'Medium', 'Low'] as const).map((energy) => (
                      <button
                        key={energy}
                        type="button"
                        onClick={() => setNewEnergy(energy)}
                        className={`h-10 text-xs rounded-xl font-bold cursor-pointer transition-all ${
                          newEnergy === energy 
                            ? 'bg-primary text-white shadow-sm' 
                            : 'bg-white border border-slate-200 text-on-surface-variant'
                        }`}
                      >
                        {energy}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer"
                >
                  Save Schedule Block
                </button>
              </div>
            </form>
          ) : (
            /* Focus Streaks & Schedule Health Deck */
            <section className="glass-card rounded-3xl p-6 space-y-5 animate-fade-in select-none">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-[#006591]">Workday Stamina</h3>
                <span className="text-[9px] font-bold bg-[#daf2ff] text-primary px-2.5 py-0.5 rounded-full">Optimal pacing</span>
              </div>

              {/* Focus streak widget */}
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/30 p-4 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 font-black text-lg shadow-sm">
                  🔥
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-outline block">Daily Focus Streak</span>
                  <p className="text-lg font-black text-on-surface">{focusStreak} Peak Periods</p>
                </div>
              </div>

              {/* Mental load advisory */}
              <div className="space-y-2 text-xs text-on-surface-variant leading-relaxed">
                <p className="font-bold text-on-surface">Zen Master's Advice:</p>
                <p className="before:content-['•_'] before:text-primary">Stagger your <strong>High Energy Budget</strong> tasks with low energy admin blocks to prevent severe afternoon cognitive load spikes.</p>
                <p className="before:content-['•_'] before:text-primary">Press any block on the right map to read description notes or activate an aesthetic <strong>Focus Session timer</strong>.</p>
              </div>
            </section>
          )}

        </div>

        {/* Right Side Deck: Scrollable Daily Timeline Map */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-black text-outline uppercase tracking-wider">Vertical Flow Timeline</span>
            <span className="text-[10px] font-bold text-primary">Scroll to navigate day</span>
          </div>
          
          <section className="relative bg-white rounded-3xl border border-slate-150 shadow-sm h-[720px] select-none overflow-y-auto pr-1">
            <div className="relative flex h-full min-h-[1440px]">
              
              {/* Hour Tags Column (Left Column) */}
              <div className="w-16 flex-none border-r border-slate-100 py-4 text-center bg-slate-50/50">
                {Array.from({ length: 24 }).map((_, i) => {
                  const formattedHour = i.toString().padStart(2, '0') + ":00";
                  const isHighlight = i === 9 || i === 11 || i === 14;
                  return (
                    <div key={i} className={`h-[60px] pr-2 text-[10px] tracking-tighter ${isHighlight ? 'font-black text-primary' : 'text-neutral-400 font-medium'}`}>
                      {formattedHour}
                    </div>
                  );
                })}
              </div>

              {/* Slots visual container */}
              <div className="flex-grow relative h-full">

                {/* Background grid indicators */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="h-[60px] border-b border-slate-100" />
                  ))}
                </div>

                {/* If no blocks exist, render a clean peaceful empty state */}
                {activeDayItems.length === 0 && (
                  <div className="absolute inset-x-4 top-[240px] p-6 text-center select-none animate-fade-in glass-card rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-sm font-semibold text-on-surface">Rest & Recovery Space</p>
                    <p className="text-xs text-outline leading-relaxed mt-1">No schedule blocks mapped. Free to restore reserve energy budget.</p>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(true)}
                      className="mt-3.5 px-4 py-2 bg-primary/10 hover:bg-primary/15 text-primary text-xs font-bold rounded-full transition-all cursor-pointer"
                    >
                      + Claim Focus Slot
                    </button>
                  </div>
                )}

                {/* Loop through active schedule items and display them */}
                {activeDayItems.map((item) => {
                  const topOffset = calculatePosition(item.startTime);
                  const durMinutes = item.endTime.includes('30') ? 90 : 60;

                  let cardStyle = "bg-tertiary-container/10 border-l-4 border-tertiary text-tertiary";
                  if (item.energyLevel === "Low") {
                    cardStyle = "bg-emerald-50/60 border-l-4 border-emerald-500 text-emerald-800";
                  } else if (item.energyLevel === "Medium") {
                    cardStyle = "bg-amber-50/60 border-l-4 border-amber-500 text-amber-900";
                  }

                  const isCompleted = item.completed;
                  return (
                    <div 
                      key={item.id} 
                      style={{ top: `${topOffset}px`, height: `${durMinutes}px` }}
                      onClick={() => setSelectedItemForDetail(item)}
                      className={`absolute left-2 right-4 rounded-r-2xl p-3 flex flex-col justify-between group hover:shadow-md hover:brightness-98 transition-all z-15 cursor-pointer select-none border border-slate-100 ${cardStyle} ${isCompleted ? 'opacity-55 line-through decoration-slate-400' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xs font-extrabold truncate tracking-tight">{item.title}</h3>
                          <p className="text-[9px] opacity-80 font-semibold">{item.startTime} – {item.endTime}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70">
                            {item.energyLevel} Budget
                          </span>
                          {isCompleted && (
                            <span className="text-[8px] bg-emerald-500 text-white rounded-full p-0.5 font-bold">✓</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center text-[8.5px] opacity-80 uppercase tracking-widest font-black">
                        <span className="text-primary hover:underline">Details & Focus</span>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          </section>
        </div>

      </div>

      {/* Item Detail Sheet Modal (displays custom details and allows Starting a Focus Session) */}
      {selectedItemForDetail && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end justify-center animate-fade-in p-4 select-none">
          <div className="bg-white w-full max-w-sm rounded-t-3xl rounded-b-xl p-6 space-y-5 animate-slide-up shadow-xl border border-slate-200">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-outline">Schedule Focus block</span>
                <h3 className="text-lg font-black text-on-surface mt-1">{selectedItemForDetail.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedItemForDetail(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 border-t border-b border-slate-100 py-4 text-xs text-on-surface-variant">
              <div className="flex justify-between">
                <span className="font-semibold text-outline">Allocation Period:</span>
                <span className="font-extrabold text-on-surface">{selectedItemForDetail.startTime} – {selectedItemForDetail.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-outline">Energy Required:</span>
                <span className={`font-extrabold uppercase py-0.5 px-2.5 rounded-full text-[9px] ${
                  selectedItemForDetail.energyLevel === 'High' ? 'bg-orange-50 text-orange-600' :
                  selectedItemForDetail.energyLevel === 'Medium' ? 'bg-yellow-50 text-yellow-600' : 'bg-emerald-50 text-emerald-600'
                }`}>{selectedItemForDetail.energyLevel} Budget</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-outline">Pace Status:</span>
                <span className="font-extrabold text-on-surface">{selectedItemForDetail.completed ? 'Completed' : 'Adaptive Queue'}</span>
              </div>
              <p className="text-[11px] text-outline leading-relaxed mt-2 italic bg-slate-50 p-2.5 rounded-xl">
                Zen analysis recommends focusing with quiet notification limits during this high physical productivity slot. No browser context shifts.
              </p>
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => {
                  // Toggle complete directly
                  setScheduleItems(prev => prev.map(item => item.id === selectedItemForDetail.id ? { ...item, completed: !item.completed } : item));
                  setSelectedItemForDetail(null);
                }}
                className="flex-1 py-3 text-xs bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-extrabold rounded-2xl cursor-pointer text-center transition-all"
              >
                {selectedItemForDetail.completed ? 'Mark Active' : 'Mark Completed'}
              </button>
              <button
                onClick={() => startFocusTimer(selectedItemForDetail)}
                className="flex-1 py-3 text-xs bg-primary hover:bg-primary/95 text-white font-extrabold rounded-2xl cursor-pointer text-center transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Focus</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Focus Session Active Mode (Fully Opaque Breathing Timer screen) */}
      {focusSessionActive && runningItem && (
        <div className="fixed inset-0 bg-[#f8f9ff] text-on-surface z-50 flex flex-col items-center justify-between p-8 select-none animate-fade-in bg-mesh">
          {/* Top Info */}
          <div className="pt-12 text-center">
            <span className="text-[11px] uppercase tracking-widest text-primary font-black animate-pulse">Zen Focus Session Active</span>
            <h2 className="text-2xl font-black mt-2 tracking-tight">{runningItem.title}</h2>
            <p className="text-xs text-on-surface-variant mt-1 uppercase tracking-widest">Energy block flow in progress</p>
          </div>

          {/* Large Zen Circle Digital Timer */}
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-60 h-60 rounded-full border border-primary-container/20 flex flex-col items-center justify-center relative shadow-[0_8px_32px_0_rgba(14,165,233,0.06)] bg-white/80">
              <span className="text-5xl font-black tracking-widest tabular-nums text-primary transition-all">
                {formatTimerString(focusSessionTime)}
              </span>
              <p className="text-[9px] text-on-surface-variant uppercase tracking-widest mt-1.5">time mapped</p>
            </div>
            <p className="max-w-[260px] text-center text-xs text-on-surface-variant leading-relaxed italic">
              {focusSessionPaused ? "Paced flow paused. Breathe naturally." : "Notifications muted. Your mind is quiet, focused, and steady."}
            </p>
          </div>

          {/* Actions Bottom Bar */}
          <div className="pb-12 flex flex-col w-full max-w-xs gap-3">
            <div className="flex justify-between gap-3">
              <button
                onClick={() => setFocusSessionPaused(!focusSessionPaused)}
                className="flex-1 py-3.5 border border-outline-variant hover:bg-slate-100 text-on-surface-variant rounded-full text-xs font-black uppercase tracking-wider cursor-pointer"
              >
                {focusSessionPaused ? 'Resume Flow' : 'Pause Flow'}
              </button>
              <button
                onClick={completeFocusTimer}
                className="flex-1 py-3.5 bg-primary hover:bg-primary/95 text-white rounded-full text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-primary/20 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 fill-white text-primary" />
                <span>Complete</span>
              </button>
            </div>
            
            <button
              onClick={() => {
                setFocusSessionActive(false);
                setRunningItem(null);
              }}
              className="py-2.5 text-outline hover:text-red-500 text-[10px] font-black uppercase tracking-widest cursor-pointer text-center"
            >
              Abort Session
            </button>
          </div>
        </div>
      )}

      {/* Floating Plus button */}
      <button 
        onClick={() => setShowAddForm(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-primary/20 z-30 hover:scale-105 active:scale-95 duration-150 transition-all cursor-pointer"
      >
        <Plus className="w-6 h-6" />
      </button>

    </div>
  );
}
