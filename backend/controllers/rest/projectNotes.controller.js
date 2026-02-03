/**
 * Project Notes REST Controller
 * Handles all Project Notes CRUD operations via REST API
 */

import {
  asyncHandler,
  buildNotFoundError,
  buildValidationError,
} from '../../middleware/errorHandler.js';
import {
  extractUser,
  sendCreated,
  sendSuccess,
} from '../../utils/apiResponse.js';
import {
  createProjectNote,
  deleteProjectNote,
  getProjectNotes,
  updateProjectNote,
} from '../../services/project/project.notes.services.js';

/**
 * @desc    Get all notes for a project
 * @route   GET /api/project-notes/:projectId
 * @access  Private (Admin, HR, Superadmin)
 */
export const getNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { priority, search, sortBy, sortOrder, limit, skip } = req.query;
  const user = extractUser(req);

  if (!projectId) {
    throw buildValidationError('projectId', 'Project ID is required');
  }

  const filters = {};
  if (priority) filters.priority = priority;
  if (search) filters.search = search;
  if (sortBy) filters.sortBy = sortBy;
  if (sortOrder) filters.sortOrder = sortOrder;
  if (limit) filters.limit = parseInt(limit);
  if (skip) filters.skip = parseInt(skip);

  const result = await getProjectNotes(user.companyId, projectId, filters);

  if (!result.done) {
    throw buildValidationError('notes', result.error || 'Failed to fetch notes');
  }

  return sendSuccess(res, result.data, 'Project notes retrieved successfully');
});

/**
 * @desc    Create a new project note
 * @route   POST /api/project-notes/:projectId
 * @access  Private (Admin, HR, Superadmin)
 */
export const createNote = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const user = extractUser(req);
  const { title, content, priority, tags } = req.body;

  if (!projectId) {
    throw buildValidationError('projectId', 'Project ID is required');
  }
  if (!title || !title.trim()) {
    throw buildValidationError('title', 'Note title is required');
  }
  if (!content || !content.trim()) {
    throw buildValidationError('content', 'Note content is required');
  }

  const noteData = {
    projectId,
    title: title.trim(),
    content: content.trim(),
    createdBy: user.userId,
  };
  if (priority) noteData.priority = priority;
  if (tags) noteData.tags = tags;

  const result = await createProjectNote(user.companyId, noteData);

  if (!result.done) {
    throw buildValidationError('note', result.error || 'Failed to create note');
  }

  return sendCreated(res, result.data, 'Project note created successfully');
});

/**
 * @desc    Update a project note
 * @route   PUT /api/project-notes/:projectId/:noteId
 * @access  Private (Admin, HR, Superadmin)
 */
export const updateNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const user = extractUser(req);
  const { title, content, priority, tags } = req.body;

  if (!noteId) {
    throw buildValidationError('noteId', 'Note ID is required');
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title.trim();
  if (content !== undefined) updateData.content = content.trim();
  if (priority !== undefined) updateData.priority = priority;
  if (tags !== undefined) updateData.tags = tags;

  const result = await updateProjectNote(user.companyId, noteId, updateData);

  if (!result.done) {
    throw buildNotFoundError('ProjectNote', noteId);
  }

  return sendSuccess(res, result.data, 'Project note updated successfully');
});

/**
 * @desc    Delete a project note (soft delete)
 * @route   DELETE /api/project-notes/:projectId/:noteId
 * @access  Private (Admin, HR, Superadmin)
 */
export const deleteNote = asyncHandler(async (req, res) => {
  const { noteId } = req.params;
  const user = extractUser(req);

  if (!noteId) {
    throw buildValidationError('noteId', 'Note ID is required');
  }

  const result = await deleteProjectNote(user.companyId, noteId);

  if (!result.done) {
    throw buildNotFoundError('ProjectNote', noteId);
  }

  return sendSuccess(res, { _id: noteId, isDeleted: true }, 'Project note deleted successfully');
});

export default {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};
