import mongoose from 'mongoose';

const standingSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    category: {
      type: String,
      default: 'Default',
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    played: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    points: {
      type: Number,
      default: 0,
    },
    pointsFor: {
      type: Number,
      default: 0,
    },
    pointsAgainst: {
      type: Number,
      default: 0,
    },
    pointDifference: {
      type: Number,
      default: 0,
    },
    rank: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

standingSchema.index({ tournamentId: 1, groupId: 1 });
standingSchema.index({ tournamentId: 1, groupId: 1, rank: 1 });

const Standing = mongoose.model('Standing', standingSchema);
export default Standing;
