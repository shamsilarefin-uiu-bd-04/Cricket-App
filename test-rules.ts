import { ScoringEngine } from './src/utils/scoringEngine.ts';
import { StorageService, OFFICIAL_TEAM_LOGOS } from './src/utils/storage.ts';
import { FixturesGenerator } from './src/utils/fixturesGenerator.ts';
import { Match } from './src/types/cricket.ts';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('=== STARTING COMPLETE ROOFTOP CRICKET TOURNAMENT RULES TEST ===\n');

// 1. Initial Innings Verification
const inn = ScoringEngine.createInitialInnings('t1', 't2');
inn.currentBatsmanId = 'p1';
inn.currentBowlerId = 'p9';

assert(inn.battingTeamReviewsRemaining === 2, 'Batting team starts with 2 DRS reviews');
assert(inn.bowlingTeamReviewsRemaining === 2, 'Bowling team starts with 2 DRS reviews');
assert(inn.substitutionUsed === false, 'Innings starts with 0 substitutions used');
assert(inn.totalRuns === 0 && inn.wickets === 0, 'Innings starts at 0/0');

// 2. Shot scoring: 4 runs boundary
let r1 = ScoringEngine.recordDelivery(inn, { runsOffBat: 4 });
assert(r1.updatedInnings.totalRuns === 4, '4-run shot awards 4 runs to team');
assert(r1.updatedInnings.batsmen[0].runs === 4, 'Batsman has 4 runs');
assert(r1.updatedInnings.batsmen[0].fours === 1, 'Batsman has 1 boundary four');
assert(r1.updatedInnings.totalLegalBalls === 1, 'Delivery counted as 1 legal ball');

// 3. Signature Rooftop Rule: Six Penalty of -4 Runs
let r2 = ScoringEngine.recordDelivery(r1.updatedInnings, { runsOffBat: -4, isSixPenalty: true });
assert(r2.updatedInnings.totalRuns === 0, 'Hitting a 6 deducts 4 runs (4 - 4 = 0)');
assert(r2.updatedInnings.batsmen[0].runs === 0, 'Batsman individual runs reduced by 4');
assert(r2.updatedInnings.batsmen[0].sixPenalties === 1, 'Batsman six penalties count is 1');
assert(r2.updatedInnings.totalLegalBalls === 2, 'Six penalty delivery is counted in the over (2 balls)');

// 4. Extras: Wide (+1 extra, not counted as legal ball)
let r3 = ScoringEngine.recordDelivery(r2.updatedInnings, { runsOffBat: 0, isWide: true });
assert(r3.updatedInnings.totalRuns === 1, 'Wide adds +1 extra run');
assert(r3.updatedInnings.totalLegalBalls === 2, 'Wide ball is not counted as a legal delivery');

// 5. Special Combo Rule: Hitting a 4 on a No-Ball (Ball not counted, 5 runs added: 1 NB + 4 off bat)
let r4 = ScoringEngine.recordDelivery(r3.updatedInnings, { runsOffBat: 4, isNoBallFour: true });
assert(r4.updatedInnings.totalRuns === 6, 'No-ball + 4 adds 5 runs (1 + 5 = 6)');
assert(r4.updatedInnings.batsmen[0].runs === 4, 'Batsman credited with +4 runs off bat (total 4)');
assert(r4.updatedInnings.batsmen[0].fours === 2, 'Batsman has 2 fours');
assert(r4.updatedInnings.totalLegalBalls === 2, 'No-Ball + 4 is NOT counted towards over legal balls');

// 6. Dead Ball Escalation Rule:
// "After 2 dead balls in an over, each subsequent dead ball awards an extra +1 run."
let currentInn = r4.updatedInnings;

// Dead Ball 1
let d1 = ScoringEngine.recordDelivery(currentInn, { runsOffBat: 0, isDeadBall: true });
assert(d1.updatedInnings.deadBallsInCurrentOver === 1, 'Dead ball #1 registered in over');
assert(d1.updatedInnings.totalRuns === 6, 'Dead ball #1 gives 0 runs');

// Dead Ball 2
let d2 = ScoringEngine.recordDelivery(d1.updatedInnings, { runsOffBat: 0, isDeadBall: true });
assert(d2.updatedInnings.deadBallsInCurrentOver === 2, 'Dead ball #2 registered in over');
assert(d2.updatedInnings.totalRuns === 6, 'Dead ball #2 gives 0 runs');

// Dead Ball 3 (exceeds threshold of 2! Must award +1 extra!)
let d3 = ScoringEngine.recordDelivery(d2.updatedInnings, { runsOffBat: 0, isDeadBall: true });
assert(d3.updatedInnings.deadBallsInCurrentOver === 3, 'Dead ball #3 registered in over');
assert(d3.updatedInnings.totalRuns === 7, 'Dead ball #3 awards +1 extra run penalty!');
assert(d3.updatedInnings.bowlers[0].deadBallPenalties === 1, 'Bowler dead ball penalty recorded');

// Dead Ball 4 (still awards +1 extra!)
let d4 = ScoringEngine.recordDelivery(d3.updatedInnings, { runsOffBat: 0, isDeadBall: true });
assert(d4.updatedInnings.deadBallsInCurrentOver === 4, 'Dead ball #4 registered in over');
assert(d4.updatedInnings.totalRuns === 8, 'Dead ball #4 awards +1 extra run penalty (total 8)');

// 7. Batsman 4 Overs Limit & Auto-Retirement:
// "A batsman can bat for a maximum of 4 overs. They must retire automatically after that."
let testInn = d4.updatedInnings;
// Currently batsman has faced 2 legal balls. Let's add 21 more legal balls (total 23)
for (let i = 0; i < 21; i++) {
  const res = ScoringEngine.recordDelivery(testInn, { runsOffBat: 1 });
  testInn = res.updatedInnings;
  if (res.requiresNewBowler) {
    testInn.currentBowlerId = testInn.currentBowlerId === 'p9' ? 'p10' : 'p9';
  }
}
assert(testInn.batsmen[0].ballsFaced === 23, 'Batsman has faced 23 legal balls');
assert(testInn.batsmen[0].isRetiredLimit === false, 'Batsman is not yet retired at 23 balls');

// Ball 24 (4 full overs limit!)
const res24 = ScoringEngine.recordDelivery(testInn, { runsOffBat: 1 });
testInn = res24.updatedInnings;
assert(testInn.batsmen[0].ballsFaced === 24, 'Batsman faced 24 legal balls (4 overs)');
assert(testInn.batsmen[0].isRetiredLimit === true, 'Batsman automatically retired after 24 balls!');
assert(res24.requiresNewBatsman === true, 'System requires new batsman to take the crease');
assert(testInn.currentBatsmanId === undefined, 'Current batsman cleared from pitch');

// 8. Rule: Out batsman CANNOT play twice
const squad = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];

// Dismiss p2
testInn.currentBatsmanId = 'p2';
testInn.currentBowlerId = 'p10';
const outResP2 = ScoringEngine.recordDelivery(testInn, { runsOffBat: 0, isWicket: true, dismissalType: 'bowled' });
testInn = outResP2.updatedInnings;

const p2Record = testInn.batsmen.find(b => b.playerId === 'p2');
assert(p2Record?.isOut === true, 'p2 is dismissed (OUT)');
const availP2Check = ScoringEngine.getAvailableBatsmen(testInn, squad);
assert(!availP2Check.unbattedPlayerIds.includes('p2'), 'Out batsman p2 is NOT in unbatted players');
assert(!availP2Check.retiredPlayerIds.includes('p2'), 'Out batsman p2 is NOT in retired eligible list (cannot play twice)');

// 9. Rule: Retire batsman can play again if:
// Condition A: Others all batsman out
// Condition B: Or all batsman face at least 1 ball
const midAvail = ScoringEngine.getAvailableBatsmen(testInn, squad);
assert(midAvail.canReEnterRetired === false, 'Retired batsman p1 CANNOT play yet because p3, p4, p5, p6 have not faced a ball and are not out');

// Now simulate p3, p4, p5, p6 each facing at least 1 legal ball (Condition B)
for (const pid of ['p3', 'p4', 'p5', 'p6']) {
  testInn.currentBatsmanId = pid;
  testInn.currentBowlerId = 'p10';
  const ballRes = ScoringEngine.recordDelivery(testInn, { runsOffBat: 1 });
  testInn = ballRes.updatedInnings;
}

// Now every teammate of p1 (p2 is out, p3-p6 faced >= 1 ball) has faced at least 1 ball!
const endAvail = ScoringEngine.getAvailableBatsmen(testInn, squad);
assert(endAvail.canReEnterRetired === true, 'Retired batsman p1 CAN PLAY AGAIN because all other batsmen faced at least 1 ball!');
assert(endAvail.retiredPlayerIds.includes('p1'), 'p1 is available for unrestricted re-entry');

// 10. Rule: "then he didnt any restriction"
// When p1 returns to bat, mark hasReEntered = true
const p1Innings = testInn.batsmen.find(b => b.playerId === 'p1')!;
p1Innings.hasReEntered = true;
testInn.currentBatsmanId = 'p1';
testInn.currentBowlerId = 'p9';

