/**
 * Project Sub-Contract Controller
 * Handles CRUD operations for sub-contracts within a specific project
 */

import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import { getTenantCollections } from '../../config/db.js';
import Project from '../../models/project/project.schema.js';
import { extractUser } from '../../utils/apiResponse.js';
import { devError, devLog } from '../../utils/logger.js';
import { getTenantModel } from '../../utils/mongooseMultiTenant.js';

/**
 * Update worker information for a project's sub-contract
 * PUT /api/projects/:projectId/subcontracts/:subContractId/workers
 */
export const updateProjectWorkers = async (req, res) => {
  try {
    const { projectId, subContractId } = req.params;
    const user = extractUser(req);
    const companyId = user.companyId;

    const { title, numberOfWorkers, workedDate } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title is required' },
      });
    }

    if (numberOfWorkers === undefined || numberOfWorkers < 1) {
      return res.status(400).json({
        success: false,
        error: { message: 'Number of workers must be at least 1' },
      });
    }

    if (!workedDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Worked date is required' },
      });
    }

    devLog(
      `[ProjectSubContract] Updating workers for project ${projectId}, sub-contract ${subContractId}`
    );

    // Get tenant-specific Project model
    const ProjectModel = getTenantModel(companyId, 'Project', Project.schema);

    // Find project
    const project = await ProjectModel.findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found' },
      });
    }

    // Find the sub-contract detail in the project
    const subContractDetail = project.subContracts?.find(
      (sc) => sc._id.toString() === subContractId && !sc.isDeleted
    );

    if (!subContractDetail) {
      return res.status(404).json({
        success: false,
        error: { message: 'Sub-contract not found in project' },
      });
    }

    // Update worker information
    subContractDetail.title = title.trim();
    subContractDetail.numberOfMembers = parseInt(numberOfWorkers, 10);
    subContractDetail.workedDate = new Date(workedDate);
    subContractDetail.updatedAt = new Date();
    project.updatedAt = new Date();

    // Save project
    await project.save();

    devLog(`[ProjectSubContract] Updated worker info for sub-contract ${subContractId}`);

    // Get sub-contract details for response
    const collections = getTenantCollections(companyId);
    const subContract = await collections.subcontracts.findOne({
      _id: new ObjectId(subContractDetail.subContractId),
    });

    const response = {
      _id: subContractDetail._id,
      subContractId: subContractDetail.subContractId,
      contractId: subContract?.contractId || '',
      contractName: subContract?.name || '',
      title: subContractDetail.title,
      numberOfWorkers: subContractDetail.numberOfMembers,
      workedDate: subContractDetail.workedDate,
      // Legacy fields for backward compatibility
      contractDate: subContractDetail.contractDate,
      totalAmount: subContractDetail.totalAmount,
      workerPayRate: subContractDetail.workerPayRate,
      paymentDate: subContractDetail.paymentDate,
      currency: subContractDetail.currency,
      description: subContractDetail.description,
      updatedAt: subContractDetail.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data: response,
      message: 'Worker information updated successfully',
    });
  } catch (error) {
    devError('[ProjectSubContract] Error updating workers:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update worker information' },
    });
  }
};

/**
 * Get all sub-contracts for a specific project
 * GET /api/projects/:projectId/subcontracts
 */
