-- Supabase Database Schema for MindBalance Application
-- Copy and paste this directly into your Supabase SQL Editor to provision tables instantly!

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'Zen Student',
    avatar_url TEXT,
    balance_score INTEGER DEFAULT 75,
    focus_streak INTEGER DEFAULT 0,
    burnout_risk INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
    ON public.profiles FOR SELECT 
    USING (true);

CREATE POLICY "Allow users to update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Trigger to auto-create a user profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Zen User'),
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
        'Focus Practitioner'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Mood Check-ins Table
CREATE TABLE IF NOT EXISTS public.mood_check_ins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mood TEXT NOT NULL CHECK (mood IN ('Sad', 'Okay', 'Good', 'Focused', 'Energized')),
    intensity INTEGER NOT NULL CHECK (intensity >= 0 AND intensity <= 100),
    note TEXT,
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for mood_check_ins
ALTER TABLE public.mood_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read own mood check-ins" 
    ON public.mood_check_ins FOR SELECT 
    USING (auth.uid() = profile_id);

CREATE POLICY "Allow users to insert own mood check-ins" 
    ON public.mood_check_ins FOR INSERT 
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Allow users to delete own mood check-ins" 
    ON public.mood_check_ins FOR DELETE 
    USING (auth.uid() = profile_id);


-- 3. Schedule Items Table
CREATE TABLE IF NOT EXISTS public.schedule_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TEXT NOT NULL, -- e.g., "09:00 AM"
    end_time TEXT NOT NULL, -- e.g., "10:00 AM"
    energy_level TEXT NOT NULL CHECK (energy_level IN ('High', 'Medium', 'Low')),
    completed BOOLEAN DEFAULT false NOT NULL,
    emoji TEXT,
    date TEXT NOT NULL, -- YYYY-MM-DD
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for schedule_items
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage own schedule items" 
    ON public.schedule_items FOR ALL 
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);


-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('P1', 'P2')),
    classification TEXT NOT NULL CHECK (classification IN ('Priority', 'Focus')),
    energy_level TEXT NOT NULL CHECK (energy_level IN ('High', 'Medium', 'Low')),
    focus_duration TEXT DEFAULT '45m Focus' NOT NULL,
    completed BOOLEAN DEFAULT false NOT NULL,
    deadline TEXT, -- YYYY-MM-DD
    energy_budget TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage own tasks" 
    ON public.tasks FOR ALL 
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);
