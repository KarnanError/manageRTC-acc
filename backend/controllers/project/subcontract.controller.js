/**
 * Sub-Contract Controller
 * Handles CRUD operations for sub-contracts
 */

import { clerkClient } from '@clerk/clerk-sdk-node';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { getTenantCollections } from '../../config/db.js';
import mailTransporter from '../../config/email.js';
import { extractUser } from '../../utils/apiResponse.js';
import { devError, devLog } from '../../utils/logger.js';

/**
 * Generate secure random password for new sub-contracts
 */
function generateSecurePassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (v) => chars[v % chars.length]).join('');
}

/**
 * Get all sub-contracts for a company
 * GET /api/subcontracts
 */
export const getAllSubContracts = async (req, res) => {
  try {
    const user = extractUser(req);
    const companyId = user.companyId;

    const { status, limit, skip } = req.query;

    // Get tenant-specific collections
    const collections = getTenantCollections(companyId);

    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }

    const subContracts = await collections.subcontracts
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit, 10) : 100)
      .skip(skip ? parseInt(skip, 10) : 0)
      .toArray();

    const total = await collections.subcontracts.countDocuments(query);

    devLog(`[SubContract] Retrieved ${subContracts.length} sub-contracts`);

    return res.status(200).json({
      success: true,
      data: subContracts,
      count: subContracts.length,
      total,
    });
  } catch (error) {
    devError('[SubContract] Error getting sub-contracts:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve sub-contracts' },
    });
  }
};

/**
 * Get a single sub-contract by ID
 * GET /api/subcontracts/:id
 */
export const getSubContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = extractUser(req);
    const companyId = user.companyId;

    // Get tenant-specific collections
    const collections = getTenantCollections(companyId);

    const subContract = await collections.subcontracts.findOne({
      _id: new ObjectId(id),
    });

    if (!subContract) {
      return res.status(404).json({
        success: false,
        error: { message: 'Sub-contract not found' },
      });
    }

    return res.status(200).json({
      success: true,
      data: subContract,
    });
  } catch (error) {
    devError('[SubContract] Error getting sub-contract:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve sub-contract' },
    });
  }
};

/**
 * Create a new sub-contract
 * POST /api/subcontracts
 */
