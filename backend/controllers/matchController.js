import Match from '../models/Match.js';
import Tournament from '../models/Tournament.js';
import Group from '../models/Group.js';
import Team from '../models/Team.js';
import Standing from '../models/Standing.js';

// Helper to check if a user is authorized to edit scores (Admin or assigned Editor)
const checkEditPermission = async (match, user) => {
  // Admins are NOT automatically granted access to all matches; they must be the creator or an editor.

  const tournament = await Tournament.findById(match.tournamentId);
  if (!tournament) return false;

  // Creator has access
  if (tournament.creator.toString() === user._id.toString()) return true;

  // Editor check
  const editorAssignment = tournament.editors.find((e) => e.user.toString() === user._id.toString());
  if (!editorAssignment) return false;

  // Full Editor has access
  if (editorAssignment.accessType === 'Full Editor') return true;

  // Tournament Editor has access
  if (editorAssignment.accessType === 'Tournament Editor') return true;

  // Category Editor check: matches have category via tournament or group category
  if (editorAssignment.accessType === 'Category Editor') {
    return match.category === editorAssignment.assignedCategory;
  }

  return false;
};

export const updateMatchDetails = async (req, res) => {
  const { scheduledTime, courtNumber, status } = req.body;

  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const isAuthorized = await checkEditPermission(match, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to edit this match details' });
    }

    if (scheduledTime) match.scheduledTime = scheduledTime;
    if (courtNumber) match.courtNumber = courtNumber;
    if (status) match.status = status;

    await match.save();
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Real-time Save Point (pushed previous state to pointHistory for undo)
export const saveMatchPoint = async (req, res) => {
  const { 
    games, 
    currentGameIndex, 
    servingTeam, 
    serverNumber,
    currentServerName,
    currentReceiverName,
    serverSide,
    receiverSide,
    teamA_EvenPlayer,
    teamA_OddPlayer,
    teamB_EvenPlayer,
    teamB_OddPlayer
  } = req.body;

  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const isAuthorized = await checkEditPermission(match, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to update scores' });
    }

    // Capture previous state as history point
    const activeGame = match.games[match.currentGameIndex] || { scoreA: 0, scoreB: 0 };
    match.pointHistory.push({
      scoreA: activeGame.scoreA,
      scoreB: activeGame.scoreB,
      servingTeam: match.servingTeam,
      serverNumber: match.serverNumber,
      gameIndex: match.currentGameIndex,
      currentServerName: match.currentServerName,
      currentReceiverName: match.currentReceiverName,
      serverSide: match.serverSide,
      receiverSide: match.receiverSide,
    });

    // Save current active state
    match.games = games;
    match.currentGameIndex = currentGameIndex;
    match.servingTeam = servingTeam;
    match.serverNumber = serverNumber;
    
    // Save doubles tracking state
    if (currentServerName !== undefined) match.currentServerName = currentServerName;
    if (currentReceiverName !== undefined) match.currentReceiverName = currentReceiverName;
    if (serverSide !== undefined) match.serverSide = serverSide;
    if (receiverSide !== undefined) match.receiverSide = receiverSide;
    
    // Save initial player assignments if provided
    if (teamA_EvenPlayer !== undefined) match.teamA_EvenPlayer = teamA_EvenPlayer;
    if (teamA_OddPlayer !== undefined) match.teamA_OddPlayer = teamA_OddPlayer;
    if (teamB_EvenPlayer !== undefined) match.teamB_EvenPlayer = teamB_EvenPlayer;
    if (teamB_OddPlayer !== undefined) match.teamB_OddPlayer = teamB_OddPlayer;

    match.status = 'In Progress';

    await match.save();
    res.json(match);
  } catch (error) {
    if (error.name === 'VersionError') {
      return res.status(409).json({ message: 'This match was updated by another editor. Please refresh the page.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Undo Last Point
export const undoMatchPoint = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const isAuthorized = await checkEditPermission(match, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to edit scores' });
    }

    if (match.pointHistory.length === 0) {
      return res.status(400).json({ message: 'No points to undo' });
    }

    // Retrieve previous state
    const prevPoint = match.pointHistory.pop();

    // Revert games points
    const updatedGames = [...match.games];
    if (updatedGames[prevPoint.gameIndex]) {
      updatedGames[prevPoint.gameIndex].scoreA = prevPoint.scoreA;
      updatedGames[prevPoint.gameIndex].scoreB = prevPoint.scoreB;
    }

    match.games = updatedGames;
    match.currentGameIndex = prevPoint.gameIndex;
    match.servingTeam = prevPoint.servingTeam;
    match.serverNumber = prevPoint.serverNumber;
    
    if (prevPoint.currentServerName !== undefined) match.currentServerName = prevPoint.currentServerName;
    if (prevPoint.currentReceiverName !== undefined) match.currentReceiverName = prevPoint.currentReceiverName;
    if (prevPoint.serverSide !== undefined) match.serverSide = prevPoint.serverSide;
    if (prevPoint.receiverSide !== undefined) match.receiverSide = prevPoint.receiverSide;

    await match.save();
    res.json(match);
  } catch (error) {
    if (error.name === 'VersionError') {
      return res.status(409).json({ message: 'This match was updated by another editor. Please refresh the page.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Set dispute status (Admin review)
export const disputeMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const isAuthorized = await checkEditPermission(match, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to dispute this match' });
    }

    match.status = 'Disputed';
    await match.save();
    res.json(match);
  } catch (error) {
    if (error.name === 'VersionError') {
      return res.status(409).json({ message: 'This match was updated by another editor. Please refresh the page.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Submit Match Score & Finalize Complete
export const submitMatchScore = async (req, res) => {
  const { games } = req.body;

  try {
    const match = await Match.findById(req.params.id);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const isAuthorized = await checkEditPermission(match, req.user);
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to submit scores' });
    }

    const tournament = await Tournament.findById(match.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Determine the winner
    let winsA = 0;
    let winsB = 0;

    match.games = games.map((g) => ({
      scoreA: Number(g.scoreA) || 0,
      scoreB: Number(g.scoreB) || 0,
    }));

    match.games.forEach((game) => {
      if (game.scoreA > game.scoreB) {
        winsA++;
      } else if (game.scoreB > game.scoreA) {
        winsB++;
      }
    });

    if (winsA > winsB) {
      match.winner = match.teamA;
    } else if (winsB > winsA) {
      match.winner = match.teamB;
    } else {
      return res.status(400).json({ message: 'Match score results in a draw. Please resolve the tie before submitting.' });
    }

    match.status = 'Completed';
    await match.save();

    // Update standings and progressions
    if (match.stage === 'Group' && match.groupId) {
      await updateGroupStandings(match.tournamentId, match.groupId);
      
      const remainingGroupMatches = await Match.countDocuments({
        tournamentId: match.tournamentId,
        category: match.category,
        stage: 'Group',
        status: { $ne: 'Completed' },
      });

      if (remainingGroupMatches === 0) {
        // Atomic status transition per category to prevent duplicate bracket generation
        const updatedTournament = await Tournament.findOneAndUpdate(
          {
            _id: tournament._id,
            categoryStatus: {
              $elemMatch: {
                category: match.category,
                status: 'Group Stage'
              }
            }
          },
          {
            $set: {
              'categoryStatus.$[elem].status': 'Knockout Stage'
            }
          },
          {
            arrayFilters: [{ 'elem.category': match.category }],
            new: true
          }
        );

        if (updatedTournament) {
          await generateKnockoutBrackets(updatedTournament, match.category);
        }
      }
    } else {
      await advanceKnockoutWinner(match);
    }

    res.json({ message: 'Score submitted successfully!', match });
  } catch (error) {
    if (error.name === 'VersionError') {
      return res.status(409).json({ message: 'This match was updated by another editor. Please refresh the page.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// Recalculates standings for a group
async function updateGroupStandings(tournamentId, groupId) {
  const standings = await Standing.find({ tournamentId, groupId });
  const matches = await Match.find({ tournamentId, groupId, stage: 'Group', status: 'Completed' });

  for (let standing of standings) {
    let played = 0;
    let wins = 0;
    let losses = 0;
    let points = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    matches.forEach((m) => {
      const isTeamA = m.teamA.toString() === standing.teamId.toString();
      const isTeamB = m.teamB.toString() === standing.teamId.toString();

      if (isTeamA || isTeamB) {
        played++;
        const won = m.winner.toString() === standing.teamId.toString();
        if (won) {
          wins++;
          points += 2; // 2 points for a win
        } else {
          losses++;
        }

        // Add rally points
        m.games.forEach((game) => {
          if (isTeamA) {
            pointsFor += game.scoreA;
            pointsAgainst += game.scoreB;
          } else {
            pointsFor += game.scoreB;
            pointsAgainst += game.scoreA;
          }
        });
      }
    });

    standing.played = played;
    standing.wins = wins;
    standing.losses = losses;
    standing.points = points;
    standing.pointsFor = pointsFor;
    standing.pointsAgainst = pointsAgainst;
    standing.pointDifference = pointsFor - pointsAgainst;

    await standing.save();
  }

  // Rank the standings inside this group using rules
  const updatedStandings = await Standing.find({ tournamentId, groupId });

  updatedStandings.sort((a, b) => {
    // Priority 1: Points
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    // Priority 2: Head-to-head result
    const headToHeadMatch = matches.find((m) => {
      const isA = m.teamA.toString() === a.teamId.toString() || m.teamB.toString() === a.teamId.toString();
      const isB = m.teamA.toString() === b.teamId.toString() || m.teamB.toString() === b.teamId.toString();
      return isA && isB;
    });

    if (headToHeadMatch && headToHeadMatch.winner) {
      if (headToHeadMatch.winner.toString() === a.teamId.toString()) return -1;
      if (headToHeadMatch.winner.toString() === b.teamId.toString()) return 1;
    }

    // Priority 3: Point differential
    if (b.pointDifference !== a.pointDifference) {
      return b.pointDifference - a.pointDifference;
    }

    // Priority 4: Points for
    return b.pointsFor - a.pointsFor;
  });

  for (let i = 0; i < updatedStandings.length; i++) {
    updatedStandings[i].rank = i + 1;
    await updatedStandings[i].save();
  }
}

// Seeding order generator for bracket pairing (binary tree style)
const getSeedingOrder = (n) => {
  let order = [0];
  while (order.length < n) {
    const nextOrder = [];
    const target = order.length * 2 - 1;
    for (const val of order) {
      nextOrder.push(val);
      nextOrder.push(target - val);
    }
    order = nextOrder;
  }
  return order;
};

// Rounds/Stages definition based on size of qualifiers
const getKnockoutRounds = (Q) => {
  const rounds = [];
  if (Q >= 64) rounds.push({ stage: 'Round of 64', matches: 32 });
  if (Q >= 32) rounds.push({ stage: 'Round of 32', matches: 16 });
  if (Q >= 16) rounds.push({ stage: 'Round of 16', matches: 8 });
  if (Q >= 8) rounds.push({ stage: 'Quarterfinal', matches: 4 });
  if (Q >= 4) rounds.push({ stage: 'Semifinal', matches: 2 });
  if (Q >= 2) rounds.push({ stage: 'Final', matches: 1 });
  
  let currentOffset = 0;
  for (let i = 0; i < rounds.length; i++) {
    rounds[i].offset = currentOffset;
    currentOffset += rounds[i].matches;
  }
  return rounds;
};

// Generate the knockout bracket once group stage is done
async function generateKnockoutBrackets(tournament, category = 'Default') {
  const tournamentId = tournament._id;

  // Clear existing knockout matches for this category
  await Match.deleteMany({ tournamentId, category, stage: { $ne: 'Group' } });

  const groups = await Group.find({ tournamentId, category });
  const qualifiedTeams = [];

  const catConfig = tournament.categorySettings.find(c => c.category === category);
  const topQualifiersPerGroup = catConfig ? catConfig.topQualifiersPerGroup : tournament.topQualifiersPerGroup;

  for (let group of groups) {
    const groupStandings = await Standing.find({ tournamentId, groupId: group._id })
      .sort({ rank: 1 })
      .limit(topQualifiersPerGroup);

    groupStandings.forEach((st) => {
      qualifiedTeams.push(st.teamId);
    });
  }

  const Q = qualifiedTeams.length;
  const rounds = getKnockoutRounds(Q);

  if (rounds.length === 0) {
    // Complete category status
    await Tournament.updateOne(
      {
        _id: tournamentId,
        'categoryStatus.category': category
      },
      {
        $set: {
          'categoryStatus.$.status': 'Completed'
        }
      }
    );

    // Check if all categories are completed
    const updatedTournament = await Tournament.findById(tournamentId);
    const allCompleted = updatedTournament.categoryStatus.every(cs => cs.status === 'Completed');
    if (allCompleted) {
      updatedTournament.status = 'Completed';
      await updatedTournament.save();
    }
    return;
  }

  // Update category status and main status
  await Tournament.updateOne(
    {
      _id: tournamentId,
      'categoryStatus.category': category
    },
    {
      $set: {
        'categoryStatus.$.status': 'Knockout Stage',
        status: 'Knockout Stage'
      }
    }
  );

  const seeding = getSeedingOrder(Q);
  
  // Create matches for the first round with initial seeded teams
  const round0 = rounds[0];
  for (let i = 0; i < round0.matches; i++) {
    const idxA = seeding[i * 2];
    const idxB = seeding[i * 2 + 1];

    await Match.create({
      tournamentId,
      stage: round0.stage,
      matchIndex: round0.offset + i,
      teamA: qualifiedTeams[idxA] || null,
      teamB: qualifiedTeams[idxB] || null,
      status: 'Not Started',
      category,
      games: [
        { scoreA: 0, scoreB: 0 },
        { scoreA: 0, scoreB: 0 },
        { scoreA: 0, scoreB: 0 },
      ],
    });
  }

  // Create empty matches for subsequent rounds
  for (let r = 1; r < rounds.length; r++) {
    const round = rounds[r];
    for (let i = 0; i < round.matches; i++) {
      await Match.create({
        tournamentId,
        stage: round.stage,
        matchIndex: round.offset + i,
        teamA: null,
        teamB: null,
        status: 'Not Started',
        category,
        games: [
          { scoreA: 0, scoreB: 0 },
          { scoreA: 0, scoreB: 0 },
          { scoreA: 0, scoreB: 0 },
        ],
      });
    }
  }
}

async function advanceKnockoutWinner(match) {
  const { stage, matchIndex, winner, tournamentId, category } = match;

  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return;

    const groups = await Group.find({ tournamentId, category });
    const catConfig = tournament.categorySettings.find(c => c.category === category);
    const topQualifiersPerGroup = catConfig ? catConfig.topQualifiersPerGroup : tournament.topQualifiersPerGroup;
    const Q = groups.length * topQualifiersPerGroup;
    
    const rounds = getKnockoutRounds(Q);
    const currentRoundIndex = rounds.findIndex(r => r.stage === stage);
    if (currentRoundIndex === -1) return;

    if (stage === 'Final') {
      // Complete category status
      await Tournament.updateOne(
        {
          _id: tournamentId,
          'categoryStatus.category': category
        },
        {
          $set: {
            'categoryStatus.$.status': 'Completed'
          }
        }
      );

      // Check if all categories are completed
      const updatedTournament = await Tournament.findById(tournamentId);
      const allCompleted = updatedTournament.categoryStatus.every(cs => cs.status === 'Completed');
      if (allCompleted) {
        updatedTournament.status = 'Completed';
        await updatedTournament.save();
      }
      return;
    }

    const currentRound = rounds[currentRoundIndex];
    const nextRound = rounds[currentRoundIndex + 1];

    const relativeIndex = matchIndex - currentRound.offset;
    const targetMatchIndex = nextRound.offset + Math.floor(relativeIndex / 2);

    const targetMatch = await Match.findOne({ 
      tournamentId, 
      category, 
      stage: nextRound.stage, 
      matchIndex: targetMatchIndex 
    });

    if (targetMatch) {
      if (relativeIndex % 2 === 0) {
        targetMatch.teamA = winner;
      } else {
        targetMatch.teamB = winner;
      }
      await targetMatch.save();
    }
  } catch (error) {
    console.error('Error advancing knockout winner:', error);
  }
}
