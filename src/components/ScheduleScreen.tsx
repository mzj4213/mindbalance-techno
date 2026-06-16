import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb, CheckSquare, Plus, RefreshCw, Sparkles, AlertCircle, Calendar as CalendarIcon, Clock, Play, Pause, CheckCircle2, Info, X, Trash2, Edit, Brain } from 'lucide-react';
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
  
  // Nested details and edit states for the schedule item modal
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalStart, setModalStart] = useState('');
  const [modalEnd, setModalEnd] = useState('');
  const [modalEnergy, setModalEnergy] = useState<'High' | 'Medium' | 'Low'>('Medium');
  
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

  // Convert 24hr string to beautiful AM/PM human format
  const formatTime = (time24: string): string => {
    const [hrStr, minStr] = time24.split(':');
    const hr = parseInt(hrStr || '0');
    const suffix = hr >= 12 ? 'PM' : 'AM';
    const formattedHr = hr % 12 || 12;
    return `${formattedHr.toString().padStart(2, '0')}:${minStr || '00'} ${suffix}`;
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

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

  // Compute schedule fullness and cognitive load
  const scheduleFullness = Math.min(100, activeDayItems.reduce((acc, item) => {
    if (item.energyLevel === 'High') return acc + 35;
    if (item.energyLevel === 'Medium') return acc + 20;
    return acc + 10;
  }, 0));

  // Compute live load advisor suggestion based on real scheduled items on this day
  const highEnergyCountThisDay = activeDayItems.filter(item => item.energyLevel === 'High' && !item.completed).length;
  const totalCountThisDay = activeDayItems.filter(item => !item.completed).length;

  let adviceTitle = "Suggestion";
  let adviceMessage = "";
  let isHeavilyLoaded = false;

  if (highEnergyCountThisDay >= 2) {
    adviceTitle = "Suggestion (High Cognitive Load)";
    adviceMessage = `You have scheduled ${highEnergyCountThisDay} High Energy slots today. We suggest deferring one entry or spacing them out through the week to safeguard your reserves options.`;
    isHeavilyLoaded = true;
  } else if (totalCountThisDay > 4) {
    adviceTitle = "Suggestion (Timeline Overload)";
    adviceMessage = `You have mapped ${totalCountThisDay} items for today. Zen analysis suggests postponing low-priority administrative tasks to decrease afternoon strain.`;
    isHeavilyLoaded = true;
  } else if (activeDayItems.length === 0) {
    adviceTitle = "Suggestion (Empty Schedule)";
    adviceMessage = "You have no focus tasks scheduled for this day. We suggest pressing the '+' button to add an intention block or mapping out custom routines.";
    isHeavilyLoaded = false;
  } else {
    adviceTitle = "Suggestion (Balanced Pace)";
    adviceMessage = "Your mental budget looks perfectly balanced today. Flow with proper recovery intervals to boost steady creative energy!";
    isHeavilyLoaded = false;
  }

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
      
      {/* Cognitive Load fullness tracker card */}
      <section className="glass-card rounded-3xl p-6 space-y-3.5 select-none animate-fade-in flex flex-col justify-between">
        <div className="flex items-start justify-between gap-1">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-lg font-bold shadow-sm shrink-0">
              <Brain className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-indigo-700">Cognitive Load</h3>
                <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full uppercase">Live Fullness</span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-on-surface tracking-tight">
                  {scheduleFullness}%
                </span>
                <span className="text-[10px] font-bold text-outline uppercase">Schedule fullness</span>
              </div>
            </div>
          </div>
          
          <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full select-none ${
            scheduleFullness > 80 ? 'bg-rose-50 text-rose-700' :
            scheduleFullness > 50 ? 'bg-amber-50 text-amber-700' :
            scheduleFullness > 20 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {scheduleFullness > 80 ? 'Overloaded' :
             scheduleFullness > 50 ? 'Demanding' :
             scheduleFullness > 20 ? 'Balanced' : 'Light'}
          </span>
        </div>

        <div className="space-y-2">
          <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                scheduleFullness > 80 ? 'bg-rose-500' :
                scheduleFullness > 50 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${scheduleFullness}%` }}
            />
          </div>
          <p className="text-[11px] text-outline leading-tight">
            {scheduleFullness === 0 ? "Daily agenda is totally clear. Zero cognitive load." :
             scheduleFullness > 80 ? "Strain alarm! Restructure slots or delegate non-essential items." :
             scheduleFullness > 50 ? "Full schedule. Space out demanding goals with standard breaks." :
             "Balanced pacing. High and low budget periods are safely aligned."}
          </p>
        </div>
      </section>

      {/* AI Suggestion Banner styled beautifully with the glass-card Workday Stamina theme */}
      {bannerVisible && (
        <section className="glass-card rounded-3xl p-6 select-none animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm shrink-0 ${
                bannerAccepted ? 'bg-emerald-100 text-emerald-600' : isHeavilyLoaded ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
              }`}>
                {bannerAccepted ? '✨' : isHeavilyLoaded ? '💡' : '☘️'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#006591]">Suggestion</h3>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    bannerAccepted ? 'bg-emerald-50 text-emerald-700' : isHeavilyLoaded ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-750'
                  }`}>
                    {bannerAccepted ? 'Stabilized' : adviceTitle}
                  </span>
                </div>
                <p className="text-xs text-on-surface mt-0.5 leading-relaxed max-w-md">
                  {bannerAccepted ? (
                    <span className="font-semibold text-emerald-800">Load balanced successfully! Stamina budget is stabilized.</span>
                  ) : (
                    adviceMessage
                  )}
                </p>
              </div>
            </div>
            
            {!bannerAccepted && isHeavilyLoaded && (
              <div className="border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-5">
                <button 
                  type="button"
                  onClick={() => {
                    setBannerAccepted(true);
                    // Auto optimize high items on this date
                    const optimizedItems = scheduleItems.map(item => {
                      if (item.date === currentKeyString && item.energyLevel === 'High' && !item.completed) {
                        return { ...item, energyLevel: 'Medium' as const, title: `${item.title} (Optimized)` };
                      }
                      return item;
                    });
                    setScheduleItems(optimizedItems);
                    setTimeout(() => {
                      setBannerAccepted(false);
                    }, 2500);
                  }}
                  className="bg-primary hover:bg-primary/95 text-white px-4 py-2 rounded-full text-[10px] font-bold shadow-md cursor-pointer transition-all"
                >
                  Auto-Optimize Budget
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Dual Column Layout on Widescreen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side Deck: Controls and form - Render ONLY when showAddForm is true */}
        {showAddForm && (
          <div className="lg:col-span-4 space-y-6">
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
                  <label className="text-[10px] text-outline font-extrabold uppercase">Energy Level</label>
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
          </div>
        )}

        {/* Right Side Deck: Scrollable Daily Timeline Map - Spans full width when form is hidden */}
        <div className={`${showAddForm ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-3`}>
          
          {/* Date Selection, Today and '+' Button Container moved strictly above the timeline */}
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

              <button 
                type="button"
                onClick={() => {
                  setSelectedDate(new Date(2026, 9, 23));
                  setShowCalendarDropdown(false);
                }}
                className="px-3 py-1.5 ml-1 text-xs font-black border border-outline-variant text-primary rounded-xl hover:bg-slate-50 cursor-pointer transition-all"
              >
                Today
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
                    
                    {/* Pad first rows for October 2026 Thursday */}
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
            </div>
          </div>

          <div className="flex justify-end items-center px-1.5">
            <span className="text-[10px] font-bold text-primary">Scroll to navigate day</span>
          </div>
          
          <section className="relative bg-white rounded-3xl border border-slate-150 shadow-sm h-[720px] select-none overflow-y-auto pr-1">
            <div className="relative flex h-full min-h-[1440px]">
              
              {/* Hour Tags Column (Left Column) */}
              <div className="w-16 flex-none border-r border-slate-100 py-4 text-center">
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
                      onClick={() => {
                        setSelectedItemForDetail(item);
                        setIsEditingInModal(false);
                        setModalTitle(item.title);
                        const parseTimeTo24h = (timeStr: string) => {
                          const [time, suffix] = timeStr.split(' ');
                          if (!time || !suffix) return "10:00";
                          let [hoursStr, minutesStr] = time.split(':');
                          let hours = parseInt(hoursStr || '0');
                          if (suffix === 'PM' && hours !== 12) hours += 12;
                          if (suffix === 'AM' && hours === 12) hours = 0;
                          return `${String(hours).padStart(2, '0')}:${minutesStr || '00'}`;
                        };
                        setModalStart(parseTimeTo24h(item.startTime));
                        setModalEnd(parseTimeTo24h(item.endTime));
                        setModalEnergy(item.energyLevel);
                      }}
                      className={`absolute left-2 right-4 rounded-r-2xl p-3 flex flex-col justify-between group hover:shadow-md hover:brightness-98 transition-all z-15 cursor-pointer select-none border border-slate-100 ${cardStyle} ${isCompleted ? 'opacity-55 line-through decoration-slate-400' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xs font-extrabold truncate tracking-tight">{item.title}</h3>
                          <p className="text-[9px] opacity-80 font-semibold">{item.startTime} – {item.endTime}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70">
                            {item.energyLevel} Energy
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
              <div className="flex-1 mr-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#006591] bg-sky-50 px-2 py-0.5 rounded-full inline-block">
                  {isEditingInModal ? 'Editing Slot' : 'Focus Slot Details'}
                </span>
                {isEditingInModal ? (
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    className="w-full h-10 p-2 border border-slate-200 text-xs font-bold rounded-xl mt-2 focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="Slot Title"
                  />
                ) : (
                  <h3 className="text-base font-black text-on-surface mt-1.5 leading-tight">{selectedItemForDetail.title}</h3>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!isEditingInModal && (
                  <>
                    <button
                      onClick={() => setIsEditingInModal(true)}
                      className="p-1.5 rounded-full hover:bg-sky-50 text-primary cursor-pointer transition-colors"
                      title="Edit Entry"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setScheduleItems(prev => prev.filter(item => item.id !== selectedItemForDetail.id));
                        setSelectedItemForDetail(null);
                      }}
                      className="p-1.5 rounded-full hover:bg-red-50 text-error cursor-pointer transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setSelectedItemForDetail(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 cursor-pointer text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isEditingInModal ? (
              <div className="space-y-4 border-t border-b border-slate-100 py-4 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black uppercase text-outline block mb-1">Start Time</label>
                    <input
                      type="time"
                      value={modalStart}
                      onChange={(e) => setModalStart(e.target.value)}
                      className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-outline block mb-1">End Time</label>
                    <input
                      type="time"
                      value={modalEnd}
                      onChange={(e) => setModalEnd(e.target.value)}
                      className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-outline block mb-1">Stamina Required</label>
                  <select
                    value={modalEnergy}
                    onChange={(e) => setModalEnergy(e.target.value as any)}
                    className="w-full h-9 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="High">High Energy</option>
                    <option value="Medium">Medium Energy</option>
                    <option value="Low">Low Energy</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingInModal(false)}
                    className="flex-1 py-2.5 text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!modalTitle.trim()) return;
                      setScheduleItems(prev => prev.map(item => item.id === selectedItemForDetail.id ? {
                        ...item,
                        title: modalTitle,
                        startTime: formatTime(modalStart),
                        endTime: formatTime(modalEnd),
                        energyLevel: modalEnergy
                      } : item));
                      setSelectedItemForDetail(null);
                    }}
                    className="flex-1 py-2.5 text-xs bg-primary text-white hover:bg-primary/95 rounded-xl font-bold cursor-pointer transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
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
                    }`}>{selectedItemForDetail.energyLevel} Energy</span>
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
              </>
            )}
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
