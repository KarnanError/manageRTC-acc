/**
 * Holiday Schema
 * Manages company holidays for leave calculation
 */

import mongoose from 'mongoose';

const holidaySchema = new mongoose.Schema({
  holidayId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  companyId: {
    type: String,
    required: true,
    index: true
  },
  holidayTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HolidayType',
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['public', 'company', 'optional'],
    default: 'public'
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDay: {
    type: Number,
    min: 1,
    max: 31
  },
  recurringMonth: {
    type: Number,
    min: 1,
    max: 12
  },
  applicableStates: [String],
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
holidaySchema.index({ companyId: 1, date: 1, isDeleted: 1 });
holidaySchema.index({ companyId: 1, isActive: 1, isDeleted: 1 });

/**
 * Get holidays in date range for a company
 */
holidaySchema.statics.getHolidaysInRange = function(companyId, startDate, endDate) {
  return this.find({
    companyId,
    date: { $gte: startDate, $lte: endDate },
    isActive: true,
    isDeleted: false
  }).sort({ date: 1 });
};

/**
 * Get holidays by year
 */
holidaySchema.statics.getHolidaysByYear = function(companyId, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  return this.find({
    companyId,
    date: { $gte: startDate, $lte: endDate },
    isActive: true,
    isDeleted: false
  }).sort({ date: 1 });
};

/**
 * Get holidays by month
 */
holidaySchema.statics.getHolidaysByMonth = function(companyId, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  return this.find({
    companyId,
    date: { $gte: startDate, $lte: endDate },
    isActive: true,
    isDeleted: false
  }).sort({ date: 1 });
};

/**
 * Check if a specific date is a holiday
 */
holidaySchema.statics.isHoliday = async function(companyId, date, state = null) {
  const query = {
    companyId,
    date: {
      $gte: new Date(date).setHours(0, 0, 0, 0),
      $lte: new Date(date).setHours(23, 59, 59, 999)
    },
    isActive: true,
    isDeleted: false
  };

  // If state is provided, check for state-specific holidays or public holidays
  if (state) {
    query.$or = [
      { type: 'public' },
      { applicableStates: { $in: [state, null] } },
      { applicableStates: { $exists: false } }
    ];
  }

  const holiday = await this.findOne(query);
  return holiday ? { isHoliday: true, name: holiday.name, type: holiday.type } : { isHoliday: false };
};

/**
 * Get upcoming holidays
 */
holidaySchema.statics.getUpcomingHolidays = function(companyId, days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);

  return this.find({
    companyId,
    date: { $gte: today, $lte: futureDate },
    isActive: true,
    isDeleted: false
  }).sort({ date: 1 });
};

export default mongoose.model('Holiday', holidaySchema);
