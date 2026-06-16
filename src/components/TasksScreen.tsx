import React, { useState } from 'react';
import { Bolt, Layout, Trash2, CheckCircle2, Play, Plus, Edit2, X, Calendar, Check, PlusCircle } from 'lucide-react';
import { TaskItem, ScheduleItem } from '../types';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface TasksScreenProps {
  tasks: TaskItem[];
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>;
  scheduleItems: ScheduleItem[];
  setScheduleItems: React.Dispatch<React.SetStateAction<ScheduleItem[]>>;
}

export default function TasksScreen({ tasks, setTasks, scheduleItems, setScheduleItems }: TasksScreenProps) {
  // Add to schedule modal states
  const [showAddToScheduleModal, setShowAddToScheduleModal] = useState(false);
  const [selectedTaskToSchedule, setSelectedTaskToSchedule] = useState<TaskItem | null>(null);
  
  // Schedule form fields
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleEnergy, setScheduleEnergy] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [scheduleStartTime, setScheduleStartTime] = useState('02:00 PM');
  const [scheduleEndTime, setScheduleEndTime] = useState('03:30 PM');
  const [scheduleDate, setScheduleDate] = useState('2026-10-23');
  const [scheduleEmoji, setScheduleEmoji] = useState('🎯');

  const startAddToScheduleWorkflow = (task: TaskItem) => {
    setSelectedTaskToSchedule(task);
    setScheduleTitle(task.title);
    setScheduleEnergy(task.energyLevel);
    // Defaults for the workflow
    setScheduleStartTime('10:00 AM');
    setScheduleEndTime('11:30 AM');
    setScheduleDate(task.deadline || '2026-10-23');
    setScheduleEmoji('🎯');
    setShowAddToScheduleModal(true);
  };

  const handleConfirmAddToSchedule = () => {
    if (!selectedTaskToSchedule) return;

    const newItem: ScheduleItem = {
      id: `task-sched-${Date.now()}`,
      title: scheduleTitle,
      startTime: scheduleStartTime,
      endTime: scheduleEndTime,
      energyLevel: scheduleEnergy,
      completed: false,
      emoji: scheduleEmoji,
      date: scheduleDate
    };

    setScheduleItems(prev => [...prev, newItem]);
    setShowAddToScheduleModal(false);
    setSelectedTaskToSchedule(null);
    alert(`Successfully added "${scheduleTitle}" to your Schedule page on ${scheduleDate}!`);
  };

  // Sort tab can order by Energy level, Deadline date, or Priority value
  const [sortTab, setSortTab] = useState<'Energy' | 'Deadline' | 'Priority'>('Energy');
  
  // High, Medium, Low filter state: if null, shows all
  const [activeFilterCategory, setActiveFilterCategory] = useState<'High' | 'Medium' | 'Low' | null>(null);

  // Task Adder sheet state
  const [showAdd, setShowAdd] = useState(false);
  
  // Task Editing item state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // New task form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'P1' | 'P2'>('P1');
  const [taskClass, setTaskClass] = useState<'Priority' | 'Focus'>('Priority');
  const [taskEnergy, setTaskEnergy] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [taskDuration, setTaskDuration] = useState('30m Focus');
  const [taskDeadline, setTaskDeadline] = useState('2026-10-23');

  // Edit task form states
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<'P1' | 'P2'>('P1');
  const [editClass, setEditClass] = useState<'Priority' | 'Focus'>('Priority');
  const [editEnergy, setEditEnergy] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [editDuration, setEditDuration] = useState('30m Focus');
  const [editDeadline, setEditDeadline] = useState('2026-10-23');

  // Counters for the Task Breakdown Metrics (count active, non-completed tasks)
  const highCount = tasks.filter((t) => t.energyLevel === "High" && !t.completed).length;
  const mediumCount = tasks.filter((t) => t.energyLevel === "Medium" && !t.completed).length;
  const lowCount = tasks.filter((t) => t.energyLevel === "Low" && !t.completed).length;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      priority: taskPriority,
      classification: taskClass,
      energyLevel: taskEnergy,
      focusDuration: taskDuration,
      completed: false,
      deadline: taskDeadline
    };

    setTasks((prev) => [newTask, ...prev]);
    setTaskTitle('');
    setShowAdd(false);
  };

  const handleSaveEdit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setTasks(prev => prev.map(t => t.id === id ? {
      ...t,
      title: editTitle,
      priority: editPriority,
      classification: editClass,
      energyLevel: editEnergy,
      focusDuration: editDuration,
      deadline: editDeadline
    } : t));
    setEditingItemId(null);
  };

  const startEditMode = (task: TaskItem) => {
    setEditingItemId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditClass(task.classification);
    setEditEnergy(task.energyLevel);
    setEditDuration(task.focusDuration);
    setEditDeadline(task.deadline || '2026-10-23');
  };

  const toggleTaskCompleted = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // Perform filters & sort on the fly!
  let renderedTasks = [...tasks];

  // (1) Filter by energy level if clicked
  if (activeFilterCategory !== null) {
    renderedTasks = renderedTasks.filter(t => t.energyLevel === activeFilterCategory);
  }

  // (2) Arrange according to the current sorting tab chosen
  if (sortTab === 'Energy') {
    // Sort High -> Medium -> Low
    const weight = { High: 3, Medium: 2, Low: 1 };
    renderedTasks.sort((a, b) => weight[b.energyLevel] - weight[a.energyLevel]);
  } else if (sortTab === 'Deadline') {
    renderedTasks.sort((a, b) => {
      const dA = a.deadline || '2026-12-31';
      const dB = b.deadline || '2026-12-31';
      return dA.localeCompare(dB);
    });
  } else if (sortTab === 'Priority') {
    renderedTasks.sort((a, b) => a.priority.localeCompare(b.priority));
  }

  return (
    <div className="space-y-6 pb-16 select-none animate-fade-in text-on-surface">
      
      {/* Responsive layout wrapper: Dual column on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LHS Column: Filters, workload breakdown & insertion form */}
        <div className="lg:col-span-5 space-y-6">

          {/* Flow Mastery */}
          <section className="glass-card rounded-3xl p-6 space-y-4 animate-fade-in select-none">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#006591]">Flow Mastery</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Intentions serve as critical pacing parameters. Click the <span className="font-extrabold text-primary">"+"</span> button to claim a new work node anytime.
            </p>
          </section>
          
          {/* Task Breakdown Indicators */}
          <section className="space-y-3">
            <div className="flex justify-between items-baseline px-1">
              <h3 className="text-xs font-black text-on-surface uppercase tracking-wider" id="breakdown-label">Energy Budget Filter</h3>
              {activeFilterCategory && (
                <button 
                  type="button"
                  onClick={() => setActiveFilterCategory(null)}
                  className="text-[10px] text-primary font-black hover:underline tracking-widest uppercase cursor-pointer"
                >
                  Clear filter
                </button>
              )}
            </div>

            {/* Staggered vertical deck for widescreen viewports, horizontal on mobile */}
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
              
              <button
                type="button"
                onClick={() => setActiveFilterCategory(activeFilterCategory === 'High' ? null : 'High')}
                className={`glass-card p-4 rounded-2xl flex flex-row items-center justify-between h-16 sm:h-20 lg:h-16 transition-all text-left cursor-pointer ${
                  activeFilterCategory === 'High' 
                    ? 'ring-2 ring-orange-500 bg-orange-50/15 scale-102 font-black' 
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Bolt className="w-4 h-4 text-orange-600 fill-orange-600 shrink-0" />
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-outline block">High Energy</span>
                    <span className="text-xs font-black text-orange-700">{highCount} Items</span>
                  </div>
                </div>
                <span className="hidden lg:inline text-[9px] font-bold text-outline uppercase tracking-wider">High Energy</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilterCategory(activeFilterCategory === 'Medium' ? null : 'Medium')}
                className={`glass-card p-4 rounded-2xl flex flex-row items-center justify-between h-16 sm:h-20 lg:h-16 transition-all text-left cursor-pointer ${
                  activeFilterCategory === 'Medium' 
                    ? 'ring-2 ring-yellow-500 bg-yellow-50/20 scale-102 font-black' 
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Bolt className="w-4 h-4 text-yellow-600 fill-yellow-600 shrink-0" />
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-outline block">Medium Energy</span>
                    <span className="text-xs font-black text-yellow-700">{mediumCount} Items</span>
                  </div>
                </div>
                <span className="hidden lg:inline text-[9px] font-bold text-outline uppercase tracking-wider">Medium Energy</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilterCategory(activeFilterCategory === 'Low' ? null : 'Low')}
                className={`glass-card p-4 rounded-2xl flex flex-row items-center justify-between h-16 sm:h-20 lg:h-16 transition-all text-left cursor-pointer ${
                  activeFilterCategory === 'Low' 
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/15 scale-102 font-black' 
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Bolt className="w-4 h-4 text-emerald-600 fill-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-outline block">Low Energy</span>
                    <span className="text-xs font-black text-emerald-700">{lowCount} Items</span>
                  </div>
                </div>
                <span className="hidden lg:inline text-[9px] font-bold text-outline uppercase tracking-wider">Low Energy</span>
              </button>

            </div>
          </section>

          {/* Task Insertion Form overlay styled with pure, light backgrounds */}
          {showAdd && (
            <form onSubmit={handleAddTask} className="bg-slate-50 border border-slate-200/60 p-5 rounded-3xl space-y-4 animate-fade-in select-none shadow-md">
              <div className="flex justify-between items-center pb-2 border-b border-outline-variant/10">
                <h3 className="text-xs font-black text-primary uppercase tracking-widest">New Zen Intention</h3>
                <button 
                  type="button" 
                  onClick={() => setShowAdd(false)}
                  className="text-xs text-outline font-semibold hover:text-error cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-outline font-extrabold uppercase">Focus Goal</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Design UI layout prototypes"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full h-11 p-3 bg-white border border-slate-200 rounded-xl text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-outline font-extrabold uppercase">Priority Badge</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value as any)}
                      className="w-full h-10 px-2 bg-white border border-slate-200 rounded-xl text-xs text-on-surface focus:outline-none"
                    >
                      <option value="P1">P1 (Immediate)</option>
                      <option value="P2">P2 (Adaptive)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-outline font-extrabold uppercase">Category</label>
                    <select
                      value={taskClass}
                      onChange={(e) => setTaskClass(e.target.value as any)}
                      className="w-full h-10 px-2 bg-white border border-slate-200 rounded-xl text-xs text-on-surface focus:outline-none"
                    >
                      <option value="Priority">Priority Card</option>
                      <option value="Focus">Focus Buffer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-outline font-extrabold uppercase">Energy Budget</label>
                    <select
                      value={taskEnergy}
                      onChange={(e) => setTaskEnergy(e.target.value as any)}
                      className="w-full h-10 px-2 bg-white border border-slate-200 rounded-xl text-xs text-on-surface focus:outline-none"
                    >
                      <option value="High">High Budget</option>
                      <option value="Medium">Medium Budget</option>
                      <option value="Low">Low Budget</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-outline font-extrabold uppercase">Estimated Duration</label>
                    <select
                      value={taskDuration}
                      onChange={(e) => setTaskDuration(e.target.value)}
                      className="w-full h-10 px-2 bg-white border border-slate-200 rounded-xl text-xs text-on-surface focus:outline-none"
                    >
                      <option value="15m Focus">15m Focus</option>
                      <option value="30m Focus">30m Focus</option>
                      <option value="1h Focus">1h Focus</option>
                      <option value="2h Focus">2h Focus</option>
                    </select>
                  </div>
                </div>

                {/* Added Deadline Picker Field with clean light design styling */}
                <div className="space-y-1">
                  <label className="text-[10px] text-outline font-extrabold uppercase block select-all">Deadline Target Date</label>
                  <input
                    type="date"
                    required
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs text-on-surface focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-11 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-md cursor-pointer mt-1"
                >
                  Add Intention Block
                </button>
              </div>
            </form>
          )}

        </div>

        {/* RHS Column: Sort menu navigation & Live active task ledger */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Header toolbars containing permanent float add '+' button and sort nav */}
          <div className="flex items-center justify-between gap-4">
            {/* Sorting tab selection */}
            <nav className="flex gap-1.5 bg-slate-50 p-1 rounded-full border border-slate-200/50">
              {(['Energy', 'Deadline', 'Priority'] as const).map((tab) => {
                const active = sortTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSortTab(tab)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      active 
                        ? 'bg-primary text-white shadow-sm font-black' 
                        : 'text-on-surface-variant hover:bg-slate-200/40'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </nav>

            {/* Persistent, highly accessible '+' button that triggers custom intention creation anytime */}
            <button 
              type="button"
              onClick={() => setShowAdd(true)}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 duration-100 transition-all cursor-pointer shrink-0"
              title="Add Intention Task"
            >
              <Plus className="w-5 h-5 text-white stroke-[2.5px]" />
            </button>
          </div>

          {/* Task List container view */}
          <div className="space-y-4">
        {renderedTasks.length === 0 ? (
          <div className="p-10 border border-dashed border-slate-200 text-center rounded-2xl glass-card">
            <p className="text-sm font-semibold text-on-surface">No tasks fit this criteria</p>
            <p className="text-xs text-outline leading-relaxed mt-1">Change category filter or sort metrics to list adaptive slots.</p>
          </div>
        ) : (
          renderedTasks.map((task) => {
            const isEditing = editingItemId === task.id;
            
            // Format deadline display nicely if exists
            const rawDeadline = task.deadline || '2026-10-23';
            const [y, m, d] = rawDeadline.split('-');
            const prettyDeadline = `${months[parseInt(m) - 1 || 9]} ${d || 23}`;

            let tagColor = "bg-orange-50 text-orange-700";
            let accentLeft = "border-l-4 border-l-orange-500";
            let boltColor = "text-orange-600";

            if (task.energyLevel === "Medium") {
              tagColor = "bg-yellow-50 text-yellow-800";
              accentLeft = "border-l-4 border-l-yellow-500";
              boltColor = "text-yellow-600";
            } else if (task.energyLevel === "Low") {
              tagColor = "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-500/10";
              accentLeft = "border-l-4 border-l-emerald-500";
              boltColor = "text-emerald-600 dark:text-emerald-400";
            }

            const isComp = task.completed;
            const completeStyle = isComp ? "opacity-50 line-through decoration-slate-400" : "";

            return (
              <div 
                key={task.id}
                className={`glass-card p-5 rounded-2xl flex flex-col justify-between select-none hover:shadow-md border border-slate-100 transition-all ${accentLeft} ${completeStyle}`}
              >
                {isEditing ? (
                  /* Edit inline Form with light backgrounds! */
                  <form onSubmit={(e) => handleSaveEdit(e, task.id)} className="space-y-3.5 w-full text-left animate-fade-in">
                    <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                      <span className="text-[9px] font-black uppercase text-primary tracking-wider">Quick Modify Card</span>
                      <button 
                        type="button" 
                        onClick={() => setEditingItemId(null)}
                        className="text-[10px] text-outline font-bold hover:text-red-500 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full h-10 p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-on-surface"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as any)}
                        className="h-10 px-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="P1">P1 (Immediate)</option>
                        <option value="P2">P2 (Adaptive)</option>
                      </select>
                      <select
                        value={editClass}
                        onChange={(e) => setEditClass(e.target.value as any)}
                        className="h-10 px-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="Priority">Priority Card</option>
                        <option value="Focus">Focus Buffer</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={editEnergy}
                        onChange={(e) => setEditEnergy(e.target.value as any)}
                        className="h-10 px-2 bg-white border border-slate-200 rounded-xl text-xs"
                      >
                        <option value="High">High Budget</option>
                        <option value="Medium">Medium Budget</option>
                        <option value="Low">Low Budget</option>
                      </select>
                      <input
                        type="date"
                        required
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        className="h-10 px-2 bg-white border border-slate-200 rounded-xl text-xs text-on-surface"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
                    >
                      Save Updates
                    </button>
                  </form>
                ) : (
                  /* Standard task display rendering */
                  <>
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[8.5px] font-black tracking-widest uppercase bg-slate-100 text-slate-700">
                          {task.priority} • {task.classification}
                        </span>
                        
                        {/* Dynamic deadline target pill */}
                        <span className="flex items-center gap-1 text-[8.5px] font-black tracking-widest text-[#006591] bg-sky-50 px-2 py-0.5 rounded-full uppercase shrink-0">
                          <Calendar className="w-2.5 h-2.5 text-[#006591]" />
                          <span>Due {prettyDeadline}</span>
                        </span>
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                        {/* Add to Schedule Action Button */}
                        <button 
                          onClick={() => startAddToScheduleWorkflow(task)}
                          className="p-1.5 rounded-full hover:bg-slate-100 text-[#006591] transition-colors cursor-pointer"
                          title="Schedule Task Node"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                        </button>
                        {/* Custom Edit Action Icon Button */}
                        <button 
                          onClick={() => startEditMode(task)}
                          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                          title="Edit Task Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => toggleTaskCompleted(task.id)}
                          className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
                          title="Toggle Completion"
                        >
                          <CheckCircle2 className={`w-4.5 h-4.5 ${task.completed ? 'text-emerald-500 fill-emerald-50' : 'text-slate-400'}`} />
                        </button>
                        <button 
                          onClick={() => removeTask(task.id)}
                          className="p-1 rounded-full hover:bg-slate-100 text-error/70 hover:text-error cursor-pointer"
                          title="Delete Intention"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-base font-black text-on-surface tracking-tight leading-snug">
                      {task.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full ${tagColor}`}>
                        <Bolt className={`w-3 h-3 fill-current ${boltColor} shrink-0`} />
                        <span className="text-[9px] font-black tracking-wider uppercase">
                          {task.energyBudget || task.energyLevel} Energy
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-[9px] font-bold text-outline uppercase tracking-wider">
                        <Layout className="w-3.5 h-3.5" />
                        <span>{task.focusDuration}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

        </div>
      </div>

      {/* Peaceful workspace placeholder graphic block */}
      <div className="pt-6 opacity-90 flex flex-col items-center select-all">
        <div className="w-full h-44 rounded-3xl overflow-hidden glass-card relative group">
          <img 
            alt="Zen Workplace Illustration" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyEtvaFuqZsZqEU-tmfJpXSk5JCSh6Gv3Dl6TJY1Xkws11KIVSHAhg12Pd9L_MIKI0JGehCf5EppX0bfLU9ByIyQeE37k9loG5hVnmh_Dn9ZkonapIoE0MCkgEbyZso1vK486DF69RqA3xgYJ2AuE4VgzmuWmbHN-TWDH2bqDq_9lh0RtUHhVZAFM--OlaKAgXkYAeDiVXC04Uf7aClq8E7CrfyTxnRrWZM0YUs9DCalcP0fYjmGIbR1OnAX73yrw0722GDgpHWXA" 
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
        </div>
        <p className="text-[11px] font-black uppercase tracking-widest text-[#006591] mt-3.5 text-center italic">
          "Simplify your list, simplify your days."
        </p>
      </div>

      {/* Dynamic Modal confirmation for adding a Task entry to the Schedule view */}
      {showAddToScheduleModal && selectedTaskToSchedule && (
        <div className="fixed inset-0 z-55 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-on-surface flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#006591]" />
                <span>Schedule Entry Configuration</span>
              </h3>
              <button 
                onClick={() => {
                  setShowAddToScheduleModal(false);
                  setSelectedTaskToSchedule(null);
                }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-500 whitespace-nowrap"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11.5px] text-outline leading-normal font-semibold">
              Review and adjust details before pinning this task as an active session node on your Schedule page.
            </p>

            <div className="space-y-3.5 pt-1 text-left">
              <div>
                <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                  Schedule Title
                </label>
                <input 
                  type="text" 
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="Schedule block title"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                    Start Time
                  </label>
                  <input 
                    type="text" 
                    value={scheduleStartTime}
                    onChange={(e) => setScheduleStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="e.g. 09:30 AM"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                    End Time
                  </label>
                  <input 
                    type="text" 
                    value={scheduleEndTime}
                    onChange={(e) => setScheduleEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="e.g. 11:00 AM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                    Energy Level
                  </label>
                  <select
                    value={scheduleEnergy}
                    onChange={(e) => setScheduleEnergy(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white cursor-pointer"
                  >
                    <option value="High">High Energy</option>
                    <option value="Medium">Medium Energy</option>
                    <option value="Low">Low Energy</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                    Target Date
                  </label>
                  <input 
                    type="date" 
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-outline tracking-wider block mb-1">
                  Schedule Emoji Symbol
                </label>
                <input 
                  type="text" 
                  value={scheduleEmoji}
                  onChange={(e) => setScheduleEmoji(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  placeholder="e.g. 🎯"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => {
                  setShowAddToScheduleModal(false);
                  setSelectedTaskToSchedule(null);
                }}
                className="px-4 py-2 text-xs font-bold text-outline rounded-xl hover:bg-slate-100 transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleConfirmAddToSchedule}
                className="px-4 py-2 text-xs font-black text-white bg-primary hover:opacity-95 rounded-xl transition-all shadow-md uppercase tracking-wider cursor-pointer"
              >
                Confirm Add
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