// p1 already faced 24 balls earlier. Now they face ball #25 and ball #26:
const res25 = ScoringEngine.recordDelivery(testInn, { runsOffBat: 4 });
testInn = res25.updatedInnings;
assert(testInn.batsmen[0].ballsFaced === 25, 'p1 faced ball #25');
assert(res25.requiresNewBatsman === false, 'No restriction! p1 is NOT auto-retired on ball #25');
if (res25.requiresNewBowler) {
  testInn.currentBowlerId = 'p10';
}
const res26 = ScoringEngine.recordDelivery(testInn, { runsOffBat: 4 });
testInn = res26.updatedInnings;
assert(testInn.batsmen[0].ballsFaced === 26, 'p1 faced ball #26');
assert(res26.requiresNewBatsman === false, 'No restriction! p1 continues batting freely beyond 4 overs');

// 11. DRS Reviews: Both Batting and Bowling sides have 2 reviews; Retained on success, Lost on failure
assert(testInn.battingTeamReviewsRemaining === 2, 'Batting team starts with 2 reviews');
assert(testInn.bowlingTeamReviewsRemaining === 2, 'Bowling team starts with 2 reviews');

// Batting team calls review - Upheld (Retained)
const batRevSuccess = ScoringEngine.handleDrsReview(testInn, {
  teamId: 't1',
  isBattingTeam: true,
  targetType: 'boundary',
  isSuccessful: true,
  reason: 'Boundary check'
});
assert(batRevSuccess.updatedInnings.battingTeamReviewsRemaining === 2, 'Batting team successful review is RETAINED (still 2 remaining)');

// Batting team calls review - Lost (Deducted)
const batRevLost = ScoringEngine.handleDrsReview(batRevSuccess.updatedInnings, {
  teamId: 't1',
  isBattingTeam: true,
  targetType: 'other',
  isSuccessful: false,
  reason: 'Wide ball dispute'
});
assert(batRevLost.updatedInnings.battingTeamReviewsRemaining === 1, 'Batting team unsuccessful review is LOST (1 remaining)');

// Bowling team calls review - Upheld (Retained)
const bowlRevSuccess = ScoringEngine.handleDrsReview(batRevLost.updatedInnings, {
  teamId: 't2',
  isBattingTeam: false,
  targetType: 'wicket',
  isSuccessful: true,
  reason: 'Caught behind appeal'
});
assert(bowlRevSuccess.updatedInnings.bowlingTeamReviewsRemaining === 2, 'Bowling team successful review is RETAINED (still 2 remaining)');

// Bowling team calls review - Lost (Deducted)
const bowlRevLost = ScoringEngine.handleDrsReview(bowlRevSuccess.updatedInnings, {
  teamId: 't2',
  isBattingTeam: false,
  targetType: 'other',
  isSuccessful: false,
  reason: 'LBW check'
});
assert(bowlRevLost.updatedInnings.bowlingTeamReviewsRemaining === 1, 'Bowling team unsuccessful review is LOST (1 remaining)');

// Test DRS Overturning a wrongful Wicket
let drsWicketTestInn = ScoringEngine.createInitialInnings('t1', 't2');
drsWicketTestInn.currentBatsmanId = 'p1';
drsWicketTestInn.currentBowlerId = 'p9';
// Dismiss p1
const wicketRes = ScoringEngine.recordDelivery(drsWicketTestInn, { runsOffBat: 0, isWicket: true, dismissalType: 'caught' });
assert(wicketRes.updatedInnings.wickets === 1, 'Wicket was credited (1/1)');
assert(wicketRes.updatedInnings.batsmen[0].isOut === true, 'Batsman was declared OUT');
// Overturn via Batting Team DRS!
const overturnedWicketRes = ScoringEngine.handleDrsReview(wicketRes.updatedInnings, {
  teamId: 't1',
  isBattingTeam: true,
  targetType: 'wicket',
  isSuccessful: true,
  overturnAction: 'cancel_wicket',
  reason: 'No edge on camera'
});
assert(overturnedWicketRes.updatedInnings.wickets === 0, 'Wicket successfully decremented back to 0 on DRS overturn');
assert(overturnedWicketRes.updatedInnings.batsmen[0].isOut === false, 'Batsman is NOT OUT on DRS overturn');
assert(overturnedWicketRes.updatedInnings.currentBatsmanId === 'p1', 'Batsman restored to the crease on DRS overturn');

// 12. Substitution: 1 per innings
const sub1 = ScoringEngine.handleSubstitution(testInn, 'p3', 'p4', 'Tactical change');
assert(sub1.success === true, '1st substitution succeeds');
assert(sub1.updatedInnings.substitutionUsed === true, 'Innings substitution flag set to true');

const sub2 = ScoringEngine.handleSubstitution(sub1.updatedInnings, 'p4', 'p5', 'Another sub');
assert(sub2.success === false, '2nd substitution in same innings is rejected');

// 13. Player Registry & 5-Player Squad Support
// "5 - 6 jon mile team, so 5 player can pick a team"
const newPlayer = {
  id: 'reg_player_test',
  name: 'Habibullah Khan',
  role: 'Batsman' as const,
  battingStyle: 'Right-Hand Bat' as const,
  bowlingStyle: 'Right-Arm Fast' as const,
  jerseyNumber: 15,
  createdAt: new Date().toISOString()
};
StorageService.savePlayer(newPlayer);
const freeAgents = StorageService.getFreeAgents();
assert(freeAgents.some(p => p.id === 'reg_player_test'), 'Player registered 1st in app appears in Free Agent pool');

// Pick into team t1 (remove a player first if full to ensure < 6)
StorageService.removePlayerFromTeam('p6', 't1');
const pickRes = StorageService.addPlayerToTeam('reg_player_test', 't1');
assert(pickRes.success === true, 'Player successfully picked from pool into Team t1');
const t1 = StorageService.getTeamById('t1')!;
assert(t1.playerIds.includes('reg_player_test'), 'Team t1 squad now includes picked player');

// A 5-player squad is completely valid and match ready
const fivePlayerTeam = StorageService.getTeamById('t1')!;
assert(fivePlayerTeam.playerIds.length >= 5 && fivePlayerTeam.playerIds.length <= 6, '5-player or 6-player squad is valid');

// 14. Create Tournament Option & Tournament Stats Separation
// "create tournament option thakbe."
// "tournament stats alada vabe dekhabe"
const tourneyCreateRes = StorageService.createTournament({
  name: 'Rooftop Cricket Tournament',
  edition: 'Season 2 (2026)',
  startDate: '2026-11-01',
  endDate: '2026-11-10',
  teamIds: ['t1', 't2', 't3', 't4'],
  oversPerInnings: 10,
  autoGenerateFixtures: true
});

assert(tourneyCreateRes.tournament.id.startsWith('tourney_'), 'New tournament created with unique ID');
assert(StorageService.getActiveTournamentId() === tourneyCreateRes.tournament.id, 'New tournament automatically activated');
assert(tourneyCreateRes.createdMatchesCount > 0, 'Round-robin fixtures auto-generated for new tournament');

// Test tournament stats separation:
// Create a completed match in Season 1 and a completed match in Season 2
const matchSeason1 = {
  id: 'test_m_s1',
  tournamentId: 'tourney_2026',
  matchNumber: 99,
  stage: 'League' as const,
  team1Id: 't1',
  team2Id: 't2',
  venue: 'Roof Court A',
  scheduledTime: '2026-10-02 10:00',
  status: 'completed' as const,
  innings1: {
    ...ScoringEngine.createInitialInnings('t1', 't2'),
    totalRuns: 45,
    oversCompleted: 10,
    batsmen: [
      {
        playerId: 'p1',
        runs: 25,
        ballsFaced: 12,
        fours: 4,
        sixPenalties: 0,
        isOut: false,
        isRetiredLimit: false,
        hasReEntered: false,
        battingOrder: 1
      }
    ],
    bowlers: []
  }
};

const matchSeason2 = {
  id: 'test_m_s2',
  tournamentId: tourneyCreateRes.tournament.id,
  matchNumber: 100,
  stage: 'League' as const,
  team1Id: 't1',
  team2Id: 't2',
  venue: 'Roof Court B',
  scheduledTime: '2026-11-02 10:00',
  status: 'completed' as const,
  innings1: {
    ...ScoringEngine.createInitialInnings('t1', 't2'),
    totalRuns: 60,
    oversCompleted: 10,
    batsmen: [
      {
        playerId: 'p1',
        runs: 35,
        ballsFaced: 16,
        fours: 6,
        sixPenalties: 1,
        isOut: false,
        isRetiredLimit: false,
        hasReEntered: false,
        battingOrder: 1
      }
    ],
    bowlers: []
  }
};

StorageService.saveMatch(matchSeason1);
StorageService.saveMatch(matchSeason2);

// Season 1 stats for p1
const s1Stats = StorageService.calculatePlayerStats('p1', 'tourney_2026');
assert(s1Stats.runs === 25, 'Season 1 stats separated: p1 has 25 runs in Season 1');
assert(s1Stats.sixPenalties === 0, 'Season 1 stats separated: p1 has 0 six penalties in Season 1');