export const getProjectSubContracts = async (req, res) => {
  try {
    const { projectId } = req.params;
    const user = extractUser(req);
    const companyId = user.companyId;

    devLog(`[ProjectSubContract] Getting sub-contracts for project ${projectId}`);

    // Get tenant-specific Project model and collections
    const ProjectModel = getTenantModel(companyId, 'Project', Project.schema);
    const collections = getTenantCollections(companyId);

    // Find project by either MongoDB _id or custom projectId field
    let project;
    if (mongoose.Types.ObjectId.isValid(projectId)) {
      // Try finding by _id first (tenant model already filters by company via database)
      project = await ProjectModel.findOne({ _id: projectId });
    }
    if (!project) {
      // If not found by _id, try finding by projectId field
      project = await ProjectModel.findOne({ projectId });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found' },
      });
    }

    // Filter out soft-deleted sub-contracts
    const activeSubContracts = project.subContracts?.filter((sc) => !sc.isDeleted) || [];

    devLog(
      `[ProjectSubContract] Raw sub-contracts from DB:`,
      JSON.stringify(activeSubContracts, null, 2)
    );

    // Populate sub-contract details from SubContract collection
    const populatedSubContracts = await Promise.all(
      activeSubContracts.map(async (detail) => {
        devLog(`[ProjectSubContract] Processing detail:`, {
          hasSubContractId: !!detail.subContractId,
          hasContractName: !!detail.contractName,
          contractName: detail.contractName,
          allKeys: Object.keys(detail),
        });

        // Handle both old embedded data and new reference-based data
        if (detail.subContractId) {
          // New structure: fetch from SubContract collection
          const subContract = await collections.subcontracts.findOne({
            _id: new ObjectId(detail.subContractId),
          });

          return {
            _id: detail._id,
            subContractId: detail.subContractId,
            contractId: subContract?.contractId || '',
            contractName: subContract?.name || '',
            startDate: detail.startDate,
            endDate: detail.endDate,
            currency: detail.currency || 'USD',
            budget: detail.budget || 0,
            description: detail.description,
            // Legacy fields for backward compatibility
            contractDate: detail.contractDate || detail.startDate,
            numberOfMembers: detail.numberOfMembers,
            totalAmount: detail.totalAmount || detail.budget,
            createdAt: detail.createdAt,
            updatedAt: detail.updatedAt,
          };
        } else {
          // Old structure: embedded data (legacy support)
          const result = {
            _id: detail._id,
            subContractId: null,
            contractId: '', // Old data doesn't have contractId
            contractName: detail.contractName || '',
            startDate: detail.startDate || detail.contractDate,
            endDate: detail.endDate,
            currency: detail.currency || 'USD',
            budget: detail.budget || detail.totalAmount || 0,
            description: detail.description,
            // Legacy fields
            contractDate: detail.contractDate,
            numberOfMembers: detail.numberOfMembers,
            totalAmount: detail.totalAmount || detail.budget,
            createdAt: detail.createdAt,
            updatedAt: detail.updatedAt,
          };
          devLog(`[ProjectSubContract] Legacy data result:`, result);
          return result;
        }
      })
    );

    devLog(`[ProjectSubContract] Found ${populatedSubContracts.length} active sub-contracts`);

    return res.status(200).json({
      success: true,
      data: populatedSubContracts,
      count: populatedSubContracts.length,
    });
  } catch (error) {
    devError('[ProjectSubContract] Error getting sub-contracts:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve sub-contracts' },
    });
  }
};

/**
 * Create a new sub-contract for a project
 * POST /api/projects/:projectId/subcontracts
 */
