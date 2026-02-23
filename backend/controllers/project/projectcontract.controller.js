/**
 * Project Contract Controller
 * Handles CRUD operations for project worker contracts
 */

import { ObjectId } from 'mongodb';
import ProjectContract from '../../models/project/projectcontract.schema.js';
import { extractUser } from '../../utils/apiResponse.js';
import { devError, devLog } from '../../utils/logger.js';
import { getTenantModel } from '../../utils/mongooseMultiTenant.js';

/**
 * Create a new project contract (worker assignment)
 * POST /api/projectcontracts
 */
export const createProjectContract = async (req, res) => {
  try {
    const user = extractUser(req);
    const companyId = user.companyId;
    const { subContractDetailId, title, numberOfWorkers, workedDate } = req.body;

    // Validate required fields
    if (!subContractDetailId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Sub-Contract Detail ID is required' },
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title is required' },
      });
    }

    if (!numberOfWorkers || numberOfWorkers < 1) {
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
      `[ProjectContract] Creating project contract for subContractDetail ${subContractDetailId}`
    );

    // Get tenant-specific ProjectContract model
    const ProjectContractModel = getTenantModel(
      companyId,
      'ProjectContract',
      ProjectContract.schema
    );

    // Create new project contract
    const newProjectContract = new ProjectContractModel({
      subContractDetailId: new ObjectId(subContractDetailId),
      title: title.trim(),
      numberOfWorkers: parseInt(numberOfWorkers, 10),
      workedDate: new Date(workedDate),
      createdBy: user.userId || user.email,
    });

    // Save to database
    await newProjectContract.save();

    devLog(`[ProjectContract] Successfully created project contract ${newProjectContract._id}`);

    return res.status(201).json({
      success: true,
      data: {
        _id: newProjectContract._id,
        subContractDetailId: newProjectContract.subContractDetailId,
        title: newProjectContract.title,
        numberOfWorkers: newProjectContract.numberOfWorkers,
        workedDate: newProjectContract.workedDate,
        createdAt: newProjectContract.createdAt,
        updatedAt: newProjectContract.updatedAt,
      },
      message: 'Project contract created successfully',
    });
  } catch (error) {
    devError('[ProjectContract] Error creating project contract:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to create project contract' },
    });
  }
};

/**
 * Get all project contracts by sub-contract detail ID
 * GET /api/projectcontracts/detail/:subContractDetailId
 */
export const getContractsByDetailId = async (req, res) => {
  try {
    const { subContractDetailId } = req.params;
    const user = extractUser(req);
    const companyId = user.companyId;

    devLog(`[ProjectContract] Fetching contracts for subContractDetail ${subContractDetailId}`);

    // Get tenant-specific ProjectContract model
    const ProjectContractModel = getTenantModel(
      companyId,
      'ProjectContract',
      ProjectContract.schema
    );

    // Find all project contracts for this subContractDetail
    const contracts = await ProjectContractModel.find({
      subContractDetailId: new ObjectId(subContractDetailId),
      isDeleted: false,
    }).sort({ workedDate: -1, createdAt: -1 });

    devLog(`[ProjectContract] Found ${contracts.length} contracts`);

    return res.status(200).json({
      success: true,
      data: contracts,
      count: contracts.length,
    });
  } catch (error) {
    devError('[ProjectContract] Error fetching project contracts:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch project contracts' },
    });
  }
};

/**
 * Deprecated - kept for backward compatibility
 * Get all project contracts for a specific project
 * GET /api/projectcontracts/project/:projectId
 */
export const getProjectContracts = async (req, res) => {
  return res.status(400).json({
    success: false,
    error: {
      message:
        'This endpoint is deprecated. Use /api/projectcontracts/detail/:subContractDetailId instead',
    },
  });
};

/**
 * Deprecated - kept for backward compatibility
 * GET /api/projectcontracts/subcontract/:subContractId
 */
export const getSubContractProjects = async (req, res) => {
  return res.status(400).json({
    success: false,
    error: {
      message:
        'This endpoint is deprecated. Use /api/projectcontracts/detail/:subContractDetailId instead',
    },
  });
};

/**
 * Update a project contract
 * PUT /api/projectcontracts/:id
 */
export const updateProjectContract = async (req, res) => {
  try {
    const { id } = req.params;
    const user = extractUser(req);
    const companyId = user.companyId;
    const { title, numberOfWorkers, workedDate } = req.body;

    devLog(`[ProjectContract] Updating project contract ${id}`);

    // Get tenant-specific ProjectContract model
    const ProjectContractModel = getTenantModel(
      companyId,
      'ProjectContract',
      ProjectContract.schema
    );

    // Find the contract
    const contract = await ProjectContractModel.findOne({
      _id: new ObjectId(id),
      isDeleted: false,
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project contract not found' },
      });
    }

    // Update fields
    if (title && title.trim()) {
      contract.title = title.trim();
    }
    if (numberOfWorkers && numberOfWorkers >= 1) {
      contract.numberOfWorkers = parseInt(numberOfWorkers, 10);
    }
    if (workedDate) {
      contract.workedDate = new Date(workedDate);
    }

    contract.updatedBy = user.userId || user.email;

    // Save changes
    await contract.save();

    devLog(`[ProjectContract] Successfully updated project contract ${id}`);

    return res.status(200).json({
      success: true,
      data: {
        _id: contract._id,
        subContractDetailId: contract.subContractDetailId,
        title: contract.title,
        numberOfWorkers: contract.numberOfWorkers,
        workedDate: contract.workedDate,
        updatedAt: contract.updatedAt,
      },
      message: 'Project contract updated successfully',
    });
  } catch (error) {
    devError('[ProjectContract] Error updating project contract:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update project contract' },
    });
  }
};

/**
 * Delete a project contract (soft delete)
 * DELETE /api/projectcontracts/:id
 */
export const deleteProjectContract = async (req, res) => {
  try {
    const { id } = req.params;
    const user = extractUser(req);
    const companyId = user.companyId;

    devLog(`[ProjectContract] Deleting project contract ${id}`);

    // Get tenant-specific ProjectContract model
    const ProjectContractModel = getTenantModel(
      companyId,
      'ProjectContract',
      ProjectContract.schema
    );

    // Find and soft delete the contract
    const contract = await ProjectContractModel.findOne({
      _id: new ObjectId(id),
      isDeleted: false,
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project contract not found' },
      });
    }

    contract.isDeleted = true;
    contract.deletedAt = new Date();
    contract.deletedBy = user.userId || user.email;

    await contract.save();

    devLog(`[ProjectContract] Successfully deleted project contract ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Project contract deleted successfully',
    });
  } catch (error) {
    devError('[ProjectContract] Error deleting project contract:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to delete project contract' },
    });
  }
};

/**
 * Get a single project contract by ID
 * GET /api/projectcontracts/:id
 */
export const getProjectContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = extractUser(req);
    const companyId = user.companyId;

    devLog(`[ProjectContract] Fetching project contract ${id}`);

    // Get tenant-specific ProjectContract model
    const ProjectContractModel = getTenantModel(
      companyId,
      'ProjectContract',
      ProjectContract.schema
    );

    // Find the contract
    const contract = await ProjectContractModel.findOne({
      _id: new ObjectId(id),
      isDeleted: false,
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: { message: 'Project contract not found' },
      });
    }

    return res.status(200).json({
      success: true,
      data: contract,
    });
  } catch (error) {
    devError('[ProjectContract] Error fetching project contract:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch project contract' },
    });
  }
};
