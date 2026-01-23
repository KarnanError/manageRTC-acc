import mongoose from 'mongoose';

const projectNoteSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Project'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});


projectNoteSchema.index({ projectId: 1 });
projectNoteSchema.index({ createdBy: 1 });
projectNoteSchema.index({ createdAt: -1 });


projectNoteSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const ProjectNote = mongoose.model('ProjectNote', projectNoteSchema);

export default ProjectNote;