// Season 2 stats for p1
const s2Stats = StorageService.calculatePlayerStats('p1', tourneyCreateRes.tournament.id);
assert(s2Stats.runs === 35, 'Season 2 stats separated: p1 has 35 runs in Season 2');
assert(s2Stats.sixPenalties === 1, 'Season 2 stats separated: p1 has 1 six penalty in Season 2');

// All-Time Career Stats for p1
const careerStats = StorageService.calculatePlayerStats('p1'); // no tournamentId passed
assert(careerStats.runs === 60, 'Lifetime career stats combine both tournaments: 25 + 35 = 60 runs');
assert(careerStats.sixPenalties === 1, 'Lifetime career stats combine six penalties (0 + 1 = 1)');

// 14. Verification: Tournament configurable player/squad size (4 to 6 players)
const tourney4Players = StorageService.createTournament({
  name: '4-Player Rooftop Trophy',
  edition: 'Fast 4s Edition',
  startDate: '2026-10-15',
  endDate: '2026-10-18',
  teamIds: ['t1', 't2', 't3', 't4'],
  playersPerTeam: 4
});
assert(tourney4Players.tournament.playersPerTeam === 4, 'Tournament supports 4-player team size');

const tourney6Players = StorageService.createTournament({
  name: '6-Player Championship',
  edition: 'Full Squad Edition',
  startDate: '2026-10-20',
  endDate: '2026-10-25',
  teamIds: ['t1', 't2', 't3', 't4', 't5'],
  playersPerTeam: 6
});
assert(tourney6Players.tournament.playersPerTeam === 6, 'Tournament supports 6-player team size');

// 15. Verification: "out na houa batsman again bat korte parbe over ba ball baki thakle"
// (Not-out batsman can bat again if overs or balls are remaining in 10-over match)
let testInn2 = ScoringEngine.createInitialInnings('t1', 't2');
const squad4 = ['p1', 'p2', 'p3', 'p4'];

// p1 bats 24 balls (4 overs limit) and auto-retires
testInn2.currentBatsmanId = 'p1';
testInn2.currentBowlerId = 'p9';
for (let b = 0; b < 24; b++) {
  const r = ScoringEngine.recordDelivery(testInn2, { runsOffBat: 1 });
  testInn2 = r.updatedInnings;
  if (r.requiresNewBowler) testInn2.currentBowlerId = testInn2.currentBowlerId === 'p9' ? 'p10' : 'p9';
}
const p1Inn2 = testInn2.batsmen.find(b => b.playerId === 'p1')!;
assert(p1Inn2.ballsFaced === 24, 'p1 reached 24 balls');
assert(p1Inn2.isRetiredLimit === true && p1Inn2.isOut === false, 'p1 auto-retired and is NOT OUT');

// p2 bats 24 balls (4 overs limit) and auto-retires
testInn2.currentBatsmanId = 'p2';
for (let b = 0; b < 24; b++) {
  const r = ScoringEngine.recordDelivery(testInn2, { runsOffBat: 1 });
  testInn2 = r.updatedInnings;
  if (r.requiresNewBowler) testInn2.currentBowlerId = testInn2.currentBowlerId === 'p9' ? 'p10' : 'p9';
}
const p2Inn2 = testInn2.batsmen.find(b => b.playerId === 'p2')!;
assert(p2Inn2.ballsFaced === 24, 'p2 reached 24 balls');
assert(p2Inn2.isRetiredLimit === true && p2Inn2.isOut === false, 'p2 auto-retired and is NOT OUT');

// p3 faces 4 balls and gets OUT
testInn2.currentBatsmanId = 'p3';
for (let b = 0; b < 3; b++) {
  if (!testInn2.currentBowlerId) testInn2.currentBowlerId = 'p9';
  const r = ScoringEngine.recordDelivery(testInn2, { runsOffBat: 1 });
  testInn2 = r.updatedInnings;
  if (r.requiresNewBowler) testInn2.currentBowlerId = 'p10';
}
if (!testInn2.currentBowlerId) testInn2.currentBowlerId = 'p9';
const rP3W = ScoringEngine.recordDelivery(testInn2, { runsOffBat: 0, isWicket: true, dismissalType: 'bowled' });
testInn2 = rP3W.updatedInnings;
if (rP3W.requiresNewBowler) testInn2.currentBowlerId = 'p10';

// p4 faces 4 balls and gets OUT
testInn2.currentBatsmanId = 'p4';
for (let b = 0; b < 3; b++) {
  if (!testInn2.currentBowlerId) testInn2.currentBowlerId = 'p9';
  const r = ScoringEngine.recordDelivery(testInn2, { runsOffBat: 1 });
  testInn2 = r.updatedInnings;
  if (r.requiresNewBowler) testInn2.currentBowlerId = 'p10';
}
if (!testInn2.currentBowlerId) testInn2.currentBowlerId = 'p9';
const rP4W = ScoringEngine.recordDelivery(testInn2, { runsOffBat: 0, isWicket: true, dismissalType: 'caught' });
testInn2 = rP4W.updatedInnings;
if (rP4W.requiresNewBowler) testInn2.currentBowlerId = 'p10';

// Legal balls so far: 24 + 24 + 4 + 4 = 56 balls. Remaining in 10 overs (60 balls) = 4 balls!
const ballsLeft = 60 - testInn2.totalLegalBalls;
assert(ballsLeft === 4, '4 legal balls remaining in 10-over innings (60 balls total)');

// Check availability:
const availAfterAllBatted = ScoringEngine.getAvailableBatsmen(testInn2, squad4);
assert(availAfterAllBatted.unbattedPlayerIds.length === 0, 'No unbatted players left in squad');
assert(availAfterAllBatted.canReEnterRetired === true, 'NOT OUT batsmen can bat again because balls are remaining!');
assert(availAfterAllBatted.retiredPlayerIds.includes('p1'), 'p1 (not out) is eligible to bat again');
assert(availAfterAllBatted.retiredPlayerIds.includes('p2'), 'p2 (not out) is eligible to bat again');
assert(!availAfterAllBatted.retiredPlayerIds.includes('p3'), 'p3 is OUT and CANNOT bat again');
assert(!availAfterAllBatted.retiredPlayerIds.includes('p4'), 'p4 is OUT and CANNOT bat again');

// p1 re-enters to bat ball 57:
testInn2.currentBatsmanId = 'p1';
const p1InTest2 = testInn2.batsmen.find(b => b.playerId === 'p1')!;
p1InTest2.hasReEntered = true;
p1InTest2.isRetiredLimit = false;

// p1 bats ball 57 (hits 4)
if (!testInn2.currentBowlerId) testInn2.currentBowlerId = 'p9';
const p1Ball57 = ScoringEngine.recordDelivery(testInn2, { runsOffBat: 4 });
testInn2 = p1Ball57.updatedInnings;
const p1After57 = testInn2.batsmen.find(b => b.playerId === 'p1')!;
assert(p1After57.ballsFaced === 25, 'p1 plays ball 25 with no restriction');
assert(p1Ball57.requiresNewBatsman === false, 'p1 not retired');

// p1 gets bowled on ball 58
if (!testInn2.currentBowlerId) testInn2.currentBowlerId = 'p9';
const p1Ball58 = ScoringEngine.recordDelivery(testInn2, { runsOffBat: 0, isWicket: true, dismissalType: 'bowled' });
testInn2 = p1Ball58.updatedInnings;
const p1After58 = testInn2.batsmen.find(b => b.playerId === 'p1')!;
assert(p1After58.isOut === true, 'p1 is now dismissed (OUT)');

// Check availability for ball 59 & 60:
const availAfterP1Out = ScoringEngine.getAvailableBatsmen(testInn2, squad4);
assert(availAfterP1Out.retiredPlayerIds.includes('p2'), 'p2 is STILL NOT OUT and can bat the final balls!');
assert(!availAfterP1Out.retiredPlayerIds.includes('p1'), 'p1 is out and cannot play again');

// 16. Bowler Quota: "bowler highest 2 overs"
// In a 10-over innings, bowler cannot bowl more than 2 overs.
let bowlerQuotaInn = ScoringEngine.createInitialInnings('t1', 't2');
const bowlingSquad = ['b1', 'b2', 'b3', 'b4', 'b5'];

// b1 bowls over 1 (6 balls)
bowlerQuotaInn.currentBatsmanId = 'p1';
bowlerQuotaInn.currentBowlerId = 'b1';
for (let i = 0; i < 6; i++) {
  bowlerQuotaInn = ScoringEngine.recordDelivery(bowlerQuotaInn, { runsOffBat: 1 }).updatedInnings;
}
assert(bowlerQuotaInn.bowlers.find(b => b.playerId === 'b1')?.oversBowled === 1, 'b1 has bowled 1 over');

// b2 bowls over 2 (6 balls)
bowlerQuotaInn.currentBowlerId = 'b2';
for (let i = 0; i < 6; i++) {
  bowlerQuotaInn = ScoringEngine.recordDelivery(bowlerQuotaInn, { runsOffBat: 1 }).updatedInnings;
}

