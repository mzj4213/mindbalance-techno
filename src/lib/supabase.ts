import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client lazily using standard import.meta.env config
const supabaseUrl = ((import.meta as any).env)?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = ((import.meta as any).env)?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL');
};

let supabaseInstance: any = null;

export const getSupabase = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
};

/**
 * Sync helper utility to allow seamless fallback during local preview mode.
 * Real databases will read and write to Supabase table connections, falling
 * back to standard browser LocalStorage when variables are unset.
 */
export const supabaseSync = {
  // Profiles
  async getProfile(userId: string) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single();
    if (error) console.warn('Supabase profile select error:', error.message);
    return data;
  },

  async updateProfile(userId: string, updates: any) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb.from('profiles').update(updates).eq('id', userId);
    if (error) console.error('Supabase profile update failure:', error.message);
    return data;
  },

  // Mood Logs
  async fetchMoods(userId: string) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('mood_check_ins')
      .select('*')
      .eq('profile_id', userId)
      .order('timestamp', { ascending: false });
    if (error) console.warn('Supabase fetch moods error:', error.message);
    return data;
  },

  async insertMood(userId: string, moodData: any) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('mood_check_ins')
      .insert([{ profile_id: userId, ...moodData }]);
    if (error) console.error('Supabase insert mood error:', error.message);
    return data;
  },

  // Tasks
  async fetchTasks(userId: string) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error } = await sb
      .from('tasks')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: true });
    if (error) console.warn('Supabase fetch tasks error:', error.message);
    return data;
  },

  async saveTask(userId: string, task: any) {
    const sb = getSupabase();
    if (!sb) return null;
    const payload = {
      id: task.id.length > 20 ? task.id : undefined, // UUID checks
      title: task.title,
      priority: task.priority,
      classification: task.classification,
      energy_level: task.energyLevel,
      focus_duration: task.focusDuration,
      completed: task.completed,
      deadline: task.deadline,
      energy_budget: task.energyBudget,
      profile_id: userId
    };
    
    const { data, error } = await sb.from('tasks').upsert([payload]);
    if (error) console.error('Supabase save task error:', error.message);
    return data;
  },

  async deleteTask(userId: string, taskId: string) {
    const sb = getSupabase();
    if (!sb) return null;
    const { error } = await sb.from('tasks').delete().eq('id', taskId).eq('profile_id', userId);
    if (error) console.error('Supabase delete task error:', error.message);
  }
};
