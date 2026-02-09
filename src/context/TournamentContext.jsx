import { createContext, useContext, useState, useEffect } from 'react';
import { GROUPS, STAGES, createTeam, generateGroupFixtures, calculateStandings, getSortedStandings, generateSemiFinals, generateFinal } from '../utils/logic';
import initialData from '../data/tournament-data.json';

const TournamentContext = createContext();

export function TournamentProvider({ children }) {
    // State
    const [data, setData] = useState(() => {
        const saved = localStorage.getItem('4inCup_v1');
        if (saved) {
            return JSON.parse(saved);
        }
        return initialData || { teams: [], matches: [], stage: STAGES.GROUP };
    });

    // Persist to LocalStorage whenever state changes
    useEffect(() => {
        localStorage.setItem('4inCup_v1', JSON.stringify(data));
    }, [data]);

    const actions = {
        addTeam: (p1, p2, group) => {
            const newTeam = createTeam(p1, p2, group);
            setData(prev => ({ ...prev, teams: [...prev.teams, newTeam] }));
        },

        updateTeam: (id, updates) => {
            setData(prev => ({
                ...prev,
                teams: prev.teams.map(t => t.id === id ? { ...t, ...updates } : t)
            }));
        },

        deleteTeam: (id) => {
            setData(prev => ({
                ...prev,
                teams: prev.teams.filter(t => t.id !== id)
            }));
        },

        resetTournament: () => {
            if (confirm('Are you sure you want to reset everything?')) {
                const emptyData = { teams: [], matches: [], stage: STAGES.GROUP };
                setData(emptyData);
                // Force save immediately to clear backend
                fetch('/api/tournament', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(emptyData)
                }).catch(console.error);
            }
        },

        startTournament: () => {
            if (data.teams.length < 4) {
                alert("Need at least 4 teams to start.");
                return;
            }
            const fixtures = generateGroupFixtures(data.teams);
            setData(prev => ({ ...prev, matches: fixtures }));
        },

        updateMatch: (matchId, scoreA, scoreB) => {
            setData(prev => {
                const updatedMatches = prev.matches.map(m => {
                    if (m.id === matchId) {
                        return {
                            ...m,
                            scoreA: parseInt(scoreA) || 0,
                            scoreB: parseInt(scoreB) || 0,
                            completed: true,
                            winnerId: (parseInt(scoreA) > parseInt(scoreB)) ? m.teamAId : m.teamBId
                        };
                    }
                    return m;
                });

                return { ...prev, matches: updatedMatches };
            });
        },

        resetMatchScore: (matchId) => {
            setData(prev => {
                const updatedMatches = prev.matches.map(m => {
                    if (m.id === matchId) {
                        return {
                            ...m,
                            scoreA: 0,
                            scoreB: 0,
                            completed: false,
                            winnerId: null
                        };
                    }
                    return m;
                });
                return { ...prev, matches: updatedMatches };
            });
        },

        resetAllScores: () => {
            if (confirm('Are you sure you want to RESET ALL SCORES? This cannot be undone.')) {
                setData(prev => ({
                    ...prev,
                    matches: prev.matches.map(m => ({
                        ...m,
                        scoreA: 0,
                        scoreB: 0,
                        completed: false,
                        winnerId: null
                    }))
                }));
            }
        },

        updateMatchTeams: (matchId, teamAId, teamBId) => {
            setData(prev => ({
                ...prev,
                matches: prev.matches.map(m =>
                    m.id === matchId ? { ...m, teamAId, teamBId, winnerId: null, completed: false, scoreA: 0, scoreB: 0 } : m
                )
            }));
        },

        generateNextStage: () => {
            // Calculate current standings
            const standings = calculateStandings(data.teams, data.matches);
            const groupA = getSortedStandings(standings, GROUPS.A);
            const groupB = getSortedStandings(standings, GROUPS.B);

            let newMatches = [...data.matches];
            let nextStage = data.stage;

            // Logic to generate Semis
            // Only generate if we are in Group stage and Semis don't exist yet
            const hasSemis = newMatches.some(m => m.stage === STAGES.SEMI_FINAL);
            if (!hasSemis) {
                const semis = generateSemiFinals(groupA, groupB);
                if (semis.length > 0) {
                    newMatches = [...newMatches, ...semis];
                    nextStage = STAGES.SEMI_FINAL;
                }
            }

            // Logic to generate Final
            // Only generate if we have Semis and Final doesn't exist
            const sfMatches = newMatches.filter(m => m.stage === STAGES.SEMI_FINAL);
            const hasFinal = newMatches.some(m => m.stage === STAGES.FINAL);

            if (!hasFinal && sfMatches.length === 2 && sfMatches.every(m => m.completed)) {
                const sf1 = sfMatches.find(m => m.matchNumber === 'SF1');
                const sf2 = sfMatches.find(m => m.matchNumber === 'SF2');
                const finalMatch = generateFinal(sf1, sf2);
                if (finalMatch.length > 0) {
                    newMatches = [...newMatches, ...finalMatch];
                    nextStage = STAGES.FINAL;
                }
            }

            setData(prev => ({ ...prev, matches: newMatches, stage: nextStage }));
        }
    };

    const derived = {
        standings: calculateStandings(data.teams, data.matches)
    };

    return (
        <TournamentContext.Provider value={{ data, actions, derived }}>
            {children}
        </TournamentContext.Provider>
    );
}

export function useTournament() {
    return useContext(TournamentContext);
}
