import { GoogleGenerativeAI } from '@google/generative-ai';
import Tournament from '../models/Tournament.js';
import Group from '../models/Group.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import Standing from '../models/Standing.js';

export const askAssistant = async (req, res) => {
  const { message, tournamentId, chatHistory } = req.body;

  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(500).json({
        message: 'Gemini API Key is missing. Please set GEMINI_API_KEY in the backend .env file.',
        setupRequired: true
      });
    }

    let contextPrompt = '';

    if (tournamentId) {
      try {
        const tournament = await Tournament.findById(tournamentId).populate('creator', 'username');
        if (tournament) {
          const groups = await Group.find({ tournamentId }).populate('teams');
          const teams = await Team.find({ tournamentId });
          const matches = await Match.find({ tournamentId })
            .populate('teamA')
            .populate('teamB')
            .populate('winner')
            .sort({ stage: 1, matchIndex: 1 });
          const standings = await Standing.find({ tournamentId })
            .populate('teamId')
            .sort({ groupId: 1, rank: 1 });

          // Map teams to group names for better context mapping
          const groupMap = {};
          groups.forEach(g => {
            groupMap[g._id.toString()] = g.name;
          });

          // Format context
          contextPrompt = `
You are the Assistant for the tournament: "${tournament.name}".
Tournament Context Details:
- Location: ${tournament.location}
- Status: ${tournament.status}
- Ruleset: ${tournament.ruleset}
- Match Rules: Winner is first to ${tournament.winningPoints} points (min lead ${tournament.minimumLead || 2} points), best of ${tournament.numberOfSets || 3} sets. Rally scoring is ${tournament.rallyScoring ? 'enabled' : 'disabled'}.

Registered Teams (${teams.length}):
${teams.map((t, idx) => `${idx + 1}. Name: "${t.name || t.teamName || 'Unnamed'}" [ID: ${t._id}] (${t.category} category), Players: ${t.players && t.players.length > 0 ? t.players.join(', ') : [t.player1, t.player2].filter(Boolean).join(' & ')}`).join('\n')}

Groups (${groups.length}):
${groups.map(g => `- "${g.name}" (${g.category} category): Teams: [${g.teams.map(t => `"${t.name || t.teamName}"`).join(', ')}]`).join('\n')}

Standings:
${standings.map(s => `- Group: "${groupMap[s.groupId?.toString()] || 'Unknown'}", Team: "${s.teamId?.name || s.teamId?.teamName || 'Unknown'}", Rank: ${s.rank}, Played: ${s.played}, Won: ${s.wins}, Lost: ${s.losses}, Points Diff: ${s.pointDifference}, Points: ${s.points}`).join('\n')}

Matches:
${matches.map(m => {
  const teamA_name = m.teamA ? (m.teamA.name || m.teamA.teamName) : 'TBD';
  const teamB_name = m.teamB ? (m.teamB.name || m.teamB.teamName) : 'TBD';
  const group_name = m.groupId ? (groupMap[m.groupId.toString()] || '') : '';
  const scores = m.games.map(g => `${g.scoreA}-${g.scoreB}`).join(', ') || 'No sets played';
  const status_str = m.status === 'Ongoing' || m.status === 'In Progress' ? 'LIVE/IN PROGRESS' : m.status;
  const winner_str = m.winner ? `(Winner: ${m.winner.name || m.winner.teamName})` : '';
  
  return `- Stage: ${m.stage} ${group_name ? `(${group_name})` : ''}, Match #${m.matchIndex}: ${teamA_name} vs ${teamB_name} | Status: ${status_str} | Scores: [${scores}] ${winner_str}`;
}).join('\n')}
`;
        }
      } catch (err) {
        console.error('Error fetching tournament context for AI:', err);
        // Continue with generic bot if DB query fails
      }
    }

    const systemInstruction = `
You are a helpful, smart, and enthusiastic Pickleball Tournament Chatbot/Assistant.
Your job is to answer user queries about tournaments, standings, fixtures, schedules, rules, or general pickleball questions.
You should converse naturally in English, Hindi, or Hinglish (Hindi in Roman script), matching the language preference of the user's message.

Guidelines:
1. Use the tournament context provided below to answer tournament-specific questions.
2. If context is provided and the user asks about matches, standings, who won, or who plays next, trace it from the matches list or standings list.
3. Be concise and structured. Use bullet points or bold text where appropriate to make information easy to read.
4. Keep the tone friendly, helpful, and energetic.
5. If the user asks about something not in the context, or if no context is provided, answer generally about pickleball rules and guidelines, or ask them to specify which tournament details they want to know.
6. Do NOT invent/hallucinate team names, scores, or standings that are not in the context. If you don't know or if it is not in the data, politely say so.
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      systemInstruction: systemInstruction,
    });

    // Format chat history for Gemini api
    const formattedHistory = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach(msg => {
        formattedHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content || msg.text || '' }]
        });
      });
    }

    // Start a chat session or send a single request
    let aiResponseText = '';
    
    if (formattedHistory.length > 0) {
      const chat = model.startChat({
        history: formattedHistory,
      });
      
      const promptContent = contextPrompt 
        ? `${contextPrompt}\n\nUser Query: ${message}`
        : message;
        
      const result = await chat.sendMessage(promptContent);
      const response = await result.response;
      aiResponseText = response.text();
    } else {
      const promptContent = contextPrompt 
        ? `${contextPrompt}\n\nUser Query: ${message}`
        : message;
        
      const result = await model.generateContent(promptContent);
      const response = await result.response;
      aiResponseText = response.text();
    }

    res.json({ text: aiResponseText });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ 
      message: 'Failed to communicate with AI Assistant. Please check backend logs.',
      error: error.message 
    });
  }
};
