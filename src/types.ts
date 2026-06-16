export type MoodType = 'Sad' | 'Okay' | 'Good' | 'Focused' | 'Energized';
export type SubscriptionTier = 'freemium' | 'student' | 'professional';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl: string;
  balanceScore: number;
  focusStreak: number;
  burnoutRisk: number; // percentage, e.g. 12 for 12%
  tier?: SubscriptionTier; // 'freemium' | 'student' | 'professional'
  moodLogCountToday?: number; // strictly tracked for freemium daily limitations
}

export interface MoodCheckIn {
  id: string;
  timestamp: string; // ISO string
  mood: MoodType;
  intensity: number; // 0 to 100
  note?: string;
}

export interface MoodCheckInEntry {
  value: number;
  time: string;
  date: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string; // e.g. "09:00 AM" or "14:00 PM"
  endTime: string;
  energyLevel: 'High' | 'Medium' | 'Low';
  completed: boolean;
  emoji?: string;
  date?: string; // e.g. YYYY-MM-DD
}

export interface TaskItem {
  id: string;
  title: string;
  priority: 'P1' | 'P2';
  classification: 'Priority' | 'Focus'; // "P1 • PRIORITY" or "P2 • FOCUS"
  energyLevel: 'High' | 'Medium' | 'Low';
  focusDuration: string; // e.g., "2h Focus", "15m Focus"
  completed: boolean;
  deadline?: string; // e.g. YYYY-MM-DD
  energyBudget?: string;
}

export interface InsightCard {
  id: string;
  title: string;
  type: 'info' | 'warning';
  shortText: string;
  expandedText: string;
}
