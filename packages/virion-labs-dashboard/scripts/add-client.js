require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables.');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createClientRecord({ name, industry }) {
  console.log('🔧 Creating client...');
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([{ name, industry, status: 'Active' }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create client: ${error.message}`);
    }

    console.log('✅ Client created successfully:');
    console.log(JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Virion Labs Client Creation Script');
  const args = process.argv.slice(2);

  if (args.length !== 2) {
    console.error('Usage: node scripts/add-client.js <name> <industry>');
    console.error('Example: node scripts/add-client.js "Test Client" "Technology"');
    process.exit(1);
  }

  const [name, industry] = args;

  await createClientRecord({ name, industry });
}

main(); 