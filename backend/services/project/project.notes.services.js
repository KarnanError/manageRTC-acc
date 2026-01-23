import { getTenantCollections } from '../../config/db.js';
import { ObjectId } from 'mongodb';

export const createProjectNote = async (companyId, noteData) => {
  try {
    const { projectNotes } = getTenantCollections(companyId);
    const now = new Date();

    // Validate projectId is a valid ObjectId
    if (!ObjectId.isValid(noteData.projectId)) {
      throw new Error('Invalid projectId format');
    }

    const note = {
      projectId: new ObjectId(noteData.projectId),
      title: noteData.title,
      content: noteData.content,
      createdBy: noteData.createdBy,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    // Add optional fields if provided
    if (noteData.priority) {
      note.priority = noteData.priority;
    }
    if (noteData.tags && Array.isArray(noteData.tags)) {
      note.tags = noteData.tags;
    }

    const result = await projectNotes.insertOne(note);
    console.log('[createProjectNote] Note created successfully:', { 
      insertedId: result.insertedId, 
      acknowledged: result.acknowledged 
    });
    
    return {
      done: true,
      data: { ...note, _id: result.insertedId },
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
    
    // Validate projectId is a valid ObjectId
    if (!ObjectId.isValid(projectId)) {
      throw new Error('Invalid projectId format');
    }
    
    const query = {
      projectId: new ObjectId(projectId),
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
    
    // Validate noteId is a valid ObjectId
    if (!ObjectId.isValid(noteId)) {
      return {
        done: false,
        error: 'Invalid noteId format'
      };
    }
    
    const note = await projectNotes.findOne({
      _id: new ObjectId(noteId),
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
    
    // Validate noteId is a valid ObjectId
    if (!ObjectId.isValid(noteId)) {
      return {
        done: false,
        error: 'Invalid noteId format'
      };
    }
    
    const updatedNote = await projectNotes.findOneAndUpdate(
      {
        _id: new ObjectId(noteId),
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

    // Some Mongo driver versions may return undefined value even when matched; fetch explicitly if needed
    const updatedDoc = updatedNote?.value
      || await projectNotes.findOne({ _id: new ObjectId(noteId), isDeleted: { $ne: true } });

    if (!updatedDoc) {
      console.error('[updateProjectNote] Note not found:', { noteId, updatedNote });
      return {
        done: false,
        error: 'Project note not found'
      };
    }

    console.log('[updateProjectNote] Note updated successfully:', { noteId, title: updatedDoc.title });
    return {
      done: true,
      data: updatedDoc,
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
    
    // Validate noteId is a valid ObjectId
    if (!ObjectId.isValid(noteId)) {
      return {
        done: false,
        error: 'Invalid noteId format'
      };
    }
    
    const deletedNote = await projectNotes.findOneAndUpdate(
      {
        _id: new ObjectId(noteId),
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

    // Some Mongo driver versions may return undefined value even when matched; fetch explicitly if needed
    const deletedDoc = deletedNote?.value
      || await projectNotes.findOne({ _id: new ObjectId(noteId) });

    if (!deletedDoc) {
      console.error('[deleteProjectNote] Note not found:', { noteId, deletedNote });
      return {
        done: false,
        error: 'Project note not found'
      };
    }

    console.log('[deleteProjectNote] Note deleted successfully:', { noteId });
    return {
      done: true,
      data: deletedDoc,
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
