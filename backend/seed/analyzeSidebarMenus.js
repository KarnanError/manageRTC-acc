/**
 * Comprehensive Sidebar Menu Analysis
 * Analyzes all role menus and compares them to identify missing items for each role
 * Run: node backend/seed/analyzeSidebarMenus.js
 */

import fs from 'fs';

const sidebarPath = 'react/src/core/data/json/sidebarMenu.jsx';

const main = () => {
  const content = fs.readFileSync(sidebarPath, 'utf8');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('COMPREHENSIVE SIDEBAR MENU ANALYSIS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Find all case statements for roles
  const roleCases = ['superadmin', 'admin', 'hr', 'manager', 'employee'];
  const roleMenus = {};

  for (const role of roleCases) {
    const caseRegex = new RegExp(`case '${role}':([\\s\\S]*?)(?=case '\\w+':|$)`, 'g');
    const match = caseRegex.exec(content);

    if (match) {
      const menuContent = match[1];

      // Extract all menu labels
      const labelRegex = /label:\s*['"`]([^'"`]+)['"`]/g;
      const labels = [];
      let labelMatch;

      while ((labelMatch = labelRegex.exec(menuContent)) !== null) {
        labels.push(labelMatch[1]);
      }

      roleMenus[role] = {
        labelCount: labels.length,
        labels: labels,
        contentLength: menuContent.length
      };
    }
  }

  console.log('ROLE MENU OVERVIEW:');
  console.log('==================\n');

  for (const role of roleCases) {
    if (roleMenus[role]) {
      console.log(`📋 ${role.toUpperCase()}:`);
      console.log(`   Total menu items: ${roleMenus[role].labelCount}`);
      console.log(`   Content length: ${roleMenus[role].contentLength} chars`);
      console.log('');
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('DETAILED MENU COMPARISON');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Categorize menus by type
  const menuCategories = {
    dashboard: [],
    applications: [],
    hrm: [],
    employees: [],
    projects: [],
    crm: [],
    finance: [],
    administration: [],
    content: [],
  };

  // Analyze each role's menus
  for (const role of roleCases) {
    if (!roleMenus[role]) continue;

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`ROLE: ${role.toUpperCase()}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Extract main menu groups (first level)
    const mainMenuRegex = /tittle:\s*['"`]([^'"`]+)['"`]/g;
    const mainMenus = [];
    let mainMatch;

    const roleContent = content.substring(
      content.indexOf(`case '${role}':`),
      role === 'employee' ? content.length : content.indexOf(`case '${roleCases[roleCases.indexOf(role) + 1]}':`)
    );

    while ((mainMatch = mainMenuRegex.exec(roleContent)) !== null) {
      mainMenus.push(mainMatch[1]);
      console.log(`📁 ${mainMatch[1]}`);
    }

    // Count items per category
    for (const mainMenu of mainMenus) {
      const lowerMenu = mainMenu.toLowerCase();

      if (lowerMenu.includes('dashboard')) menuCategories.dashboard.push({ role, menu: mainMenu });
      if (lowerMenu.includes('hrm') || lowerMenu.includes('employees')) menuCategories.hrm.push({ role, menu: mainMenu });
      if (lowerMenu.includes('project')) menuCategories.projects.push({ role, menu: mainMenu });
      if (lowerMenu.includes('crm') || lowerMenu.includes('deal') || lowerMenu.includes('lead')) menuCategories.crm.push({ role, menu: mainMenu });
      if (lowerMenu.includes('finance') || lowerMenu.includes('payroll') || lowerMenu.includes('accounting')) menuCategories.finance.push({ role, menu: mainMenu });
    }

    // List all unique labels for this role
    const uniqueLabels = [...new Set(roleMenus[role].labels)].slice(0, 50); // Show first 50
    console.log(`\n   Sample menu items (${Math.min(uniqueLabels.length, 50)} of ${roleMenus[role].labelCount}):`);
    uniqueLabels.forEach(label => {
      console.log(`   • ${label}`);
    });
  }

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CATEGORY ANALYSIS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const [category, items] of Object.entries(menuCategories)) {
    if (items.length > 0) {
      console.log(`\n📂 ${category.toUpperCase()}:`);
      console.log(`   Roles that have this category: ${[...new Set(items.map(i => i.role))].join(', ')}`);
    }
  }

  // Specific analysis: What does employee have vs what HR has?
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('HR vs EMPLOYEE COMPARISON');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const hrLabels = new Set(roleMenus.hr?.labels || []);
  const employeeLabels = new Set(roleMenus.employee?.labels || []);

  const inHRNotInEmployee = [...hrLabels].filter(x => !employeeLabels.has(x));
  const inEmployeeNotInHR = [...employeeLabels].filter(x => !hrLabels.has(x));

  console.log('🔍 Items HR has that Employee does NOT:');
  inHRNotInEmployee.slice(0, 20).forEach(item => {
    console.log(`   • ${item}`);
  });

  console.log(`\n   Total: ${inHRNotInEmployee.length} items\n`);

  console.log('🔍 Items Employee has that HR does NOT:');
  inEmployeeNotInHR.slice(0, 10).forEach(item => {
    console.log(`   • ${item}`);
  });

  console.log(`\n   Total: ${inEmployeeNotInHR.length} items\n`);

  // Look for leave-related items in HR but not in Employee
  const leaveItems = inHRNotInEmployee.filter(x =>
    x.toLowerCase().includes('leave') ||
    x.toLowerCase().includes('attendance')
  );

  if (leaveItems.length > 0) {
    console.log('🍃 LEAVE-RELATED items HR has but Employee does NOT:');
    leaveItems.forEach(item => {
      console.log(`   • ${item}`);
    });
    console.log('');
  }

  // Recommend items employee should have
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RECOMMENDATION FOR EMPLOYEE ROLE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const recommendedForEmployee = [
    'Dashboard',
    'Applications',
    'HRM',
    'Leave Management',
    'Leaves',
    'Attendance',
    'Holidays',
    'Performance',
    'Training',
    'Policies',
    'Announcement',
    'Assets',
    'Knowledge Base',
  ];

  console.log('Items Employee SHOULD have:');
  recommendedForEmployee.forEach(item => {
    const has = employeeLabels.has(item);
    console.log(`   ${has ? '✅' : '❌'} ${item}`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};

main();
