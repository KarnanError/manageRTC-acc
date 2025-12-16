import { getTenantCollections } from "../../config/db.js";
import { ObjectId } from "mongodb";

const parseDate = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
};

const normalizeTicketInput = (input = {}) => {
  const now = new Date();
  
  // Normalize assignedTo - handle both string and object formats
  let assignedTo = input.assignedTo;
  if (typeof assignedTo === "string") {
    assignedTo = { 
      firstName: assignedTo.trim(),
      lastName: "",
      email: "",
      avatar: "assets/img/profiles/avatar-01.jpg",
      role: "IT Support Specialist"
    };
  } else if (!assignedTo || typeof assignedTo !== "object") {
    assignedTo = { 
      firstName: "",
      lastName: "",
      email: "",
      avatar: "assets/img/profiles/avatar-01.jpg",
      role: "IT Support Specialist"
    };
  }

  // Normalize createdBy - ensure it's an object
  let createdBy = input.createdBy;
  if (typeof createdBy === "string") {
    createdBy = { 
      firstName: createdBy.trim(),
      lastName: "",
      email: "",
      avatar: "assets/img/profiles/avatar-01.jpg",
      department: "General"
    };
  } else if (!createdBy || typeof createdBy !== "object") {
    createdBy = { 
      firstName: "System",
      lastName: "User",
      email: "system@company.com",
      avatar: "assets/img/profiles/avatar-01.jpg",
      department: "General"
    };
  }

  return {
    ticketId: input.ticketId || "",
    title: input.title || "",
    subject: input.subject || "",
    description: input.description || "",
    category: input.category || "IT Support",
    priority: input.priority || "Medium",
    status: input.status || "New",
    assignedTo: assignedTo,
    createdBy: createdBy,
    createdAt: parseDate(input.createdAt) || now,
    updatedAt: parseDate(input.updatedAt) || now,
    dueDate: parseDate(input.dueDate),
    closedAt: parseDate(input.closedAt),
    comments: input.comments || [],
    attachments: input.attachments || [],
    tags: input.tags || [],
    estimatedHours: input.estimatedHours || 0,
    actualHours: input.actualHours || 0,
    resolution: input.resolution || "",
    isPrivate: input.isPrivate || false,
    department: input.department || "IT Support",
    location: input.location || "Office",
    urgency: input.urgency || "Medium",
    slaDeadline: parseDate(input.slaDeadline)
  };
};

// Get tickets dashboard statistics
export const getTicketsStats = async (tenantDbName) => {
  try {
    const collections = getTenantCollections(tenantDbName);
    
    // Get ticket counts by status
    const statusStats = await collections.tickets.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get monthly ticket trends (last 12 months)
    const monthlyTrends = await collections.tickets.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]).toArray();

    // Get category counts
    const categoryStats = await collections.tickets.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Get agent workload
    const agentStats = await collections.tickets.aggregate([
      {
        $group: {
          _id: '$assignedTo.firstName',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // Calculate percentage changes (current month vs previous month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTickets = await collections.tickets.countDocuments({
      createdAt: {
        $gte: new Date(currentYear, currentMonth, 1),
        $lt: new Date(currentYear, currentMonth + 1, 1)
      }
    });

    const previousMonthTickets = await collections.tickets.countDocuments({
      createdAt: {
        $gte: new Date(previousYear, previousMonth, 1),
        $lt: new Date(previousYear, previousMonth + 1, 1)
      }
    });

    const percentageChange = previousMonthTickets > 0 
      ? ((currentMonthTickets - previousMonthTickets) / previousMonthTickets * 100).toFixed(2)
      : 0;

    // Format monthly trends to ensure we have 12 months of data
    const monthlyTrendsArray = Array(12).fill(0);
    monthlyTrends.forEach(trend => {
      const monthIndex = trend._id.month - 1;
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyTrendsArray[monthIndex] = trend.count;
      }
    });

    // Format the data
    const stats = {
      newTickets: statusStats.find(s => s._id === 'New')?.count || 0,
      openTickets: statusStats.find(s => s._id === 'Open')?.count || 0,
      solvedTickets: statusStats.find(s => s._id === 'Solved')?.count || 0,
      pendingTickets: statusStats.find(s => s._id === 'On Hold')?.count || 0,
      percentageChange: parseFloat(percentageChange),
      monthlyTrends: monthlyTrendsArray,
      categoryStats: categoryStats,
      agentStats: agentStats
    };

    return { done: true, data: stats };
  } catch (error) {
    console.error('Error getting tickets stats:', error);
    return { done: false, error: error.message };
  }
};

