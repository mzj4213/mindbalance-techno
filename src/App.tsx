import React, { useState, useEffect } from 'react';
import { Home, Calendar, CheckSquare, TrendingUp, User as UserIcon, Bell, Loader2 } from 'lucide-react';
import AuthScreen from './components/AuthScreen';
import HomeScreen from './components/HomeScreen';
import ScheduleScreen from './components/ScheduleScreen';
import TasksScreen from './components/TasksScreen';
import MoodScreen from './components/MoodScreen';
import ProfileScreen from './components/ProfileScreen';
import { User, MoodType, ScheduleItem, TaskItem } from './types';

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
  const [moodCheckIns, setMoodCheckIns] = useState<Record<string, number>>({
    '2026-05-28': 45,
    '2026-05-30': 75,
    '2026-06-01': 50,
    '2026-06-02': 80,
    '2026-06-03': 65 // Today
  });

  // Automatically compute and sync cognitive load based on currently scheduled items for the active date (default Oct 23, 2026)
  useEffect(() => {
    const activeDateItems = scheduleItems.filter(item => item.date === "2026-10-23" && !item.completed);
    let totalLoad = 0;
    activeDateItems.forEach(item => {
      if (item.energyLevel === 'High') totalLoad += 30;
      else if (item.energyLevel === 'Medium') totalLoad += 15;
      else if (item.energyLevel === 'Low') totalLoad += 5;
    });
    setCognitiveLoad(Math.min(100, Math.max(10, totalLoad)));
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
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider truncate">{currentUser.role || 'Zen Mind'}</p>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className="space-y-1 pt-2">
            {[
              { id: 'home', label: 'Dashboard', icon: Home },
              { id: 'schedule', label: 'Zen Schedule', icon: Calendar },
              { id: 'tasks', label: 'Intentions', icon: CheckSquare },
              { id: 'mood', label: 'Mood Log', icon: TrendingUp },
              { id: 'profile', label: 'Preferences', icon: UserIcon },
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
          {/* Notifications bell inline in Sidebar for desktop */}
          <button 
            onClick={() => alert(`MindBalance Sandbox v1.0 connected securely. User: ${currentUser.email}`)}
            className="flex items-center justify-between w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200/40 text-left text-[11px] font-bold text-on-surface-variant hover:bg-slate-100/85 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span>Sandbox Alerts</span>
            </div>
            <span className="w-2 h-2 bg-[#8455ef] rounded-full animate-pulse" />
          </button>

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
                Good morning
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
          onClick={() => alert(`MindBalance Sandbox v1.0 connected securely. User: ${currentUser.email}`)}
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
              <h1 className="text-2xl font-black text-on-surface capitalize tracking-tight select-all">
                {activeTab === 'home' ? `Welcome back, ${currentUser.fullName.split(' ')[0]}` : activeTab}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-outline bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/30">
                Cognitive Load: <strong className="text-primary">{cognitiveLoad}%</strong>
              </span>
              <span className="text-xs font-bold text-outline bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/30">
                Reserves: <strong className="text-emerald-600">Optimal ({100 - stressLevel}%)</strong>
              </span>
            </div>
          </div>

          {activeTab === 'home' && (
            <HomeScreen 
              user={currentUser} 
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
            />
          )}
          {activeTab === 'mood' && (
            <MoodScreen 
              currentMood={currentMood}
              moodIntensity={moodIntensity}
              moodCheckIns={moodCheckIns}
              setMoodCheckIns={setMoodCheckIns}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileScreen 
              user={currentUser} 
              onLogout={handleLogout} 
              cognitiveLoad={cognitiveLoad}
              scheduleItems={scheduleItems}
              focusStreak={focusStreak}
              setFocusStreak={setFocusStreak}
              setScheduleItems={setScheduleItems}
              setTasks={setTasks}
              setMoodCheckIns={setMoodCheckIns}
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
