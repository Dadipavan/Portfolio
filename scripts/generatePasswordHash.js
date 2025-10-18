// Script to generate password hash
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'TryPa$$wordDadi@6563or129';
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  
  console.log('\n🔐 Password hash generated successfully!');
  console.log('\nAdd this to your .env.local file:');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log('\nAlso add this to your Vercel environment variables in the dashboard.');
  console.log('\n⚠️  Important: Never commit this password to Git!');
}

generateHash().catch(console.error);