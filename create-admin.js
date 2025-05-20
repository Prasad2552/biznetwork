const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const envConfig = require('dotenv').parse(fs.readFileSync(path.resolve(process.cwd(), '.env.local')))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

async function createAdminUser() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db('biznetwork'); // Replace with your actual database name
    const users = database.collection('users');

    // Check if admin user already exists
    const existingAdmin = await users.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Generate a temporary password
    const temporaryPassword = Math.random().toString(36).substring(2, 15); // Generates a random string
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10); // Hash the temporary password

    const newAdmin = {
      username: 'Prasad',
      email: 'wangade9@gmail.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await users.insertOne(newAdmin);
    console.log(`New admin user created with id: ${result.insertedId}`);
      console.log(`Temporary password for first login: ${temporaryPassword}`);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.close();
  }
}

createAdminUser();