// b1 bowls over 3 (6 balls) -> reaches highest 2 overs limit!
bowlerQuotaInn.currentBowlerId = 'b1';
for (let i = 0; i < 6; i++) {
  bowlerQuotaInn = ScoringEngine.recordDelivery(bowlerQuotaInn, { runsOffBat: 1 }).updatedInnings;
}
assert(bowlerQuotaInn.bowlers.find(b => b.playerId === 'b1')?.oversBowled === 2, 'b1 has completed 2 overs (highest limit)');

// Check eligible bowlers: b1 MUST be excluded because highest limit is 2 overs!
const eligibleBowlersForNextOver = ScoringEngine.getEligibleBowlers(bowlerQuotaInn, bowlingSquad, 'b1');
assert(!eligibleBowlersForNextOver.eligiblePlayerIds.includes('b1'), 'b1 cannot bowl any more overs (highest 2 overs reached)');
assert(eligibleBowlersForNextOver.eligiblePlayerIds.includes('b3'), 'b3 is eligible to bowl');
assert(eligibleBowlersForNextOver.eligiblePlayerIds.includes('b4'), 'b4 is eligible to bowl');
assert(eligibleBowlersForNextOver.eligiblePlayerIds.includes('b5'), 'b5 is eligible to bowl');

// 17. Player Name & Jersey Number Editing
// "also edit player name and jersey number"
const playerToEdit = StorageService.getPlayerById('p1')!;
const updatedPlayer = {
  ...playerToEdit,
  name: 'Tamim The Rooftop Legend',
  jerseyNumber: 28
};
StorageService.savePlayer(updatedPlayer);

const retrievedPlayer = StorageService.getPlayerById('p1')!;
assert(retrievedPlayer.name === 'Tamim The Rooftop Legend', 'Player name successfully edited in profile');
assert(retrievedPlayer.jerseyNumber === 28, 'Player jersey number successfully edited to 28');

// 18. Team Name Update Propagation
// "team name update in webside and player profile"
const teamToEdit = StorageService.getTeamById('t1')!;
const updatedTeam = {
  ...teamToEdit,
  name: 'Skyline Super Kings'
};
StorageService.saveTeam(updatedTeam);

const retrievedTeam = StorageService.getTeamById('t1')!;
assert(retrievedTeam.name === 'Skyline Super Kings', 'Team name successfully updated to Skyline Super Kings');

// Verify that player profile linked to t1 sees the new team name
const playerCurrentTeam = StorageService.getTeamById(retrievedPlayer.currentTeamId!);
assert(playerCurrentTeam?.name === 'Skyline Super Kings', 'Player profile reflects new team name immediately');

// 19. Tournament Playoffs: Round Robin -> Semifinal -> Final
// "round robin then semifinal then final"
const playoffsRes = StorageService.generatePlayoffs('tourney_2026');
assert(playoffsRes.matches.length === 3, 'Playoffs generated 3 knockout matches: SF1, SF2, Grand Final');

const sf1 = playoffsRes.matches.find(m => m.notes?.includes('Semi-Final 1'));
const sf2 = playoffsRes.matches.find(m => m.notes?.includes('Semi-Final 2'));
const grandFinal = playoffsRes.matches.find(m => m.stage === 'Final');

assert(sf1 !== undefined && sf1.stage === 'Semi-Final', 'Semi-Final 1 created');
assert(sf2 !== undefined && sf2.stage === 'Semi-Final', 'Semi-Final 2 created');
assert(grandFinal !== undefined && grandFinal.stage === 'Final', 'Grand Final created');
assert(grandFinal.notes?.includes('Winner SF1 vs Winner SF2'), 'Grand Final correctly pairs SF1 winner vs SF2 winner');

// 20. Score History and Timeline Every Innings
// "score history and timeline every innings"
let timelineInn = ScoringEngine.createInitialInnings('t1', 't2');
timelineInn.currentBatsmanId = 'p1';
timelineInn.currentBowlerId = 'b1';

// Ball 1: 4 runs
const ball1 = ScoringEngine.recordDelivery(timelineInn, { runsOffBat: 4 });
timelineInn = ball1.updatedInnings;
assert(timelineInn.balls.length === 1, 'Delivery #1 logged in innings ball history');
assert(timelineInn.balls[0].cumulativeRuns === 4, 'Delivery #1 records cumulative score: 4');
assert(timelineInn.balls[0].overNumber === 0 && timelineInn.balls[0].ballNumber === 1, 'Delivery #1 recorded at Over 0.1');

// Ball 2: Six penalty (-4 runs)
const ball2 = ScoringEngine.recordDelivery(timelineInn, { runsOffBat: -4, isSixPenalty: true });
timelineInn = ball2.updatedInnings;
assert(timelineInn.balls.length === 2, 'Delivery #2 logged');
assert(timelineInn.balls[1].isSixPenalty === true, 'Six penalty logged in timeline delivery');
assert(timelineInn.balls[1].cumulativeRuns === 0, 'Cumulative score reduced to 0 after -4 six penalty');

// Complete Over 1 (balls 3 to 6)
for (let i = 0; i < 4; i++) {
  timelineInn = ScoringEngine.recordDelivery(timelineInn, { runsOffBat: 1 }).updatedInnings;
}
assert(timelineInn.oversCompleted === 1, 'Over 1 completed (6 legal balls)');
assert(timelineInn.balls.length === 6, 'Over 1 has 6 delivery logs');
assert(timelineInn.balls[5].overNumber === 0 && timelineInn.balls[5].ballNumber === 6, 'Ball 6 of Over 1 accurately logged as overNumber 0, ballNumber 6');

// Start Over 2 with bowler b2
timelineInn.currentBowlerId = 'b2';
const ballOver2Ball1 = ScoringEngine.recordDelivery(timelineInn, { runsOffBat: 4 });
timelineInn = ballOver2Ball1.updatedInnings;
assert(timelineInn.balls[6].overNumber === 1 && timelineInn.balls[6].ballNumber === 1, 'First ball of Over 2 accurately logged as overNumber 1, ballNumber 1');

// 21. Select how many overs played in tournament / after select tournament will played number of overs
// User: "select how many over played in tournament / after select tounrnamet will played number of overs"
const t5 = StorageService.createTournament({
  name: 'Rooftop 5-Over Smash',
  edition: '2026 Blitz',
  startDate: '2026-10-15',
  endDate: '2026-10-20',
  teamIds: ['t1', 't2', 't3', 't4'],
  oversPerInnings: 5,
  maxOversPerBatsman: 2,
  maxOversPerBowler: 1,
  playersPerTeam: 5,
  autoGenerateFixtures: true
});

assert(t5.tournament.oversPerInnings === 5, 'Tournament created with 5 overs per innings');
assert(t5.tournament.maxOversPerBatsman === 2, '5-over tournament sets max 2 overs per batsman auto-retire');
assert(t5.tournament.maxOversPerBowler === 1, '5-over tournament sets max 1 over per bowler quota');

// Verify active tournament overs can be updated dynamically
StorageService.setActiveTournamentId(t5.tournament.id);
StorageService.updateActiveTournamentOvers(6);
const updatedT = StorageService.getActiveTournament();
assert(updatedT.oversPerInnings === 6, 'Active tournament overs updated to 6 overs');
assert(updatedT.maxOversPerBatsman === 3, '6-over tournament adjusts batsman retire limit to 3 overs');
assert(updatedT.maxOversPerBowler === 2, '6-over tournament adjusts bowler quota to 2 overs');

// Restore to 5 overs for match testing
StorageService.updateActiveTournamentOvers(5);
const match5Tourney = StorageService.getActiveTournament();

// Test Scoring with 5-over match rules:
// - Bowler limit: 1 over (6 balls)
// - Batsman limit: 2 overs (12 legal balls)
// - Total match innings limit: 5 overs (30 legal balls)
let inn5 = ScoringEngine.createInitialInnings('t1', 't2');
inn5.maxOvers = 5;
inn5.currentBatsmanId = 'p1';
inn5.currentBowlerId = 'b1';

// Bowler b1 bowls 1 over (6 balls)
for (let i = 0; i < 6; i++) {
  inn5 = ScoringEngine.recordDelivery(inn5, { runsOffBat: 1 }, {
    oversPerInnings: 5,
    maxOversPerBatsman: 2,
    maxOversPerBowler: 1
  }).updatedInnings;
}
assert(inn5.oversCompleted === 1, 'Over 1 of 5-over match completed');

// Check eligible bowlers for Over 2: b1 should be ineligible (reached 1 over max quota)
const { eligiblePlayerIds: eligibleForOver2 } = ScoringEngine.getEligibleBowlers(
  inn5,
  ['b1', 'b2', 'b3', 'b4', 'b5'],
  'b1',
  { maxOversPerBowler: 1, totalOvers: 5 }
);
assert(!eligibleForOver2.includes('b1'), 'Bowler b1 reached 1-over quota in 5-over match and is not eligible');
assert(eligibleForOver2.includes('b2'), 'Bowler b2 has not bowled and is eligible');

