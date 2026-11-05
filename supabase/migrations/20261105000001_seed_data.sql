-- ReachOut Seed Data
-- Creates default function to initialize a new user's default services, templates, and settings upon signup

create or replace function public.handle_new_user_setup()
returns trigger as $$
declare
    v_sm_id uuid;
    v_ve_id uuid;
    v_ai_id uuid;
    v_pm_id uuid;
begin
    -- 1. Create Profile
    insert into public.profiles (id, email, full_name, phone, location)
    values (new.id, new.email, 'Shoaib ul Din', '03473547036', 'Islamabad, Pakistan')
    on conflict (id) do nothing;

    -- 2. Create Default Settings
    insert into public.settings (
        user_id, sender_name, sender_phone, sender_location,
        facebook_url, tiktok_url, video_portfolio_url, ai_video_portfolio_url, pm_case_study_url,
        service_pm_enabled, daily_manual_goal, warmup_start_limit, warmup_step, warmup_step_days, warmup_max_limit,
        send_window_start, send_window_end, send_runs, skip_sundays,
        min_delay_sec, max_delay_sec, approval_mode
    ) values (
        new.id, 'Shoaib ul Din', '03473547036', 'Islamabad, Pakistan',
        'https://www.facebook.com/syedali.azzam', 'https://www.tiktok.com/@syed_ali_azzam',
        'https://video-portfolio-self-eight.vercel.app/', 'https://video-portfolio-572m.vercel.app/', '',
        false, 20, 15, 5, 3, 40,
        '10:00', '18:00', array['10:00', '16:00'], true,
        15, 45, false
    ) on conflict (user_id) do update set
        facebook_url = excluded.facebook_url,
        tiktok_url = excluded.tiktok_url,
        video_portfolio_url = excluded.video_portfolio_url,
        ai_video_portfolio_url = excluded.ai_video_portfolio_url,
        pm_case_study_url = excluded.pm_case_study_url,
        service_pm_enabled = excluded.service_pm_enabled,
        approval_mode = false,
        warmup_max_limit = 40;

    -- 3. Create the 4 Services
    -- Service 1: Social Media Management (4 months)
    insert into public.services (user_id, slug, name, display_name, description, experience_text, portfolio_url, target_industries)
    values (
        new.id,
        'social-media',
        'Social Media Management',
        'Social Media Management',
        'End-to-end content creation, community engagement, and organic brand growth across TikTok, Instagram, and Facebook.',
        'I have 4 months of dedicated hands-on experience managing organic social media channels, producing engaging short clips, and growing audience reach.',
        'https://www.tiktok.com/@syed_ali_azzam',
        array['Restaurants & Cafes', 'Fitness & Gyms', 'E-commerce & Fashion', 'Real Estate']
    ) returning id into v_sm_id;

    -- Service 2: Video Editing (3 years)
    insert into public.services (user_id, slug, name, display_name, description, experience_text, portfolio_url, target_industries)
    values (
        new.id,
        'video-editing',
        'Video Editing',
        'Video Editing (Short-Form & Reels)',
        'High-retention short-form video editing for Reels, TikTok, and YouTube Shorts with dynamic pacing, motion graphics, and sound design.',
        'I bring over 3 years of video editing experience specializing in high-retention short-form reels, pacing, captions, and narrative flow.',
        'https://video-portfolio-572m.vercel.app/',
        array['Content Creators', 'Digital Agencies', 'SaaS Brands', 'Coaches & Consultants']
    ) returning id into v_ve_id;

    -- Service 3: AI Video Creation (4 months)
    insert into public.services (user_id, slug, name, display_name, description, experience_text, portfolio_url, target_industries)
    values (
        new.id,
        'ai-video',
        'AI Video Creation',
        'AI Video Creation & Automation',
        'Production of scalable AI-assisted promotional videos, synthetic avatar explainers, and automated product showcases.',
        'I have 4 months of focused experience crafting AI-assisted promo videos and synthetic media with high visual fidelity and narrative impact.',
        'https://video-portfolio-572m.vercel.app/',
        array['Tech Startups', 'E-commerce Brands', 'Real Estate Agencies', 'EdTech & Training']
    ) returning id into v_ai_id;

    -- Service 4: Product Management (4 months)
    insert into public.services (user_id, slug, name, display_name, description, experience_text, portfolio_url, target_industries)
    values (
        new.id,
        'product-manager',
        'Product Management',
        'Product Management & Coordination',
        'Agile product coordination, backlog grooming, PRD documentation, user research, and cross-functional team delivery.',
        'I have 4 months of practical experience in product management and coordination, guiding user story mapping, roadmaps, and sprint execution.',
        'https://github.com/shoaib',
        array['B2B SaaS', 'Mobile Apps', 'Early-Stage Startups', 'Dev Agencies']
    ) returning id into v_pm_id;

    -- 4. Initial Campaigns for each service
    insert into public.campaigns (user_id, service_id, name, status, daily_limit)
    values
        (new.id, v_sm_id, 'Local Business Social Growth Q4', 'active', 20),
        (new.id, v_ve_id, 'Creator & Agency Short-Form Editing', 'active', 20),
        (new.id, v_ai_id, 'AI Video Showcase Outreach', 'active', 20),
        (new.id, v_pm_id, 'Startup Product Delivery Support', 'active', 15);

    -- 5. Seed Templates with 3 subject line variants per template
    -- Social Media Initial Template
    insert into public.templates (service_id, name, stage, step_day, subject_variants, body_template)
    values (
        v_sm_id,
        'Social Media - Initial Outreach',
        'initial',
        0,
        array[
            'Quick question regarding {business_name}''s social media',
            'Idea for {business_name}''s TikTok & Instagram content',
            'Loved {business_name} — quick thought on your short-form video'
        ],
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

    -- Social Media Follow-Up 1 (Day 3)
    insert into public.templates (service_id, name, stage, step_day, subject_variants, body_template)
    values (
        v_sm_id,
        'Social Media - Follow Up 1',
        'follow_up_1',
        3,
        array[
            'Re: Quick question regarding {business_name}''s social media',
            'Following up on {business_name}''s content',
            'Quick check-in for {business_name}'
        ],
        'Hi {first_name},

Wanted to quickly follow up on my previous note. 

I put together 2 specific reel concepts tailored for {business_name} that could help drive more local engagement.

Are you available for a brief 10-minute call this Thursday?

Best regards,
Shoaib ul Din
Islamabad | 03473547036

If this isn''t relevant, reply ''stop'' and I won''t contact you again.'
    );

    -- Social Media Follow-Up 2 (Day 7)
    insert into public.templates (service_id, name, stage, step_day, subject_variants, body_template)
    values (
        v_sm_id,
        'Social Media - Follow Up 2',
        'follow_up_2',
        7,
        array[
            'Final note for {business_name}',
            'Closing the loop — {business_name}',
            'Should I take this off your radar?'
        ],
        'Hi {first_name},

I know how busy things get. If now isn''t the right time to ramp up {business_name}''s social media presence, no worries at all.

Feel free to keep my details handy whenever you decide to scale your content.

Best regards,
Shoaib ul Din
Islamabad | 03473547036

If this isn''t relevant, reply ''stop'' and I won''t contact you again.'
    );

    -- Video Editing Initial Template
    insert into public.templates (service_id, name, stage, step_day, subject_variants, body_template)
    values (
        v_ve_id,
        'Video Editing - Initial Outreach',
        'initial',
        0,
        array[
            'High-retention editing for {business_name}''s videos',
            'Quick feedback on {business_name}''s video pacing',
            'Short-form reels & shorts for {business_name}'
        ],
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

    -- Video Editing Follow Up 1
    insert into public.templates (service_id, name, stage, step_day, subject_variants, body_template)
    values (
        v_ve_id,
        'Video Editing - Follow Up 1',
        'follow_up_1',
        3,
        array[
            'Re: High-retention editing for {business_name}',
            'Sample edit for {business_name}',
            'Quick thought on your video retention'
        ],
        'Hi {first_name},

Just checking in on this. I would be happy to edit one 30-second sample video for {business_name} for free so you can see the pacing and caption quality firsthand.

Let me know if that sounds interesting.

Best regards,
Shoaib ul Din
Islamabad | 03473547036

If this isn''t relevant, reply ''stop'' and I won''t contact you again.'
    );

    -- Video Editing Follow Up 2
    insert into public.templates (service_id, name, stage, step_day, subject_variants, body_template)
    values (
        v_ve_id,
        'Video Editing - Follow Up 2',
        'follow_up_2',
        7,
        array[
            'Last follow-up for {business_name}',
            'Permission to close your file, {first_name}?',
            'Re: Video editing for {business_name}'
        ],
        'Hi {first_name},

I will assume you have video production covered for now. If you ever need overflow editing support or higher retention cuts, don''t hesitate to reach out.

Best regards,
Shoaib ul Din
Islamabad | 03473547036

If this isn''t relevant, reply ''stop'' and I won''t contact you again.'
    );

    -- AI Video Initial Template
    insert into public.templates (service_id, name, stage, step_day, subject_variants, body_template)
    values (
        v_ai_id,
        'AI Video - Initial Outreach',
        'initial',
        0,
        array[
            'AI-assisted promo videos for {business_name}',
            'Scaling {business_name}''s video assets with AI',
            'Idea: automated product showcase for {business_name}'
        ],
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

    -- Product Management Initial Template
    insert into public.templates (service_id, name, stage, step_day, subject_variants, body_template)
    values (
        v_pm_id,
        'Product Manager - Initial Outreach',
        'initial',
        0,
        array[
            'Product coordination & delivery support for {business_name}',
            'Helping {business_name} ship features faster',
            'Quick note on {business_name}''s product roadmap'
        ],
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

-- Trigger to run whenever a new user signs up via Supabase Auth
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user_setup();

