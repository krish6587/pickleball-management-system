import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: 'Default',
    },
    players: {
      type: [String],
    },
    playerName: {
      type: String,
      trim: true,
    },
    teamName: {
      type: String,
      trim: true,
    },
    player1: {
      type: String,
      trim: true,
    },
    player2: {
      type: String,
      trim: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
    },
  },
  {
    timestamps: true,
  }
);

teamSchema.index({ tournamentId: 1 });
teamSchema.index({ tournamentId: 1, category: 1 });

const Team = mongoose.model('Team', teamSchema);
export default Team;
