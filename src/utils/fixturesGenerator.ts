import { Match, Team, StandingsRow, PlayoffFormat, ManualPlayoffOverrides, RoundRobinType } from '../types/cricket';

export const FixturesGenerator = {
  // Generate round robin schedule for 2-6 teams (Single or Double Round Robin)
  generateRoundRobin(
    tournamentId: string,
    teams: Team[],
    startDateStr: string,
    startingMatchNum = 1,
    overs?: number,
    roundRobinType: RoundRobinType = 'single'
  ): Match[] {
    if (teams.length < 2) return [];

    const matches: Match[] = [];
    const teamIds = teams.map((t) => t.id);
    let matchCounter = startingMatchNum;
    const baseDate = new Date(startDateStr || new Date().toISOString());

    // Helper to generate a single round
    const addRound = (roundNumber: number, reverseHomeAway: boolean) => {
      for (let i = 0; i < teamIds.length; i++) {
        for (let j = i + 1; j < teamIds.length; j++) {
          const matchDate = new Date(baseDate);
          matchDate.setDate(
            baseDate.getDate() +
              Math.floor((matchCounter - startingMatchNum) / 2) +
              (roundNumber === 2 ? Math.ceil(teamIds.length / 2) + 1 : 0)
          );
          const hour = matchCounter % 2 === 1 ? 14 : 17; // 2:00 PM or 5:00 PM floodlit rooftop session
          matchDate.setHours(hour, 0, 0, 0);

          const venueCourt =
            matchCounter % 2 === 1 ? 'Sky Court North (Floodlit)' : 'Sky Court South';

          const t1 = reverseHomeAway ? teamIds[j] : teamIds[i];
          const t2 = reverseHomeAway ? teamIds[i] : teamIds[j];

          matches.push({
            id: `match_${Date.now()}_${matchCounter}`,
            tournamentId,
            matchNumber: matchCounter,
            stage: 'League',
            team1Id: t1,
            team2Id: t2,
            venue: venueCourt,
            scheduledTime: matchDate.toISOString().replace('T', ' ').slice(0, 16),
            status: 'scheduled',
            overs,
            notes:
              roundRobinType === 'double'
                ? `Round Robin Leg ${roundNumber} (Match #${matchCounter})`
                : `Round Robin Match #${matchCounter}`
          });
          matchCounter++;
        }
      }
    };

    // Leg 1
    addRound(1, false);

    // If double round robin, add Leg 2 with reversed home/away
    if (roundRobinType === 'double') {
      addRound(2, true);
    }

    return matches;
  },

  // Generate Playoff Knockouts with format support & manual overrides
  generateKnockouts(
    tournamentId: string,
    teams: Team[],
    startDateStr: string,
    standings?: StandingsRow[],
    startingMatchNum = 1,
    overs?: number,
    format: PlayoffFormat = 'semifinals_top4',
    manualOverrides?: ManualPlayoffOverrides
  ): Match[] {
    if (teams.length < 2) return [];

    // Determine seeds from standings or team list
    let seed1 = teams[0]?.id;
    let seed2 = teams[1]?.id;
    let seed3 = teams[2]?.id || teams[0]?.id;
    let seed4 = teams[3]?.id || teams[1]?.id;

    if (standings && standings.length >= 2) {
      seed1 = standings[0].teamId;
      seed2 = standings[1].teamId;
      if (standings.length >= 4) {
        seed3 = standings[2].teamId;
        seed4 = standings[3].teamId;
      }
    }

    // Apply manual overrides if enabled
    if (manualOverrides?.enabled) {
      if (manualOverrides.sf1Team1Id) seed1 = manualOverrides.sf1Team1Id;
      if (manualOverrides.sf1Team2Id) seed4 = manualOverrides.sf1Team2Id;
      if (manualOverrides.sf2Team1Id) seed2 = manualOverrides.sf2Team1Id;
      if (manualOverrides.sf2Team2Id) seed3 = manualOverrides.sf2Team2Id;
    }

    const matches: Match[] = [];
    const baseDate = new Date(startDateStr || new Date().toISOString());
    let matchNum = startingMatchNum;

    // 1. Direct Final Format (Top 2 only)
    if (format === 'direct_final_top2') {
      const finalDate = new Date(baseDate);
      finalDate.setDate(baseDate.getDate() + 1);
      finalDate.setHours(17, 0, 0, 0);

      const f1 = manualOverrides?.enabled && manualOverrides.finalTeam1Id ? manualOverrides.finalTeam1Id : seed1;
      const f2 = manualOverrides?.enabled && manualOverrides.finalTeam2Id ? manualOverrides.finalTeam2Id : seed2;

      matches.push({
        id: `match_final_${Date.now()}_${matchNum}`,
        tournamentId,
        matchNumber: matchNum++,
        stage: 'Final',
        team1Id: f1,
        team2Id: f2,
        venue: 'Rooftop Grand Championship Center Court',
        scheduledTime: finalDate.toISOString().replace('T', ' ').slice(0, 16),
        status: 'scheduled',
        overs,
        notes: '🏆 GRAND FINAL: Championship Match (Rank 1 vs Rank 2 Direct Final)'
      });
      return matches;
    }

    // 2. Top 3 Playoff Format: Table #1 team direct qualify for Final, 2nd & 3rd play Semi-Final
    if (format === 'rank1_direct_final') {
      const sfDate = new Date(baseDate);
      sfDate.setDate(baseDate.getDate() + 1);
      sfDate.setHours(15, 0, 0, 0);

      // Semi-Final: Rank 2 vs Rank 3 (or manual override)
      const sfT1 = manualOverrides?.enabled && manualOverrides.sf1Team1Id ? manualOverrides.sf1Team1Id : seed2;
      const sfT2 = manualOverrides?.enabled && manualOverrides.sf1Team2Id ? manualOverrides.sf1Team2Id : seed3;

      matches.push({
        id: `match_sf_${Date.now()}_${matchNum}`,
        tournamentId,
        matchNumber: matchNum++,
        stage: 'Semi-Final',
        team1Id: sfT1,
        team2Id: sfT2,
        venue: 'Sky Court Arena (Floodlit)',
        scheduledTime: sfDate.toISOString().replace('T', ' ').slice(0, 16),
        status: 'scheduled',
        overs,
        notes: 'Semi-Final: Rank 2 vs Rank 3 (Winner advances to Grand Final vs Rank 1)'
      });

      // Grand Final: Rank 1 Direct Finalist vs Winner of Semi-Final
      const finalDate = new Date(baseDate);
      finalDate.setDate(baseDate.getDate() + 2);
      finalDate.setHours(17, 0, 0, 0);

      const fT1 = manualOverrides?.enabled && manualOverrides.finalTeam1Id ? manualOverrides.finalTeam1Id : seed1;
      const fT2 = manualOverrides?.enabled && manualOverrides.finalTeam2Id ? manualOverrides.finalTeam2Id : sfT1;

      matches.push({
        id: `match_final_${Date.now()}_${matchNum}`,
        tournamentId,
        matchNumber: matchNum++,
        stage: 'Final',
        team1Id: fT1,
        team2Id: fT2,
        venue: 'Rooftop Grand Championship Center Court',
        scheduledTime: finalDate.toISOString().replace('T', ' ').slice(0, 16),
        status: 'scheduled',
        overs,
        notes: '🏆 GRAND FINAL: Championship Match (Rank 1 Direct Finalist vs Winner of Semi-Final)'
      });

      return matches;
    }

    // 3. IPL Style Playoff System (Qualifier 1, Eliminator, Qualifier 2, Grand Final)
    if (format === 'ipl_playoffs' && teams.length >= 4) {
      // Qualifier 1 (1 vs 2)
      const q1Date = new Date(baseDate);
      q1Date.setDate(baseDate.getDate() + 1);
      q1Date.setHours(15, 0, 0, 0);

      matches.push({
        id: `match_q1_${Date.now()}_${matchNum}`,
        tournamentId,
        matchNumber: matchNum++,
        stage: 'Semi-Final',
        team1Id: seed1,
        team2Id: seed2,
        venue: 'Sky Court Arena (Floodlit)',
        scheduledTime: q1Date.toISOString().replace('T', ' ').slice(0, 16),
        status: 'scheduled',
        overs,
        notes: 'Qualifier 1: Rank 1 vs Rank 2 (Winner to Final, Loser to Qualifier 2)'
      });

      // Eliminator (3 vs 4)
      const elimDate = new Date(baseDate);
      elimDate.setDate(baseDate.getDate() + 1);
      elimDate.setHours(18, 0, 0, 0);

      matches.push({
        id: `match_elim_${Date.now()}_${matchNum}`,
        tournamentId,
        matchNumber: matchNum++,
        stage: 'Semi-Final',
        team1Id: seed3,
        team2Id: seed4,
        venue: 'Sky Court Arena (Floodlit)',
        scheduledTime: elimDate.toISOString().replace('T', ' ').slice(0, 16),
        status: 'scheduled',
        overs,
        notes: 'Eliminator: Rank 3 vs Rank 4 (Winner to Qualifier 2, Loser Eliminated)'
      });

      // Qualifier 2
      const q2Date = new Date(baseDate);
      q2Date.setDate(baseDate.getDate() + 2);
      q2Date.setHours(16, 0, 0, 0);

      matches.push({
        id: `match_q2_${Date.now()}_${matchNum}`,
        tournamentId,
        matchNumber: matchNum++,
        stage: 'Semi-Final',
        team1Id: seed2, // Default, updated on match completion
        team2Id: seed3,
        venue: 'Sky Court Arena (Floodlit)',
        scheduledTime: q2Date.toISOString().replace('T', ' ').slice(0, 16),
        status: 'scheduled',
        overs,
        notes: 'Qualifier 2: Loser Q1 vs Winner Eliminator (Winner to Final)'
      });

      // Grand Final
      const finalDate = new Date(baseDate);
      finalDate.setDate(baseDate.getDate() + 3);
      finalDate.setHours(17, 0, 0, 0);

      matches.push({
        id: `match_final_${Date.now()}_${matchNum}`,
        tournamentId,
        matchNumber: matchNum++,
        stage: 'Final',
        team1Id: seed1,
        team2Id: seed2,
        venue: 'Rooftop Grand Championship Center Court',
        scheduledTime: finalDate.toISOString().replace('T', ' ').slice(0, 16),
        status: 'scheduled',
        overs,
        notes: '🏆 GRAND FINAL: Championship Match (Winner Q1 vs Winner Q2)'
      });

      return matches;
    }

    // 3. Standard Top 4 Semifinals & Grand Final (or Manual Override)
    // Semi-Final 1: 1st vs 4th (or Manual SF1)
    const sf1Date = new Date(baseDate);
    sf1Date.setDate(baseDate.getDate() + 1);
    sf1Date.setHours(15, 0, 0, 0);

    const sf1T1 = manualOverrides?.enabled && manualOverrides.sf1Team1Id ? manualOverrides.sf1Team1Id : seed1;
    const sf1T2 = manualOverrides?.enabled && manualOverrides.sf1Team2Id ? manualOverrides.sf1Team2Id : seed4;

    matches.push({
      id: `match_sf1_${Date.now()}_${matchNum}`,
      tournamentId,
      matchNumber: matchNum++,
      stage: 'Semi-Final',
      team1Id: sf1T1,
      team2Id: sf1T2,
      venue: 'Sky Court Arena (Floodlit)',
      scheduledTime: sf1Date.toISOString().replace('T', ' ').slice(0, 16),
      status: 'scheduled',
      overs,
      notes:
        manualOverrides?.enabled
          ? 'Semi-Final 1: (Manual Pairing) Winner advances to Final'
          : 'Semi-Final 1: Rank 1 vs Rank 4 (Winner advances to Final)'
    });

    // Semi-Final 2: 2nd vs 3rd (or Manual SF2)
    const sf2Date = new Date(baseDate);
    sf2Date.setDate(baseDate.getDate() + 1);
    sf2Date.setHours(18, 0, 0, 0);

    const sf2T1 = manualOverrides?.enabled && manualOverrides.sf2Team1Id ? manualOverrides.sf2Team1Id : seed2;
    const sf2T2 = manualOverrides?.enabled && manualOverrides.sf2Team2Id ? manualOverrides.sf2Team2Id : seed3;

    matches.push({
      id: `match_sf2_${Date.now()}_${matchNum}`,
      tournamentId,
      matchNumber: matchNum++,
      stage: 'Semi-Final',
      team1Id: sf2T1,
      team2Id: sf2T2,
      venue: 'Sky Court Arena (Floodlit)',
      scheduledTime: sf2Date.toISOString().replace('T', ' ').slice(0, 16),
      status: 'scheduled',
      overs,
      notes:
        manualOverrides?.enabled
          ? 'Semi-Final 2: (Manual Pairing) Winner advances to Final'
          : 'Semi-Final 2: Rank 2 vs Rank 3 (Winner advances to Final)'
    });

    // Grand Final: Winner SF1 vs Winner SF2 (or Manual Final)
    const finalDate = new Date(baseDate);
    finalDate.setDate(baseDate.getDate() + 2);
    finalDate.setHours(17, 0, 0, 0);

    const fT1 = manualOverrides?.enabled && manualOverrides.finalTeam1Id ? manualOverrides.finalTeam1Id : sf1T1;
    const fT2 = manualOverrides?.enabled && manualOverrides.finalTeam2Id ? manualOverrides.finalTeam2Id : sf2T1;

    matches.push({
      id: `match_final_${Date.now()}_${matchNum}`,
      tournamentId,
      matchNumber: matchNum++,
      stage: 'Final',
      team1Id: fT1,
      team2Id: fT2,
      venue: 'Rooftop Grand Championship Center Court',
      scheduledTime: finalDate.toISOString().replace('T', ' ').slice(0, 16),
      status: 'scheduled',
      overs,
      notes: '🏆 GRAND FINAL: Championship Match (Winner SF1 vs Winner SF2)'
    });

    return matches;
  },

  // Generate full tournament: Round Robin then Semifinals then Final
  generateFullTournament(
    tournamentId: string,
    teams: Team[],
    startDateStr: string,
    overs?: number,
    roundRobinType: RoundRobinType = 'single',
    format: PlayoffFormat = 'semifinals_top4',
    manualOverrides?: ManualPlayoffOverrides
  ): Match[] {
    const roundRobinMatches = this.generateRoundRobin(
      tournamentId,
      teams,
      startDateStr,
      1,
      overs,
      roundRobinType
    );
    const lastNum = roundRobinMatches.length > 0 ? roundRobinMatches.length + 1 : 1;

    const lastDate =
      roundRobinMatches.length > 0
        ? roundRobinMatches[roundRobinMatches.length - 1].scheduledTime.slice(0, 10)
        : startDateStr;

    const knockoutMatches = this.generateKnockouts(
      tournamentId,
      teams,
      lastDate,
      undefined,
      lastNum,
      overs,
      format,
      manualOverrides
    );

    return [...roundRobinMatches, ...knockoutMatches];
  }
};
