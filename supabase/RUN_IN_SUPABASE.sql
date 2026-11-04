-- ==============================================================================
-- ReachOut AI Outreach System: Complete Production Schema & Seed Migrations
-- Copy and paste this whole script into the Supabase SQL Editor and click RUN.
-- ==============================================================================

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
    facebook_url text default '',
    video_portfolio_url text default 'https://video-portfolio-572m.vercel.app/',
    ai_video_portfolio_url text default 'https://video-portfolio-572m.vercel.app/',
    pm_case_study_url text default 'https://github.com/shoaib',
    calendly_link text default '',
    daily_manual_goal int default 20,
    warmup_start_limit int default 15,
    warmup_step int default 5,
    warmup_step_days int default 3,
    warmup_max_limit int default 50,
    send_window_start text default '09:00',
    send_window_end text default '18:00',
    send_runs text[] default array['10:00', '16:00'],
    skip_sundays boolean default true,
    min_delay_sec int default 45,
    max_delay_sec int default 150,
    bcc_self boolean default false,
    dry_run_mode boolean default false,
    approval_mode boolean default true,
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

-- User Signup Trigger (Automatically sets up the 4 services, campaigns, and templates)
create or replace function public.handle_new_user_setup()
returns trigger as $$
declare
    v_sm_id uuid;
    v_ve_id uuid;
    v_ai_id uuid;
    v_pm_id uuid;
