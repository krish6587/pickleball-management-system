import mongoose from 'mongoose';
import Tournament from '../models/Tournament.js';
import Group from '../models/Group.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import Standing from '../models/Standing.js';
import User from '../models/User.js';
import EditorAssignment from '../models/EditorAssignment.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Helper function to generate 6 digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createTournament = async (req, res) => {
  const {
    name,
    location,
    startDate,
    endDate,
    contactPerson,
    adminPhone,
    adminEmail,
    ruleset,
    categories,
    categorySettings,
    winningPoints,
    minimumLead,
    numberOfSets,
    rallyScoring,
    tieBreakerRules,
    numGroups, // Fallbacks
    teamsPerGroup,
    topQualifiersPerGroup,
  } = req.body;

  try {
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Tournament name is required.' });
    }

    if (adminEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(adminEmail)) {
        return res.status(400).json({ message: 'Please provide a valid admin email address.' });
      }
    }

    const resolvedCategories = categories || ["Men's Singles", "Men's Doubles", "Women's Singles", "Women's Doubles", "Mixed Doubles"];
    const categoryStatus = resolvedCategories.map(cat => ({ category: cat, status: 'Setup' }));

    const tournament = await Tournament.create({
      name,
      location: location || 'Main Court',
      startDate,
      endDate,
      contactPerson,
      adminPhone,
      adminEmail,
      ruleset: ruleset || 'Pickleball Standard',
      categories: resolvedCategories,
      categorySettings: categorySettings || [],
      winningPoints: Number(winningPoints) || 11,
      minimumLead: Number(minimumLead) || 2,
      numberOfSets: Number(numberOfSets) || 3,
      rallyScoring: !!rallyScoring,
      tieBreakerRules: tieBreakerRules || 'Head-to-head',
      creator: req.user._id,
      numGroups: Number(numGroups) || 1,
      teamsPerGroup: Number(teamsPerGroup) || 4,
      topQualifiersPerGroup: Number(topQualifiersPerGroup) || 2,
      status: 'Setup',
      categoryStatus,
    });

    res.status(201).json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTournaments = async (req, res) => {
  try {
    let filter = {};
    if (req.user && req.user.role === 'Admin') {
      // Admins only see their own created tournaments or those assigned to them as an editor
      filter = {
        $or: [
          { creator: req.user._id },
          { 'editors.user': req.user._id }
        ]
      };
    }
    const tournaments = await Tournament.find(filter).populate('creator', 'username email');
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('creator', 'username email')
      .populate('editors.user', 'username email mobileNumber role');
      
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Access Control: If user is an Admin, they can only view their own or assigned tournaments
    if (req.user && req.user.role === 'Admin') {
      const isCreator = tournament.creator._id.toString() === req.user._id.toString();
      const isEditor = tournament.editors.some(e => e.user._id.toString() === req.user._id.toString());
      if (!isCreator && !isEditor) {
        return res.status(403).json({ message: 'Access Denied' });
      }
    }

    const groups = await Group.find({ tournamentId: tournament._id }).populate('teams');
    const teams = await Team.find({ tournamentId: tournament._id });
    const matches = await Match.find({ tournamentId: tournament._id })
      .populate('teamA')
      .populate('teamB')
      .populate('winner')
      .sort({ stage: 1, matchIndex: 1 });
    const standings = await Standing.find({ tournamentId: tournament._id })
      .populate('teamId')
      .sort({ groupId: 1, rank: 1 });

    res.json({
      tournament,
      groups,
      teams,
      matches,
      standings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



export const setupTeamsAndGroups = async (req, res) => {
  const { groupsData, categoryGroupsData } = req.body;
  const tournamentId = req.params.id;

  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Authorize admin/creator or assigned Full/Tournament Editor
    const isCreator = tournament.creator.toString() === req.user._id.toString();
    const isEditor = tournament.editors.some(
      (e) => e.user.toString() === req.user._id.toString() && (e.accessType === 'Full Editor' || e.accessType === 'Tournament Editor')
    );

    if (!isCreator && !isEditor) {
      return res.status(403).json({ message: 'Access Denied: Not authorized to manage this tournament setup' });
    }

    if (tournament.status !== 'Setup') {
      return res.status(400).json({ message: 'Tournament has already started and cannot be reset.' });
    }

    const categoriesToProcess = categoryGroupsData || [ { category: 'Default', groups: groupsData || [] } ];

    for (const catData of categoriesToProcess) {
      const catConfig = tournament.categorySettings.find(c => c.category === catData.category);
      const numGroups = catConfig ? catConfig.numGroups : tournament.numGroups;
      const topQualifiers = catConfig ? catConfig.topQualifiersPerGroup : tournament.topQualifiersPerGroup;
      const totalQualifiers = numGroups * topQualifiers;
      
      if (![2, 4, 8, 16, 32, 64].includes(totalQualifiers)) {
        return res.status(400).json({ message: `Total qualifiers for category ${catData.category} must be a power of 2 (2, 4, 8, 16, 32, 64). Please adjust settings.` });
      }
    }

    // Atomic status transition to lock concurrent setups
    const lockedTournament = await Tournament.findOneAndUpdate(
      { _id: tournamentId, status: 'Setup' },
      { $set: { status: 'Setting Up' } },
      { new: true }
    );

    if (!lockedTournament) {
      return res.status(400).json({ message: 'Setup is already in progress or has completed.' });
    }

    // Setup transaction session with replica set fallback
    const session = await mongoose.startSession();
    let transactionActive = false;
    try {
      await session.startTransaction();
      transactionActive = true;
    } catch (sessionErr) {
      transactionActive = false;
    }

    const opts = transactionActive ? { session } : {};

    try {
      // Clean up any existing groups, teams, matches, standings for this tournament to avoid duplicates on re-submission
      await Group.deleteMany({ tournamentId }, opts);
      await Team.deleteMany({ tournamentId }, opts);
      await Match.deleteMany({ tournamentId }, opts);
      await Standing.deleteMany({ tournamentId }, opts);

      const groupsToInsert = [];
      const teamsToInsert = [];
      const standingsToInsert = [];
      const matchesToInsert = [];
      const categoryStatusUpdates = [];

      for (const catData of categoriesToProcess) {
        categoryStatusUpdates.push({
          category: catData.category,
          status: 'Group Stage'
        });

        for (let i = 0; i < catData.groups.length; i++) {
          const gData = catData.groups[i];
          const groupId = new mongoose.Types.ObjectId();
          const teamIds = [];

          for (let tData of gData.teams) {
            const teamId = new mongoose.Types.ObjectId();
            teamIds.push(teamId);

            const isSingles = catData.category.toLowerCase().includes('singles');
            const teamPayload = {
              _id: teamId,
              tournamentId,
              groupId,
              category: catData.category,
              name: tData.name,
              players: tData.players,
            };

            if (isSingles) {
              teamPayload.playerName = tData.name;
            } else {
              teamPayload.teamName = tData.name;
              teamPayload.player1 = tData.players[0] || '';
              teamPayload.player2 = tData.players[1] || '';
            }

            teamsToInsert.push(teamPayload);

            // Initialize Standing entry
            standingsToInsert.push({
              tournamentId,
              groupId,
              teamId,
              category: catData.category,
            });
          }

          // Group document
          groupsToInsert.push({
            _id: groupId,
            tournamentId,
            name: gData.groupName,
            category: catData.category,
            teams: teamIds,
          });

          // Generate round robin fixtures for this group
          let matchIndex = 0;
          for (let j = 0; j < teamIds.length; j++) {
            for (let k = j + 1; k < teamIds.length; k++) {
              matchesToInsert.push({
                tournamentId,
                groupId,
                stage: 'Group',
                matchIndex: matchIndex++,
                teamA: teamIds[j],
                teamB: teamIds[k],
                status: 'Scheduled',
                category: catData.category,
                games: [
                  { scoreA: 0, scoreB: 0 },
                  { scoreA: 0, scoreB: 0 },
                  { scoreA: 0, scoreB: 0 },
                ],
              });
            }
          }
        }
      }

      // Bulk write database insertions
      if (groupsToInsert.length > 0) await Group.insertMany(groupsToInsert, opts);
      if (teamsToInsert.length > 0) await Team.insertMany(teamsToInsert, opts);
      if (standingsToInsert.length > 0) await Standing.insertMany(standingsToInsert, opts);
      if (matchesToInsert.length > 0) await Match.insertMany(matchesToInsert, opts);

      // Merge category statuses
      const updatedCategoryStatus = lockedTournament.categoryStatus.map(cs => {
        const match = categoryStatusUpdates.find(u => u.category === cs.category);
        return match ? { category: cs.category, status: match.status } : cs;
      });

      categoryStatusUpdates.forEach(u => {
        const exists = updatedCategoryStatus.some(cs => cs.category === u.category);
        if (!exists) {
          updatedCategoryStatus.push(u);
        }
      });

      // Update parent tournament status
      await Tournament.updateOne(
        { _id: tournamentId },
        { 
          $set: { 
            status: 'Group Stage',
            categoryStatus: updatedCategoryStatus
          } 
        },
        opts
      );

      if (transactionActive) {
        await session.commitTransaction();
      }
      session.endSession();

      res.json({ message: 'Teams, groups, and fixtures set up successfully!' });
    } catch (innerError) {
      if (transactionActive) {
        try {
          await session.abortTransaction();
        } catch (abortErr) {}
      }
      session.endSession();
      throw innerError;
    }
  } catch (error) {
    // Reset status back to Setup if error occurred during setup
    await Tournament.updateOne({ _id: tournamentId, status: 'Setting Up' }, { $set: { status: 'Setup' } });
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign editor to a tournament (Sends OTP)
// @route   POST /api/tournaments/:id/assign-editor
// @access  Private/Admin
export const assignEditor = async (req, res) => {
  try {
    const { email, accessType } = req.body;
    const tournamentId = req.params.id;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email address' });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Only the creator or a Full Editor can assign other editors
    const isCreator = tournament.creator.toString() === req.user._id.toString();
    const isFullEditor = tournament.editors.some(
      (e) => e.user.toString() === req.user._id.toString() && e.accessType === 'Full Editor'
    );

    if (!isCreator && !isFullEditor) {
      return res.status(403).json({ message: 'Access Denied: You do not have permission to assign editors' });
    }

    // Check if already an editor
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const isAlreadyEditor = tournament.editors.some(e => e.user.toString() === user._id.toString());
      if (isAlreadyEditor) {
        return res.status(400).json({ message: 'This user is already an editor for this tournament' });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Hash OTP for storage
    const salt = await bcrypt.genSalt(10);
    const otpHash = await bcrypt.hash(otp, salt);

    // Expire in 10 minutes
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save or update EditorAssignment
    let assignment = await EditorAssignment.findOne({ tournamentId, email: email.toLowerCase() });
    if (assignment) {
      assignment.otpHash = otpHash;
      assignment.otpExpiresAt = otpExpiresAt;
      assignment.accessType = accessType || 'Tournament Editor';
      assignment.assignedBy = req.user._id;
      assignment.isVerified = false;
      await assignment.save();
    } else {
      assignment = await EditorAssignment.create({
        tournamentId,
        email: email.toLowerCase(),
        accessType: accessType || 'Tournament Editor',
        otpHash,
        otpExpiresAt,
        assignedBy: req.user._id
      });
    }

    // Send email
    const message = `You have been invited to be an editor for the tournament "${tournament.name}".\n\nYour OTP is: ${otp}\n\nThis OTP will expire in 10 minutes.`;
    
    try {
      await sendEmail({
        email: email.toLowerCase(),
        subject: 'Tournament Editor Invitation - OTP',
        message
      });
      res.status(200).json({ message: 'OTP sent successfully to ' + email, assignmentId: assignment._id });
    } catch (error) {
      console.error(error);
      assignment.otpHash = undefined;
      assignment.otpExpiresAt = undefined;
      await assignment.save();
      res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP and grant editor access
// @route   POST /api/tournaments/:id/verify-editor
// @access  Private/Admin
export const verifyEditor = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const tournamentId = req.params.id;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Please provide email and OTP' });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Only the creator or a Full Editor can verify editors
    const isCreator = tournament.creator.toString() === req.user._id.toString();
    const isFullEditor = tournament.editors.some(
      (e) => e.user.toString() === req.user._id.toString() && e.accessType === 'Full Editor'
    );

    if (!isCreator && !isFullEditor) {
      return res.status(403).json({ message: 'Access Denied: You do not have permission to verify editors' });
    }

    const assignment = await EditorAssignment.findOne({ 
      tournamentId, 
      email: email.toLowerCase() 
    });

    if (!assignment) {
      return res.status(404).json({ message: 'No assignment request found for this email' });
    }

    if (assignment.isVerified) {
      return res.status(400).json({ message: 'This editor is already verified' });
    }

    if (assignment.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    const isMatch = await bcrypt.compare(otp, assignment.otpHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if User exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    // Auto-create user if doesn't exist
    if (!user) {
      const defaultPassword = Math.random().toString(36).slice(-8) + 'A1!'; // Generate random password
      
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      user = await User.create({
        username: `${email.split('@')[0]}_${randomSuffix}`, // Ensure unique username
        mobileNumber: `000000${Math.floor(1000 + Math.random() * 9000)}`, // Dummy number
        email: email.toLowerCase(),
        password: defaultPassword, // Let User model pre-save hook handle hashing
        role: 'Editor',
      });

      // Send email with default password
      const message = `Your account has been created for the Pickleball Tournament App.\n\nYour login email is: ${email}\nYour temporary password is: ${defaultPassword}\n\nPlease login and change your password.`;
      try {
        await sendEmail({
          email: email.toLowerCase(),
          subject: 'Account Created - Pickleball Tournaments',
          message
        });
      } catch (err) {
        console.error('Failed to send password email, but user was created.');
      }
    }

    // Update assignment
    assignment.isVerified = true;
    assignment.otpHash = undefined;
    assignment.otpExpiresAt = undefined;
    await assignment.save();

    // Add to tournament editors
    const isAlreadyEditor = tournament.editors.some(e => e.user.toString() === user._id.toString());
    
    if (!isAlreadyEditor) {
      tournament.editors.push({
        user: user._id,
        accessType: assignment.accessType
      });
      await tournament.save();
    }

    res.status(200).json({ 
      message: 'Editor verified and added successfully',
      editor: {
        _id: user._id,
        name: user.name,
        email: user.email,
        accessType: assignment.accessType
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update tournament details
// @route   PUT /api/tournaments/:id
// @access  Private/Admin
export const updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Only creator can update tournament settings
    if (tournament.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access Denied: Only the creator can modify settings' });
    }

    if (tournament.status !== 'Setup') {
      return res.status(400).json({ message: 'Tournament cannot be modified after it has started.' });
    }

    const {
      name,
      location,
      startDate,
      endDate,
      contactPerson,
      adminPhone,
      adminEmail,
      ruleset,
      winningPoints,
      minimumLead,
      numberOfSets,
      rallyScoring,
      tieBreakerRules,
    } = req.body;

    if (name) tournament.name = name;
    if (location) tournament.location = location;
    if (startDate) tournament.startDate = startDate;
    if (endDate) tournament.endDate = endDate;
    if (contactPerson) tournament.contactPerson = contactPerson;
    if (adminPhone) tournament.adminPhone = adminPhone;
    if (adminEmail) tournament.adminEmail = adminEmail;
    if (ruleset) tournament.ruleset = ruleset;
    if (winningPoints !== undefined) tournament.winningPoints = Number(winningPoints);
    if (minimumLead !== undefined) tournament.minimumLead = Number(minimumLead);
    if (numberOfSets !== undefined) tournament.numberOfSets = Number(numberOfSets);
    if (rallyScoring !== undefined) tournament.rallyScoring = !!rallyScoring;
    if (tieBreakerRules) tournament.tieBreakerRules = tieBreakerRules;

    await tournament.save();
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete tournament (cascade delete all related data)
// @route   DELETE /api/tournaments/:id
// @access  Private/Admin
export const deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Only creator can delete tournament
    if (tournament.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access Denied: Only the creator can delete this tournament' });
    }

    const tournamentId = tournament._id;

    // Setup transaction session with replica set fallback
    const session = await mongoose.startSession();
    let transactionActive = false;
    try {
      await session.startTransaction();
      transactionActive = true;
    } catch (sessionErr) {}

    const opts = transactionActive ? { session } : {};

    try {
      await Group.deleteMany({ tournamentId }, opts);
      await Team.deleteMany({ tournamentId }, opts);
      await Match.deleteMany({ tournamentId }, opts);
      await Standing.deleteMany({ tournamentId }, opts);
      await EditorAssignment.deleteMany({ tournamentId }, opts);
      await Tournament.deleteOne({ _id: tournamentId }, opts);

      if (transactionActive) {
        await session.commitTransaction();
      }
      session.endSession();

      res.json({ message: 'Tournament and all related data deleted successfully' });
    } catch (innerError) {
      if (transactionActive) {
        try { await session.abortTransaction(); } catch (e) {}
      }
      session.endSession();
      throw innerError;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove editor from tournament
// @route   DELETE /api/tournaments/:id/editors/:editorId
// @access  Private/Admin
export const removeEditor = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Only creator can remove editors
    if (tournament.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access Denied: Only the creator can remove editors' });
    }

    const { editorId } = req.params;

    // Find and remove from editors array
    const editorIndex = tournament.editors.findIndex(e => e._id.toString() === editorId || e.user.toString() === editorId);
    if (editorIndex === -1) {
      return res.status(404).json({ message: 'Editor not found in this tournament' });
    }

    const editorObj = tournament.editors[editorIndex];
    
    // Also remove EditorAssignment if exists
    const user = await User.findById(editorObj.user);
    if (user) {
      await EditorAssignment.deleteOne({ tournamentId: tournament._id, email: user.email.toLowerCase() });
    }

    tournament.editors.splice(editorIndex, 1);
    await tournament.save();

    res.json({ message: 'Editor removed successfully', editors: tournament.editors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