// Get tickets list
export const getTicketsList = async (tenantDbName, options = {}) => {
  try {
    const collections = getTenantCollections(tenantDbName);
    const { 
      status, 
      priority, 
      category, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tickets = await collections.tickets
      .find(filter)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .toArray();

    const total = await collections.tickets.countDocuments(filter);

    return {
      done: true,
      data: tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    };
  } catch (error) {
    console.error('Error getting tickets list:', error);
    return { done: false, error: error.message };
  }
};

// Get single ticket details
export const getTicketDetails = async (tenantDbName, ticketId) => {
  try {
    const collections = getTenantCollections(tenantDbName);

    const ticket = await collections.tickets.findOne({ ticketId });

    if (!ticket) {
      return { done: false, error: 'Ticket not found' };
    }

    return {
      done: true,
      data: ticket
    };
  } catch (error) {
    console.error('Error getting ticket details:', error);
    return { done: false, error: error.message };
  }
};

// Create new ticket
export const createTicket = async (tenantDbName, ticketData) => {
  try {
    console.log('createTicket called with:', { tenantDbName, ticketData });
    
    const collections = getTenantCollections(tenantDbName);
    console.log('Collections retrieved:', collections);
    
    const normalizedData = normalizeTicketInput(ticketData);
    console.log('Normalized data:', normalizedData);

    // Generate ticket ID with proper error handling and race condition prevention
    let ticketId;
    let attempts = 0;
    const maxAttempts = 5;
    
    do {
      attempts++;
      console.log(`🎫 Generating ticket ID (attempt ${attempts})`);
      
      // Find the highest ticket number to avoid race conditions
      const ticketsWithNumbers = await collections.tickets.find({
        ticketId: { $regex: /^TIC-\d{3,}$/ }
      }).toArray();
      
      console.log(`📊 Found ${ticketsWithNumbers.length} tickets with valid IDs`);
      
      let maxNumber = 0;
      ticketsWithNumbers.forEach(ticket => {
        const match = ticket.ticketId.match(/^TIC-(\d+)$/);
        if (match) {
          const number = parseInt(match[1]);
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
          }
        }
      });
      
      const newNumber = maxNumber + 1;
      ticketId = `TIC-${newNumber.toString().padStart(3, '0')}`;
      
      console.log(`🔢 Generated ticket ID: ${ticketId} (from max: ${maxNumber})`);
      
      // Check if this ID already exists (race condition protection)
      const existingTicket = await collections.tickets.findOne({ ticketId });
      if (!existingTicket) {
        break; // ID is unique, we can use it
      }
      
      console.log(`⚠️ Ticket ID ${ticketId} already exists, trying again...`);
      
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      console.error('❌ Failed to generate unique ticket ID after maximum attempts');
      return { done: false, error: 'Failed to generate unique ticket ID' };
    }
    
    normalizedData.ticketId = ticketId;
    console.log('✅ Final ticket ID:', normalizedData.ticketId);

    const insertResult = await collections.tickets.insertOne(normalizedData);
    console.log('Insert result:', insertResult);

    return {
      done: true,
      data: normalizedData,
      message: 'Ticket created successfully'
    };
  } catch (error) {
    console.error('Error creating ticket:', error);
    return { done: false, error: error.message };
  }
};

// Update ticket
export const updateTicket = async (tenantDbName, ticketId, updateData) => {
  try {
    console.log('🔄 UPDATE TICKET SERVICE CALLED:');
    console.log('🏢 Tenant DB:', tenantDbName);
    console.log('🎫 Ticket ID:', ticketId);
    console.log('📝 Update Data:', JSON.stringify(updateData, null, 2));
    
    const collections = getTenantCollections(tenantDbName);
    console.log('📚 Collections retrieved:', collections);
    
    // First, let's check if the ticket exists and get its current state
    const existingTicket = await collections.tickets.findOne({ ticketId });
    console.log('🔍 Existing ticket found:', existingTicket ? {
      ticketId: existingTicket.ticketId,
      title: existingTicket.title,
      priority: existingTicket.priority,
      status: existingTicket.status
    } : 'NOT FOUND');
    
    if (!existingTicket) {
      console.log('❌ Ticket not found with ID:', ticketId);
      return { done: false, error: 'Ticket not found' };
    }
    
    const normalizedData = normalizeTicketInput(updateData);
    normalizedData.updatedAt = new Date();
    console.log('🔄 Normalized data:', JSON.stringify(normalizedData, null, 2));

    const ticket = await collections.tickets.findOneAndUpdate(
      { ticketId },
      { $set: normalizedData },
      { returnDocument: 'after' }
    );
    console.log('📄 Updated ticket:', ticket ? {
      ticketId: ticket.ticketId,
      title: ticket.title,
      priority: ticket.priority,
      status: ticket.status,
      updatedAt: ticket.updatedAt
    } : 'UPDATE FAILED');

    if (!ticket) {
      console.log('❌ Ticket update failed');
      return { done: false, error: 'Ticket update failed' };
    }

    console.log('✅ Ticket updated successfully');
    return {
      done: true,
      data: ticket,
      message: 'Ticket updated successfully'
    };
  } catch (error) {
    console.error('❌ Error updating ticket:', error);
    return { done: false, error: error.message };
  }
};

