import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * GET /r/:id
 * Click tracker for portfolio links. Redirects to actual portfolio and marks lead as hot if clicked >= 2 times.
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const destination = req.query.url || 'https://video-portfolio-572m.vercel.app/';
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';

  console.log(`[CLICK TRACKER] Lead ${id} clicked link to ${destination}`);

  try {
    if (supabase) {
      // 1. Record click in link_clicks table
      await supabase.from('link_clicks').insert({
        lead_id: id,
        destination_url: destination,
        ip_address: String(ip),
        user_agent: String(userAgent),
      });

      // 2. Fetch lead to check current clicks
      const { data: lead } = await supabase.from('leads').select('link_click_count, user_id').eq('id', id).single();
      const newClickCount = (lead?.link_click_count || 0) + 1;
      const isHot = newClickCount >= 2;

      // 3. Update lead
      await supabase.from('leads').update({
        link_click_count: newClickCount,
        is_hot: isHot,
        updated_at: new Date().toISOString(),
      }).eq('id', id);

      // 4. Log activity if hot lead
      if (isHot) {
        await supabase.from('activity_log').insert({
          user_id: lead?.user_id,
          action_type: 'hot_lead_detected',
          entity_type: 'lead',
          entity_id: id,
          description: `Hot Lead Alert! Lead clicked portfolio link ${newClickCount} times.`,
        });
      }
    }
  } catch (err) {
    console.error('Click tracking error:', err.message);
  }

  // Redirect to destination
  res.redirect(302, destination);
});

export default router;
