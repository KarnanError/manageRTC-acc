import { config } from 'dotenv';
config();

const uri = process.env.MONGO_URI || '';
const dbName = process.env.MONGODB_DATABASE || '';

console.log('MONGO_URI:', uri);
console.log('MONGODB_DATABASE:', dbName);

// Check if database name is in the URI
if (uri.includes('/')) {
  const parts = uri.split('/');
  const lastPart = parts[parts.length - 1];
  console.log('Database in URI:', lastPart);
}
