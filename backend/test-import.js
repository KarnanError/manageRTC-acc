import { config } from "dotenv";
config();

console.log('Step 1: Dotenv loaded');

try {
  console.log('Step 2: Testing leave controller import...');
  const leaveController = await import('./controllers/rest/leave.controller.js');
  console.log('Step 3: Leave controller imported successfully');

  console.log('Step 4: Testing full server import...');
  await import('./server.js');
  console.log('Step 5: Server imported successfully');
} catch (error) {
  console.error('Import error:', error);
  process.exit(1);
}
