import React, { useState, useEffect } from 'react';
import { Home, Calendar, CheckSquare, TrendingUp, User as UserIcon, Bell, Loader2 } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import ScheduleScreen from './components/ScheduleScreen';
import TasksScreen from './components/TasksScreen';
import MoodScreen from './components/MoodScreen';
import ProfileScreen from './components/ProfileScreen';
import { User, MoodType, ScheduleItem, TaskItem, MoodCheckInEntry } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [initialLoading, setInitialLoading] = useState(true);

  // Synchronized overall states to coordinate between HomeScreen and Mood Analytics / Profile Screen!
  const [cognitiveLoad, setCognitiveLoad] = useState<number>(50);
  const [stressLevel, setStressLevel] = useState<number>(40);
  const [currentMood, setCurrentMood] = useState<MoodType>('Good');
  const [moodIntensity, setMoodIntensity] = useState<number>(65);

  const [focusStreak, setFocusStreak] = useState<number>(3); // initial streak

  // Globally synchronized Energy Reserves and Heart Rate
  const [energyReserves, setEnergyReserves] = useState<number>(88);
  const [heartRate, setHeartRate] = useState<number>(72);

  // Lifted Schedule Items (synchronized for Cognitive Load and Burnout Risk analytics)
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    {
      id: "deep-work",
      title: "Deep Work",
      startTime: "09:00 AM",
      endTime: "10:30 AM",
      energyLevel: "High",
      completed: false,
      emoji: "😊",
      date: "2026-10-23"
    },
    {
      id: "standup",
      title: "Standup Meeting",
      startTime: "11:30 AM",
      endTime: "12:00 PM",
      energyLevel: "Low",
      completed: true,
      emoji: "😊",
      date: "2026-10-23"
    },
    {
      id: "project-sync",
      title: "Project Sync",
      startTime: "02:00 PM",
      endTime: "03:30 PM",
      energyLevel: "Medium",
      completed: false,
      emoji: "😂",
      date: "2026-10-23"
    }
  ]);

  // Lifted Tasks state
  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: "t1",
      title: "Finalize Portfolio",
      priority: "P1",
      classification: "Priority",
      energyLevel: "High",
      focusDuration: "2h Focus",
      completed: false,
      deadline: "2026-10-24"
    },
    {
      id: "t2",
      title: "Research AI Ethics",
      priority: "P1",
      classification: "Priority",
      energyLevel: "Medium",
      focusDuration: "1h Focus",
      completed: false,
      deadline: "2026-10-25"
    },
    {
      id: "t3",
      title: "Email Professor",
      priority: "P2",
      classification: "Focus",
      energyLevel: "Low",
      focusDuration: "15m Focus",
      completed: false,
      deadline: "2026-10-23"
    }
  ]);

  // Lifted Mood Check-Ins (May 28 to Jun 3) with real intensity values. Days without data are omitted (value 0).
  const [moodCheckIns, setMoodCheckIns] = useState<Record<string, MoodCheckInEntry[]>>({
    '2026-05-28': [{ value: 45, time: '09:30 AM', date: '2026-05-28' }],
    '2026-05-30': [{ value: 75, time: '01:15 PM', date: '2026-05-30' }],
    '2026-06-01': [{ value: 50, time: '10:00 AM', date: '2026-06-01' }],
    '2026-06-02': [{ value: 80, time: '04:30 PM', date: '2026-06-02' }],
    '2026-06-03': [{ value: 65, time: '02:45 PM', date: '2026-06-03' }]
  });

  // Heart rate flutter and Energy Reserves calculation
  useEffect(() => {
    const handle = setInterval(() => {
      const val = 71 + Math.floor(Math.random() * 5);
      setHeartRate(val);
    }, 4500);
    return () => clearInterval(handle);
  }, []);

  useEffect(() => {
    // Dynamic Energy Reserves score based on 7.5 sleep hours and heart rate
    const score = Math.min(100, Math.max(10, Math.round((7.5 / 8.0) * 40 + (100 - heartRate) * 1.8)));
    setEnergyReserves(score);
  }, [heartRate]);

  // Automatically compute and sync cognitive load based on currently scheduled items for the active date (default Oct 23, 2026)
  useEffect(() => {
    const activeDateItems = scheduleItems.filter(item => item.date === "2026-10-23");
    const scheduleFullness = Math.min(100, activeDateItems.reduce((acc, item) => {
      if (item.energyLevel === 'High') return acc + 35;
      if (item.energyLevel === 'Medium') return acc + 20;
      return acc + 10;
    }, 0));
    setCognitiveLoad(scheduleFullness);
  }, [scheduleItems]);

  // Auto-restore previous user session if logged in
  useEffect(() => {
    const cachedUser = localStorage.getItem('mb_active_session');
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('mb_active_session');
      }
    }
    // Simulate minor peaceful load animation
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateUser = (updated: User) => {
    setCurrentUser(updated);
    localStorage.setItem('mb_active_session', JSON.stringify(updated));
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('mb_active_session', JSON.stringify(user));
    setActiveTab('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('mb_active_session');
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-mesh flex flex-col items-center justify-center space-y-4 select-none">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <h2 className="text-xl font-bold text-primary">MindBalance</h2>
        <p className="text-xs text-outline tracking-widest uppercase">Harmony in every moment</p>
      </div>
    );
  }

  // If there's no logged-in user, render Auth screen
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="bg-mesh min-h-screen text-on-surface flex flex-col md:flex-row">
      
      {/* Desktop Left Sidebar - hidden on mobile, visible on tablet/desktop */}
      <aside className="hidden md:flex flex-col w-64 fixed top-0 bottom-0 left-0 bg-white/95 backdrop-blur-md border-r border-outline-variant/10 select-none z-40 p-6 justify-between shadow-[4px_0_24px_rgba(14,165,233,0.015)]">
        <div className="space-y-8">
          {/* Logo / Title branded container */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center font-bold text-white shadow-md shadow-primary/20">
              <span className="text-lg">MB</span>
            </div>
            <div>
              <h2 className="text-base font-black text-on-surface tracking-tight leading-none">MindBalance</h2>
              <span className="text-[9px] font-bold text-outline tracking-wider uppercase">Zen Workspace</span>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className="space-y-1 pt-2">
            {[
              { id: 'home', label: 'Dashboard', icon: Home },
              { id: 'schedule', label: 'Schedule', icon: Calendar },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'mood', label: 'Mood', icon: TrendingUp },
              { id: 'profile', label: 'Profile', icon: UserIcon },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 w-full px-4 h-11 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                    active
                      ? 'bg-primary text-white shadow-md shadow-primary/10'
                      : 'text-outline hover:bg-slate-50 hover:text-on-surface'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2 py-3 border-t border-b border-outline-variant/10">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container/20 shrink-0">
              <img 
                alt={currentUser.fullName} 
                src={currentUser.avatarUrl} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs font-black text-on-surface truncate select-all">{currentUser.fullName}</h2>
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider truncate">
                {currentUser.role || 'Zen Mind'} • <span className="text-primary font-black uppercase">{currentUser.tier || 'freemium'}</span>
              </p>
            </div>
          </div>

          <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-center">
            <p className="text-[9px] font-black text-outline uppercase">Current Plan</p>
            <p className="text-xs font-black text-primary capitalize mt-0.5">
              {currentUser.tier === 'freemium' ? 'Student Trial (RM 0)' :
               currentUser.tier === 'student' ? 'Student Plan (RM 10)' : 'Professional Plan (RM 30)'}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 text-error font-extrabold text-xs border border-error/15 rounded-xl hover:bg-error/5 cursor-pointer active:scale-95 transition-all uppercase tracking-wider text-center"
          >
            Log Out
          </button>
        </div>
      </aside>

      {/* Mobile Top Header Bar Block - hidden on tablet/desktop */}
      <header className="md:hidden flex justify-between items-center w-full px-6 h-16 fixed top-0 z-40 bg-white/75 backdrop-blur-xl border-b border-outline-variant/10 shadow-[0_4px_24px_rgba(14,165,233,0.04)] select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container/20 shrink-0">
            <img 
              alt={currentUser.fullName} 
              src={currentUser.avatarUrl} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div>
            {activeTab === 'home' ? (
              <h1 className="text-xs font-black text-primary uppercase tracking-wider select-all">
                Good morning • <span className="uppercase text-[9px] font-black bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded">{currentUser.tier}</span>
              </h1>
            ) : (
              <h1 className="text-xs font-black text-primary capitalize select-all">
                {activeTab}
              </h1>
            )}
          </div>
        </div>

        {/* Real-time sync alert dot */}
        <button 
          onClick={() => alert(`MindBalance Sandbox v1.0 connected securely. User: ${currentUser.email}, Tier: ${currentUser.tier}`)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-high/65 text-primary hover:opacity-85 transition-opacity cursor-pointer relative"
        >
          <Bell className="w-4 h-4 text-primary" />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-[#8455ef] rounded-full" />
        </button>
      </header>

      {/* Main content body with desktop offset */}
      <div className="flex-grow md:pl-64 flex flex-col min-h-screen">
        
        {/* Primary Page Content Wrapper - fully fluid and responsive */}
        <main className="flex-grow pt-24 md:pt-14 pb-32 md:pb-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full transition-all">
          
          {/* Desktop Specific Screen Title Segment */}
          <div className="hidden md:flex justify-between items-center mb-8 border-b border-outline-variant/10 pb-4 select-none">
            <div>
              <span className="text-[10px] font-black uppercase text-outline tracking-widest block mb-0.5">MindBalance Workspace</span>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-on-surface capitalize tracking-tight select-all">
                  {activeTab === 'home' ? `Welcome back, ${currentUser.fullName.split(' ')[0]}` : activeTab}
                </h1>
                <span className="text-[10px] font-black text-[#006591] bg-sky-100 rounded-lg px-2.5 py-1 uppercase border border-[#006591]/10">
                  {currentUser.tier === 'freemium' ? 'Student Trial' :
                   currentUser.tier === 'student' ? 'Student Plan' : 'Professional Plan'}
                </span>
              </div>
            </div>
            {activeTab !== 'profile' && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-outline bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/30 font-sans">
                  Cognitive Load: <strong className="text-primary">{cognitiveLoad}%</strong>
                </span>
                <span className="text-xs font-bold text-outline bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/30 font-sans">
                  Energy Reserves: <strong className="text-emerald-600">{energyReserves}%</strong>
                </span>
              </div>
            )}
          </div>

          {activeTab === 'home' && (
            <HomeScreen 
              user={currentUser} 
              onUpdateUser={handleUpdateUser}
              onSelectTab={setActiveTab}
              cognitiveLoad={cognitiveLoad}
              setCognitiveLoad={setCognitiveLoad}
              stressLevel={stressLevel}
              setStressLevel={setStressLevel}
              currentMood={currentMood}
              setCurrentMood={setCurrentMood}
              moodIntensity={moodIntensity}
              setMoodIntensity={setMoodIntensity}
              scheduleItems={scheduleItems}
              moodCheckIns={moodCheckIns}
              setMoodCheckIns={setMoodCheckIns}
              tasks={tasks}
            />
          )}
          {activeTab === 'schedule' && (
            <ScheduleScreen 
              scheduleItems={scheduleItems}
              setScheduleItems={setScheduleItems}
              focusStreak={focusStreak}
              setFocusStreak={setFocusStreak}
            />
          )}
          {activeTab === 'tasks' && (
            <TasksScreen 
              tasks={tasks}
              setTasks={setTasks}
              scheduleItems={scheduleItems}
              setScheduleItems={setScheduleItems}
            />
          )}
          {activeTab === 'mood' && (
            <MoodScreen 
              user={currentUser}
              onUpdateUser={handleUpdateUser}
              currentMood={currentMood}
              moodIntensity={moodIntensity}
              moodCheckIns={moodCheckIns}
              setMoodCheckIns={setMoodCheckIns}
              heartRate={heartRate}
              energyReserves={energyReserves}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen 
              user={currentUser} 
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout} 
              cognitiveLoad={cognitiveLoad}
              energyReserves={energyReserves}
              scheduleItems={scheduleItems}
              focusStreak={focusStreak}
              setFocusStreak={setFocusStreak}
              setScheduleItems={setScheduleItems}
              setTasks={setTasks}
              setMoodCheckIns={setMoodCheckIns}
              tasks={tasks}
            />
          )}
        </main>
      </div>

      {/* Breathtaking Bottom Navigation Bar - visible ONLY on mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-40 flex justify-around items-center px-4 pb-safe h-20 bg-surface/90 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-4px_24px_rgba(14,165,233,0.03)] rounded-t-3xl select-none">
        
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home' 
              ? 'text-primary scale-102 font-black' 
              : 'text-outline hover:text-on-surface-variant'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5px]' : 'opacity-80'}`} />
          <span className="text-[9px] font-black uppercase tracking-wider">Home</span>
        </button>

        <button 
          onClick={() => setActiveTab('schedule')}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'schedule' 
              ? 'text-primary scale-102 font-black' 
              : 'text-outline hover:text-on-surface-variant'
          }`}
        >
          <Calendar className={`w-5 h-5 ${activeTab === 'schedule' ? 'stroke-[2.5px]' : 'opacity-80'}`} />
          <span className="text-[9px] font-black uppercase tracking-wider">Schedule</span>
        </button>

        <button 
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'tasks' 
              ? 'text-primary scale-102 font-black' 
              : 'text-outline hover:text-on-surface-variant'
          }`}
        >
          <CheckSquare className={`w-5 h-5 ${activeTab === 'tasks' ? 'stroke-[2.5px]' : 'opacity-80'}`} />
          <span className="text-[9px] font-black uppercase tracking-wider">Tasks</span>
        </button>

        <button 
          onClick={() => setActiveTab('mood')}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'mood' 
              ? 'text-primary scale-102 font-black' 
              : 'text-outline hover:text-on-surface-variant'
          }`}
        >
          <TrendingUp className={`w-5 h-5 ${activeTab === 'mood' ? 'stroke-[2.5px]' : 'opacity-80'}`} />
          <span className="text-[9px] font-black uppercase tracking-wider">Mood</span>
        </button>

        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile' 
              ? 'text-primary scale-102 font-black' 
              : 'text-outline hover:text-on-surface-variant'
          }`}
        >
          <UserIcon className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5px]' : 'opacity-80'}`} />
          <span className="text-[9px] font-black uppercase tracking-wider">Profile</span>
        </button>

      </nav>

    </div>
  );
}
