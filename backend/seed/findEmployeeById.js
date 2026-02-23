/**
 * Find employee by ID in amasQIS.ai database
 */

import { MongoClient } from 'mongodb';

const DB_URI = 'mongodb+srv://admin:AdMin-2025@cluster0.iooxltd.mongodb.net/';
const DB_NAME = '6982468548550225cc5585a9';
const EMPLOYEE_ID = '6982c7cca0ceeb38da48ba58';

async function findEmployee() {
  const client = new MongoClient(DB_URI);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas\n');

    const db = client.db(DB_NAME);
    const employees = db.collection('employees');

    const employee = await employees.findOne({ _id: EMPLOYEE_ID });

    if (employee) {
      console.log('=== EMPLOYEE FOUND ===');
      console.log(`Name: ${employee.firstName} ${employee.lastName}`);
      console.log(`Employee ID: ${employee.employeeId}`);
      console.log(`Email: ${employee.email}`);
      console.log(`MongoDB _id: ${employee._id}`);
    } else {
      console.log(`❌ Employee with _id "${EMPLOYEE_ID}" not found!`);
      console.log('\nSearching by employeeId instead...');

      const empByEmployeeId = await employees.findOne({ employeeId: EMPLOYEE_ID });
      if (empByEmployeeId) {
        console.log('Found by employeeId:');
        console.log(`Name: ${empByEmployeeId.firstName} ${empByEmployeeId.lastName}`);
        console.log(`Employee ID: ${empByEmployeeId.employeeId}`);
        console.log(`Email: ${empByEmployeeId.email}`);
      } else {
        console.log('❌ Not found by employeeId either.');
      }
    }

    console.log('\n✅ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

findEmployee();