export const createSubContract = async (req, res) => {
  try {
    const user = extractUser(req);
    const companyId = user.companyId;
    const userId = user.userId;

    const { name, company, email, phone, address, logo, status, socialLinks } = req.body;

    // Validate required fields
    if (!name || !company || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name, company, email, phone, and address are required' },
      });
    }

    // Get tenant-specific collections
    const collections = getTenantCollections(companyId);

    // Check for duplicate email
    const existingSubContract = await collections.subcontracts.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingSubContract) {
      return res.status(400).json({
        success: false,
        error: { message: 'A sub-contract with this email already exists' },
      });
    }

    // Generate contract ID
    const year = new Date().getFullYear();

    // Find the highest contract ID for this year in tenant database
    const lastContract = await collections.subcontracts
      .find({ contractId: { $regex: `^SUBC-${year}-` } })
      .sort({ contractId: -1 })
      .limit(1)
      .toArray();

    let sequence = 1;
    if (lastContract && lastContract.length > 0 && lastContract[0].contractId) {
      const parts = lastContract[0].contractId.split('-');
      const lastSequence = parseInt(parts[parts.length - 1]);
      sequence = lastSequence + 1;
    }

    const paddedSequence = String(sequence).padStart(4, '0');
    const contractId = `SUBC-${year}-${paddedSequence}`;

    // Generate secure password for sub-contract login
    const password = generateSecurePassword(12);
    devLog('[SubContract] Generated password for sub-contract');

    // Generate username from email (must be 4-64 characters for Clerk)
    let username = email.trim().toLowerCase().split('@')[0];

    // Ensure username meets Clerk's minimum length requirement (4 characters)
    if (username.length < 4) {
      const namePart = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      username = username + namePart.substring(0, 4 - username.length);

      // If still too short, pad with random numbers
      if (username.length < 4) {
        username =
          username +
          Math.floor(1000 + Math.random() * 9000)
            .toString()
            .substring(0, 4 - username.length);
      }
    }

    // Ensure username doesn't exceed maximum length (64 characters)
    if (username.length > 64) {
      username = username.substring(0, 64);
    }

    // Create Clerk user with retry if username collides
    const createClerkUserWithFallback = async (baseUsername) => {
      let lastError = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const candidate =
          attempt === 0
            ? baseUsername
            : `${baseUsername}-${Math.floor(1000 + Math.random() * 9000)}`.substring(0, 64);

        try {
          devLog('[SubContract] Creating Clerk user with username:', candidate);
          const createdUser = await clerkClient.users.createUser({
            emailAddress: [email.trim().toLowerCase()],
            username: candidate,
            password: password,
            publicMetadata: {
              role: 'contractor',
              companyId: companyId,
            },
          });
          return createdUser;
        } catch (error) {
          lastError = error;
          const isUsernameTaken =
            Array.isArray(error?.errors) &&
            error.errors.some(
              (e) =>
                e.code === 'form_identifier_exists' &&
                ((e.meta && e.meta.paramName === 'username') ||
                  (e.message || '').toLowerCase().includes('username'))
            );
          if (isUsernameTaken) {
            devError('[SubContract] Username already taken in Clerk, retrying with suffix', {
              candidate,
            });
            continue;
          }
          throw error;
        }
      }
      throw lastError;
    };

    // Create Clerk user
    let clerkUserId;
    try {
      const createdUser = await createClerkUserWithFallback(username);
      clerkUserId = createdUser.id;
      devLog('[SubContract] Clerk user created:', clerkUserId);
    } catch (clerkError) {
      devError('[SubContract] Failed to create Clerk user:', clerkError);
      devError('[SubContract] Clerk error details:', {
        code: clerkError.code,
        message: clerkError.message,
        errors: clerkError.errors,
        clerkTraceId: clerkError.clerkTraceId,
      });

      // Parse Clerk errors and return field-specific errors
      if (clerkError.errors && Array.isArray(clerkError.errors)) {
        for (const error of clerkError.errors) {
          devError('[SubContract] Clerk error code:', error.code, 'message:', error.message);

          // Email already exists in Clerk
          if (
            error.code === 'form_identifier_exists' &&
            error.message.toLowerCase().includes('email')
          ) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'EMAIL_EXISTS_IN_CLERK',
                message: 'This email is already registered in the system.',
                field: 'email',
                details: error.message,
              },
            });
          }

          // Password validation errors
          if (error.code === 'form_password_pwned' || error.code === 'password_too_weak') {
            return res.status(400).json({
              success: false,
              error: {
                code: 'PASSWORD_TOO_WEAK',
                message:
                  'Password is too weak or has been compromised. Please use a stronger password.',
                field: 'password',
                details: error.message,
              },
            });
          }
        }
      }

      // Generic Clerk error
      return res.status(500).json({
        success: false,
        error: {
          code: 'CLERK_USER_CREATION_FAILED',
          message: 'Failed to create user account. Please try again.',
          details: clerkError.message,
          clerkTraceId: clerkError.clerkTraceId,
        },
      });
    }

    // Create sub-contract document
    const subContractData = {
      contractId,
      clerkUserId: clerkUserId,
      name: name.trim(),
      company: company.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      logo: logo?.trim() || '',
      status: status || 'Active',
      password: password, // Store password for reference
      socialLinks: {
        instagram: socialLinks?.instagram?.trim() || '',
        facebook: socialLinks?.facebook?.trim() || '',
        linkedin: socialLinks?.linkedin?.trim() || '',
        whatsapp: socialLinks?.whatsapp?.trim() || '',
      },
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collections.subcontracts.insertOne(subContractData);

    devLog(`[SubContract] Created sub-contract ${result.insertedId}`);

    // Send email with credentials
    try {
      const mailOptions = {
        from: '"ManageRTC" <noreply@manage-rtc.com>',
        to: email.trim().toLowerCase(),
        subject: 'Your Sub-Contract Account Credentials - ManageRTC',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .credentials { background-color: white; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; border-radius: 4px; }
              .label { font-weight: bold; color: #555; }
              .value { color: #2196F3; font-size: 16px; margin: 5px 0 15px 0; }
              .password { font-family: 'Courier New', monospace; background-color: #f0f0f0; padding: 8px 12px; border-radius: 4px; display: inline-block; }
              .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
              .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Welcome to ManageRTC</h1>
              </div>
              <div class="content">
                <p>Dear <strong>${name.trim()}</strong>,</p>
                <p>Your sub-contract account has been successfully created in ManageRTC. Here are your login credentials:</p>

                <div class="credentials">
                  <div class="label">Contract ID:</div>
                  <div class="value">${contractId}</div>

                  <div class="label">Company:</div>
                  <div class="value">${company.trim()}</div>

                  <div class="label">Email (Username):</div>
                  <div class="value">${email.trim().toLowerCase()}</div>

                  <div class="label">Password:</div>
                  <div class="value"><span class="password">${password}</span></div>
                </div>

                <div class="warning">
                  <strong>⚠️ Important Security Notice:</strong>
                  <ul style="margin: 10px 0;">
                    <li>Please change your password after your first login</li>
                    <li>Do not share your password with anyone</li>
                    <li>Keep this email secure and delete it after changing your password</li>
                  </ul>
                </div>

                <p>You can now access the ManageRTC portal to:</p>
                <ul>
                  <li>View assigned projects</li>
                  <li>Manage worker assignments</li>
                  <li>Track project progress</li>
                  <li>Access contract documents</li>
                </ul>

                <p>If you have any questions or need assistance, please contact your administrator.</p>

                <p>Best regards,<br><strong>ManageRTC Team</strong></p>
              </div>
              <div class="footer">
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>&copy; ${new Date().getFullYear()} ManageRTC. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      await mailTransporter.sendMail(mailOptions);
      devLog(`[SubContract] Credentials email sent to ${email.trim().toLowerCase()}`);
    } catch (emailError) {
      devError('[SubContract] Failed to send credentials email:', emailError);
      // Don't fail the request if email sending fails
    }

    return res.status(201).json({
      success: true,
      data: { ...subContractData, _id: result.insertedId },
      message:
        'Sub-contract created successfully. Login credentials have been sent to the email address.',
    });
  } catch (error) {
    devError('[SubContract] Error creating sub-contract:', error);

    return res.status(500).json({
      success: false,
      error: { message: 'Failed to create sub-contract' },
    });
  }
};

/**
 * Update a sub-contract
 * PUT /api/subcontracts/:id
 */
export const updateSubContract = async (req, res) => {
  try {
    const { id } = req.params;
    const user = extractUser(req);
    const companyId = user.companyId;
    const userId = user.userId;

    const { name, company, email, phone, address, logo, status, socialLinks } = req.body;

    // Get tenant-specific collections
    const collections = getTenantCollections(companyId);

    // Find sub-contract
    const subContract = await collections.subcontracts.findOne({
      _id: new ObjectId(id),
    });

    if (!subContract) {
      return res.status(404).json({
        success: false,
        error: { message: 'Sub-contract not found' },
      });
    }

    // Check for duplicate email (if email is being updated)
    if (email && email.trim().toLowerCase() !== subContract.email) {
      const existingSubContract = await collections.subcontracts.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: new ObjectId(id) },
      });

      if (existingSubContract) {
        return res.status(400).json({
          success: false,
          error: { message: 'A sub-contract with this email already exists' },
        });
      }
    }

    // Build update object
    const updateData = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (company !== undefined) updateData.company = company.trim();
    if (email !== undefined) updateData.email = email.trim().toLowerCase();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (address !== undefined) updateData.address = address.trim();
    if (logo !== undefined) updateData.logo = logo.trim();
    if (status !== undefined) updateData.status = status;

    if (socialLinks) {
      updateData.socialLinks = { ...subContract.socialLinks };
      if (socialLinks.instagram !== undefined)
        updateData.socialLinks.instagram = socialLinks.instagram.trim();
      if (socialLinks.facebook !== undefined)
        updateData.socialLinks.facebook = socialLinks.facebook.trim();
      if (socialLinks.linkedin !== undefined)
        updateData.socialLinks.linkedin = socialLinks.linkedin.trim();
      if (socialLinks.whatsapp !== undefined)
        updateData.socialLinks.whatsapp = socialLinks.whatsapp.trim();
    }

    await collections.subcontracts.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    // Get updated document
    const updatedSubContract = await collections.subcontracts.findOne({
      _id: new ObjectId(id),
    });

    devLog(`[SubContract] Updated sub-contract ${id}`);

    return res.status(200).json({
      success: true,
      data: updatedSubContract,
      message: 'Sub-contract updated successfully',
    });
  } catch (error) {
    devError('[SubContract] Error updating sub-contract:', error);

    return res.status(500).json({
      success: false,
      error: { message: 'Failed to update sub-contract' },
    });
  }
};