export const createProjectSubContract = async (req, res) => {
  try {
    const { projectId } = req.params;
    const user = extractUser(req);
    const companyId = user.companyId;

    const { contractId, startDate, endDate, currency, budget, description } = req.body;

    // Validate required fields
    if (!contractId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: { message: 'Contract ID, start date, and end date are required' },
      });
    }

    // Validate currency and budget
    if (!currency) {
      return res.status(400).json({
        success: false,
        error: { message: 'Currency is required' },
      });
    }

    if (budget === undefined || budget === null || budget <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Budget must be a positive number' },
      });
    }

    // Validate description
    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Description is required' },
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: { message: 'Description must be at least 10 characters' },
      });
    }

    devLog(`[ProjectSubContract] Creating sub-contract for project ${projectId}`);
    devLog(`[ProjectSubContract] Company ID: ${companyId}`);

    // Get tenant-specific Project model
    const ProjectModel = getTenantModel(companyId, 'Project', Project.schema);

    // Find project by either MongoDB _id or custom projectId field
    let project;
    if (mongoose.Types.ObjectId.isValid(projectId)) {
      // Try finding by _id first (tenant model already filters by company via database)
      devLog(`[ProjectSubContract] Searching by _id: ${projectId}`);
      project = await ProjectModel.findOne({ _id: projectId });
      devLog(`[ProjectSubContract] Found by _id:`, project ? 'Yes' : 'No');
    }
    if (!project) {
      // If not found by _id, try finding by projectId field
      devLog(`[ProjectSubContract] Searching by projectId field: ${projectId}`);
      project = await ProjectModel.findOne({ projectId });
      devLog(`[ProjectSubContract] Found by projectId field:`, project ? 'Yes' : 'No');
    }

    if (!project) {
      devLog(`[ProjectSubContract] Project not found. Searched for: ${projectId}`);
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found' },
      });
    }

    // Get tenant-specific collections
    const collections = getTenantCollections(companyId);

    // Find the SubContract by contractId in the SubContract collection
    const subContract = await collections.subcontracts.findOne({
      contractId: contractId.trim(),
    });

    if (!subContract) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Sub-contract with ID '${contractId}' not found in sub-contracts collection`,
        },
      });
    }

    // Validate budget against project value (if project has a value)
    if (project.projectValue && budget > project.projectValue) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Budget (${budget}) cannot exceed project value (${project.projectValue})`,
        },
      });
    }

    // Create new sub-contract reference with project-specific details
    const newSubContractDetail = {
      _id: new ObjectId(),
      subContractId: subContract._id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      currency: currency,
      budget: parseFloat(budget),
      description: description?.trim() || '',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Add sub-contract detail to project's subContracts array
    if (!project.subContracts) {
      project.subContracts = [];
    }
    project.subContracts.push(newSubContractDetail);
    project.updatedAt = new Date();

    // Save project
    await project.save();

    devLog(
      `[ProjectSubContract] Created sub-contract detail ${newSubContractDetail._id} for project ${projectId}`
    );

    // Return populated data
    const response = {
      _id: newSubContractDetail._id,
      subContractId: subContract._id,
      contractId: subContract.contractId,
      contractName: subContract.name,
      startDate: newSubContractDetail.startDate,
      endDate: newSubContractDetail.endDate,
      currency: newSubContractDetail.currency,
      budget: newSubContractDetail.budget,
      description: newSubContractDetail.description,
      createdAt: newSubContractDetail.createdAt,
      updatedAt: newSubContractDetail.updatedAt,
    };

    return res.status(201).json({
      success: true,
      data: response,
      message: 'Sub-contract added to project successfully',
    });
  } catch (error) {
    devError('[ProjectSubContract] Error creating sub-contract:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to create sub-contract' },
    });
  }
};

/**
 * Update a sub-contract in a project
 * PUT /api/projects/:projectId/subcontracts/:subContractId
 */
