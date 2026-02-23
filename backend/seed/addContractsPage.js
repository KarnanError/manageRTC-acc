import { connectDB, client } from '../config/db.js';

async function addContractsPage() {
  await connectDB();
  const db = client.db('AmasQIS');

  try {
    // Find the Projects category (VI)
    const categoryVI = await db.collection('pagecategories').findOne({ identifier: 'VI' });

    if (!categoryVI) {
      console.error('❌ Category VI (Projects) not found!');
      await client.close();
      return;
    }

    console.log('✅ Found Category VI:', categoryVI.name);

    // ─── 1. Contracts List Page ───────────────────────────────────────────────
    const existingContractsPage = await db.collection('pages').findOne({ name: 'contracts' });

    let contractsPageId;

    if (existingContractsPage) {
      console.log('⚠️ Contracts page already exists! Updating...');
      await db.collection('pages').updateOne(
        { name: 'contracts' },
        {
          $set: {
            displayName: 'Contracts',
            route: 'contracts',
            category: categoryVI._id,
            description: 'View and manage project contracts',
            availableActions: ['create', 'read', 'update', 'delete'],
            isActive: true,
            isMenuGroup: false,
            menuGroupLevel: null,
            level: 1,
            depth: 1,
            sortOrder: 43,
            parentPage: null,
            updatedAt: new Date(),
          },
        }
      );
      contractsPageId = existingContractsPage._id;
      console.log('✅ Contracts page updated:', contractsPageId);
    } else {
      const contractsPage = {
        name: 'contracts',
        displayName: 'Contracts',
        route: 'contracts',
        category: categoryVI._id,
        description: 'View and manage project contracts',
        availableActions: ['create', 'read', 'update', 'delete'],
        isActive: true,
        isMenuGroup: false,
        menuGroupLevel: null,
        level: 1,
        depth: 1,
        sortOrder: 43,
        parentPage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('pages').insertOne(contractsPage);
      contractsPageId = result.insertedId;
      console.log('✅ Contracts page created with _id:', contractsPageId);
    }

    // ─── 2. Contract Details Page ─────────────────────────────────────────────
    const existingDetailsPage = await db.collection('pages').findOne({ name: 'contract-details' });

    let contractDetailsPageId;

    if (existingDetailsPage) {
      console.log('⚠️ Contract Details page already exists! Updating...');
      await db.collection('pages').updateOne(
        { name: 'contract-details' },
        {
          $set: {
            displayName: 'Contract Details',
            route: 'contract-details/:contractId/:projectId',
            category: categoryVI._id,
            description: 'Detailed view of a specific contract and its associated project',
            availableActions: ['read', 'update'],
            isActive: true,
            isMenuGroup: false,
            menuGroupLevel: null,
            level: 2,
            depth: 2,
            sortOrder: 44,
            parentPage: contractsPageId,
            updatedAt: new Date(),
          },
        }
      );
      contractDetailsPageId = existingDetailsPage._id;
      console.log('✅ Contract Details page updated:', contractDetailsPageId);
    } else {
      const contractDetailsPage = {
        name: 'contract-details',
        displayName: 'Contract Details',
        route: 'contract-details/:contractId/:projectId',
        category: categoryVI._id,
        description: 'Detailed view of a specific contract and its associated project',
        availableActions: ['read', 'update'],
        isActive: true,
        isMenuGroup: false,
        menuGroupLevel: null,
        level: 2,
        depth: 2,
        sortOrder: 44,
        parentPage: contractsPageId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.collection('pages').insertOne(contractDetailsPage);
      contractDetailsPageId = result.insertedId;
      console.log('✅ Contract Details page created with _id:', contractDetailsPageId);
    }

    // ─── 3. Create / Update Permissions ──────────────────────────────────────
    const pagesInfo = [
      { id: contractsPageId, name: 'contracts', displayName: 'Contracts', actions: ['create', 'read', 'update', 'delete'] },
      { id: contractDetailsPageId, name: 'contract-details', displayName: 'Contract Details', actions: ['read', 'update'] },
    ];

    const permissionIds = [];

    for (const pageInfo of pagesInfo) {
      const existingPerm = await db.collection('permissions').findOne({ pageId: pageInfo.id });

      let permId;
      if (existingPerm) {
        console.log(`⚠️ Permission for ${pageInfo.displayName} already exists! Updating...`);
        await db.collection('permissions').updateOne(
          { pageId: pageInfo.id },
          {
            $set: {
              availableActions: pageInfo.actions,
              isActive: true,
              updatedAt: new Date(),
            },
          }
        );
        permId = existingPerm._id;
      } else {
        const perm = {
          pageId: pageInfo.id,
          pageName: pageInfo.name,
          pageDisplayName: pageInfo.displayName,
          availableActions: pageInfo.actions,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        const result = await db.collection('permissions').insertOne(perm);
        permId = result.insertedId;
        console.log(`✅ Permission created for ${pageInfo.displayName}:`, permId);
      }

      permissionIds.push({ pageId: pageInfo.id, permId, displayName: pageInfo.displayName });
    }

    // ─── 4. Add Pages to All Active Modules ──────────────────────────────────
    console.log('\n📦 Adding Contracts pages to all active modules...');

    const modules = await db.collection('modules').find({ isActive: true }).toArray();

    for (const module of modules) {
      for (const pageInfo of [
        { id: contractsPageId, displayName: 'Contracts' },
        { id: contractDetailsPageId, displayName: 'Contract Details' },
      ]) {
        const alreadyIn = module.pages && module.pages.some(
          (p) => p.pageId && p.pageId.toString() === pageInfo.id.toString()
        );

        if (alreadyIn) {
          console.log(`⏭️ Skipping ${module.name} — ${pageInfo.displayName} already in module`);
          continue;
        }

        await db.collection('modules').updateOne(
          { _id: module._id },
          {
            $push: {
              pages: {
                pageId: pageInfo.id,
                isActive: true,
                addedAt: new Date(),
              },
            },
          }
        );

        console.log(`✅ Added ${pageInfo.displayName} to module: ${module.name}`);
      }
    }

    // ─── 5. Add Permissions to All Roles ─────────────────────────────────────
    console.log('\n🔐 Adding Contracts permissions to all roles...');

    const roles = await db.collection('roles').find({}).toArray();

    for (const role of roles) {
      for (const { permId, displayName } of permissionIds) {
        const hasIt = role.permissions && role.permissions.some(
          (p) => p.permissionId && p.permissionId.toString() === permId.toString()
        );

        if (hasIt) {
          console.log(`⏭️ Skipping role ${role.name} — ${displayName} permission already exists`);
          continue;
        }

        await db.collection('roles').updateOne(
          { _id: role._id },
          {
            $push: {
              permissions: {
                permissionId: permId,
                actions: ['create', 'read', 'update', 'delete'],
                addedAt: new Date(),
              },
            },
          }
        );

        console.log(`✅ Added ${displayName} permission to role: ${role.name}`);
      }
    }

    console.log('\n✅ Contracts page setup complete!');
    console.log('\n📋 Summary:');
    console.log('  Pages created/updated:');
    console.log('    - Contracts            (/contracts)');
    console.log('    - Contract Details     (/contract-details/:contractId/:projectId)');
    console.log('  - Category: Projects (VI)');
    console.log('  - Added to all active modules');
    console.log('  - Permissions added to all roles');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

addContractsPage().catch(console.error);
