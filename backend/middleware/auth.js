/**
 * Authentication Middleware for REST APIs
 * Verifies Clerk JWT tokens and extracts user metadata
 */

import { clerkClient } from '@clerk/clerk-sdk-node';

/**
 * Authenticate - Main authentication middleware
 * Verifies Clerk JWT token and attaches user info to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Debug: Log incoming request headers
    console.log('[Auth Middleware] Incoming request:', {
      path: req.path,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization,
      authHeaderPrefix: req.headers.authorization?.substring(0, 20) + '...',
      requestId: req.id,
    });

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Auth Middleware] No Bearer token found');
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          requestId: req.id || 'no-id',
        },
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token using Clerk SDK
    try {
      const verifiedToken = await clerkClient.verifyToken(token);

      // Get user details with metadata
      const user = await clerkClient.users.getUser(verifiedToken.sub);

      // Attach user info to request
      req.user = {
        userId: user.id,
        companyId: user.publicMetadata?.companyId || null,
        role: user.publicMetadata?.role || 'public',
        email: user.primaryEmailAddress?.emailAddress,
      };

      // Also attach full auth object for compatibility
      req.auth = {
        userId: user.id,
        publicMetadata: user.publicMetadata,
        primaryEmailAddress: user.primaryEmailAddress,
      };

      next();
    } catch (clerkError) {
      console.error('[Clerk Verification Error]', {
        error: clerkError.message,
        stack: clerkError.stack,
        requestId: req.id,
      });
      throw clerkError;
    }
  } catch (error) {
    console.error('[Auth Middleware Error]', {
      error: error.message,
      stack: error.stack,
      requestId: req.id,
    });

    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        requestId: req.id || 'no-id',
      },
    });
  }
};

/**
 * requireRole - Role-based authorization middleware
 * Checks if authenticated user has one of the required roles
 *
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware function
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    // First ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          requestId: req.id || 'no-id',
        },
      });
    }

    // Check if user has one of the required roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient permissions. Required roles: ${roles.join(', ')}`,
          requestId: req.id || 'no-id',
        },
      });
    }

    next();
  };
};

/**
 * requireCompany - Ensures user belongs to a company
 * Superadmin bypasses this check (case-insensitive)
 */
export const requireCompany = (req, res, next) => {
  // Superadmin doesn't need company (case-insensitive check)
  const userRole = req.user?.role?.toLowerCase();
  if (req.user && userRole === 'superadmin') {
    console.log('[Company Check Bypassed - Superadmin]', {
      userId: req.user.userId,
      role: req.user.role,
      requestId: req.id,
    });
    return next();
  }

  if (!req.user || !req.user.companyId) {
    console.warn('[Company Check Failed]', {
      userId: req.user?.userId,
      role: req.user?.role,
      hasCompanyId: !!req.user?.companyId,
      requestId: req.id,
    });

    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Must belong to a company',
        requestId: req.id || 'no-id',
      },
    });
  }

  next();
};

/**
 * optionalAuth - Allows access without authentication
 * Useful for public endpoints
 */
export const optionalAuth = async (req, res, next) => {
  try {
    await requireAuth()(req, res, () => {
      // Continue regardless of auth result
      next();
    });
  } catch (error) {
    // No authentication required, continue
    next();
  }
};

/**
 * attachRequestId - Adds unique request ID for tracing
 */
export const attachRequestId = (req, res, next) => {
  // Generate or use existing request ID
  req.id =
    req.headers['x-request-id'] ||
    `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  // Add request ID to response headers for tracing
  res.setHeader('X-Request-ID', req.id);

  next();
};

export default {
  authenticate,
  requireRole,
  requireCompany,
  optionalAuth,
  attachRequestId,
};
