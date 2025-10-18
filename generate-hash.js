const bcrypt = require('bcryptjs');

async function testHash() {
  try {
    const password = 'TryPa$$wordDadi@6563or129';
    const hash = '$2a$10$c27fGNjiXOK/ltKCyyV1keqpDQq6b51M2sqEpEA91/ailvFHK8R9m';
    
    console.log('Testing password:', password);
    console.log('Against hash:', hash);
    
    const isValid = await bcrypt.compare(password, hash);
    console.log('Hash validation result:', isValid);
    
    if (!isValid) {
      console.log('Generating new hash...');
      const newHash = await bcrypt.hash(password, 10);
      console.log('New hash:', newHash);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testHash();