export const updateProjectSubContract = async (req, res) => {
  try {
    const { projectId, subContractId } = req.params;
    const user = extractUser(req);
    const companyId = user.companyId;

    const { startDate, endDate, currency, budget, description } = req.body;

    // Validate description if provided
    if (description !== undefined) {
      if (!description || !description.trim()) {
        return res.status(400).json({
          success: false,
          error: { message: 'Description is required' },
        });
      }

      if (description.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: { message: 'Description must be at least 10 characters' },
        });
      }
    }

    devLog(`[ProjectSubContract] Updating sub-contract ${subContractId} in project ${projectId}`);

    // Get tenant-specific Project model
    const ProjectModel = getTenantModel(companyId, 'Project', Project.schema);

    // Find project by either MongoDB _id or custom projectId field
    let project;
    if (mongoose.Types.ObjectId.isValid(projectId)) {
      // Try finding by _id first (tenant model already filters by company via database)
      project = await ProjectModel.findOne({ _id: projectId });
    }
    if (!project) {
      // If not found by _id, try finding by projectId field
      project = await ProjectModel.findOne({ projectId });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found' },
      });
    }

    // Find the sub-contract in the project's subContracts array (excluding deleted ones)
    const subContractIndex = project.subContracts?.findIndex(
      (sc) => sc._id.toString() === subContractId && !sc.isDeleted
    );

    if (subContractIndex === -1 || subContractIndex === undefined) {
      return res.status(404).json({
        success: false,
        error: { message: 'Sub-contract not found in this project' },
      });
    }

    // Get tenant-specific collections
    const collections = getTenantCollections(companyId);

    // Validate budget against project value if budget is being updated
    if (budget !== undefined && project.projectValue && parseFloat(budget) > project.projectValue) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Budget (${budget}) cannot exceed project value (${project.projectValue})`,
        },
      });
    }

    // Update sub-contract fields (project-specific details only)
    const subContract = project.subContracts[subContractIndex];

    if (startDate !== undefined) subContract.startDate = new Date(startDate);
    if (endDate !== undefined) subContract.endDate = new Date(endDate);
    if (currency !== undefined) subContract.currency = currency;
    if (budget !== undefined) subContract.budget = parseFloat(budget);
    if (description !== undefined) subContract.description = description.trim();

    subContract.updatedAt = new Date();
    project.updatedAt = new Date();

    // Save project
    await project.save();

    // Get the sub-contract info for response
    let subContractInfo = null;
    if (subContract.subContractId) {
      subContractInfo = await collections.subcontracts.findOne({
        _id: new ObjectId(subContract.subContractId),
      });
    }

    devLog(`[ProjectSubContract] Updated sub-contract ${subContractId} in project ${projectId}`);

    // Return populated data
    const response = {
      _id: subContract._id,
      subContractId: subContract.subContractId || null,
      contractId: subContractInfo?.contractId || '',
      contractName: subContractInfo?.name || subContract.contractName || '',
      startDate: subContract.startDate,
      endDate: subContract.endDate,
      currency: subContract.currency || 'USD',
      budget: subContract.budget || 0,
      description: subContract.description,
      // Legacy fields for backward compatibility
      contractDate: subContract.contractDate || subContract.startDate,
      numberOfMembers: subContract.numberOfMembers,
      totalAmount: subContract.totalAmount || subContract.budget,
      createdAt: subContract.createdAt,
      updatedAt: subContract.updatedAt,
    };

    return res.status(200).json({
      success: true,
      data: response,
      message: 'Sub-contract updated successfully',
    });
  } catch (error) {
    devError('[ProjectSubContract] Error updating sub-contract:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update sub-contract' },
    });
  }
};

/**
 * Delete a sub-contract from a project
 * DELETE /api/projects/:projectId/subcontracts/:subContractId
 */
export const deleteProjectSubContract = async (req, res) => {
  try {
    const { projectId, subContractId } = req.params;
    const user = extractUser(req);
    const companyId = user.companyId;

    devLog(`[ProjectSubContract] Deleting sub-contract ${subContractId} from project ${projectId}`);

    // Get tenant-specific Project model
    const ProjectModel = getTenantModel(companyId, 'Project', Project.schema);

    // Find project by either MongoDB _id or custom projectId field
    let project;
    if (mongoose.Types.ObjectId.isValid(projectId)) {
      // Try finding by _id first (tenant model already filters by company via database)
      project = await ProjectModel.findOne({ _id: projectId });
    }
    if (!project) {
      // If not found by _id, try finding by projectId field
      project = await ProjectModel.findOne({ projectId });
    }

    if (!project) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project not found' },
      });
    }

    // Find the sub-contract in the project's subContracts array
    const subContract = project.subContracts?.find(
      (sc) => sc._id.toString() === subContractId && !sc.isDeleted
    );

    if (!subContract) {
      return res.status(404).json({
        success: false,
        error: { message: 'Sub-contract not found in this project' },
      });
    }

    // Soft delete: mark as deleted instead of removing from array
    subContract.isDeleted = true;
    subContract.updatedAt = new Date();
    project.updatedAt = new Date();

    // Save project
    await project.save();

    devLog(
      `[ProjectSubContract] Soft deleted sub-contract ${subContractId} from project ${projectId}`
    );

    return res.status(200).json({
      success: true,
      message: 'Sub-contract deleted successfully',
    });
  } catch (error) {
    devError('[ProjectSubContract] Error deleting sub-contract:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to delete sub-contract' },
    });
  }
};
