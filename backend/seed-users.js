const mongoose = require('C:/Users/msi/Documents/GitHub/STB/node_modules/mongoose');
const bcrypt = require('C:/Users/msi/Documents/GitHub/STB/node_modules/bcrypt');

mongoose.connect('mongodb://localhost:27017/stb_smartcredit').then(async () => {
  console.log('MongoDB connecté');

  const hash_agent = await bcrypt.hash('Agent2026!', 10);
  const hash_client = await bcrypt.hash('Client2026!', 10);

  const users = [
    {
      name: 'Agent STB',
      email: 'agent@stb.com.tn',
      password: hash_agent,
      role: 'admin',
      isVerified: true,
      phone: '+216 71 148 000',
      address: 'Avenue Habib Bourguiba, Tunis',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      name: 'Malak Ben Arbia',
      email: 'malak@stb.com.tn',
      password: hash_client,
      role: 'user',
      isVerified: true,
      phone: '+216 98 000 000',
      address: 'Tataouine, Tunisie',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const user of users) {
    const existing = await mongoose.connection.collection('users').findOne({ email: user.email });
    if (!existing) {
      await mongoose.connection.collection('users').insertOne(user);
      console.log(`✅ Créé: ${user.email} / ${user.role}`);
    } else {
      console.log(`⚠️  Existe déjà: ${user.email} (role: ${existing.role})`);
    }
  }

  const total = await mongoose.connection.collection('users').countDocuments();
  console.log(`\nTotal utilisateurs en base: ${total}`);
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