// Add comment to ticket
export const addComment = async (tenantDbName, ticketId, commentData) => {
  try {
    const collections = getTenantCollections(tenantDbName);
    const { text, author, isInternal = false, attachments = [] } = commentData;

    const comment = {
      text,
      author,
      createdAt: new Date(),
      isInternal,
      attachments
    };

    const ticket = await collections.tickets.findOneAndUpdate(
      { ticketId },
      { 
        $push: { comments: comment },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: 'after' }
    );

    if (!ticket) {
      return { done: false, error: 'Ticket not found' };
    }

    return {
      done: true,
      data: ticket,
      message: 'Comment added successfully'
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { done: false, error: error.message };
  }
};

// Delete ticket
export const deleteTicket = async (tenantDbName, ticketId) => {
  try {
    const collections = getTenantCollections(tenantDbName);

    const result = await collections.tickets.deleteOne({ ticketId });

    if (result.deletedCount === 0) {
      return { done: false, error: 'Ticket not found' };
    }

    return {
      done: true,
      message: 'Ticket deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return { done: false, error: error.message };
  }
};

// Bulk delete tickets
export const bulkDeleteTickets = async (tenantDbName, ticketIds) => {
  try {
    const collections = getTenantCollections(tenantDbName);

    const result = await collections.tickets.deleteMany({
      ticketId: { $in: ticketIds }
    });

    return {
      done: true,
      message: `${result.deletedCount} tickets deleted successfully`
    };
  } catch (error) {
    console.error('Error bulk deleting tickets:', error);
    return { done: false, error: error.message };
  }
};

// Get all ticket categories
export const getTicketCategories = async (tenantDbName) => {
  try {
    const collections = getTenantCollections(tenantDbName);
    
    const categories = await collections.ticketCategories
      .find({ status: "active" })
      .sort({ name: 1 })
      .toArray();

    // Get ticket counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const ticketCount = await collections.tickets.countDocuments({
          category: category.name
        });
        return {
          ...category,
          ticketCount: ticketCount
        };
      })
    );

    return {
      done: true,
      data: categoriesWithCounts,
      message: "Categories fetched successfully"
    };
  } catch (error) {
    console.error('Error fetching ticket categories:', error);
    return { done: false, error: error.message };
  }
};

// Add new ticket category
export const addTicketCategory = async (tenantDbName, categoryData, userId = "System") => {
  try {
    const collections = getTenantCollections(tenantDbName);
    
    // Validate required fields
    if (!categoryData.name || !categoryData.name.trim()) {
      return { done: false, error: "Category name is required" };
    }

    // Check if category already exists
    const existingCategory = await collections.ticketCategories.findOne({
      name: { $regex: `^${categoryData.name.trim()}$`, $options: "i" }
    });

    if (existingCategory) {
      return { done: false, error: "Category already exists" };
    }

    // Create new category
    const newCategory = {
      name: categoryData.name.trim(),
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId
    };

    const result = await collections.ticketCategories.insertOne(newCategory);

    return {
      done: true,
      data: {
        _id: result.insertedId,
        ...newCategory
      },
      message: "Category added successfully"
    };
  } catch (error) {
    console.error('Error adding ticket category:', error);
    return { done: false, error: error.message };
  }
};

// Update ticket category
export const updateTicketCategory = async (tenantDbName, categoryId, updateData) => {
  try {
    const collections = getTenantCollections(tenantDbName);
    
    // Validate category ID
    if (!ObjectId.isValid(categoryId)) {
      return { done: false, error: "Invalid category ID" };
    }

    const updates = {
      updatedAt: new Date()
    };

    if (updateData.name) updates.name = updateData.name.trim();
    if (updateData.status) updates.status = updateData.status;

    const result = await collections.ticketCategories.updateOne(
      { _id: new ObjectId(categoryId) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return { done: false, error: "Category not found" };
    }

    return {
      done: true,
      message: "Category updated successfully"
    };
  } catch (error) {
    console.error('Error updating ticket category:', error);
    return { done: false, error: error.message };
  }
};

// Delete ticket category
export const deleteTicketCategory = async (tenantDbName, categoryId) => {
  try {
    const collections = getTenantCollections(tenantDbName);
    
    // Validate category ID
    if (!ObjectId.isValid(categoryId)) {
      return { done: false, error: "Invalid category ID" };
    }

    // Check if any tickets are using this category
    const ticketsUsingCategory = await collections.tickets.countDocuments({
      category: categoryId
    });

    if (ticketsUsingCategory > 0) {
      return { 
        done: false, 
        error: `Cannot delete category. ${ticketsUsingCategory} ticket(s) are using this category.` 
      };
    }

    const result = await collections.ticketCategories.deleteOne({
      _id: new ObjectId(categoryId)
    });

    if (result.deletedCount === 0) {
      return { done: false, error: "Category not found" };
    }

    return {
      done: true,
      message: "Category deleted successfully"
    };
  } catch (error) {
    console.error('Error deleting ticket category:', error);
    return { done: false, error: error.message };
  }
};

