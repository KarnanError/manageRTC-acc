import { getTenantCollections } from '../../config/db.js';
import { generateId } from '../../utils/generateId.js';

export const createProjectNote = async (companyId, noteData) => {
  try {
    const { projectNotes } = getTenantCollections(companyId);
    const now = new Date();
    const noteId = generateId('project_note');

    const note = {
      _id: noteId,
      ...noteData,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    await projectNotes.insertOne(note);
    return {
      done: true,
      data: note,
      message: 'Project note created successfully'
    };
  } catch (error) {
    console.error('Error creating project note:', error);
    return {
      done: false,
      error: error.message
    };
  }
};

export const getProjectNotes = async (companyId, projectId, filters = {}) => {
  try {
    const { projectNotes } = getTenantCollections(companyId);
    const query = {
      companyId,
      projectId,
      isDeleted: { $ne: true }
    };

    
    if (filters.priority && filters.priority !== 'all') {
      query.priority = filters.priority;
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { content: { $regex: filters.search, $options: 'i' } },
        { tags: { $in: [new RegExp(filters.search, 'i')] } }
      ];
    }

    const sortOptions = {};
    if (filters.sortBy) {
      sortOptions[filters.sortBy] = filters.sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1;
    }

    const notes = await projectNotes
      .find(query)
      .sort(sortOptions)
      .limit(filters.limit || 50)
      .skip(filters.skip || 0)
      .toArray();

    const totalCount = await projectNotes.countDocuments(query);

    return {
      done: true,
      data: notes,
      totalCount,
      message: 'Project notes retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting project notes:', error);
    return {
      done: false,
      error: error.message
    };
  }
};

export const getProjectNoteById = async (companyId, noteId) => {
  try {
    const { projectNotes } = getTenantCollections(companyId);
    const note = await projectNotes.findOne({
      _id: noteId,
      companyId,
      isDeleted: { $ne: true }
    });

    if (!note) {
      return {
        done: false,
        error: 'Project note not found'
      };
    }

    return {
      done: true,
      data: note,
      message: 'Project note retrieved successfully'
    };
  } catch (error) {
    console.error('Error getting project note by ID:', error);
    return {
      done: false,
      error: error.message
    };
  }
};

export const updateProjectNote = async (companyId, noteId, updateData) => {
  try {
    const { projectNotes } = getTenantCollections(companyId);
    const updatedNote = await projectNotes.findOneAndUpdate(
      {
        _id: noteId,
        companyId,
        isDeleted: { $ne: true }
      },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!updatedNote.value) {
      return {
        done: false,
        error: 'Project note not found'
      };
    }

    return {
      done: true,
      data: updatedNote.value,
      message: 'Project note updated successfully'
    };
  } catch (error) {
    console.error('Error updating project note:', error);
    return {
      done: false,
      error: error.message
    };
  }
};

export const deleteProjectNote = async (companyId, noteId) => {
  try {
    const { projectNotes } = getTenantCollections(companyId);
    const deletedNote = await projectNotes.findOneAndUpdate(
      {
        _id: noteId,
        companyId,
        isDeleted: { $ne: true }
      },
      {
        $set: {
          isDeleted: true,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!deletedNote.value) {
      return {
        done: false,
        error: 'Project note not found'
      };
    }

    return {
      done: true,
      data: deletedNote.value,
      message: 'Project note deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting project note:', error);
    return {
      done: false,
      error: error.message
    };
  }
};
