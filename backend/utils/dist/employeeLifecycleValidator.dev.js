"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.validateEmployeeLifecycle = void 0;

var _db = require("../config/db.js");

var _mongodb = require("mongodb");

/**
 * Check if an employee exists in any active lifecycle process
 * Prevents duplicate entries across Promotion, Resignation, and Termination
 * 
 * @param {string} companyId - Company/tenant ID
 * @param {string|ObjectId} employeeId - Employee ID to check
 * @param {string} excludeProcess - Process to exclude from check ('promotion', 'resignation', 'termination')
 * @param {string} excludeRecordId - Specific record ID to exclude (for edit operations)
 * @returns {Promise<{isValid: boolean, conflictType?: string, message?: string}>}
 */
var validateEmployeeLifecycle = function validateEmployeeLifecycle(companyId, employeeId) {
  var excludeProcess,
      excludeRecordId,
      collections,
      employeeObjectId,
      employee,
      promotionQuery,
      existingPromotion,
      resignationQuery,
      existingResignation,
      terminationQuery,
      existingTermination,
      _args = arguments;
  return regeneratorRuntime.async(function validateEmployeeLifecycle$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          excludeProcess = _args.length > 2 && _args[2] !== undefined ? _args[2] : null;
          excludeRecordId = _args.length > 3 && _args[3] !== undefined ? _args[3] : null;
          _context.prev = 2;
          collections = (0, _db.getTenantCollections)(companyId); // Validate employeeId format

          if (!(!employeeId || !_mongodb.ObjectId.isValid(employeeId))) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", {
            isValid: false,
            message: "Invalid employee ID format"
          });

        case 6:
          employeeObjectId = new _mongodb.ObjectId(employeeId); // Check if employee exists

          _context.next = 9;
          return regeneratorRuntime.awrap(collections.employees.findOne({
            _id: employeeObjectId,
            isDeleted: {
              $ne: true
            }
          }));

        case 9:
          employee = _context.sent;

          if (employee) {
            _context.next = 12;
            break;
          }

          return _context.abrupt("return", {
            isValid: false,
            message: "Employee not found"
          });

        case 12:
          if (!(excludeProcess !== 'promotion')) {
            _context.next = 20;
            break;
          }

          promotionQuery = {
            employeeId: employeeId.toString(),
            status: {
              $in: ["pending", "applied"]
            },
            isDeleted: {
              $ne: true
            }
          }; // Exclude specific record if provided

          if (excludeRecordId && excludeProcess === 'promotion') {
            promotionQuery._id = {
              $ne: new _mongodb.ObjectId(excludeRecordId)
            };
          }

          _context.next = 17;
          return regeneratorRuntime.awrap(collections.promotions.findOne(promotionQuery));

        case 17:
          existingPromotion = _context.sent;

          if (!existingPromotion) {
            _context.next = 20;
            break;
          }

          return _context.abrupt("return", {
            isValid: false,
            conflictType: "promotion",
            message: "This employee already has an active promotion."
          });

        case 20:
          if (!(excludeProcess !== 'resignation')) {
            _context.next = 28;
            break;
          }

          resignationQuery = {
            employeeId: employeeId.toString(),
            resignationStatus: {
              $in: ["pending", "approved"]
            }
          }; // Exclude specific record if provided

          if (excludeRecordId && excludeProcess === 'resignation') {
            resignationQuery.resignationId = {
              $ne: excludeRecordId
            };
          }

          _context.next = 25;
          return regeneratorRuntime.awrap(collections.resignation.findOne(resignationQuery));

        case 25:
          existingResignation = _context.sent;

          if (!existingResignation) {
            _context.next = 28;
            break;
          }

          return _context.abrupt("return", {
            isValid: false,
            conflictType: "resignation",
            message: "This employee is already in resignation process."
          });

        case 28:
          if (!(excludeProcess !== 'termination')) {
            _context.next = 36;
            break;
          }

          terminationQuery = {
            employeeId: employeeObjectId,
            status: {
              $in: ["pending", "processed"]
            }
          }; // Exclude specific record if provided

          if (excludeRecordId && excludeProcess === 'termination') {
            terminationQuery.terminationId = {
              $ne: excludeRecordId
            };
          }

          _context.next = 33;
          return regeneratorRuntime.awrap(collections.termination.findOne(terminationQuery));

        case 33:
          existingTermination = _context.sent;

          if (!existingTermination) {
            _context.next = 36;
            break;
          }

          return _context.abrupt("return", {
            isValid: false,
            conflictType: "termination",
            message: "This employee is already in termination process."
          });

        case 36:
          return _context.abrupt("return", {
            isValid: true
          });

        case 39:
          _context.prev = 39;
          _context.t0 = _context["catch"](2);
          console.error("[EmployeeLifecycleValidator] Error:", _context.t0);
          return _context.abrupt("return", {
            isValid: false,
            message: _context.t0.message || "Validation error"
          });

        case 43:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[2, 39]]);
};

exports.validateEmployeeLifecycle = validateEmployeeLifecycle;