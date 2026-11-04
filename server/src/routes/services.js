import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

let localServices = [
  {
    id: 'srv-social-media',
    slug: 'social-media',
    name: 'Social Media Management',
    display_name: 'Social Media Management',
    description: 'End-to-end content creation, community engagement, and organic brand growth across TikTok, Instagram, and Facebook.',
    experience_text: '4 months',
    portfolio_url: 'https://www.tiktok.com/@syed_ali_azzam',
    target_industries: ['Restaurants & Cafes', 'Fitness & Gyms', 'E-commerce & Fashion', 'Real Estate'],
    active: true,
  },
  {
    id: 'srv-video-editing',
    slug: 'video-editing',
    name: 'Video Editing',
    display_name: 'Video Editing (Short-Form & Reels)',
    description: 'High-retention short-form video editing for Reels, TikTok, and YouTube Shorts with dynamic pacing, motion graphics, and sound design.',
    experience_text: '3 years',
    portfolio_url: 'https://video-portfolio-572m.vercel.app/',
    target_industries: ['Content Creators', 'Digital Agencies', 'SaaS Brands', 'Coaches & Consultants'],
    active: true,
  },
  {
    id: 'srv-ai-video',
    slug: 'ai-video',
    name: 'AI Video Creation',
    display_name: 'AI Video Creation & Automation',
    description: 'Production of scalable AI-assisted promotional videos, synthetic avatar explainers, and automated product showcases.',
    experience_text: '4 months',
    portfolio_url: 'https://video-portfolio-572m.vercel.app/',
    target_industries: ['Tech Startups', 'E-commerce Brands', 'Real Estate Agencies', 'EdTech & Training'],
    active: true,
  },
  {
    id: 'srv-product-manager',
    slug: 'product-manager',
    name: 'Product Management',
    display_name: 'Product Management & Coordination',
    description: 'Agile product coordination, backlog grooming, PRD documentation, user research, and cross-functional team delivery.',
    experience_text: '4 months',
    portfolio_url: 'https://github.com/shoaib',
    target_industries: ['B2B SaaS', 'Mobile Apps', 'Early-Stage Startups', 'Dev Agencies'],
    active: true,
  },
];

/**
 * GET /api/services
 */
router.get('/', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('services').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return res.json(data);
      }
    }
    res.json(localServices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/services/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const idx = localServices.findIndex(s => s.id === id || s.slug === id);
    if (idx !== -1) {
      localServices[idx] = { ...localServices[idx], ...updates, updated_at: new Date().toISOString() };
    }

    if (supabase) {
      await supabase.from('services').update(updates).eq('id', id);
    }

    res.json({ success: true, service: idx !== -1 ? localServices[idx] : updates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
