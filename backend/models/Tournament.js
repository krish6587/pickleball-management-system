import mongoose from 'mongoose';

const editorAssignmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accessType: {
    type: String,
    enum: ['Full Editor', 'Category Editor', 'Tournament Editor'],
    default: 'Tournament Editor',
  },
  assignedCategory: {
    type: String,
  },
  expiryDate: {
    type: Date,
  },
});

const tournamentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: 'Main Court',
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    contactPerson: {
      type: String,
    },
    adminPhone: {
      type: String,
    },
    adminEmail: {
      type: String,
    },
    ruleset: {
      type: String,
      default: 'Pickleball Standard',
    },
    status: {
      type: String,
      enum: ['Setup', 'Group Stage', 'Knockout Stage', 'Completed'],
      default: 'Setup',
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Category Configuration
    categories: {
      type: [String],
      default: ["Men's Singles", "Men's Doubles", "Women's Singles", "Women's Doubles", "Mixed Doubles"],
    },
    categorySettings: [
      {
        category: String,
        numGroups: Number,
        teamsPerGroup: Number,
        topQualifiersPerGroup: Number,
      }
    ],
    // Rules & Scoring Settings
    winningPoints: {
      type: Number,
      default: 11,
    },
    minimumLead: {
      type: Number,
      default: 2,
    },
    numberOfSets: {
      type: Number,
      default: 3,
    },
    rallyScoring: {
      type: Boolean,
      default: false,
    },
    tieBreakerRules: {
      type: String,
      default: 'Head-to-head',
    },
    // Number of Groups & Progression Settings
    numGroups: {
      type: Number,
      required: true,
      default: 1,
    },
    teamsPerGroup: {
      type: Number,
      required: true,
      default: 4,
    },
    topQualifiersPerGroup: {
      type: Number,
      required: true,
      default: 2,
    },
    // Editors assigned to this tournament
    editors: [editorAssignmentSchema],
    // Per-category status tracking
    categoryStatus: [
      {
        category: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ['Setup', 'Group Stage', 'Knockout Stage', 'Completed'],
          default: 'Setup',
        },
      }
    ],
  },
  {
    timestamps: true,
  }
);

const Tournament = mongoose.model('Tournament', tournamentSchema);
export default Tournament;