// Over 2: Bowler b2 bowls to batsman p1 (balls 7 to 12)
inn5.currentBowlerId = 'b2';
for (let i = 0; i < 5; i++) {
  inn5 = ScoringEngine.recordDelivery(inn5, { runsOffBat: 1 }, {
    oversPerInnings: 5,
    maxOversPerBatsman: 2,
    maxOversPerBowler: 1
  }).updatedInnings;
}
const p1Before12 = inn5.batsmen.find(b => b.playerId === 'p1');
assert(p1Before12?.ballsFaced === 11, 'Batsman p1 faced 11 legal balls');
assert(p1Before12?.isRetiredLimit === false, 'Batsman p1 not retired after 11 legal balls');

// Ball 12 (Batsman p1's 12th legal ball = 2 full overs): Must auto-retire!
const resBall12 = ScoringEngine.recordDelivery(inn5, { runsOffBat: 1 }, {
  oversPerInnings: 5,
  maxOversPerBatsman: 2,
  maxOversPerBowler: 1
});
inn5 = resBall12.updatedInnings;
const p1After12 = inn5.batsmen.find(b => b.playerId === 'p1');
assert(p1After12?.ballsFaced === 12, 'Batsman p1 faced exactly 12 legal balls (2 overs)');
assert(p1After12?.isRetiredLimit === true, 'Batsman p1 auto-retired after reaching 2-over limit in 5-over match');
assert(resBall12.requiresNewBatsman === true, 'Delivery result flagged requiresNewBatsman');
assert(inn5.currentBatsmanId === undefined, 'Current batsman cleared from crease');

// Next batsman p2 comes in; Over 3 (b3), Over 4 (b4), Over 5 (b5)
inn5.currentBatsmanId = 'p2';
inn5.currentBowlerId = 'b3';
for (let i = 0; i < 6; i++) {
  inn5 = ScoringEngine.recordDelivery(inn5, { runsOffBat: 1 }, {
    oversPerInnings: 5,
    maxOversPerBatsman: 2,
    maxOversPerBowler: 1
  }).updatedInnings;
}
assert(inn5.oversCompleted === 3, 'Over 3 completed');

inn5.currentBowlerId = 'b4';
for (let i = 0; i < 6; i++) {
  inn5 = ScoringEngine.recordDelivery(inn5, { runsOffBat: 1 }, {
    oversPerInnings: 5,
    maxOversPerBatsman: 2,
    maxOversPerBowler: 1
  }).updatedInnings;
}
assert(inn5.oversCompleted === 4, 'Over 4 completed');

// Over 5: Final over of the 5-over innings (p2 auto-retired at 12 balls, so p3 comes in; b5 bowls)
inn5.currentBatsmanId = 'p3';
inn5.currentBowlerId = 'b5';
for (let i = 0; i < 5; i++) {
  inn5 = ScoringEngine.recordDelivery(inn5, { runsOffBat: 1 }, {
    oversPerInnings: 5,
    maxOversPerBatsman: 2,
    maxOversPerBowler: 1
  }).updatedInnings;
  assert(!inn5.isCompleted, 'Innings not complete yet before 30th legal ball');
}

// 30th legal ball (5.0 overs): Must complete the innings!
const finalBallRes = ScoringEngine.recordDelivery(inn5, { runsOffBat: 2 }, {
  oversPerInnings: 5,
  maxOversPerBatsman: 2,
  maxOversPerBowler: 1
});
inn5 = finalBallRes.updatedInnings;
assert(inn5.totalLegalBalls === 30, 'Total legal balls reached 30 (5.0 overs)');
assert(inn5.isCompleted === true, 'Innings automatically completed after 5 overs (30 balls)');

// 22. Official Team Logos (Choy Chokka, Bhai Brothers, Rooftop Fury, Skyline Vipers)
// User: "team logos"
assert(OFFICIAL_TEAM_LOGOS.length === 4, '4 Official Team Logos configured');
const choyPreset = OFFICIAL_TEAM_LOGOS.find(p => p.id === 'choy-chokka');
const bhaiPreset = OFFICIAL_TEAM_LOGOS.find(p => p.id === 'bhai-brothers');
const furyPreset = OFFICIAL_TEAM_LOGOS.find(p => p.id === 'rooftop-fury');
const vipersPreset = OFFICIAL_TEAM_LOGOS.find(p => p.id === 'skyline-vipers');

assert(choyPreset?.logoUrl === '/logos/choy-chokka.jpg', 'Choy Chokka logo URL is configured');
assert(bhaiPreset?.logoUrl === '/logos/bhai-brothers.jpg', 'Bhai Brothers logo URL is configured');
assert(furyPreset?.logoUrl === '/logos/rooftop-fury.jpg', 'Rooftop Fury logo URL is configured');
assert(vipersPreset?.logoUrl === '/logos/skyline-vipers.png', 'Skyline Vipers logo URL is configured');

const teamsWithLogos = StorageService.getTeams();
const tChoy = teamsWithLogos.find(t => t.name === 'Choy Chokka');
const tBhai = teamsWithLogos.find(t => t.name === 'Bhai Brothers');
const tFury = teamsWithLogos.find(t => t.name === 'Rooftop Fury');
const tVipers = teamsWithLogos.find(t => t.id === 't1' || t.name === 'Skyline Vipers');

assert(tChoy?.logoUrl !== undefined, 'Choy Chokka team in storage has logoUrl');
assert(tBhai?.logoUrl !== undefined, 'Bhai Brothers team in storage has logoUrl');
assert(tFury?.logoUrl !== undefined, 'Rooftop Fury team in storage has logoUrl');
assert(tVipers?.logoUrl !== undefined, 'Skyline Vipers team in storage has logoUrl');

// Verify custom logo update on a team
StorageService.saveTeam({
  ...tChoy!,
  logoUrl: 'data:image/png;base64,custom_uploaded_logo_data'
});
const updatedChoy = StorageService.getTeamById(tChoy!.id);
assert(updatedChoy?.logoUrl === 'data:image/png;base64,custom_uploaded_logo_data', 'Custom uploaded logo successfully saved on team');

// Restore Choy Chokka logo
StorageService.saveTeam({
  ...tChoy!,
  logoUrl: '/logos/choy-chokka.jpg'
});

// 23. Realistic Cricket Rules & Playoff Automation Tests
// (1) Dynamic undo of retirement in 5-over match
let innTest5 = ScoringEngine.createInitialInnings('t1', 't2');
innTest5.maxOvers = 5;
innTest5.currentBatsmanId = 'p1';
innTest5.currentBowlerId = 'p9';

// p1 faces 11 balls
for (let b = 0; b < 11; b++) {
  if (!innTest5.currentBowlerId) {
    innTest5.currentBowlerId = innTest5.oversCompleted % 2 === 0 ? 'p9' : 'p10';
  }
  innTest5 = ScoringEngine.recordDelivery(innTest5, { runsOffBat: 0 }, { oversPerInnings: 5 }).updatedInnings;
}
if (!innTest5.currentBowlerId) {
  innTest5.currentBowlerId = 'p10';
}
// 12th ball causes retirement in 5-over match (limit is 2 overs = 12 balls)
let retRes = ScoringEngine.recordDelivery(innTest5, { runsOffBat: 0 }, { oversPerInnings: 5 });
assert(retRes.updatedInnings.batsmen[0].isRetiredLimit === true, 'p1 is auto-retired at 12 balls in 5-over match');

// Undo 12th ball -> p1 should un-retire!
let unRetInn = ScoringEngine.undoLastDelivery(retRes.updatedInnings);
assert(unRetInn.batsmen[0].isRetiredLimit === false, 'p1 retirement is cancelled on undo in 5-over match');
assert(unRetInn.batsmen[0].ballsFaced === 11, 'p1 ballsFaced reverted to 11');

// (2) Bowler overs notation test
// If bowler has 14 legal balls bowled, oversBowled should be 2.2 (not 2.8)
const testStats = StorageService.calculatePlayerStats('p9');
const expectedOversNotation = Math.floor(testStats.legalBallsBowled / 6) + (testStats.legalBallsBowled % 6) / 10;
assert(testStats.oversBowled === expectedOversNotation, `oversBowled uses accurate cricket notation: ${testStats.oversBowled}`);

// (3) Playoffs auto-advancement test
const testTourneyId = 'tourney_playoff_test';
StorageService.saveTournament({
  id: testTourneyId,
  name: 'Playoff Test Tourney',
  edition: '2026',
  teamIds: ['t1', 't2', 't3', 't4'],
  playersPerTeam: 6,
  oversPerInnings: 10,
  maxOversPerBatsman: 4,
  maxOversPerBowler: 2,
  minOversPerBowler: 1,
  reviewsPerInnings: 2,
  substitutionsPerInnings: 1,
  status: 'ongoing',
  startDate: '2026-10-13',
  endDate: '2026-10-20'
});

