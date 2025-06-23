const { createClient } = require('@supabase/supabase-js');

/**
 * Supabase client wrapper for database operations
 */
class SupabaseClient {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!this.supabaseUrl || !this.supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    }
    
    this.client = createClient(this.supabaseUrl, this.supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'User-Agent': 'Virion-Discord-Bot/2.0'
        }
      }
    });
  }

  /**
   * Get the Supabase client instance
   * @returns {import('@supabase/supabase-js').SupabaseClient}
   */
  getClient() {
    return this.client;
  }

  /**
   * Test database connection
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const { data, error } = await this.client
        .from('discord_guild_campaigns')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        return false;
      }
      
      console.log('✅ Supabase connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Supabase connection test error:', error);
      return false;
    }
  }

  /**
   * Generic query method with error handling
   * @param {Function} queryFn - Function that performs the query
   * @returns {Promise<{data: any, error: any}>}
   */
  async query(queryFn) {
    try {
      const result = await queryFn(this.client);
      if (result.error) {
        console.error('❌ Database query error:', result.error);
      }
      return result;
    } catch (error) {
      console.error('❌ Database query exception:', error);
      return { data: null, error };
    }
  }
}

module.exports = { SupabaseClient }; 