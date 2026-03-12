export type ShiftType = 'A' | 'B' | 'C' | 'G' | 'Leave' | 'OFF' | 'None';

export interface User {
  id: number;
  name: string;
  company: string;
  department: string;
  position: string;
  notifications_enabled: boolean;
  theme_mode: 'light' | 'dark' | 'system';
  profile_image?: string;
}

export interface Shift {
  id: number;
  user_id: number;
  date: string; // ISO string YYYY-MM-DD
  shift_type: ShiftType;
  leave_reason?: string;
}

export interface Overtime {
  id: number;
  user_id: number;
  date: string;
  hours: number;
  time: string;
  description: string;
}

export const SHIFT_DETAILS = {
  A: { name: 'Shift A', time: '06:00 - 14:00', color: 'bg-accent-blue', textColor: 'text-white' },
  B: { name: 'Shift B', time: '14:00 - 22:00', color: 'bg-accent-orange', textColor: 'text-white' },
  C: { name: 'Shift C', time: '22:00 - 06:00', color: 'bg-accent-purple', textColor: 'text-white' },
  G: { name: 'General Shift', time: '09:00 - 18:00', color: 'bg-accent-yellow', textColor: 'text-slate-900' },
  Leave: { name: 'Leave', time: 'All Day', color: 'bg-accent-red', textColor: 'text-white' },
  OFF: { name: 'Off Day', time: '-', color: 'bg-accent-green', textColor: 'text-white' },
  None: { name: 'No Shift', time: '-', color: 'bg-slate-200 dark:bg-slate-800', textColor: 'text-slate-500' },
};
