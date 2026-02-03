/**
 * Mongoose Multi-Tenant Utility
 * Provides dynamic database switching based on companyId
 */

import mongoose from 'mongoose';

// Cache for tenant connections
const tenantConnections = new Map();

/**
 * Get a Mongoose connection for a specific tenant (company)
 * @param {string} companyId - The company/tenant ID (used as database name)
 * @returns {mongoose.Connection} - Mongoose connection to the tenant database
 */
export const getTenantConnection = (companyId) => {
  if (!companyId) {
    throw new Error('Company ID is required for tenant connection');
  }

  // Return cached connection if it exists
  if (tenantConnections.has(companyId)) {
    return tenantConnections.get(companyId);
  }

  // Create new connection to tenant database
  const connection = mongoose.connection.useDb(companyId, { useCache: true });
  tenantConnections.set(companyId, connection);

  console.log(`[Mongoose] Created connection to tenant database: ${companyId}`);

  return connection;
};

/**
 * Get a Mongoose model for a specific tenant
 * @param {string} companyId - The company/tenant ID
 * @param {string} modelName - The model name (e.g., 'Project', 'Employee')
 * @param {mongoose.Schema} schema - The Mongoose schema
 * @returns {mongoose.Model} - Mongoose model bound to the tenant database
 */
export const getTenantModel = (companyId, modelName, schema) => {
  const connection = getTenantConnection(companyId);

  // Check if model already exists in this connection
  if (connection.models[modelName]) {
    return connection.models[modelName];
  }

  // Create and return new model
  return connection.model(modelName, schema);
};

/**
 * Clear tenant connection cache (useful for testing or cleanup)
 */
export const clearTenantConnections = () => {
  tenantConnections.clear();
  console.log('[Mongoose] Cleared tenant connection cache');
};
