/**
 * Migration Script: Add Status Fields to Resignation and Termination Records
 * 
 * This script migrates existing resignation and termination records to include
 * the new workflow status fields (resignationStatus, terminationStatus) required
 * for the new approval workflow architecture.
 * 
 * Run this script ONCE after deploying the updated code.
 * 
 * Usage: node backend/migrations/migrate-hr-status-fields.cjs
 */

const { MongoClient, ObjectId } = require('mongodb');
const config = require('../config/db.js');

// Get MongoDB connection string from environment or config
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'hrms_db';

async function migrateResignations(db, companyId) {
  try {
    const collectionName = companyId ? `${companyId}_resignation` : 'resignation';
    const collection = db.collection(collectionName);
    
    // Find all resignations without resignationStatus field
    const resignationsToUpdate = await collection.find({
      resignationStatus: { $exists: false }
    }).toArray();
    
    console.log(`Found ${resignationsToUpdate.length} resignations to migrate in ${collectionName}`);
    
    if (resignationsToUpdate.length === 0) {
      return 0;
    }
    
    // Update all resignations to add new fields
    const result = await collection.updateMany(
      { resignationStatus: { $exists: false } },
      { 
        $set: { 
          resignationStatus: "approved", // Assume existing records are approved
          effectiveDate: "$noticeDate", // Use notice date as effective date
          approvedBy: null,
          approvedAt: new Date() // Set to current date for audit purposes
        } 
      }
    );
    
    console.log(`✓ Updated ${result.modifiedCount} resignation records in ${collectionName}`);
    return result.modifiedCount;
  } catch (error) {
    console.error(`Error migrating resignations for ${companyId || 'default'}:`, error);
    return 0;
  }
}

async function migrateTerminations(db, companyId) {
  try {
    const collectionName = companyId ? `${companyId}_termination` : 'termination';
    const collection = db.collection(collectionName);
    
    // Find all terminations without terminationStatus field
    const terminationsToUpdate = await collection.find({
      terminationStatus: { $exists: false }
    }).toArray();
    
    console.log(`Found ${terminationsToUpdate.length} terminations to migrate in ${collectionName}`);
    
    if (terminationsToUpdate.length === 0) {
      return 0;
    }
    
    // Update all terminations to add new fields
    const result = await collection.updateMany(
      { terminationStatus: { $exists: false } },
      { 
        $set: { 
          terminationStatus: "processed", // Assume existing records are processed
          lastWorkingDate: "$terminationDate", // Use termination date as last working date
          processedBy: null,
          processedAt: new Date() // Set to current date for audit purposes
        } 
      }
    );
    
    console.log(`✓ Updated ${result.modifiedCount} termination records in ${collectionName}`);
    return result.modifiedCount;
  } catch (error) {
    console.error(`Error migrating terminations for ${companyId || 'default'}:`, error);
    return 0;
  }
}

async function fixEffectiveDates(db, companyId) {
  try {
    const collectionName = companyId ? `${companyId}_resignation` : 'resignation';
    const collection = db.collection(collectionName);
    
    // Find resignations where effectiveDate is the literal string "$noticeDate"
    const cursor = collection.find({ 
      effectiveDate: "$noticeDate" 
    });
    
    let fixedCount = 0;
    
    for await (const doc of cursor) {
      // Copy noticeDate value to effectiveDate
      await collection.updateOne(
        { _id: doc._id },
        { $set: { effectiveDate: doc.noticeDate } }
      );
      fixedCount++;
    }
    
    if (fixedCount > 0) {
      console.log(`✓ Fixed effectiveDate for ${fixedCount} resignation records in ${collectionName}`);
    }
    
    return fixedCount;
  } catch (error) {
    console.error(`Error fixing effective dates for ${companyId || 'default'}:`, error);
    return 0;
  }
}

async function fixLastWorkingDates(db, companyId) {
  try {
    const collectionName = companyId ? `${companyId}_termination` : 'termination';
    const collection = db.collection(collectionName);
    
    // Find terminations where lastWorkingDate is the literal string "$terminationDate"
    const cursor = collection.find({ 
      lastWorkingDate: "$terminationDate" 
    });
    
    let fixedCount = 0;
    
    for await (const doc of cursor) {
      // Copy terminationDate value to lastWorkingDate
      await collection.updateOne(
        { _id: doc._id },
        { $set: { lastWorkingDate: doc.terminationDate } }
      );
      fixedCount++;
    }
    
    if (fixedCount > 0) {
      console.log(`✓ Fixed lastWorkingDate for ${fixedCount} termination records in ${collectionName}`);
    }
    
    return fixedCount;
  } catch (error) {
    console.error(`Error fixing last working dates for ${companyId || 'default'}:`, error);
    return 0;
  }
}

async function getAllCompanyIds(db) {
  try {
    // Get all unique company IDs from collections
    const collections = await db.listCollections().toArray();
    const companyIds = new Set();
    
    collections.forEach(col => {
      const match = col.name.match(/^(.+?)_(?:resignation|termination|employees)$/);
      if (match) {
        companyIds.add(match[1]);
      }
    });
    
    return Array.from(companyIds);
  } catch (error) {
    console.error('Error getting company IDs:', error);
    return [];
  }
}

async function main() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✓ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Get all company IDs (for multi-tenant setup)
    const companyIds = await getAllCompanyIds(db);
    
    if (companyIds.length === 0) {
      console.log('\nNo company-specific collections found. Migrating default collections...');
      companyIds.push(null); // null represents default/non-tenant collections
    } else {
      console.log(`\nFound ${companyIds.length} companies to migrate:`, companyIds);
    }
    
    let totalResignations = 0;
    let totalTerminations = 0;
    let totalEffectiveDatesFixed = 0;
    let totalLastWorkingDatesFixed = 0;
    
    // Migrate each company's data
    for (const companyId of companyIds) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing company: ${companyId || 'default'}`);
      console.log('='.repeat(60));
      
      totalResignations += await migrateResignations(db, companyId);
      totalTerminations += await migrateTerminations(db, companyId);
      
      // Fix any literal string references
      totalEffectiveDatesFixed += await fixEffectiveDates(db, companyId);
      totalLastWorkingDatesFixed += await fixLastWorkingDates(db, companyId);
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('Migration Summary');
    console.log('='.repeat(60));
    console.log(`Total resignations migrated: ${totalResignations}`);
    console.log(`Total terminations migrated: ${totalTerminations}`);
    console.log(`Total effective dates fixed: ${totalEffectiveDatesFixed}`);
    console.log(`Total last working dates fixed: ${totalLastWorkingDatesFixed}`);
    console.log(`\n✓ Migration completed successfully!`);
    
  } catch (error) {
    console.error('\n✗ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run migration
if (require.main === module) {
  console.log('\n' + '='.repeat(60));
  console.log('HR Status Fields Migration Script');
  console.log('='.repeat(60));
  console.log(`Database: ${DB_NAME}`);
  console.log(`MongoDB URI: ${MONGO_URI}`);
  console.log('='.repeat(60) + '\n');
  
  main().catch(console.error);
}

module.exports = { migrateResignations, migrateTerminations };