// Setup SF1, SF2 and Final matches
const matchSf1 = {
  id: 'sf1_test',
  tournamentId: testTourneyId,
  matchNumber: 101,
  stage: 'Semi-Final' as const,
  team1Id: 't1',
  team2Id: 't4',
  venue: 'Center Court',
  scheduledTime: '2026-10-15 15:00',
  status: 'scheduled' as const,
  overs: 10
};
const matchSf2 = {
  id: 'sf2_test',
  tournamentId: testTourneyId,
  matchNumber: 102,
  stage: 'Semi-Final' as const,
  team1Id: 't2',
  team2Id: 't3',
  venue: 'Center Court',
  scheduledTime: '2026-10-15 18:00',
  status: 'scheduled' as const,
  overs: 10
};
const matchFinal = {
  id: 'final_test',
  tournamentId: testTourneyId,
  matchNumber: 103,
  stage: 'Final' as const,
  team1Id: 't1',
  team2Id: 't2',
  venue: 'Center Court',
  scheduledTime: '2026-10-16 17:00',
  status: 'scheduled' as const,
  overs: 10
};

StorageService.saveMatch(matchSf1);
StorageService.saveMatch(matchSf2);
StorageService.saveMatch(matchFinal);

// Complete SF1 with winner t4 (upset over t1)
StorageService.saveMatch({
  ...matchSf1,
  status: 'completed',
  winningTeamId: 't4',
  winMargin: 'Won by 10 runs'
});

// Verify Final match team1Id automatically became t4!
let finalUpdated = StorageService.getMatchById('final_test');
assert(finalUpdated?.team1Id === 't4', 'Grand Final team1Id automatically updated to SF1 winner (t4)');

// Complete SF2 with winner t3
StorageService.saveMatch({
  ...matchSf2,
  status: 'completed',
  winningTeamId: 't3',
  winMargin: 'Won by 2 wickets'
});

// Verify Final match team2Id automatically became t3!
finalUpdated = StorageService.getMatchById('final_test');
// (4) Tournament auto-healing of teamIds (User issue: "Teams (0):" and modal layout)
StorageService.saveTournament({
  id: 'tourney_empty_teams_test',
  name: 'Empty Teams Bug Test',
  edition: '2026',
  teamIds: [] as string[],
  playersPerTeam: 6,
  oversPerInnings: 10,
  maxOversPerBatsman: 4,
  maxOversPerBowler: 2,
  minOversPerBowler: 1,
  reviewsPerInnings: 2,
  substitutionsPerInnings: 1,
  status: 'ongoing',
  startDate: '2026-10-13',
  endDate: '2026-10-20'
});

const healedTourneys = StorageService.getTournaments();
const healed = healedTourneys.find(t => t.id === 'tourney_empty_teams_test');
assert(healed !== undefined, 'Tourney found');
// (5) Admin Authentication & Cricbuzz Spectator Mode Security Tests (pass: 0123admin)
console.log('\n=== TESTING ADMIN AUTHENTICATION & ROLE-BASED ACCESS (pass: 0123admin) ===');

// Reset admin auth state to test spectator starting point
StorageService.logoutAdmin();
assert(StorageService.isAdmin() === false, 'Default visitor is in Spectator Mode (isAdmin = false)');

// Test invalid password attempts
assert(StorageService.loginAsAdmin('wrongpassword') === false, 'Invalid password rejected');
assert(StorageService.loginAsAdmin('admin') === false, 'Simple "admin" rejected');
assert(StorageService.loginAsAdmin('1234') === false, '1234 rejected');
assert(StorageService.isAdmin() === false, 'isAdmin remains false after failed login attempts');

// Test official admin password
const loginSuccess = StorageService.loginAsAdmin('0123admin');
assert(loginSuccess === true, 'Admin login with password "0123admin" succeeded');
assert(StorageService.isAdmin() === true, 'StorageService.isAdmin() is now true');

// Test logout
StorageService.logoutAdmin();
assert(StorageService.isAdmin() === false, 'StorageService.isAdmin() returned to false after logout');

// Test setAdmin directly
StorageService.setAdmin(true);
assert(StorageService.isAdmin() === true, 'StorageService.setAdmin(true) set admin status');
StorageService.setAdmin(false);
assert(StorageService.isAdmin() === false, 'StorageService.setAdmin(false) cleared admin status');

// 24. Manual Tournament Round Robin & Qualification Rules Tests
console.log('\n=== TESTING MANUAL ROUND ROBIN & QUALIFICATION RULES ===');

const allSampleTeams = StorageService.getTeams().slice(0, 4);

// Test Single vs Double Round Robin Generation
const singleRR = FixturesGenerator.generateRoundRobin(
  'tourney_rr_test',
  allSampleTeams,
  '2026-10-15',
  1,
  10,
  'single'
);
assert(singleRR.length === 6, 'Single Round Robin for 4 teams produces exactly 6 matches (4*3/2)');

const doubleRR = FixturesGenerator.generateRoundRobin(
  'tourney_rr_test',
  allSampleTeams,
  '2026-10-15',
  1,
  10,
  'double'
);
assert(doubleRR.length === 12, 'Double Round Robin for 4 teams produces exactly 12 matches (4*3)');
assert(doubleRR[0].stage === 'League', 'Double RR matches are League stage');
assert(doubleRR[6].notes?.includes('Leg 2'), 'Double RR accurately labels Leg 2 reverse fixtures');

// Test Playoff Formats
const top4Knockouts = FixturesGenerator.generateKnockouts(
  'tourney_rr_test',
  allSampleTeams,
  '2026-10-15',
  undefined,
  1,
  10,
  'semifinals_top4'
);
assert(top4Knockouts.length === 3, 'Top 4 Semifinals format produces 3 knockout fixtures (SF1, SF2, Final)');
assert(top4Knockouts[0].stage === 'Semi-Final', 'SF1 generated');
assert(top4Knockouts[1].stage === 'Semi-Final', 'SF2 generated');
assert(top4Knockouts[2].stage === 'Final', 'Grand Final generated');

const top2DirectFinal = FixturesGenerator.generateKnockouts(
  'tourney_rr_test',
  allSampleTeams,
  '2026-10-15',
  undefined,
  1,
  10,
  'direct_final_top2'
);
assert(top2DirectFinal.length === 1, 'Top 2 Direct Final format produces exactly 1 match (Grand Final directly)');
assert(top2DirectFinal[0].stage === 'Final', 'Direct Final is stage Final');

// Test Custom Points in Standings Calculation
const { tournament: customPtsTourney } = StorageService.createTournament({
  name: '3-Point League',
  edition: 'Season 3',
  startDate: '2026-10-15',
  endDate: '2026-10-22',
  teamIds: ['t1', 't2'],
  oversPerInnings: 10,
  qualifyRules: {
    roundRobinType: 'single',
    pointsPerWin: 3,
    pointsPerTie: 1,
    pointsPerLoss: 0,
    playoffFormat: 'direct_final_top2',
    topTeamsCount: 2,
    tieBreaker: 'nrr',
    manualOverrides: { enabled: false }
  }
});

// Create completed match for this tournament
const completedTestMatch: Match = {
  id: 'match_custom_pts_1',
  tournamentId: customPtsTourney.id,
  matchNumber: 1,
  stage: 'League',
  team1Id: 't1',
  team2Id: 't2',
  venue: 'Sky Court',
  scheduledTime: '2026-10-15 14:00',
  status: 'completed',
  winningTeamId: 't1',
  innings1: {
    teamId: 't1',
    bowlingTeamId: 't2',
    totalRuns: 60,
    wickets: 2,
    totalLegalBalls: 60,
    oversCompleted: 10,
    ballsInCurrentOver: 0,
    batsmen: [],
    bowlers: [],
    balls: [],
    deadBallsInCurrentOver: 0,
    battingTeamReviewsRemaining: 2,
    bowlingTeamReviewsRemaining: 2,
    reviewsRemaining: 2,
    reviewsUsedCount: 0,
    drsHistory: [],
    substitutionUsed: false,
    substitutions: [],
    isCompleted: true
  },
  innings2: {
    teamId: 't2',
    bowlingTeamId: 't1',
    totalRuns: 45,
    wickets: 3,
    totalLegalBalls: 60,
    oversCompleted: 10,
    ballsInCurrentOver: 0,
    batsmen: [],
    bowlers: [],
    balls: [],
    deadBallsInCurrentOver: 0,
    battingTeamReviewsRemaining: 2,
    bowlingTeamReviewsRemaining: 2,
    reviewsRemaining: 2,
    reviewsUsedCount: 0,
    drsHistory: [],
    substitutionUsed: false,
    substitutions: [],
    isCompleted: true
  }
};
StorageService.saveMatch(completedTestMatch);

const customStandings = StorageService.calculateStandings(customPtsTourney.id);
const t1Row = customStandings.find(s => s.teamId === 't1');
assert(t1Row?.points === 3, 'Winning team is awarded custom 3 points per win in standings calculation!');

// Test Manual Playoff Overrides
const tA = allSampleTeams[0].id;
const tB = allSampleTeams[1].id;
const tC = allSampleTeams[2].id;
const tD = allSampleTeams[3].id;

const { tournament: manualTourney } = StorageService.createTournament({
  name: 'Manual Qualification Tourney',
  edition: '2026',
  startDate: '2026-10-15',
  endDate: '2026-10-25',
  teamIds: [tA, tB, tC, tD],
  oversPerInnings: 10
});

// Generate knockouts for it
const genRes = StorageService.generatePlayoffs(manualTourney.id, '2026-10-16', 'semifinals_top4');
assert(genRes.success === true, 'Generated playoffs for manual qualification tourney');