/**
 * Delete a sub-contract
 * DELETE /api/subcontracts/:id
 */
export const deleteSubContract = async (req, res) => {
  try {
    const { id } = req.params;
    const user = extractUser(req);
    const companyId = user.companyId;

    // Get tenant-specific collections
    const collections = getTenantCollections(companyId);

    const result = await collections.subcontracts.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Sub-contract not found' },
      });
    }

    devLog(`[SubContract] Deleted sub-contract ${id}`);

    return res.status(200).json({
      success: true,
      message: 'Sub-contract deleted successfully',
    });
  } catch (error) {
    devError('[SubContract] Error deleting sub-contract:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to delete sub-contract' },
    });
  }
};

/**
 * Get sub-contract statistics
 * GET /api/subcontracts/stats
 */
export const getSubContractStats = async (req, res) => {
  try {
    const user = extractUser(req);
    const companyId = user.companyId;

    // Get tenant-specific collections
    const collections = getTenantCollections(companyId);

    const stats = await collections.subcontracts
      .aggregate([
        {
          $group: {
            _id: null,
            totalContracts: { $sum: 1 },
            activeContracts: {
              $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] },
            },
            inactiveContracts: {
              $sum: { $cond: [{ $eq: ['$status', 'Inactive'] }, 1, 0] },
            },
          },
        },
      ])
      .toArray();

    const result = stats[0] || {
      totalContracts: 0,
      activeContracts: 0,
      inactiveContracts: 0,
    };

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    devError('[SubContract] Error getting stats:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve statistics' },
    });
  }
};