begin
    insert into public.profiles (id, email, full_name, phone, location)
    values (new.id, new.email, 'Shoaib ul Din', '03473547036', 'Islamabad, Pakistan')
    on conflict (id) do nothing;

    insert into public.settings (
        user_id, sender_name, sender_phone, sender_location,
        facebook_url, video_portfolio_url, ai_video_portfolio_url, pm_case_study_url,
        daily_manual_goal, warmup_start_limit, warmup_step, warmup_step_days, warmup_max_limit,
        send_window_start, send_window_end, send_runs, skip_sundays,
        min_delay_sec, max_delay_sec, approval_mode
    ) values (
        new.id, 'Shoaib ul Din', '03473547036', 'Islamabad, Pakistan',
        'https://facebook.com/shoaib.media', 'https://video-portfolio-572m.vercel.app/', 'https://video-portfolio-572m.vercel.app/', 'https://github.com/shoaib',
        20, 15, 5, 3, 50,
        '09:00', '18:00', array['10:00', '16:00'], true,
        45, 150, true
    ) on conflict (user_id) do nothing;

    insert into public.services (user_id, slug, name, display_name, description, experience_text, portfolio_url, target_industries)
    values (
        new.id, 'social-media', 'Social Media Management', 'Social Media Management',
        'End-to-end content creation, community engagement, and organic brand growth across TikTok, Instagram, and Facebook.',
        'I have 4 months of dedicated hands-on experience managing organic social media channels, producing engaging short clips, and growing audience reach.',
        'https://www.tiktok.com/@syed_ali_azzam',
        array['Restaurants & Cafes', 'Fitness & Gyms', 'E-commerce & Fashion', 'Real Estate']
    ) returning id into v_sm_id;

    insert into public.services (user_id, slug, name, display_name, description, experience_text, portfolio_url, target_industries)
    values (
        new.id, 'video-editing', 'Video Editing', 'Video Editing (Short-Form & Reels)',
        'High-retention short-form video editing for Reels, TikTok, and YouTube Shorts with dynamic pacing, motion graphics, and sound design.',
        'I bring over 3 years of video editing experience specializing in high-retention short-form reels, pacing, captions, and narrative flow.',
        'https://video-portfolio-572m.vercel.app/',
        array['Content Creators', 'Digital Agencies', 'SaaS Brands', 'Coaches & Consultants']
    ) returning id into v_ve_id;

    insert into public.services (user_id, slug, name, display_name, description, experience_text, portfolio_url, target_industries)
    values (
        new.id, 'ai-video', 'AI Video Creation', 'AI Video Creation & Automation',
        'Production of scalable AI-assisted promotional videos, synthetic avatar explainers, and automated product showcases.',
        'I have 4 months of focused experience crafting AI-assisted promo videos and synthetic media with high visual fidelity and narrative impact.',
        'https://video-portfolio-572m.vercel.app/',
        array['Tech Startups', 'E-commerce Brands', 'Real Estate Agencies', 'EdTech & Training']
    ) returning id into v_ai_id;

    insert into public.services (user_id, slug, name, display_name, description, experience_text, portfolio_url, target_industries)
    values (
        new.id, 'product-manager', 'Product Management', 'Product Management & Coordination',
        'Agile product coordination, backlog grooming, PRD documentation, user research, and cross-functional team delivery.',
        'I have 4 months of practical experience in product management and coordination, guiding user story mapping, roadmaps, and sprint execution.',
        'https://github.com/shoaib',
        array['B2B SaaS', 'Mobile Apps', 'Early-Stage Startups', 'Dev Agencies']
    ) returning id into v_pm_id;

    insert into public.campaigns (user_id, service_id, name, status, daily_limit)
    values
        (new.id, v_sm_id, 'Local Business Social Growth Q4', 'active', 20),
        (new.id, v_ve_id, 'Creator & Agency Short-Form Editing', 'active', 20),
        (new.id, v_ai_id, 'AI Video Showcase Outreach', 'active', 20),
        (new.id, v_pm_id, 'Startup Product Delivery Support', 'active', 15);

    -- Templates
    insert into public.templates (service_id, name, stage, step_day, subject_variants, body_template)
    values (
        v_sm_id, 'Social Media - Initial Outreach', 'initial', 0,
        array['Quick question regarding {business_name}''s social media', 'Idea for {business_name}''s TikTok & Instagram content', 'Loved {business_name} — quick thought on your short-form video'],
        'Hi {first_name},

{personal_hook}

I help local businesses turn everyday highlights into engaging short-form content on Instagram and TikTok.

Here is some social media content I have worked on:
TikTok: https://www.tiktok.com/@syed_ali_azzam
Facebook: {facebook_url}

Would you be open to a 15-minute chat this week to explore ideas for {business_name}?

Best regards,
Shoaib ul Din
Islamabad | 03473547036

If this isn''t relevant, reply ''stop'' and I won''t contact you again.'
    );

    insert into public.templates (service_id, name, stage, step_day, subject_variants, body_template)
    values (
        v_ve_id, 'Video Editing - Initial Outreach', 'initial', 0,
        array['High-retention editing for {business_name}''s videos', 'Quick feedback on {business_name}''s video pacing', 'Short-form reels & shorts for {business_name}'],
        'Hi {first_name},

{personal_hook}

I specialize in editing fast-paced, high-retention short-form videos (Reels, TikTok, YouTube Shorts) designed to hook viewers in the first 3 seconds.

Here is my video portfolio:
{video_portfolio_url}

Would you be open to a quick 15-minute call to see how we could elevate your video output?

Best regards,
Shoaib ul Din
Islamabad | 03473547036

If this isn''t relevant, reply ''stop'' and I won''t contact you again.'
    );

    insert into public.templates (service_id, name, stage, step_day, subject_variants, body_template)
    values (
        v_ai_id, 'AI Video - Initial Outreach', 'initial', 0,
        array['AI-assisted promo videos for {business_name}', 'Scaling {business_name}''s video assets with AI', 'Idea: automated product showcase for {business_name}'],
        'Hi {first_name},

{personal_hook}

I create AI-assisted promo videos that deliver studio-quality brand storytelling at a fraction of the traditional production time.

Here is my portfolio:
https://video-portfolio-572m.vercel.app/

Would you be open to a 15-minute call to see how AI video could fit {business_name}''s marketing plans?

Best regards,
Shoaib ul Din
Islamabad | 03473547036

If this isn''t relevant, reply ''stop'' and I won''t contact you again.'
    );

    insert into public.templates (service_id, name, stage, step_day, subject_variants, body_template)
    values (
        v_pm_id, 'Product Manager - Initial Outreach', 'initial', 0,
        array['Product coordination & delivery support for {business_name}', 'Helping {business_name} ship features faster', 'Quick note on {business_name}''s product roadmap'],
        'Hi {first_name},

{personal_hook}

I help growing tech teams organize sprint backlogs, write clear PRDs, and coordinate cross-functional delivery so developers can focus purely on building.

Here is a summary of my past case studies and project documentation:
{pm_case_study_url}

Would you be open to a brief call this week to discuss {business_name}''s upcoming delivery milestones?

Best regards,
Shoaib ul Din
Islamabad | 03473547036

If this isn''t relevant, reply ''stop'' and I won''t contact you again.'
    );

    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user_setup();
