import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  scoreA: {
    type: Number,
    required: true,
    default: 0,
  },
  scoreB: {
    type: Number,
    required: true,
    default: 0,
  },
});

const pointLogSchema = new mongoose.Schema({
  scoreA: Number,
  scoreB: Number,
  servingTeam: String,  // 'A' or 'B'
  serverNumber: Number, // 1 or 2
  gameIndex: Number,    // Which set/game (0-indexed)
  timestamp: {
    type: Date,
    default: Date.now,
  },
  currentServerName: String,
  currentReceiverName: String,
  serverSide: String, // 'Right' or 'Left'
  receiverSide: String, // 'Right' or 'Left'
});

const matchSchema = new mongoose.Schema(
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
    },
    stage: {
      type: String,
      enum: ['Group', 'Round of 64', 'Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final'],
      default: 'Group',
    },
    matchIndex: {
      type: Number,
      required: true,
      default: 0,
    },
    teamA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    teamB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed', 'Disputed', 'Scheduled', 'Ongoing'],
      default: 'Not Started',
    },
    scheduledTime: {
      type: Date,
    },
    courtNumber: {
      type: String,
      trim: true,
    },
    games: [gameSchema],
    // Live Server Info
    currentGameIndex: {
      type: Number,
      default: 0,
    },
    servingTeam: {
      type: String,
      enum: ['A', 'B'],
      default: 'A',
    },
    serverNumber: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
    currentServerName: String,
    currentReceiverName: String,
    serverSide: String,
    receiverSide: String,
    // Initial assigned players (who started on the Right/Even and Left/Odd courts at score 0-0)
    teamA_EvenPlayer: String,
    teamA_OddPlayer: String,
    teamB_EvenPlayer: String,
    teamB_OddPlayer: String,
    pointHistory: [pointLogSchema],
    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

matchSchema.index({ tournamentId: 1, category: 1, stage: 1 });
matchSchema.index({ tournamentId: 1, groupId: 1, stage: 1 });
matchSchema.index({ status: 1 });

const Match = mongoose.model('Match', matchSchema);
export default Match;