/**
 * Get all contracts with their assigned projects
 * GET /api/subcontracts/with-projects
 */
export const getContractsWithProjects = async (req, res) => {
  try {
    const user = extractUser(req);
    const companyId = user.companyId;

    // Get tenant-specific collections
    const collections = getTenantCollections(companyId);

    // Get all sub-contracts
    const subContracts = await collections.subcontracts.find({}).sort({ createdAt: -1 }).toArray();

    // For each sub-contract, get the projects where it's assigned
    const contractsWithProjects = await Promise.all(
      subContracts.map(async (contract) => {
        // Find all projects that have this sub-contract assigned
        const projects = await collections.projects
          .find({
            'subContracts.subContractId': contract._id,
            isDeleted: { $ne: true },
          })
          .project({
            _id: 1,
            name: 1,
            projectId: 1,
            status: 1,
            startDate: 1,
            deadline: 1,
            'subContracts.$': 1, // Only get the matching sub-contract from the array
          })
          .toArray();

        // Extract sub-contract details from each project
        const projectsWithDetails = await Promise.all(
          projects.map(async (project) => {
            const subContractDetail = project.subContracts?.[0] || {};
            const subContractDetailId = subContractDetail._id;

            // Get total workers for this sub-contract assignment
            let totalWorkers = 0;
            if (subContractDetailId) {
              const workers = await collections.projectcontracts
                .find({
                  subContractDetailId: subContractDetailId,
                  isDeleted: { $ne: true },
                })
                .toArray();

              totalWorkers = workers.reduce(
                (sum, worker) => sum + (worker.numberOfWorkers || 0),
                0
              );
            }

            return {
              _id: project._id,
              projectName: project.name,
              projectId: project.projectId,
              status: project.status,
              startDate: project.startDate,
              deadline: project.deadline,
              endDate: subContractDetail.endDate,
              contractDate: subContractDetail.contractDate,
              numberOfMembers: subContractDetail.numberOfMembers,
              totalWorkers: totalWorkers,
              totalAmount: subContractDetail.totalAmount,
              currency: subContractDetail.currency,
              description: subContractDetail.description,
            };
          })
        );

        return {
          _id: contract._id,
          contractId: contract.contractId,
          name: contract.name,
          company: contract.company,
          email: contract.email,
          phone: contract.phone,
          status: contract.status,
          address: contract.address,
          projects: projectsWithDetails,
          projectCount: projectsWithDetails.length,
        };
      })
    );

    devLog(`[SubContract] Retrieved ${contractsWithProjects.length} contracts with projects`);

    return res.status(200).json({
      success: true,
      data: contractsWithProjects,
      count: contractsWithProjects.length,
    });
  } catch (error) {
    devError('[SubContract] Error getting contracts with projects:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve contracts with projects' },
    });
  }
};
