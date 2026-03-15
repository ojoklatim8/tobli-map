export default {
  async scheduled(event, env) {
    const db = env.DB;
    
    console.log(`[Cron] Resetting business status at ${new Date().toISOString()}`);
    
    try {
      const result = await db.prepare('UPDATE businesses SET is_open = 0 WHERE is_open = 1').run();
      console.log(`[Cron] Successfully reset ${result.meta.changes} businesses to closed.`);
    } catch (err) {
      console.error('[Cron] Failed to reset business status:', err);
    }
  },
};
