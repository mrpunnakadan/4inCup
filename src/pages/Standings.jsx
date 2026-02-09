import { useTournament } from '../context/TournamentContext';
import { GROUPS, calculateStandings, getSortedStandings } from '../utils/logic';

export function Standings() {
    const { data } = useTournament();
    const standings = calculateStandings(data.teams, data.matches);
    const groupA = getSortedStandings(standings, GROUPS.A);
    const groupB = getSortedStandings(standings, GROUPS.B);

    return (
        <div className="space-y-12">
            <h1 className="text-4xl font-bold text-center mb-8">Points Table</h1>
            <div className="flex justify-center w-full">
                <PointsTable title="Group A" data={groupA} color="lime" />
                {/* <PointsTable title="Group B" data={groupB} color="emerald" /> */}
            </div>
        </div>
    );
}

function PointsTable({ title, data, color }) {
    const isA = color === 'lime';
    const headerColor = isA ? 'text-lime-400' : 'text-emerald-400';
    const borderColor = isA ? 'border-lime-500/20' : 'border-emerald-500/20';

    return (
        <div className={`bg-neutral-900/80 backdrop-blur-md rounded-xl border ${borderColor} overflow-hidden`}>
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <h2 className={`text-xl font-bold ${headerColor}`}>{title}</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white/5 text-neutral-400 font-medium">
                        <tr>
                            <th className="p-3">Team</th>
                            <th className="p-3 text-center">P</th>
                            <th className="p-3 text-center">W</th>
                            <th className="p-3 text-center">L</th>
                            <th className="p-3 text-center">+/-</th>
                            <th className="p-3 text-center font-bold text-white">Pts</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.length === 0 ? (
                            <tr><td colSpan="6" className="p-4 text-center text-neutral-500">No teams</td></tr>
                        ) : (
                            data.map((team, i) => (
                                <tr key={team.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-3 font-medium text-white flex items-center gap-2">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold 
                                            ${i < 4 ? (isA ? 'bg-lime-500 text-black' : 'bg-emerald-500 text-black') : 'bg-neutral-800 text-neutral-500'}`}>
                                            {i + 1}
                                        </span>
                                        {team.player1} & {team.player2}
                                    </td>
                                    <td className="p-3 text-center text-neutral-300">{team.played}</td>
                                    <td className="p-3 text-center text-green-400">{team.won}</td>
                                    <td className="p-3 text-center text-red-400">{team.lost}</td>
                                    <td className="p-3 text-center text-neutral-400">{team.scoreDiff > 0 ? `+${team.scoreDiff}` : team.scoreDiff}</td>
                                    <td className="p-3 text-center font-bold text-white text-lg">{team.points}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
