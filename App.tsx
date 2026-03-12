import React, { useState, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { format, addDays, startOfToday, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { LayoutDashboard, CalendarDays, ClipboardList, Settings, Bell, Sun, Moon, LogOut, Timer, Calendar as CalendarIcon, ChevronRight, Share2, Info, Shield, HelpCircle, FileText, Camera, Image, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { ShiftType, User, Shift, Overtime, SHIFT_DETAILS } from './types';

// --- Components ---

const AdBanner = () => (
  <div className="mt-6 neumorphic-card rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800/50">
    <div className="bg-slate-100 dark:bg-slate-800/50 px-3 py-1 border-b border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sponsored</span>
      <Info size={10} className="text-slate-400" />
    </div>
    <div className="h-[60px] flex items-center justify-center bg-white dark:bg-[#161e2e]">
      <div className="flex flex-col items-center">
        <p className="text-[11px] text-primary font-bold">Advertisement</p>
        <p className="text-[9px] text-slate-400">Standard Banner Ad</p>
      </div>
    </div>
  </div>
);

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'dash', label: 'Dash', icon: LayoutDashboard },
    { id: 'schedule', label: 'Schedule', icon: CalendarDays },
    { id: 'request', label: 'Request', icon: ClipboardList },
    { id: 'setting', label: 'Setting', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800/50 px-6 pb-8 pt-4 flex items-center justify-between z-50 transition-colors duration-300">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex flex-col items-center gap-1.5 transition-colors",
            activeTab === tab.id ? "text-primary" : "text-slate-400 dark:text-slate-500"
          )}
        >
          <tab.icon size={24} fill={activeTab === tab.id ? "currentColor" : "none"} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

const ShiftTimer = ({ shiftType, variant = 'stat' }: { shiftType: ShiftType, variant?: 'stat' | 'large' }) => {
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      if (shiftType === 'None' || shiftType === 'Leave') {
        setTimeLeft('OFF');
        setProgress(0);
        setStatus('No Active Shift');
        return;
      }

      const now = new Date();
      const currentTimeInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
      
      let startHour = 0;
      let endHour = 0;

      if (shiftType === 'A') { startHour = 6; endHour = 14; }
      else if (shiftType === 'B') { startHour = 14; endHour = 22; }
      else if (shiftType === 'C') { startHour = 22; endHour = 6; }
      else if (shiftType === 'G') { startHour = 9; endHour = 18; }

      let startTimeInSeconds = startHour * 3600;
      let endTimeInSeconds = endHour * 3600;

      // Handle Shift C spanning midnight
      if (shiftType === 'C') {
        if (now.getHours() >= 22) {
          endTimeInSeconds = (24 + 6) * 3600;
        } else if (now.getHours() < 6) {
          startTimeInSeconds = -2 * 3600; // 22:00 previous day
          endTimeInSeconds = 6 * 3600;
        }
      }

      if (currentTimeInSeconds < startTimeInSeconds) {
        const diff = startTimeInSeconds - currentTimeInSeconds;
        setTimeLeft(formatTime(diff));
        setProgress(0);
        setStatus('Starts In');
      } else if (currentTimeInSeconds >= endTimeInSeconds) {
        setTimeLeft('00:00:00');
        setProgress(100);
        setStatus('Shift Ended');
      } else {
        const remaining = endTimeInSeconds - currentTimeInSeconds;
        const total = endTimeInSeconds - startTimeInSeconds;
        setTimeLeft(formatTime(remaining));
        setProgress(((total - remaining) / total) * 100);
        setStatus('Ends In');
      }
    };

    const formatTime = (seconds: number) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const interval = setInterval(updateTimer, 1000);
    updateTimer();
    return () => clearInterval(interval);
  }, [shiftType]);

  if (variant === 'large') {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="bg-accent-orange/20 text-accent-orange px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-[0.1em] mb-4 border border-accent-orange/30">
          {shiftType !== 'None' ? `Active Shift ${shiftType}` : 'No Active Shift'}
        </span>
        <h4 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{status}</h4>
        <div className="text-5xl font-black text-slate-900 dark:text-slate-100 tracking-tighter mb-6">
          {timeLeft.split(':').slice(0, 2).join(':')}:<span className="text-accent-orange">{timeLeft.split(':')[2]}</span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full mb-6 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="bg-accent-orange h-full rounded-full shadow-[0_0_10px_rgba(255,140,66,0.5)]"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="neumorphic-card rounded-2xl p-4 flex flex-col gap-2 border border-slate-200 dark:border-slate-700/20">
      <div className="flex items-center gap-2 text-primary">
        <Timer size={18} />
        <span className="text-xs font-bold uppercase tracking-wider">Shift Timer</span>
      </div>
      <div>
        <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{timeLeft}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="bg-primary h-full rounded-full"
        />
      </div>
    </div>
  );
};

