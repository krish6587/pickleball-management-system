import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'Default',
    },
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
      },
    ],
  },
  {
    timestamps: true,
  }
);

groupSchema.index({ tournamentId: 1 });
groupSchema.index({ tournamentId: 1, category: 1 });

const Group = mongoose.model('Group', groupSchema);
export default Group;
