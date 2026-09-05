const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/stb_smartcredit');
  const hash = await bcrypt.hash('123456', 10);

  // Update existing users
  await mongoose.connection.collection('users').updateMany(
    {},
    { $set: { password: hash } }
  );

  // Ensure default client account exists
  await mongoose.connection.collection('users').updateOne(
    { email: 'client@stb.com.tn' },
    { $set: { email: 'client@stb.com.tn', name: 'Malak Ben Arbia', password: hash, role: 'user' } },
    { upsert: true }
  );

  // Ensure default agent account exists
  await mongoose.connection.collection('users').updateOne(
    { email: 'agent@stb.com.tn' },
    { $set: { email: 'agent@stb.com.tn', name: 'Agent STB', password: hash, role: 'admin' } },
    { upsert: true }
  );

  const users = await mongoose.connection.collection('users').find({}).toArray();
  console.log('SUCCESS. Users in database:');
  users.forEach(u => console.log(`- Email: ${u.email} | Role: ${u.role} | Password: 123456`));
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