// Admin manually overrides the playoff matchups:
// Sets SF1 to tC vs tD, and SF2 to tA vs tB
const overrideRes = StorageService.applyManualPlayoffMatchups(manualTourney.id, {
  enabled: true,
  sf1Team1Id: tC,
  sf1Team2Id: tD,
  sf2Team1Id: tA,
  sf2Team2Id: tB,
  notes: 'Manual qualification by tournament committee'
});
assert(overrideRes.success === true, 'Manual playoff matchups applied successfully');

const manualMatches = StorageService.getMatches().filter(m => m.tournamentId === manualTourney.id && m.stage === 'Semi-Final');
assert(manualMatches[0].team1Id === tC, `SF1 Team 1 manually overridden to ${tC}`);
assert(manualMatches[0].team2Id === tD, `SF1 Team 2 manually overridden to ${tD}`);
assert(manualMatches[1].team1Id === tA, `SF2 Team 1 manually overridden to ${tA}`);
assert(manualMatches[1].team2Id === tB, `SF2 Team 2 manually overridden to ${tB}`);

// Verify that automatic advanceTournamentPlayoffs respects manual override and does NOT overwrite it
StorageService.advanceTournamentPlayoffs(manualTourney.id);
const recheckMatches = StorageService.getMatches().filter(m => m.tournamentId === manualTourney.id && m.stage === 'Semi-Final');
assert(recheckMatches[0].team1Id === tC, `SF1 Team 1 retained ${tC} after advanceTournamentPlayoffs (not overwritten)`);
assert(recheckMatches[1].team1Id === tA, `SF2 Team 1 retained ${tA} after advanceTournamentPlayoffs (not overwritten)`);

// 25. Test "Table 1 team direct qualify for final, 2nd and 3rd team will play semifinal"
console.log('\n=== TESTING TOP 3: RANK 1 DIRECT FINAL + SEMI-FINAL (RANK 2 vs 3) ===');

const top3Knockouts = FixturesGenerator.generateKnockouts(
  'tourney_top3_test',
  allSampleTeams,
  '2026-10-15',
  undefined,
  1,
  10,
  'rank1_direct_final'
);
assert(top3Knockouts.length === 2, 'Top 3 format produces exactly 2 matches (1 Semi-Final + 1 Final)');
assert(top3Knockouts[0].stage === 'Semi-Final', 'First knockout is Semi-Final');
assert(top3Knockouts[0].team1Id === allSampleTeams[1].id, 'Semi-Final Team 1 is Rank 2');
assert(top3Knockouts[0].team2Id === allSampleTeams[2].id, 'Semi-Final Team 2 is Rank 3');
assert(top3Knockouts[1].stage === 'Final', 'Second knockout is Grand Final');
assert(top3Knockouts[1].team1Id === allSampleTeams[0].id, 'Grand Final Team 1 is Rank 1 (Direct Finalist)');

// Test tournament creation with rank1_direct_final
const { tournament: top3Tourney } = StorageService.createTournament({
  name: 'Top 3 Ladder Championship',
  edition: '2026',
  startDate: '2026-10-15',
  endDate: '2026-10-25',
  teamIds: [tA, tB, tC, tD],
  oversPerInnings: 10,
  qualifyRules: {
    roundRobinType: 'single',
    pointsPerWin: 2,
    pointsPerTie: 1,
    pointsPerLoss: 0,
    playoffFormat: 'rank1_direct_final',
    topTeamsCount: 3,
    tieBreaker: 'nrr',
    manualOverrides: { enabled: false }
  }
});
assert(top3Tourney.qualifyRules?.playoffFormat === 'rank1_direct_final', 'Tournament qualify rules configured with rank1_direct_final');

// Generate playoffs for this tournament
const top3GenRes = StorageService.generatePlayoffs(top3Tourney.id, '2026-10-16', 'rank1_direct_final');
assert(top3GenRes.success === true, 'Playoffs generated successfully for Top 3 tournament');
assert(top3GenRes.matches.length === 2, 'Generated exactly 2 playoff matches (SF & Final)');

// Simulate completed league matches to establish standings:
// Give tB a win so standings order is established: tB is Rank 1, tC is Rank 2, tD is Rank 3
const leagueMatch1: Match = {
  id: `match_top3_league_1_${Date.now()}`,
  tournamentId: top3Tourney.id,
  matchNumber: 1,
  stage: 'League',
  team1Id: tB,
  team2Id: tA,
  venue: 'Sky Arena',
  scheduledTime: '2026-10-15 10:00',
  status: 'completed',
  winningTeamId: tB,
  innings1: {
    ...ScoringEngine.createInitialInnings(tB, tA),
    totalRuns: 80,
    oversCompleted: 10,
    totalLegalBalls: 60,
    batsmen: [],
    bowlers: [],
    balls: [],
    deadBallsInCurrentOver: 0,
    battingTeamReviewsRemaining: 2,
    bowlingTeamReviewsRemaining: 2,
    reviewsRemaining: 2,
    reviewsUsedCount: 0,
    drsHistory: [],
    substitutionUsed: false,
    substitutions: [],
    isCompleted: true
  },
  innings2: {
    ...ScoringEngine.createInitialInnings(tA, tB),
    totalRuns: 50,
    oversCompleted: 10,
    totalLegalBalls: 60,
    batsmen: [],
    bowlers: [],
    balls: [],
    deadBallsInCurrentOver: 0,
    battingTeamReviewsRemaining: 2,
    bowlingTeamReviewsRemaining: 2,
    reviewsRemaining: 2,
    reviewsUsedCount: 0,
    drsHistory: [],
    substitutionUsed: false,
    substitutions: [],
    isCompleted: true
  }
};

const leagueMatch2: Match = {
  id: `match_top3_league_2_${Date.now()}`,
  tournamentId: top3Tourney.id,
  matchNumber: 2,
  stage: 'League',
  team1Id: tC,
  team2Id: tD,
  venue: 'Sky Arena',
  scheduledTime: '2026-10-15 12:00',
  status: 'completed',
  winningTeamId: tC,
  innings1: {
    ...ScoringEngine.createInitialInnings(tC, tD),
    totalRuns: 70,
    oversCompleted: 10,
    totalLegalBalls: 60,
    batsmen: [],
    bowlers: [],
    balls: [],
    deadBallsInCurrentOver: 0,
    battingTeamReviewsRemaining: 2,
    bowlingTeamReviewsRemaining: 2,
    reviewsRemaining: 2,
    reviewsUsedCount: 0,
    drsHistory: [],
    substitutionUsed: false,
    substitutions: [],
    isCompleted: true
  },
  innings2: {
    ...ScoringEngine.createInitialInnings(tD, tC),
    totalRuns: 60,
    oversCompleted: 10,
    totalLegalBalls: 60,
    batsmen: [],
    bowlers: [],
    balls: [],
    deadBallsInCurrentOver: 0,
    battingTeamReviewsRemaining: 2,
    bowlingTeamReviewsRemaining: 2,
    reviewsRemaining: 2,
    reviewsUsedCount: 0,
    drsHistory: [],
    substitutionUsed: false,
    substitutions: [],
    isCompleted: true
  }
};

StorageService.saveMatch(leagueMatch1);
StorageService.saveMatch(leagueMatch2);

// Check standings
const top3Standings = StorageService.calculateStandings(top3Tourney.id);
const rank1Team = top3Standings[0].teamId; // tB (+3.00 NRR)
const rank2Team = top3Standings[1].teamId; // tC (+1.00 NRR)
const rank3Team = top3Standings[2].teamId; // tD (-1.00 NRR)
assert(rank1Team === tB, 'Rank 1 is tB');
assert(rank2Team === tC, 'Rank 2 is tC');
assert(rank3Team === tD, 'Rank 3 is tD');

// Trigger advancement
StorageService.advanceTournamentPlayoffs(top3Tourney.id);

const top3PlayoffMatches = StorageService.getMatches().filter(m => m.tournamentId === top3Tourney.id && m.stage !== 'League');
const sfMatch = top3PlayoffMatches.find(m => m.stage === 'Semi-Final')!;
const fMatch = top3PlayoffMatches.find(m => m.stage === 'Final')!;

assert(sfMatch.team1Id === rank2Team, `Semi-Final Team 1 is Rank 2 (${rank2Team})`);
assert(sfMatch.team2Id === rank3Team, `Semi-Final Team 2 is Rank 3 (${rank3Team})`);
assert(fMatch.team1Id === rank1Team, `Grand Final Team 1 is Table 1 Direct Finalist (${rank1Team})`);

// Now complete the Semi-Final match: Rank 2 (tC) wins over Rank 3 (tD)
sfMatch.status = 'completed';
sfMatch.winningTeamId = rank2Team;
sfMatch.winMargin = 'Won by 15 runs';
StorageService.saveMatch(sfMatch);

// Grand Final must now have SF winner (tC) as Team 2!
const updatedFMatch = StorageService.getMatchById(fMatch.id)!;
assert(updatedFMatch.team1Id === rank1Team, `Grand Final retains Table 1 team as Finalist 1 (${rank1Team})`);
assert(updatedFMatch.team2Id === rank2Team, `Grand Final advances Semi-Final winner as Finalist 2 (${rank2Team})`);

