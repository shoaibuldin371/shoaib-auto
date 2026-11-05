-- ReachOut AI Cold-Outreach System: Initial Schema
-- PostgreSQL + Row Level Security (RLS) for Supabase

-- Extensions
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    full_name text default 'Shoaib ul Din',
    phone text default '03473547036',
    location text default 'Islamabad, Pakistan',
    avatar_url text,
    ai_credits int default 1000,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Settings Table
create table if not exists public.settings (
    user_id uuid primary key references auth.users(id) on delete cascade,
    sender_name text default 'Shoaib ul Din',
    sender_email text default 'Mshoaibuldin371@gmail.com',
    sender_phone text default '03473547036',
    sender_location text default 'Islamabad, Pakistan',
    facebook_url text default 'https://www.facebook.com/syedali.azzam',
    tiktok_url text default 'https://www.tiktok.com/@syed_ali_azzam',
    video_portfolio_url text default 'https://video-portfolio-self-eight.vercel.app/',
    ai_video_portfolio_url text default 'https://video-portfolio-572m.vercel.app/',
    pm_case_study_url text default '',
    service_pm_enabled boolean default false,
    calendly_link text default '',
    daily_manual_goal int default 20,
    warmup_start_limit int default 15,
    warmup_step int default 5,
    warmup_step_days int default 3,
    warmup_max_limit int default 40,
    send_window_start text default '10:00',
    send_window_end text default '18:00',
    send_runs text[] default array['10:00', '16:00'],
    skip_sundays boolean default true,
    min_delay_sec int default 15,
    max_delay_sec int default 45,
    bcc_self boolean default false,
    dry_run_mode boolean default false,
    approval_mode boolean default false,
    pause_all boolean default false,
    telegram_bot_token text default '',
    telegram_chat_id text default '',
    gmail_address text default 'Mshoaibuldin371@gmail.com',
    gmail_app_password_encrypted text default '',
    gmail_is_connected boolean default false,
    last_imap_sync timestamptz default null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Ensure newer columns exist if migrating an existing settings table
alter table public.settings add column if not exists tiktok_url text default 'https://www.tiktok.com/@syed_ali_azzam';
alter table public.settings add column if not exists service_pm_enabled boolean default false;
alter table public.settings alter column approval_mode set default false;
alter table public.settings alter column warmup_max_limit set default 40;

-- 3. Services Table
create table if not exists public.services (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    slug text not null,
    name text not null,
    display_name text not null,
    description text default '',
    experience_text text not null,
    portfolio_url text default '',
    target_industries text[] default array[]::text[],
    active boolean default true,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    unique(user_id, slug)
);

-- 4. Leads Table
create table if not exists public.leads (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    service_id uuid references public.services(id) on delete set null,
    business_name text not null,
    contact_name text default '',
    first_name text default '',
    email text default '',
    phone text default '',
    website text default '',
    city text default 'Islamabad',
    country text default 'Pakistan',
    address text default '',
    rating numeric(3,2) default 0.0,
    review_count int default 0,
    source text default 'osm_overpass', -- csv_import, osm_overpass, manual
    status text default 'new', -- new, contacted, replied, interested, call_booked, won, lost, bounced, unsubscribed
    lead_score int default 50, -- 0-100
    personal_hook text default '',
    link_click_count int default 0,
    is_hot boolean default false,
    notes text default '',
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Lead Channels (Social links detected on websites or manual)
create table if not exists public.lead_channels (
    id uuid primary key default uuid_generate_v4(),
    lead_id uuid references public.leads(id) on delete cascade not null,
    platform text not null, -- instagram, facebook, tiktok, youtube, linkedin, whatsapp, twitter, other
    profile_url text not null,
    handle text default '',
    status text default 'pending', -- pending, contacted, replied, skipped
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 6. Campaigns Table
create table if not exists public.campaigns (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    service_id uuid references public.services(id) on delete cascade not null,
    name text not null,
    status text default 'active', -- active, paused, completed
    daily_limit int default 25,
    sent_count int default 0,
    reply_count int default 0,
    click_count int default 0,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. Email Templates Table (Initial + 2 follow-ups per service, 3 subject line variants)
create table if not exists public.templates (
    id uuid primary key default uuid_generate_v4(),
    service_id uuid references public.services(id) on delete cascade not null,
    name text not null,
    stage text not null, -- initial, follow_up_1, follow_up_2
    step_day int default 0, -- 0 for initial, 3 for follow_up_1, 7 for follow_up_2
    subject_variants text[] not null default array[]::text[],
    body_template text not null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 8. Email Queue Table
create table if not exists public.email_queue (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    lead_id uuid references public.leads(id) on delete cascade not null,
    service_id uuid references public.services(id) on delete cascade not null,
    template_id uuid references public.templates(id) on delete set null,
    scheduled_for timestamptz not null,
    status text default 'queued', -- queued, pending_approval, sent, failed, cancelled, skipped
    subject text not null,
    body text not null,
    step_day int default 0,
    thread_id text default null,
    in_reply_to text default null,
    message_id_header text default null,
    approved boolean default false,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    sent_at timestamptz default null
);

-- 9. Email Logs Table (Sent emails via Gmail SMTP)
create table if not exists public.email_logs (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    lead_id uuid references public.leads(id) on delete cascade not null,
    service_id uuid references public.services(id) on delete set null,
    message_id text not null,
    thread_id text not null,
    in_reply_to text default null,
    references_header text default null,
    subject text not null,
    recipient text not null,
    status text default 'sent', -- sent, delivered, bounced, failed
    error_message text default null,
    sent_at timestamptz default timezone('utc'::text, now()) not null
);

-- 10. Replies Table (Incoming replies classified by Gemini AI)
create table if not exists public.replies (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    lead_id uuid references public.leads(id) on delete cascade not null,
    email_log_id uuid references public.email_logs(id) on delete set null,
    message_id text not null,
    thread_id text not null,
    from_email text not null,
    subject text default '',
    snippet text default '',
    body_text text not null,
    classification text default 'Question', -- Interested, Not interested, Question, Out of office, Unsubscribe
    is_read boolean default false,
    received_at timestamptz default timezone('utc'::text, now()) not null
);

-- 11. Manual Tasks Table (For leads without email but with social links)
create table if not exists public.manual_tasks (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    lead_id uuid references public.leads(id) on delete cascade not null,
    platform text not null, -- Instagram, Facebook, TikTok, YouTube, LinkedIn, WhatsApp, Other
    profile_url text not null,
    suggested_service text default '',
    dm_message text not null,
    status text default 'pending', -- pending, done, replied, skipped, snoozed
    step_day int default 0, -- 0 initial, 3 reminder, 7 reminder
    due_date date default current_date,
    completed_at timestamptz default null,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 12. Link Clicks Table (For /r/:id redirects)
create table if not exists public.link_clicks (
    id uuid primary key default uuid_generate_v4(),
    lead_id uuid references public.leads(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    destination_url text not null,
    ip_address text default null,
    user_agent text default null,
    clicked_at timestamptz default timezone('utc'::text, now()) not null
);

-- 13. Suppression List Table (Unsubscribed, bounced, or manual suppress)
create table if not exists public.suppression_list (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    email text default null,
    domain text default null,
    reason text default 'unsubscribed', -- unsubscribed, bounced, manual
    added_at timestamptz default timezone('utc'::text, now()) not null
);

-- 14. Activity Log Table
create table if not exists public.activity_log (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references auth.users(id) on delete cascade not null,
    action_type text not null, -- email_sent, reply_received, lead_imported, score_calculated, task_completed
    entity_type text default '', -- lead, email, task, campaign
    entity_id uuid default null,
    description text not null,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on all tables
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.services enable row level security;
alter table public.leads enable row level security;
alter table public.lead_channels enable row level security;
alter table public.campaigns enable row level security;
alter table public.templates enable row level security;
alter table public.email_queue enable row level security;
alter table public.email_logs enable row level security;
alter table public.replies enable row level security;
alter table public.manual_tasks enable row level security;
alter table public.link_clicks enable row level security;
alter table public.suppression_list enable row level security;
alter table public.activity_log enable row level security;

-- Policies (Users can access only their own rows)
create policy "Users can view their own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

create policy "Users can view their own settings" on public.settings for select using (auth.uid() = user_id);
create policy "Users can insert/update their own settings" on public.settings for all using (auth.uid() = user_id);

create policy "Users can view their own services" on public.services for select using (auth.uid() = user_id);
create policy "Users can manage their own services" on public.services for all using (auth.uid() = user_id);

create policy "Users can manage their own leads" on public.leads for all using (auth.uid() = user_id);

create policy "Users can manage lead channels through lead ownership" on public.lead_channels for all using (
    exists (select 1 from public.leads where leads.id = lead_channels.lead_id and leads.user_id = auth.uid())
);

create policy "Users can manage their own campaigns" on public.campaigns for all using (auth.uid() = user_id);

create policy "Users can manage templates through service ownership" on public.templates for all using (
    exists (select 1 from public.services where services.id = templates.service_id and services.user_id = auth.uid())
);

create policy "Users can manage their email queue" on public.email_queue for all using (auth.uid() = user_id);

create policy "Users can manage their email logs" on public.email_logs for all using (auth.uid() = user_id);

create policy "Users can manage their replies" on public.replies for all using (auth.uid() = user_id);

create policy "Users can manage their manual tasks" on public.manual_tasks for all using (auth.uid() = user_id);

create policy "Users can manage their link clicks" on public.link_clicks for all using (auth.uid() = user_id);

create policy "Users can manage their suppression list" on public.suppression_list for all using (auth.uid() = user_id);

create policy "Users can view their activity log" on public.activity_log for all using (auth.uid() = user_id);