const Dashboard = ({ user, shifts, overtime, onResetOT, onDeleteOT, onUpdateUser }: { user: User | null, shifts: Shift[], overtime: Overtime[], onResetOT: () => void, onDeleteOT: (id: number) => void, onUpdateUser: (u: Partial<User>) => void }) => {
  const today = startOfToday();
  const [showMonthlyOT, setShowMonthlyOT] = useState(false);
  
  const getShiftForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.find(s => s.date === dateStr)?.shift_type || 'None';
  };

  const getOTForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const ots = overtime.filter(ot => ot.date === dateStr);
    return {
      hours: ots.reduce((acc, curr) => acc + curr.hours, 0),
      time: ots.length > 0 ? ots[0].time : null
    };
  };

  const todayShift = getShiftForDate(today);
  const todayOT = getOTForDate(today);
  
  const currentMonthOTs = overtime.filter(ot => {
    const otDate = parseISO(ot.date);
    return isSameMonth(otDate, today);
  });

  const monthlyOT = currentMonthOTs.reduce((acc, curr) => acc + curr.hours, 0);
  
  const toggleTheme = () => {
    const modes: User['theme_mode'][] = ['light', 'dark', 'system'];
    const next = modes[(modes.indexOf(user?.theme_mode || 'system') + 1) % modes.length];
    onUpdateUser({ theme_mode: next });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 pb-32"
    >
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 shrink-0 p-0.5 rounded-full bg-gradient-to-tr from-primary to-accent-blue">
            <img 
              className="rounded-full size-full object-cover border-2 border-white dark:border-background-dark" 
              src={user?.profile_image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80"} 
              alt="Profile"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-medium">{format(today, 'EEEE, MMM d')}</p>
            <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">{user?.name || 'Alex Rivera'}</h2>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{user?.position || 'Operations'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="flex size-10 items-center justify-center rounded-xl neumorphic-card text-slate-600 dark:text-slate-100 hover:text-primary transition-colors"
          >
            {user?.theme_mode === 'dark' ? <Moon size={20} /> : user?.theme_mode === 'light' ? <Sun size={20} /> : <Settings size={20} />}
          </button>
          <button className="flex size-10 items-center justify-center rounded-xl neumorphic-card text-slate-600 dark:text-slate-100">
            <Bell size={20} />
          </button>
        </div>
      </header>

      {/* Logo Section */}
      <div className="flex items-center gap-2">
        <div className="size-6 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
          <Timer size={14} className="text-white" />
        </div>
        <h1 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white uppercase">SHIFT MASTER</h1>
      </div>

      {/* Weekly Timeline */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-slate-900 dark:text-slate-100 text-lg font-semibold">Weekly Timeline</h3>
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full uppercase tracking-wider">Cycle {format(today, 'w')}/52</span>
        </div>
        <div className="flex w-full overflow-x-auto hide-scrollbar gap-4 pb-4">
          {[-2, -1, 0, 1, 2, 3, 4].map((offset) => {
            const date = addDays(today, offset);
            const isToday = offset === 0;
            const shift = getShiftForDate(date);
            return (
              <div key={offset} className="flex flex-col items-center gap-2 min-w-[70px]">
                <div className={cn(
                  "size-16 rounded-2xl neumorphic-card flex items-center justify-center flex-col border border-slate-200 dark:border-slate-700/30 transition-all",
                  isToday && "size-[72px] -mt-1 active-glow-orange bg-gradient-to-br from-accent-orange/10 to-transparent",
                  offset > 0 && "opacity-60"
                )}>
                  <span className={cn("text-[10px] uppercase font-bold", isToday ? "text-accent-orange" : "text-slate-500")}>
                    {isToday ? 'Today' : `Day ${date.getDate()}`}
                  </span>
                  <span className="text-lg font-bold text-slate-700 dark:text-slate-200">{format(date, 'EEE')}</span>
                </div>
                {shift !== 'None' && (
                  <div className={cn("size-1.5 rounded-full", SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS].color)}></div>
                )}
                {isToday && shift !== 'None' && (
                  <span className="text-[10px] font-bold text-accent-orange uppercase">Shift {shift}</span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4">
        <div className="neumorphic-card rounded-2xl p-4 flex flex-col gap-2 border border-slate-200 dark:border-slate-700/20 text-left">
          <div className="flex items-center gap-2 text-primary">
            <CalendarIcon size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Today's Shift</span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{todayShift}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">
            {todayShift !== 'None' ? SHIFT_DETAILS[todayShift as keyof typeof SHIFT_DETAILS].name : 'No Shift Scheduled'}
          </p>
        </div>
        <button 
          onClick={() => setShowMonthlyOT(true)}
          className="neumorphic-card rounded-2xl p-4 flex flex-col gap-2 border border-slate-200 dark:border-slate-700/20 text-left"
        >
          <div className="flex items-center gap-2 text-accent-green">
            <Timer size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Today OT</span>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{todayOT.hours}</span>
            <span className="text-sm font-medium text-slate-400"> hrs</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">{todayOT.time || 'No OT Logged'}</p>
        </button>
      </section>

      {/* Monthly Summary Card */}
      <section 
        onClick={() => setShowMonthlyOT(true)}
        className="neumorphic-card rounded-2xl p-4 flex flex-col gap-2 border border-slate-200 dark:border-slate-700/20 cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-accent-yellow">
            <CalendarIcon size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">Monthly OT</span>
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </div>
        <div>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{monthlyOT}</span>
          <span className="text-sm font-medium text-slate-400"> hrs</span>
        </div>
        <p className="text-[10px] text-slate-500 font-medium">Monthly Total for {format(today, 'MMMM')}</p>
      </section>

      {/* Monthly OT Modal */}
      <AnimatePresence>
        {showMonthlyOT && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm neumorphic-card rounded-3xl p-6 space-y-6 max-h-[80vh] overflow-y-auto hide-scrollbar"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Monthly OT Details</h3>
                <button onClick={() => setShowMonthlyOT(false)} className="p-2 neumorphic-card rounded-lg">
                  <LogOut size={16} className="rotate-180" />
                </button>
              </div>
              
              <div className="space-y-3">
                {currentMonthOTs.length > 0 ? (
                  currentMonthOTs.map(ot => (
                    <div key={ot.id} className="neumorphic-inset p-4 rounded-2xl flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => onDeleteOT(ot.id)}
                          className="p-2 neumorphic-card rounded-lg text-accent-red opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                        <div>
                          <p className="text-sm font-bold">{format(parseISO(ot.date), 'EEE, MMM d')}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-bold">{ot.time || 'Extra Time'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-accent-green">{ot.hours}h</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-8">No OT records for this month.</p>
                )}
              </div>

              <button 
                onClick={onResetOT}
                className="w-full py-4 rounded-2xl bg-accent-red/10 text-accent-red font-bold flex items-center justify-center gap-2 border border-accent-red/20"
              >
                <Trash2 size={18} />
                Reset All OT Data
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Active Shift Card */}
      <section>
        <div className="neumorphic-card rounded-[2.5rem] p-8 flex flex-col items-center text-center relative overflow-hidden border border-slate-200 dark:border-slate-700/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-orange/10 blur-[50px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 blur-[40px] rounded-full"></div>
          
          <ShiftTimer shiftType={todayShift as ShiftType} variant="large" />
          
          <div className="w-full flex items-center justify-between neumorphic-inset rounded-2xl p-4 mb-6">
            <div className="text-left">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Start</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {todayShift !== 'None' ? SHIFT_DETAILS[todayShift as keyof typeof SHIFT_DETAILS].time.split(' - ')[0] : '-'}
              </p>
            </div>
            <div className="flex-1 flex justify-center items-center">
              <div className="h-[1px] w-12 bg-slate-300 dark:bg-slate-700"></div>
              <Timer size={20} className="text-slate-400 dark:text-slate-600 px-2" />
              <div className="h-[1px] w-12 bg-slate-300 dark:bg-slate-700"></div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">End</p>
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {todayShift !== 'None' ? SHIFT_DETAILS[todayShift as keyof typeof SHIFT_DETAILS].time.split(' - ')[1] : '-'}
              </p>
            </div>
          </div>
          
          <button className="w-full bg-primary hover:scale-[0.98] active:scale-95 transition-transform text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2">
            <LogOut size={20} />
            Clock Out Early
          </button>
        </div>
      </section>

      <footer className="text-center opacity-50">
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Shift Master - Shifts in Motion, Records in Control.</p>
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Developed by Appzyro</p>
      </footer>

      <AdBanner />
    </motion.div>
  );
};

const Schedule = ({ shifts, overtime, onAddShift, onBulkAddShifts }: { shifts: Shift[], overtime: Overtime[], onAddShift: (date: string, type: ShiftType, reason?: string) => void, onBulkAddShifts: (newShifts: { date: string, shift_type: ShiftType, leave_reason?: string }[]) => void }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [leaveReason, setLeaveReason] = useState('');
  const [showLeaveInput, setShowLeaveInput] = useState(false);
  const [viewingShiftDate, setViewingShiftDate] = useState<string | null>(null);
  
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getShiftForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.find(s => s.date === dateStr)?.shift_type || 'None';
  };

  const getFullShiftForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.find(s => s.date === dateStr);
  };

  const getOTForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const ots = overtime.filter(ot => ot.date === dateStr);
    return {
      hours: ots.reduce((acc, curr) => acc + curr.hours, 0),
      time: ots.length > 0 ? ots[0].time : null
    };
  };

  const monthShifts = shifts.filter(s => {
    const d = parseISO(s.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  });

  const monthOT = overtime.filter(ot => {
    const d = parseISO(ot.date);
    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
  }).reduce((acc, curr) => acc + curr.hours, 0);

  const shiftCounts = monthShifts.reduce((acc, curr) => {
    acc[curr.shift_type] = (acc[curr.shift_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleSetMonthShift = (type: ShiftType) => {
    if (confirm(`Set all days in ${format(currentMonth, 'MMMM')} to ${type}?`)) {
      const newShifts = days.map(day => ({
        date: format(day, 'yyyy-MM-dd'),
        shift_type: type
      }));
      onBulkAddShifts(newShifts);
    }
  };

  const handleBulkApply = (type: ShiftType) => {
    if (selectedDates.length === 0) return;
    
    if (type === 'Leave') {
      setShowLeaveInput(true);
      return;
    }

    const newShifts = selectedDates.map(date => ({
      date,
      shift_type: type
    }));
    onBulkAddShifts(newShifts);
    setSelectedDates([]);
    setBulkMode(false);
  };

  const handleLeaveSubmit = () => {
    if (bulkMode) {
      const newShifts = selectedDates.map(date => ({
        date,
        shift_type: 'Leave' as ShiftType,
        leave_reason: leaveReason
      }));
      onBulkAddShifts(newShifts);
      setSelectedDates([]);
      setBulkMode(false);
    } else if (selectedDate) {
      onAddShift(selectedDate, 'Leave', leaveReason);
      setSelectedDate(null);
    }
    setShowLeaveInput(false);
    setLeaveReason('');
  };

  const toggleDateSelection = (dateStr: string) => {
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dateStr));
    } else {
      setSelectedDates([...selectedDates, dateStr]);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-32"
    >
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentMonth(addDays(currentMonth, -30))} className="p-2 neumorphic-card rounded-lg">
            <ChevronRight className="rotate-180" size={18} />
          </button>
          <button onClick={() => setCurrentMonth(addDays(currentMonth, 30))} className="p-2 neumorphic-card rounded-lg">
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      {/* Bulk & Manual Edit Buttons */}
      <section className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => {
            setBulkMode(!bulkMode);
            setSelectedDates([]);
            setSelectedDate(null);
          }}
          className={cn(
            "py-4 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2",
            bulkMode ? "bg-accent-orange text-white shadow-accent-orange/30" : "neumorphic-card text-slate-400"
          )}
        >
          <ClipboardList size={18} />
          {bulkMode ? "Cancel Bulk" : "Bulk Edit"}
        </button>
        <div className="relative">
          <button 
            className="w-full py-4 rounded-2xl font-bold text-sm neumorphic-card text-primary shadow-lg flex items-center justify-center gap-2"
          >
            <CalendarIcon size={18} />
            Manual Edit
          </button>
          <input 
            type="date" 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </section>

      {/* Shift Selection for Bulk/Month */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            {bulkMode ? `Selected: ${selectedDates.length} days` : 'Quick Set Month'}
          </h3>
          {bulkMode && selectedDates.length > 0 && (
            <button 
              onClick={() => setSelectedDates(days.map(d => format(d, 'yyyy-MM-dd')))}
              className="text-[9px] font-bold text-primary uppercase"
            >
              Select All
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {['A', 'B', 'C', 'G', 'Leave', 'OFF', 'None'].map((type) => (
            <button
              key={type}
              onClick={() => bulkMode ? handleBulkApply(type as ShiftType) : handleSetMonthShift(type as ShiftType)}
              className={cn(
                "px-3 py-2 rounded-xl neumorphic-card text-[10px] font-bold uppercase whitespace-nowrap border transition-all",
                bulkMode && selectedDates.length > 0 ? "border-primary/50" : "border-transparent",
                SHIFT_DETAILS[type as keyof typeof SHIFT_DETAILS].color,
                SHIFT_DETAILS[type as keyof typeof SHIFT_DETAILS].textColor
              )}
            >
              {bulkMode ? `Apply ${type}` : `Set Month ${type}`}
            </button>
          ))}
        </div>
      </section>

      {/* Monthly Summary Card */}
      <section className="neumorphic-card rounded-2xl p-4 border border-slate-700/20 grid grid-cols-5 gap-2">
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">OT</p>
          <p className="text-base font-black text-accent-green">{monthOT}h</p>
        </div>
        <div className="text-center border-x border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">A</p>
          <p className="text-base font-black text-accent-blue">{shiftCounts['A'] || 0}</p>
        </div>
        <div className="text-center border-r border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">B</p>
          <p className="text-base font-black text-accent-orange">{shiftCounts['B'] || 0}</p>
        </div>
        <div className="text-center border-r border-slate-800">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">C</p>
          <p className="text-base font-black text-accent-purple">{shiftCounts['C'] || 0}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">G</p>
          <p className="text-base font-black text-accent-yellow">{shiftCounts['G'] || 0}</p>
        </div>
      </section>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-slate-600 uppercase">{d}</div>
        ))}
        {days.map(day => {
          const shift = getShiftForDate(day);
          const ot = getOTForDate(day);
          const isToday = isSameDay(day, new Date());
          const dateStr = format(day, 'yyyy-MM-dd');
          const isSelected = selectedDates.includes(dateStr);
          const shiftLetter = shift === 'Leave' ? 'L' : shift === 'None' ? '-' : shift;
          
          return (
            <button 
              key={day.toString()}
              onClick={() => {
                if (bulkMode) {
                  toggleDateSelection(dateStr);
                } else {
                  setViewingShiftDate(dateStr);
                }
              }}
              className={cn(
                "aspect-square rounded-lg neumorphic-card flex flex-col items-center justify-center relative border transition-all overflow-hidden",
                SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS].color,
                isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background-dark z-10",
                isSelected && "ring-2 ring-primary bg-primary/20 z-10 scale-95"
              )}
            >
              <span className={cn(
                "text-[10px] font-bold relative z-10 opacity-60",
                SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS].textColor
              )}>{day.getDate()}</span>
              
              <span className={cn(
                "text-xs font-black relative z-10",
                SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS].textColor
              )}>{shiftLetter}</span>
              
              <div className="flex gap-0.5 mt-0.5 relative z-10">
                {ot.hours > 0 && (
                  <div className="size-1 rounded-full bg-white shadow-sm"></div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Day Selector (Manual System) */}
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Manual Edit</h3>
        <input 
          type="date" 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="bg-transparent border-none text-[10px] font-bold text-primary uppercase focus:ring-0"
        />
      </div>

      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="neumorphic-inset rounded-2xl p-4 space-y-3 overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase">Set Shift for {format(parseISO(selectedDate), 'MMM d')}</h4>
              <button onClick={() => setSelectedDate(null)} className="text-slate-500 hover:text-white">
                <LogOut size={16} className="rotate-180" />
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['A', 'B', 'C', 'G', 'Leave', 'OFF', 'None'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    if (type === 'Leave') {
                      setShowLeaveInput(true);
                    } else {
                      onAddShift(selectedDate, type as ShiftType);
                      setSelectedDate(null);
                    }
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl neumorphic-card text-xs font-bold transition-all",
                    getShiftForDate(parseISO(selectedDate)) === type ? "border-primary text-primary" : "text-slate-300"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Reason Modal */}
      <AnimatePresence>
        {showLeaveInput && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm neumorphic-card rounded-3xl p-6 space-y-6"
            >
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Leave Reason</h3>
              <textarea 
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Enter reason for leave..."
                className="w-full neumorphic-inset rounded-xl p-4 bg-transparent border-none focus:ring-2 focus:ring-primary text-slate-900 dark:text-white h-32"
              />
              <div className="flex gap-3">
                <button onClick={() => setShowLeaveInput(false)} className="flex-1 py-3 rounded-xl neumorphic-inset font-bold text-slate-500">Cancel</button>
                <button onClick={handleLeaveSubmit} className="flex-1 py-3 rounded-xl bg-primary text-white font-bold">Apply Leave</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shift Detail Modal */}
      <AnimatePresence>
        {viewingShiftDate && (
          <ShiftDetailModal 
            date={viewingShiftDate} 
            shift={getFullShiftForDate(parseISO(viewingShiftDate))} 
            ot={getOTForDate(parseISO(viewingShiftDate))}
            onClose={() => setViewingShiftDate(null)} 
          />
        )}
      </AnimatePresence>

      {/* Duty List View */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Duty List</h3>
        <div className="space-y-3">
          {days.filter(d => getShiftForDate(d) !== 'None' || getOTForDate(d).hours > 0).map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const shift = getShiftForDate(day);
            const ot = getOTForDate(day);
            return (
              <div 
                key={dateStr} 
                onClick={() => setViewingShiftDate(dateStr)}
                className="neumorphic-card p-4 rounded-2xl flex items-center justify-between border border-slate-800/30 cursor-pointer active:scale-95 transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("size-10 rounded-xl flex items-center justify-center font-black text-lg", SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS].color, SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS].textColor)}>
                    {shift === 'Leave' ? 'L' : shift === 'None' ? '-' : shift}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">{format(day, 'EEEE, MMM d')}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS].name}
                      {ot.hours > 0 && ` • ${ot.hours}h OT`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400">
                    {shift !== 'None' ? SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS].time : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <AdBanner />
    </motion.div>
  );
};

const Request = ({ overtime, onAddOT, onResetOT, onDeleteOT }: { overtime: Overtime[], onAddOT: (hours: number, date: string, time: string) => void, onResetOT: () => void, onDeleteOT: (id: number) => void }) => {
  const [hours, setHours] = useState(2);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('18:00 - 20:00');

  const monthlyOTs = overtime.filter(ot => isSameMonth(parseISO(ot.date), new Date()));

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 pb-32"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Shift Requests</h2>
        <button onClick={onResetOT} className="p-2 neumorphic-card rounded-lg text-accent-red">
          <Trash2 size={20} />
        </button>
      </div>
      
      <div className="neumorphic-card p-6 rounded-3xl space-y-6">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Log Extra Hours</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="neumorphic-inset p-4 rounded-2xl space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Date</span>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 w-full text-slate-900 dark:text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="neumorphic-inset p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Hours</span>
              <input 
                type="number" 
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 w-full text-slate-900 dark:text-white"
              />
            </div>
            <div className="neumorphic-inset p-4 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Time (e.g. 18:00-20:00)</span>
              <input 
                type="text" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-transparent border-none p-0 text-sm font-bold focus:ring-0 w-full text-slate-900 dark:text-white"
                placeholder="18:00 - 20:00"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={() => onAddOT(hours, date, time)}
          className="w-full bg-primary py-4 rounded-2xl text-white font-bold text-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
        >
          Submit OT Request
        </button>
      </div>

      <section className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monthly OT Log</h3>
        <div className="space-y-3">
          {monthlyOTs.length > 0 ? (
            monthlyOTs.map(ot => (
              <div key={ot.id} className="neumorphic-card p-4 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onDeleteOT(ot.id)}
                    className="p-2 neumorphic-inset rounded-lg text-accent-red opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div>
                    <p className="font-bold">{format(parseISO(ot.date), 'EEEE, MMM d')}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{ot.time || 'Extra Hours'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-accent-green">+{ot.hours}h</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-slate-500 py-8 text-sm italic">No OT logged this month.</p>
          )}
        </div>
      </section>

      <AdBanner />
    </motion.div>
  );
};

const ShiftDetailModal = ({ date, shift, ot, onClose }: { date: string, shift: Shift | undefined, ot: { hours: number, time: string | null }, onClose: () => void }) => {
  const shiftType = shift?.shift_type || 'None';
  const details = SHIFT_DETAILS[shiftType as keyof typeof SHIFT_DETAILS];
  
  const totalHours = (shiftType !== 'None' && shiftType !== 'Leave' && shiftType !== 'OFF') ? 8 + ot.hours : ot.hours;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm neumorphic-card rounded-3xl p-8 space-y-6 text-center relative overflow-hidden border border-slate-200 dark:border-slate-700/20"
      >
        <div className={cn("absolute top-0 left-0 w-full h-2", details.color)}></div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100">{format(parseISO(date), 'EEEE, MMM d')}</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{details.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="neumorphic-inset p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Timing</p>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{details.time}</p>
          </div>
          <div className="neumorphic-inset p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Overtime</p>
            <p className="text-sm font-bold text-accent-green">{ot.hours} Hours</p>
            {ot.time && <p className="text-[9px] text-slate-400 mt-1">{ot.time}</p>}
          </div>
        </div>

        <div className="neumorphic-inset p-4 rounded-2xl">
          <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Total Duty Time</p>
          <p className="text-lg font-black text-primary">{totalHours} Hours</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => {
              onClose();
              // We need a way to trigger edit for this date. 
              // Since this modal is inside Schedule, we can't easily reach setSelectedDate.
              // But we can just use the manual edit input.
            }} 
            className="flex-1 py-3 rounded-xl neumorphic-inset font-bold text-slate-500"
          >
            Close
          </button>
        </div>

        {shift?.leave_reason && (
          <div className="neumorphic-inset p-4 rounded-2xl text-left">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Leave Reason</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{shift.leave_reason}"</p>
          </div>
        )}

        <button 
          onClick={onClose}
          className="w-full bg-primary py-4 rounded-2xl text-white font-bold shadow-lg shadow-primary/30"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
};

const ProfileEditModal = ({ user, onClose, onSave }: { user: User | null, onClose: () => void, onSave: (u: Partial<User>) => Promise<void> | void }) => {
  const [name, setName] = useState(user?.name || '');
  const [company, setCompany] = useState(user?.company || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [position, setPosition] = useState(user?.position || '');
  const [profileImage, setProfileImage] = useState(user?.profile_image || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({ name, company, department, position, profile_image: profileImage });
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setShowCamera(false);
      alert("Could not access camera.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setProfileImage(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm neumorphic-card rounded-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto hide-scrollbar"
      >
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Profile</h3>
        
        <div className="flex flex-col items-center gap-4">
          <div className="relative size-24 rounded-full p-1 bg-gradient-to-tr from-primary to-accent-blue">
            <img 
              src={profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80"} 
              className="size-full rounded-full object-cover border-2 border-white dark:border-background-dark" 
              alt="Profile"
            />
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              <button 
                onClick={startCamera}
                className="size-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-background-dark"
                title="Take Photo"
              >
                <Camera size={14} />
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="size-8 bg-accent-blue text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-background-dark"
                title="Pick from Gallery"
              >
                <Image size={14} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleGalleryPick} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Profile Picture</p>
        </div>

        {showCamera && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
              <video ref={videoRef} autoPlay playsInline className="size-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="flex gap-2">
              <button onClick={stopCamera} className="flex-1 py-2 rounded-xl neumorphic-inset font-bold text-slate-500">Cancel</button>
              <button onClick={capturePhoto} className="flex-1 py-2 rounded-xl bg-primary text-white font-bold">Capture</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
            <input 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full neumorphic-inset rounded-xl p-3 border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-900 dark:text-white"
              placeholder="Your Name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Company</label>
            <input 
              value={company} 
              onChange={(e) => setCompany(e.target.value)}
              className="w-full neumorphic-inset rounded-xl p-3 border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-900 dark:text-white"
              placeholder="Company Name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Department</label>
            <input 
              value={department} 
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full neumorphic-inset rounded-xl p-3 border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-900 dark:text-white"
              placeholder="Department"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Position</label>
            <input 
              value={position} 
              onChange={(e) => setPosition(e.target.value)}
              className="w-full neumorphic-inset rounded-xl p-3 border-none focus:ring-2 focus:ring-primary bg-transparent text-slate-900 dark:text-white"
              placeholder="Your Position"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={isSaving} className="flex-1 py-3 rounded-xl neumorphic-inset font-bold text-slate-500 disabled:opacity-50">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && <div className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PrivacyPage = ({ title, content, onClose }: { title: string, content: string, onClose: () => void }) => {
  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-0 z-[110] bg-background-light dark:bg-background-dark p-6 overflow-y-auto"
    >
      <header className="flex items-center gap-4 mb-8">
        <button onClick={onClose} className="p-2 neumorphic-card rounded-lg">
          <ChevronRight className="rotate-180" />
        </button>
        <h2 className="text-xl font-bold">{title}</h2>
      </header>
      <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">
        {content}
      </div>
      <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Developed by Appzyro</p>
        <p className="text-[10px] text-slate-400 mt-1">Contact: shubhamdigital96@gmail.com</p>
      </footer>
    </motion.div>
  );
};

const SettingsScreen = ({ user, onUpdateUser }: { user: User | null, onUpdateUser: (u: Partial<User>) => void }) => {
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [privacyPage, setPrivacyPage] = useState<{ title: string, content: string } | null>(null);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Shift Master',
          text: 'Track your rotating shifts easily with Shift Master!',
          url: 'https://appzyro.com/shift-master',
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      alert('Sharing is not supported on this browser. Copy link: https://appzyro.com/shift-master');
    }
  };

  const privacyContent = {
    privacy: "Privacy Policy\n\nLast Updated: March 2026\n\nShift Master ('we', 'our', or 'us') is committed to protecting your privacy. This Privacy Policy explains how your information is collected, used, and disclosed by Shift Master when you use our mobile application.\n\n1. Information Collection and Use\nWe collect shift data and overtime records locally on your device. This information is used solely to provide the core functionality of the app (shift tracking, reminders, and overtime calculation). We do not transmit this data to our servers or any third parties.\n\n2. Local Storage\nYour data is stored using local storage mechanisms on your device. We take reasonable measures to protect this information from unauthorized access.\n\n3. Third-Party Services (AdMob)\nOur app uses Google AdMob to display advertisements. AdMob may collect and use certain data (such as your device's advertising ID) to serve personalized ads. For more information, please refer to Google's Privacy Policy.\n\n4. Data Security\nWe prioritize the security of your data. However, please remember that no method of electronic storage is 100% secure.\n\n5. Contact Us\nIf you have any questions about this Privacy Policy, please contact us at: shubhamdigital96@gmail.com",
    terms: "Terms and Conditions\n\nLast Updated: March 2026\n\nBy downloading or using Shift Master, these terms will automatically apply to you – you should make sure therefore that you read them carefully before using the app.\n\n1. Usage\nShift Master is a tool for personal organization. You are responsible for the accuracy of the shift data you enter. It should not be used as a primary source for payroll or legal disputes.\n\n2. Intellectual Property\nYou are not allowed to copy, or modify the app, any part of the app, or our trademarks in any way.\n\n3. Changes to These Terms\nWe may update our Terms and Conditions from time to time. Thus, you are advised to review this page periodically for any changes.\n\n4. Contact Us\nIf you have any questions or suggestions about our Terms and Conditions, do not hesitate to contact us at: shubhamdigital96@gmail.com",
    disclaimer: "Disclaimer\n\nLast Updated: March 2026\n\n1. Informational Purposes Only\nShift Master is developed by Appzyro for informational purposes only. While we strive for accuracy, we are not responsible for any errors or omissions in the shift calculations or reminders.\n\n2. No Professional Advice\nThe information provided by Shift Master does not constitute professional, legal, or financial advice.\n\n3. User Responsibility\nAlways verify your schedule with your official employer records. We are not liable for any losses or damages arising from the use of this app.\n\n4. Contact Us\nFor any clarifications, contact: shubhamdigital96@gmail.com",
    about: "About App\n\nShift Master is a comprehensive shift management tool designed for employees working in rotating shifts (A, B, C, G).\n\nDeveloped by: Appzyro\nVersion: 1.2.0\nContact: shubhamdigital96@gmail.com"
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6 pb-32"
    >
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
      </header>

      <section className="neumorphic-card rounded-3xl p-6 flex items-center gap-4">
        <div className="size-20 rounded-full border-2 border-primary/30 p-1">
          <img 
            src={user?.profile_image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&h=100&q=80"} 
            className="size-full rounded-full object-cover" 
            alt="Profile"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</h2>
          <p className="text-slate-500 text-sm">{user?.department} @ {user?.company}</p>
          <button 
            onClick={() => setShowProfileEdit(true)}
            className="mt-2 px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg"
          >
            Edit Profile
          </button>
        </div>
      </section>

      <div className="space-y-4">
        <div className="neumorphic-card rounded-2xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 neumorphic-inset rounded-lg flex items-center justify-center text-primary">
              <Bell size={20} />
            </div>
            <span className="font-medium">Notifications</span>
          </div>
          <button 
            onClick={() => onUpdateUser({ notifications_enabled: !user?.notifications_enabled })}
            className={cn(
              "w-11 h-6 rounded-full transition-colors relative",
              user?.notifications_enabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
            )}
          >
            <div className={cn(
              "absolute top-1 size-4 bg-white rounded-full transition-all",
              user?.notifications_enabled ? "left-6" : "left-1"
            )} />
          </button>
        </div>

        {[
          { icon: Shield, label: 'Privacy Policy', key: 'privacy' },
          { icon: FileText, label: 'Terms and Conditions', key: 'terms' },
          { icon: HelpCircle, label: 'Disclaimer', key: 'disclaimer' },
          { icon: Info, label: 'About App', key: 'about' },
        ].map((item) => (
          <button 
            key={item.label} 
            onClick={() => setPrivacyPage({ title: item.label, content: privacyContent[item.key as keyof typeof privacyContent] })}
            className="w-full neumorphic-card rounded-2xl px-4 py-4 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 neumorphic-inset rounded-lg flex items-center justify-center text-primary">
                <item.icon size={20} />
              </div>
              <span className="font-medium">{item.label}</span>
            </div>
            <ChevronRight className="text-slate-500 group-hover:text-primary transition-colors" />
          </button>
        ))}

        <button 
          onClick={handleShare}
          className="w-full neumorphic-card rounded-2xl px-4 py-4 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 neumorphic-inset rounded-lg flex items-center justify-center text-primary">
              <Share2 size={20} />
            </div>
            <span className="font-medium">Share App</span>
          </div>
          <ChevronRight className="text-slate-500 group-hover:text-primary transition-colors" />
        </button>

        <div className="neumorphic-card rounded-2xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 neumorphic-inset rounded-lg flex items-center justify-center text-primary">
              <ClipboardList size={20} />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-medium">App Version</span>
              <span className="text-xs text-slate-500">Version 1.2.0 - Up to date</span>
            </div>
          </div>
          <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        </div>
      </div>

      {showProfileEdit && (
        <ProfileEditModal 
          user={user} 
          onClose={() => setShowProfileEdit(false)} 
          onSave={async (updates) => {
            await onUpdateUser(updates);
            setShowProfileEdit(false);
          }} 
        />
      )}

      {/* AdBanner */}
      <AdBanner />

      <footer className="text-center pt-4 pb-8 space-y-2">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Developed by Appzyro</p>
        <p className="text-[10px] text-slate-400">Version 1.2.0 (Build 20241005)</p>
      </footer>

      <AnimatePresence>
        {privacyPage && (
          <PrivacyPage 
            title={privacyPage.title} 
            content={privacyPage.content} 
            onClose={() => setPrivacyPage(null)} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};


// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dash');
  const [user, setUser] = useState<User | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [overtime, setOvertime] = useState<Overtime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // Request Notification Permission
      if ('Notification' in window) {
        await Notification.requestPermission();
      }
      
      try {
        await LocalNotifications.requestPermissions();
      } catch {
        console.warn("Capacitor notifications not available");
      }

      loadLocalData();
    };
    initApp();
  }, []);

  const loadLocalData = () => {
    const savedUser = localStorage.getItem('user_profile');
    const savedShifts = localStorage.getItem('shifts_data');
    const savedOT = localStorage.getItem('overtime_data');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      const defaultUser: User = {
        id: 1,
        name: 'Alex Rivera',
        company: 'AppZyro Corp',
        department: 'Operations',
        position: 'Shift Lead',
        notifications_enabled: true,
        theme_mode: 'system'
      };
      setUser(defaultUser);
      localStorage.setItem('user_profile', JSON.stringify(defaultUser));
    }

    if (savedShifts) setShifts(JSON.parse(savedShifts));
    if (savedOT) setOvertime(JSON.parse(savedOT));
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    localStorage.setItem('user_profile', JSON.stringify(user));
    localStorage.setItem('theme_mode', user.theme_mode);

    const root = window.document.documentElement;
    const applyTheme = () => {
      const theme = user.theme_mode;
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(systemTheme);
      } else {
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
      }
    };
    applyTheme();
  }, [user]);

  useEffect(() => {
    if (!user || !user.notifications_enabled || shifts.length === 0) return;

    const scheduleNotifications = async () => {
      try {
        await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
        
        const today = startOfToday();
        const tomorrow = addDays(today, 1);
        const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
        const tomorrowShift = shifts.find(s => s.date === tomorrowStr)?.shift_type;

        if (tomorrowShift && tomorrowShift !== 'None' && tomorrowShift !== 'OFF') {
          let startHour = 6;
          if (tomorrowShift === 'B') startHour = 14;
          if (tomorrowShift === 'C') startHour = 22;
          if (tomorrowShift === 'G') startHour = 9;

          const notifyTime = new Date(tomorrow);
          notifyTime.setHours(startHour - 1, 0, 0, 0);

          if (notifyTime > new Date()) {
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: 'Shift Reminder',
                  body: `Your ${SHIFT_DETAILS[tomorrowShift as keyof typeof SHIFT_DETAILS].name} starts in 1 hour!`,
                  id: 1,
                  schedule: { at: notifyTime },
                  sound: 'default',
                }
              ]
            });
          }
        }
      } catch (e) {
        console.warn("Notification scheduling failed", e);
      }
    };
    scheduleNotifications();
  }, [user, shifts]);

  const handleAddShift = (date: string, shift_type: ShiftType, leave_reason?: string) => {
    const newShifts = [...shifts];
    const existingIndex = newShifts.findIndex(s => s.date === date);
    
    const shiftEntry = { id: Date.now(), user_id: 1, date, shift_type, leave_reason };
    
    if (existingIndex > -1) {
      newShifts[existingIndex] = shiftEntry;
    } else {
      newShifts.push(shiftEntry);
    }

    // Auto-fill cycle logic: B, B, A, A, C, C after OFF
    if (shift_type === 'OFF') {
      const cycle = ['B', 'B', 'A', 'A', 'C', 'C'];
      const startDate = parseISO(date);
      cycle.forEach((type, index) => {
        const nextDate = addDays(startDate, index + 1);
        const nextDateStr = format(nextDate, 'yyyy-MM-dd');
        const nextShift = { id: Date.now() + index + 1, user_id: 1, date: nextDateStr, shift_type: type as ShiftType };
        const idx = newShifts.findIndex(s => s.date === nextDateStr);
        if (idx > -1) newShifts[idx] = nextShift;
        else newShifts.push(nextShift);
      });
    }

    setShifts(newShifts);
    localStorage.setItem('shifts_data', JSON.stringify(newShifts));
  };

  const handleBulkAddShifts = (bulkShifts: { date: string, shift_type: ShiftType, leave_reason?: string }[]) => {
    const newShifts = [...shifts];
    bulkShifts.forEach(bs => {
      const idx = newShifts.findIndex(s => s.date === bs.date);
      const entry = { id: Date.now() + Math.random(), user_id: 1, ...bs };
      if (idx > -1) newShifts[idx] = entry;
      else newShifts.push(entry);
    });
    setShifts(newShifts);
    localStorage.setItem('shifts_data', JSON.stringify(newShifts));
  };

  const handleAddOT = (hours: number, date: string, time: string) => {
    const newOT = [...overtime, { id: Date.now(), user_id: 1, date, hours, time, description: '' }];
    setOvertime(newOT);
    localStorage.setItem('overtime_data', JSON.stringify(newOT));
    setActiveTab('dash');
  };

  const handleResetOT = () => {
    if (window.confirm("Are you sure you want to delete all overtime data? This cannot be undone.")) {
      setOvertime([]);
      localStorage.removeItem('overtime_data');
    }
  };

  const handleDeleteOT = (id: number) => {
    const newOT = overtime.filter(ot => ot.id !== id);
    setOvertime(newOT);
    localStorage.setItem('overtime_data', JSON.stringify(newOT));
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    setUser(prev => {
      const newUser = prev ? { ...prev, ...updates } : null;
      if (newUser) {
        localStorage.setItem('user_profile', JSON.stringify(newUser));
      }
      return newUser;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Shift Master...</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shifts in Motion, Records in Control.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-background-light dark:bg-background-dark relative overflow-x-hidden p-6">
      <AnimatePresence mode="wait">
        {activeTab === 'dash' && (
          <Dashboard 
            key="dash" 
            user={user} 
            shifts={shifts} 
            overtime={overtime} 
            onResetOT={handleResetOT}
            onDeleteOT={handleDeleteOT}
            onUpdateUser={handleUpdateUser}
          />
        )}
        {activeTab === 'schedule' && (
          <Schedule 
            key="schedule" 
            shifts={shifts} 
            overtime={overtime} 
            onAddShift={handleAddShift} 
            onBulkAddShifts={handleBulkAddShifts} 
          />
        )}
        {activeTab === 'request' && (
          <Request 
            key="request" 
            overtime={overtime}
            onAddOT={handleAddOT} 
            onResetOT={handleResetOT}
            onDeleteOT={handleDeleteOT}
          />
        )}
        {activeTab === 'setting' && (
          <SettingsScreen 
            key="setting" 
            user={user} 
            onUpdateUser={handleUpdateUser} 
          />
        )}
      </AnimatePresence>
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