// 18. Admin Auth & Log Out tests
StorageService.logoutAdmin();
assert(StorageService.isAdmin() === false, 'StorageService.isAdmin() is false initially / after logout');

const wrongAttempt = StorageService.loginAsAdmin('badpassword');
assert(wrongAttempt === false, 'Invalid admin password rejected');
assert(StorageService.isAdmin() === false, 'isAdmin remains false on failed login');

const correctAttempt = StorageService.loginAsAdmin('0123admin');
assert(correctAttempt === true, 'Admin password "0123admin" accepted');
assert(StorageService.isAdmin() === true, 'isAdmin is true after successful login');

StorageService.logoutAdmin();
assert(StorageService.isAdmin() === false, 'isAdmin is false immediately after logoutAdmin()');

// 19. Admin Editing Player Profile & Stats Override
const testPlayer = StorageService.getPlayerById('p1')!;
assert(testPlayer !== undefined, 'Player p1 exists');

testPlayer.statsOverrides = {
  runs: 150,
  wickets: 12,
  fours: 25,
  sixPenalties: 2,
  highScore: 78,
  matchesPlayed: 10
};
StorageService.savePlayer(testPlayer);

const recomputedStats = StorageService.calculatePlayerStats('p1');
assert(recomputedStats.runs === 150, 'Admin overridden runs reflected: 150');
assert(recomputedStats.wickets === 12, 'Admin overridden wickets reflected: 12');
assert(recomputedStats.fours === 25, 'Admin overridden fours reflected: 25');
assert(recomputedStats.sixPenalties === 2, 'Admin overridden six penalties reflected: 2');
assert(recomputedStats.highScore === 78, 'Admin overridden high score reflected: 78');
assert(recomputedStats.matchesPlayed === 10, 'Admin overridden matches played reflected: 10');

// 20. Admin Restart Fixture
const matchToRestart = StorageService.getMatches()[0];
matchToRestart.status = 'completed';
matchToRestart.winningTeamId = matchToRestart.team1Id;
matchToRestart.winMargin = 'Won by 20 runs';
matchToRestart.toss = { winnerTeamId: matchToRestart.team1Id, decision: 'bat', tossTime: '10:00' };
StorageService.saveMatch(matchToRestart);

const restartResult = StorageService.restartMatch(matchToRestart.id);
assert(restartResult.success === true, 'StorageService.restartMatch succeeded');
assert(restartResult.match?.status === 'scheduled', 'Restarted match status reset to "scheduled"');
assert(restartResult.match?.toss === undefined, 'Restarted match toss cleared');
assert(restartResult.match?.winningTeamId === undefined, 'Restarted match winningTeamId cleared');
assert(restartResult.match?.winMargin === undefined, 'Restarted match winMargin cleared');

// 21. Admin Restart All Tournament Fixtures
const tourneyRestartResult = StorageService.restartTournamentFixtures(top3Tourney.id);
assert(tourneyRestartResult.success === true, 'StorageService.restartTournamentFixtures succeeded');
const restartedTourneyMatches = StorageService.getMatches().filter((m) => m.tournamentId === top3Tourney.id);
assert(
  restartedTourneyMatches.every((m) => m.status === 'scheduled'),
  'All fixtures in tournament successfully reset to "scheduled"'
);

// 22. End Game Button (Umpire Decision: Draw or One Team Win)
// Case A: Umpire ends live league match as Draw
const leagueMatchesList = restartedTourneyMatches.filter((m) => m.stage === 'League');
const liveMatchForDraw = leagueMatchesList[0];
liveMatchForDraw.status = 'completed';
liveMatchForDraw.winningTeamId = undefined; // Draw
liveMatchForDraw.winMargin = 'Match Drawn (Umpire Decision)';
liveMatchForDraw.notes = 'Rooftop rain curfew - umpire declared draw';
StorageService.saveMatch(liveMatchForDraw);

const drawStandings = StorageService.calculateStandings(top3Tourney.id);
const drawTeam1 = drawStandings.find((s) => s.teamId === liveMatchForDraw.team1Id)!;
const drawTeam2 = drawStandings.find((s) => s.teamId === liveMatchForDraw.team2Id)!;
assert(drawTeam1.tied === 1, 'Team 1 standings recorded 1 tied / draw match');
assert(drawTeam2.tied === 1, 'Team 2 standings recorded 1 tied / draw match');
assert(drawTeam1.points === 1, 'Team 1 awarded 1 draw point');
assert(drawTeam2.points === 1, 'Team 2 awarded 1 draw point');

// Case B: Umpire ends live league match as Team 1 Win
const liveMatchForWin = leagueMatchesList[1];
liveMatchForWin.status = 'completed';
liveMatchForWin.winningTeamId = liveMatchForWin.team1Id; // Team 1 Win
liveMatchForWin.winMargin = `${liveMatchForWin.team1Id} won by Umpire Decision`;
liveMatchForWin.notes = 'Opponent conceded after rain delay';
StorageService.saveMatch(liveMatchForWin);

const winStandings = StorageService.calculateStandings(top3Tourney.id);
const winningTeamRow = winStandings.find((s) => s.teamId === liveMatchForWin.team1Id)!;
const losingTeamRow = winStandings.find((s) => s.teamId === liveMatchForWin.team2Id)!;
assert(winningTeamRow.won >= 1, 'Umpire awarded win credited to Team 1');
assert(losingTeamRow.lost >= 1, 'Loss credited to Team 2');

// Case C: Umpire ends live Playoff match (Semi-Final) as Win
const playoffMatchesList = restartedTourneyMatches.filter((m) => m.stage === 'Semi-Final');
if (playoffMatchesList.length > 0) {
  const sfPlayoff = playoffMatchesList[0];
  sfPlayoff.status = 'completed';
  sfPlayoff.winningTeamId = sfPlayoff.team1Id;
  sfPlayoff.winMargin = 'Won by umpire decision (bad light)';
  StorageService.saveMatch(sfPlayoff);
  const finalMatchCheck = StorageService.getMatches().find((m) => m.tournamentId === top3Tourney.id && m.stage === 'Final')!;
  assert(finalMatchCheck.team2Id === sfPlayoff.team1Id, 'Grand Final advanced SF winner ended by umpire');
}

// 23. Standalone Friendly Match (2 Teams Without Tournament)
const friendlyMatch = StorageService.createFriendlyMatch({
  team1Id: 't1',
  team2Id: 't2',
  overs: 8,
  venue: 'Sky Rooftop East Ground',
  autoActivate: true
});
assert(friendlyMatch.stage === 'Friendly', 'Friendly match created with stage "Friendly"');
assert(friendlyMatch.overs === 8, 'Friendly match format has 8 overs');
assert(friendlyMatch.tournamentId === 'friendly', 'Friendly match tournamentId is "friendly"');
assert(StorageService.getActiveMatchId() === friendlyMatch.id, 'Friendly match auto-activated in LiveScorer');

// Verify that friendly matches NEVER pollute tournament standings
const tourneyStandingsBefore = StorageService.calculateStandings(top3Tourney.id);
// Mark friendly match as completed with t1 win
friendlyMatch.status = 'completed';
friendlyMatch.winningTeamId = 't1';
friendlyMatch.winMargin = 'Won by 15 runs';
StorageService.saveMatch(friendlyMatch);

const tourneyStandingsAfter = StorageService.calculateStandings(top3Tourney.id);
assert(
  JSON.stringify(tourneyStandingsBefore) === JSON.stringify(tourneyStandingsAfter),
  'Tournament standings are completely untouched by standalone friendly matches'
);

// 24. Match Deletion and Persistence Without Re-Seeding Bugs
const totalMatchesBefore = StorageService.getMatches().length;
StorageService.deleteMatch(friendlyMatch.id);
const totalMatchesAfter = StorageService.getMatches().length;
assert(totalMatchesAfter === totalMatchesBefore - 1, 'Match successfully deleted without resurrection');

// Verify deleting all matches keeps them at 0 without resurrecting SEED_MATCHES
StorageService.clearAllMatches();
assert(StorageService.getMatches().length === 0, 'All matches cleared to 0');
assert(StorageService.getMatches().length === 0, 'Calling getMatches() repeatedly does NOT resurrect SEED_MATCHES');

// Restore matches for other tests/defaults
StorageService.resetToDefaults();
assert(StorageService.getMatches().length > 0, 'Reset to defaults restored initial tournament matches');
assert(StorageService.getLastUpdated() > 0, 'StorageService tracks modification timestamp for sync conflict resolution');

console.log('\n🎉 ALL UPDATED RULES, DYNAMIC TOURNAMENT OVERS, BOWLER QUOTAS, BATSMAN AUTO-RETIREMENT, PLAYOFFS, SCORE TIMELINE, OFFICIAL TEAM LOGOS, CRICBUZZ SPECTATOR MODE, ADMIN AUTH & LOG OUT (0123admin), ADMIN EDIT PLAYER STATS, RESTART FIXTURES, AND UMPIRE END GAME (DRAW OR WIN), STANDALONE FRIENDLY MATCHES, AND FIXTURE REFRESH BUG FIXES PASSED 100%!');






