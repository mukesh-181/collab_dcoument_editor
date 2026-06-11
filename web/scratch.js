const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...rest] = line.split('=');
    env[key] = rest.join('=');
  }
});

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']);

async function checkSchema() {
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .limit(1);
    
  console.log('Invites table columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data', error);

  // Since we also want to create user-specific invites, let's see if we can insert one to see the schema validation, or check if an email column exists by querying it.
  const checkEmail = await supabase.from('invites').select('email').limit(1);
  console.log('Has email column?', !checkEmail.error);
  
  const checkInviteeId = await supabase.from('invites').select('invitee_id').limit(1);
  console.log('Has invitee_id column?', !checkInviteeId.error);
}

checkSchema();
