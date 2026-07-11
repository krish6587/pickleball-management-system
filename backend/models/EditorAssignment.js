import mongoose from 'mongoose';

const editorAssignmentSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  accessType: {
    type: String,
    enum: ['Full Editor', 'Category Editor', 'Tournament Editor'],
    default: 'Tournament Editor',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otpHash: {
    type: String,
  },
  otpExpiresAt: {
    type: Date,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

const EditorAssignment = mongoose.model('EditorAssignment', editorAssignmentSchema);
export default EditorAssignment;
