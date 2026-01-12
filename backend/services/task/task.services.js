import Task from '../../models/task/task.schema.js';
import { generateId } from '../../utils/generateId.js';
import { getTenantCollections } from '../../config/db.js';
import { ObjectId } from 'mongodb';

export const createTask = async (companyId, taskData) => {
  try {
    const collections = getTenantCollections(companyId);

    const now = new Date();
    const normalizedAssignees = Array.isArray(taskData.assignee)
      ? taskData.assignee.filter(Boolean)
      : [];

    const normalizedAttachments = Array.isArray(taskData.attachments)
      ? taskData.attachments.map(att => ({
          filename: att?.filename || '',
          url: att?.url || '',
          uploadedAt: att?.uploadedAt ? new Date(att.uploadedAt) : now,
        }))
      : [];

    const doc = {
      _id: new ObjectId(),
      title: taskData.title,
      description: taskData.description || '',
      projectId: taskData.projectId,
      companyId,
      status: taskData.status || 'Pending',
      priority: taskData.priority || 'Medium',
      assignee: normalizedAssignees,
      tags: Array.isArray(taskData.tags) ? taskData.tags : [],
      estimatedHours: taskData.estimatedHours || 0,
      actualHours: taskData.actualHours || 0,
      attachments: normalizedAttachments,
      createdBy: taskData.createdBy || 'unknown',
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    // Only add date fields if they have values (MongoDB doesn't accept undefined)
    if (taskData.startDate) {
      doc.startDate = new Date(taskData.startDate);
    }
    if (taskData.dueDate) {
      doc.dueDate = new Date(taskData.dueDate);
    }

    const insertResult = await collections.tasks.insertOne(doc);

    return {
      done: true,
      data: { ...doc, _id: insertResult.insertedId },
      message: 'Task created successfully'
    };
  } catch (error) {
    console.error('Error creating task:', error);
    return {
      done: false,
      error: error.message
    };
  }
};

export const getTaskById = async (companyId, taskId) => {
  try {
    const collections = getTenantCollections(companyId);

    const task = await collections.tasks.findOne({
      _id: new ObjectId(taskId),
      isDeleted: { $ne: true }
    });

    if (!task) {
      return {
        done: false,
        error: 'Task not found'
      };
    }

    return {
      done: true,
      data: task,
      message: 'Task retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting task by ID:', error);

    
    if (error.message && error.message.includes('buffering timed out')) {
      console.log('Tasks collection does not exist yet');
      return {
        done: false,
        error: 'Task not found'
      };
    }

    return {
      done: false,
      error: error.message
    };
  }
};



export const updateTask = async (companyId, taskId, updateData) => {
  try {
    const collections = getTenantCollections(companyId);

    const updatedTask = await collections.tasks.findOneAndUpdate(
      {
        _id: new ObjectId(taskId),
        isDeleted: { $ne: true }
      },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedTask) {
      return {
        done: false,
        error: 'Task not found'
      };
    }

    return {
      done: true,
      data: updatedTask,
      message: 'Task updated successfully'
    };
  } catch (error) {
    console.error('Error updating task:', error);

    
    if (error.message && error.message.includes('buffering timed out')) {
      console.log('Tasks collection does not exist yet');
      return {
        done: false,
        error: 'Task not found'
      };
    }

    return {
      done: false,
      error: error.message
    };
  }
};



export const deleteTask = async (companyId, taskId) => {
  try {
    const collections = getTenantCollections(companyId);

    const deletedTask = await collections.tasks.findOneAndUpdate(
      {
        _id: new ObjectId(taskId),
        isDeleted: { $ne: true }
      },
      {
        $set: {
          isDeleted: true,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!deletedTask) {
      return {
        done: false,
        error: 'Task not found'
      };
    }

    return {
      done: true,
      data: deletedTask,
      message: 'Task deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting task:', error);

    
    if (error.message && error.message.includes('buffering timed out')) {
      console.log('Tasks collection does not exist yet');
      return {
        done: false,
        error: 'Task not found'
      };
    }

    return {
      done: false,
      error: error.message
    };
  }
};



export const getTasksByProject = async (companyId, projectId, filters = {}) => {
  try {
    const collections = getTenantCollections(companyId);

    const query = {
      projectId: projectId,
    };


    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.priority && filters.priority !== 'all') {
      query.priority = filters.priority;
    }

    if (filters.assignee) {
      query.assignee = { $in: [filters.assignee] };
    }

    const tasks = await collections.tasks.find(query).sort({ createdAt: -1 }).toArray();

    return {
      done: true,
      data: tasks,
      message: 'Project tasks retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting project tasks:', error);

    
    if (error.message && error.message.includes('buffering timed out')) {
      console.log('Tasks collection does not exist yet, returning empty results');
      return {
        done: true,
        data: [],
        message: 'Project tasks retrieved successfully (collection not created yet)'
      };
    }

    return {
      done: false,
      error: error.message
    };
  }
};

export const getTasksForKanban = async (companyId, projectId = null, filters = {}) => {
  try {
    const collections = getTenantCollections(companyId);

    const matchQuery = {
      isDeleted: { $ne: true }
    };

    if (projectId) {
      matchQuery.projectId = projectId;
    }

    
    if (filters.priority && filters.priority !== "all") {
      matchQuery.priority = filters.priority;
    }

    if (filters.status && filters.status !== "all") {
      matchQuery.status = filters.status;
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      matchQuery.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { tags: { $elemMatch: { $regex: searchRegex } } },
        { assignee: { $elemMatch: { $regex: searchRegex } } },
        { _id: { $regex: searchRegex } }
      ];
    }

    
    if (filters.createdDate) {
      const createdDate = new Date(filters.createdDate);
      const nextDay = new Date(createdDate);
      nextDay.setDate(nextDay.getDate() + 1);

      matchQuery.createdAt = {
        $gte: createdDate,
        $lt: nextDay
      };
    }

    if (filters.dueDate) {
      const dueDate = new Date(filters.dueDate);
      const nextDay = new Date(dueDate);
      nextDay.setDate(nextDay.getDate() + 1);

      matchQuery.dueDate = {
        $gte: dueDate,
        $lt: nextDay
      };
    }

    const tasks = await collections.tasks
      .find(matchQuery)
      .sort({ createdAt: -1 })
      .toArray();

    
    const groupedTasks = {
      todo: tasks.filter(task => task.status === "Pending" || task.status === "pending"),
      inprogress: tasks.filter(task => task.status === "Inprogress" || task.status === "inprogress" || task.status === "In Progress"),
      completed: tasks.filter(task => task.status === "Completed" || task.status === "completed"),
      onhold: tasks.filter(task => task.status === "Onhold" || task.status === "onhold" || task.status === "On Hold")
    };

    return {
      done: true,
      data: groupedTasks,
      message: "Tasks retrieved successfully for kanban board"
    };
  } catch (error) {
    console.error("Error getting tasks for kanban:", error);
    return {
      done: false,
      error: error.message
    };
  }
};


export const updateTaskStatus = async (companyId, taskId, newStatus) => {
  try {
    const collections = getTenantCollections(companyId);

    const result = await collections.tasks.findOneAndUpdate(
      {
        _id: new ObjectId(taskId),
        isDeleted: { $ne: true }
      },
      {
        $set: {
          status: newStatus,
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    if (!result) {
      return {
        done: false,
        error: "Task not found"
      };
    }

    return {
      done: true,
      data: result,
      message: "Task status updated successfully"
    };
  } catch (error) {
    console.error("Error updating task status:", error);
    return {
      done: false,
      error: error.message
    };
  }
};

export const getTaskStatuses = async (companyId) => {
  try {
    const collections = getTenantCollections(companyId);

    const statuses = await collections.taskstatus
      .find({ active: true })
      .sort({ order: 1 })
      .toArray();

    return {
      done: true,
      data: statuses,
      message: 'Task statuses retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting task statuses:', error);
    
    if (error.message && error.message.includes('buffering timed out')) {
      console.log('Task statuses collection does not exist yet, returning empty results');
      return {
        done: true,
        data: [],
        message: 'Task statuses collection not created yet'
      };
    }

    return {
      done: false,
      error: error.message
    };
  }
};

export const createTaskStatus = async (companyId, payload) => {
  try {
    const collections = getTenantCollections(companyId);

    const name = (payload?.name || "").trim();
    const colorName = (payload?.colorName || "purple").trim().toLowerCase();
    const colorHex = payload?.colorHex || "";
    if (!name) {
      return { done: false, error: "Status name is required" };
    }

    const key = (payload?.key || name)
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

    // Determine next order
    const last = await collections.taskstatus
      .find({})
      .sort({ order: -1 })
      .limit(1)
      .toArray();
    const nextOrder = last.length ? (last[0].order || 0) + 1 : 1;

    const doc = {
      key,
      name,
      colorName,
      colorHex,
      order: payload?.order || nextOrder,
      active: payload?.active !== false,
      createdAt: new Date(),
    };

    await collections.taskstatus.insertOne(doc);

    return { done: true, data: doc, message: "Task status created" };
  } catch (error) {
    console.error("Error creating task status:", error);
    return { done: false, error: error.message };
  }
};

