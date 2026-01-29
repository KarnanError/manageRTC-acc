/**
 * Designation REST Controller
 * Wraps existing designation service functions for REST API
 */

import { displayDesignations } from '../../services/hr/hrm.designation.js';
import { logger } from '../../utils/logger.js';

/**
 * Get all designations with optional filtering
 * REST API: GET /api/designations
 */
export const getAllDesignations = async (req, res) => {
  try {
    const { departmentId, status } = req.query;
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Company ID is required' }
      });
    }

    const filters = {};
    if (departmentId) filters.departmentId = departmentId;
    if (status) filters.status = status;

    const result = await displayDesignations(companyId, null, filters);

    if (result.done) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length
      });
    } else {
      res.status(400).json({
        success: false,
        error: { message: result.error || 'Failed to fetch designations' }
      });
    }
  } catch (error) {
    logger.error('Error fetching designations:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch designations' }
    });
  }
};
