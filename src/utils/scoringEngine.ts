import {
  Match,
  Innings,
  BallRecord,
  BatsmanInnings,
  BowlerInnings,
  DismissalType
} from '../types/cricket';
import { StorageService } from './storage';

export interface DeliveryInput {
  runsOffBat: number; // 0, 1, 2, 3, 4, or -4 (six penalty)
  isSixPenalty?: boolean;
  isWide?: boolean;
  isNoBall?: boolean;
  isNoBallFour?: boolean; // Hitting 4 on no-ball: ball not counted, 1 NB + 4 bat = 5 runs
  isDeadBall?: boolean;
  isWicket?: boolean;
  dismissalType?: DismissalType;
  commentary?: string;
}

export const ScoringEngine = {
  // Initialize a fresh innings
  createInitialInnings(
    battingTeamId: string,
    bowlingTeamId: string,
    target?: number
  ): Innings {
    return {
      teamId: battingTeamId,
      bowlingTeamId: bowlingTeamId,
      totalRuns: 0,
      wickets: 0,
      totalLegalBalls: 0,
      oversCompleted: 0,
      ballsInCurrentOver: 0,
      currentBatsmanId: undefined,
      currentBowlerId: undefined,
      batsmen: [],
      bowlers: [],
      balls: [],
      deadBallsInCurrentOver: 0,
      battingTeamReviewsRemaining: 2, // 2 reviews for batting team
      bowlingTeamReviewsRemaining: 2, // 2 reviews for bowling team
      reviewsRemaining: 2, // Backwards compatibility
      reviewsUsedCount: 0,
      drsHistory: [],
      substitutionUsed: false,
      substitutions: [],
      isCompleted: false,
      target
    };
  },

  // Record a ball in the innings
  recordDelivery(
    innings: Innings,
    input: DeliveryInput,
    options?: {
      oversPerInnings?: number;
      maxOversPerBatsman?: number;
      maxOversPerBowler?: number;
    }
  ): {
    updatedInnings: Innings;
    alertMessage?: string;
    requiresNewBatsman: boolean;
    requiresNewBowler: boolean;
    isInningsOver: boolean;
  } {
    if (innings.isCompleted) {
      return {
        updatedInnings: innings,
        alertMessage: 'Innings is already completed.',
        requiresNewBatsman: false,
        requiresNewBowler: false,
        isInningsOver: true
      };
    }

    const totalOvers = options?.oversPerInnings ?? innings.maxOvers ?? 10;
    const totalLegalBallsLimit = totalOvers * 6;
    const maxBatsmanOvers =
      options?.maxOversPerBatsman ??
      (totalOvers <= 6 ? Math.max(2, Math.floor(totalOvers * 0.5)) : Math.min(totalOvers, 4));
    const maxBatsmanLegalBalls = maxBatsmanOvers * 6;

    const activeBatsmanId = innings.currentBatsmanId;
    const activeBowlerId = innings.currentBowlerId;
    if (!activeBatsmanId) {
      throw new Error('No active batsman selected. Please select a batsman.');
    }
    if (!activeBowlerId) {
      throw new Error('No active bowler selected. Please select a bowler.');
    }

    // Clone innings deeply
    const inn: Innings = JSON.parse(JSON.stringify(innings));
    inn.maxOvers = totalOvers;
    let alertMessage: string | undefined = undefined;
    let requiresNewBatsman = false;
    let requiresNewBowler = false;

    // Get or initialize active batsman innings
    let existingBatsman = inn.batsmen.find((b) => b.playerId === activeBatsmanId);
    if (!existingBatsman) {
      existingBatsman = {
        playerId: activeBatsmanId,
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixPenalties: 0,
        isOut: false,
        isRetiredLimit: false,
        hasReEntered: false,
        battingOrder: inn.batsmen.length + 1
      };
      inn.batsmen.push(existingBatsman);
    }
    const batsman: BatsmanInnings = existingBatsman;

    // Get or initialize active bowler innings
    let existingBowler = inn.bowlers.find((bw) => bw.playerId === activeBowlerId);
    if (!existingBowler) {
      existingBowler = {
        playerId: activeBowlerId,
        oversBowled: 0,
        ballsThisOver: 0,
        totalLegalBalls: 0,
        maidens: 0,
        runsConceded: 0,
        wickets: 0,
        wides: 0,
        noBalls: 0,
        deadBalls: 0,
        deadBallPenalties: 0
      };
      inn.bowlers.push(existingBowler);
    }
    const bowler: BowlerInnings = existingBowler;

    // Process delivery attributes
    let isLegal = true;
    let runsOffBat = input.runsOffBat;
    let extras = 0;
    let netBallRuns = 0;
    let deadBallPenaltyAwarded = false;

    // Rule: Six penalty (-4 runs)
    if (input.isSixPenalty) {
      runsOffBat = -4;
      netBallRuns = -4;
      batsman.runs -= 4;
      batsman.sixPenalties += 1;
      batsman.ballsFaced += 1;
      bowler.runsConceded -= 4; // Or penalty doesn't penalize bowler, but reduces total
      isLegal = true;
      alertMessage = '⚠️ SIX HIT! Rooftop Penalty: -4 Runs deducted from score!';
    }
    // Rule: No-Ball with 4 runs hit
    else if (input.isNoBallFour) {
      isLegal = false;
      extras = 1; // 1 run for No-Ball
      runsOffBat = 4; // 4 runs from bat
      netBallRuns = 5; // Total 5 runs
      bowler.noBalls += 1;
      bowler.runsConceded += 5;
      batsman.runs += 4;
      batsman.fours += 1;
      // "Hitting a 4 on a no-ball means the ball isn't counted, but 4 runs are added"
      // Not counted towards batsman legal balls faced or over legal balls!
      alertMessage = '🎉 NO BALL + 4! Ball is not counted, 5 runs added (1 NB + 4 off bat)!';
    }
    // Rule: Standard No-Ball
    else if (input.isNoBall) {
      isLegal = false;
      extras = 1;
      runsOffBat = Math.max(0, input.runsOffBat);
      netBallRuns = extras + runsOffBat;
      bowler.noBalls += 1;
      bowler.runsConceded += netBallRuns;
      batsman.runs += runsOffBat;
      if (runsOffBat === 4) batsman.fours += 1;
      // Not counted as legal ball
      alertMessage = '⚡ NO BALL! +1 Extra, ball must be re-bowled.';
    }
    // Rule: Wide
    else if (input.isWide) {
      isLegal = false;
      extras = 1;
      runsOffBat = 0;
      netBallRuns = 1;
      bowler.wides += 1;
      bowler.runsConceded += 1;
      // Not counted as legal ball
      alertMessage = '↔️ WIDE BALL! +1 Extra, ball must be re-bowled.';
    }
    // Rule: Dead Ball
    else if (input.isDeadBall) {
      isLegal = false;
      runsOffBat = 0;
      inn.deadBallsInCurrentOver += 1;
      bowler.deadBalls += 1;

      // Rule: "After 2 dead balls in an over, each subsequent dead ball awards an extra +1 run."
      if (inn.deadBallsInCurrentOver > 2) {
        extras = 1;
        netBallRuns = 1;
        deadBallPenaltyAwarded = true;
        bowler.deadBallPenalties += 1;
        bowler.runsConceded += 1;
        alertMessage = `🚨 DEAD BALL #${inn.deadBallsInCurrentOver} in this over! Exceeded 2 limit: +1 Extra Run awarded to batting team!`;
      } else {
        extras = 0;
        netBallRuns = 0;
        alertMessage = `⏸️ Dead Ball #${inn.deadBallsInCurrentOver}/2 in this over (re-bowl, no penalty yet).`;
      }
    }
    // Standard legal ball (0, 1, 2, 3, 4, or Wicket)
    else {
      isLegal = true;
      runsOffBat = Math.max(0, input.runsOffBat);
      netBallRuns = runsOffBat;
      batsman.runs += runsOffBat;
      batsman.ballsFaced += 1;
      bowler.runsConceded += runsOffBat;

      if (runsOffBat === 4) {
        batsman.fours += 1;
      }
    }

    // Apply net runs to team total (can decrease if 6 penalty)
    inn.totalRuns = inn.totalRuns + netBallRuns;

    // Handle Wicket
    if (input.isWicket && !input.isNoBall && !input.isNoBallFour && !input.isDeadBall) {
      inn.wickets += 1;
      batsman.isOut = true;
      batsman.dismissalType = input.dismissalType || 'bowled';
      batsman.bowlerId = bowler.playerId;
      bowler.wickets += 1;
      requiresNewBatsman = true;
      alertMessage = `OUT! ${input.dismissalType?.toUpperCase() || 'WICKET'}! Batsman dismissed.`;
    }

    // Delivery over and ball coordinates
    let deliveryOverNumber = inn.oversCompleted;
    let deliveryBallNumber = inn.ballsInCurrentOver;

    // Handle Legal Ball Count
    if (isLegal) {
      inn.totalLegalBalls += 1;
      inn.ballsInCurrentOver += 1;
      bowler.totalLegalBalls += 1;
      bowler.ballsThisOver += 1;

      deliveryBallNumber = inn.ballsInCurrentOver;
      deliveryOverNumber = inn.oversCompleted;

      // Rule: Batsman can bat for a maximum of maxBatsmanOvers overs (maxBatsmanLegalBalls legal balls).
      // "They must retire automatically after that."
      // Special Rule: Once a retired batsman returns to bat, "then he didnt any restriction"
      if (!batsman.isOut && !batsman.hasReEntered && batsman.ballsFaced >= maxBatsmanLegalBalls) {
        batsman.isRetiredLimit = true;
        requiresNewBatsman = true;
        alertMessage = `🛑 RETIREMENT: Batsman faced ${maxBatsmanLegalBalls} legal balls (${maxBatsmanOvers} full overs limit)! Automatically retired.`;
      }

      // Check if over is completed (6 legal balls)
      if (inn.ballsInCurrentOver === 6) {
        inn.oversCompleted += 1;
        inn.ballsInCurrentOver = 0;
        bowler.oversBowled += 1;
        bowler.ballsThisOver = 0;

        // Reset dead ball counter for next over
        inn.deadBallsInCurrentOver = 0;

        // Check for maiden over
        // If bowler conceded 0 runs in this over
        // We can inspect the last 6 balls or calculate based on over runs
        requiresNewBowler = true;
      }
    }

    // Record ball log
    const ballRecord: BallRecord = {
      ballNumber: deliveryBallNumber,
      overNumber: deliveryOverNumber,
      bowlerId: bowler.playerId,
      batsmanId: batsman.playerId,
      runsOffBat,
      isSixPenalty: !!input.isSixPenalty,
      isWide: !!input.isWide,
      isNoBall: !!input.isNoBall,
      isNoBallFour: !!input.isNoBallFour,
      isDeadBall: !!input.isDeadBall,
      deadBallPenaltyAwarded,
      extras,
      totalRunsOnBall: netBallRuns,
      cumulativeRuns: inn.totalRuns,
      cumulativeWickets: inn.wickets,
      isLegalBall: isLegal,
      isWicket: !!input.isWicket,
      dismissal: input.isWicket
        ? {
            type: input.dismissalType || 'bowled',
            batsmanId: batsman.playerId,
            bowlerId: bowler.playerId
          }
        : undefined,
      commentary:
        input.commentary ||
        (input.isSixPenalty
          ? 'Six hit! -4 penalty applied'
          : input.isNoBallFour
          ? 'No-ball + boundary four! 5 runs total'
          : input.isNoBall
          ? 'No-ball bowled'
          : input.isWide
          ? 'Wide delivery'
          : input.isDeadBall
          ? `Dead ball (${deadBallPenaltyAwarded ? '+1 penalty extra' : 'no run'})`
          : input.isWicket
          ? 'Wicket taken!'
          : `${runsOffBat} run(s) scored`),
      timestamp: new Date().toISOString()
    };
    inn.balls.push(ballRecord);

    // If requires new batsman, clear current batsman
    if (requiresNewBatsman) {
      inn.currentBatsmanId = undefined;
    }

    // If requires new bowler, clear current bowler
    if (requiresNewBowler) {
      inn.currentBowlerId = undefined;
    }

    // Check if innings is complete:
    // 1. Max overs reached (totalLegalBallsLimit = totalOvers * 6)
    // 2. Chasing target reached (2nd innings)
    // 3. All batsmen out / retired and no one left to bat
    let isInningsOver = false;

    if (inn.totalLegalBalls >= totalLegalBallsLimit) {
      isInningsOver = true;
      inn.isCompleted = true;
    } else if (inn.target && inn.totalRuns >= inn.target) {
      isInningsOver = true;
      inn.isCompleted = true;
    }

    return {
      updatedInnings: inn,
      alertMessage,
      requiresNewBatsman,
      requiresNewBowler,
      isInningsOver
    };
  },

  // Undo last ball
  undoLastDelivery(innings: Innings): Innings {
    if (innings.balls.length === 0) return innings;

    // We can replay from initial state or rollback the last ball
    const inn: Innings = JSON.parse(JSON.stringify(innings));
    const lastBall = inn.balls.pop();
    if (!lastBall) return inn;

    // Deduct total runs
    inn.totalRuns -= lastBall.totalRunsOnBall;

    // Revert bowler stats
    const bowler = inn.bowlers.find((b) => b.playerId === lastBall.bowlerId);
    if (bowler) {
      bowler.runsConceded -= lastBall.totalRunsOnBall;
      if (lastBall.isWide) bowler.wides -= 1;
      if (lastBall.isNoBall || lastBall.isNoBallFour) bowler.noBalls -= 1;
      if (lastBall.isDeadBall) {
        bowler.deadBalls -= 1;
        if (lastBall.deadBallPenaltyAwarded) {
          bowler.deadBallPenalties -= 1;
        }
      }
      if (lastBall.isWicket) bowler.wickets -= 1;
    }

    // Revert dead balls in over
    if (lastBall.isDeadBall && inn.deadBallsInCurrentOver > 0) {
      inn.deadBallsInCurrentOver -= 1;
    }

    // Revert batsman stats
    const batsman = inn.batsmen.find((b) => b.playerId === lastBall.batsmanId);
    if (batsman) {
      if (lastBall.isSixPenalty) {
        batsman.runs += 4;
        batsman.sixPenalties -= 1;
        batsman.ballsFaced -= 1;
      } else if (lastBall.isNoBallFour) {
        batsman.runs -= 4;
        batsman.fours -= 1;
      } else if (!lastBall.isWide && !lastBall.isDeadBall && !lastBall.isNoBall) {
        batsman.runs -= lastBall.runsOffBat;
        batsman.ballsFaced -= 1;
        if (lastBall.runsOffBat === 4) batsman.fours -= 1;
      }

      if (lastBall.isWicket) {
        batsman.isOut = false;
        batsman.dismissalType = undefined;
        batsman.bowlerId = undefined;
        inn.wickets -= 1;
      }

      const totalOvers = inn.maxOvers || 10;
      const maxBatsmanOvers =
        totalOvers <= 6 ? Math.max(2, Math.floor(totalOvers * 0.5)) : Math.min(totalOvers, 4);
      const maxBatsmanLegalBalls = maxBatsmanOvers * 6;

      if (batsman.isRetiredLimit && batsman.ballsFaced < maxBatsmanLegalBalls) {
        batsman.isRetiredLimit = false;
      }
    }

    // Revert legal ball counters
    if (lastBall.isLegalBall) {
      inn.totalLegalBalls -= 1;
      if (inn.ballsInCurrentOver === 0) {
        // Was at start of new over, go back to over - 1 and ball 5
        inn.oversCompleted -= 1;
        inn.ballsInCurrentOver = 5;
        if (bowler) {
          bowler.oversBowled -= 1;
          bowler.ballsThisOver = 5;
        }
      } else {
        inn.ballsInCurrentOver -= 1;
        if (bowler) {
          bowler.ballsThisOver -= 1;
        }
      }
      if (bowler) {
        bowler.totalLegalBalls -= 1;
      }
    }

    // Restore current batsman and bowler
    inn.currentBatsmanId = lastBall.batsmanId;
    inn.currentBowlerId = lastBall.bowlerId;
    inn.isCompleted = false;

    return inn;
  },

  // Check eligible batsmen to bat next (including re-entry of not-out batsmen!)
  getAvailableBatsmen(
    innings: Innings,
    teamPlayerIds: string[],
    options?: { totalOvers?: number }
  ): {
    unbattedPlayerIds: string[];
    canReEnterRetired: boolean;
    retiredPlayerIds: string[];
    reEntryReason?: string;
  } {
    // 1. Players who have not batted yet (Out batsmen can NEVER play twice)
    const battedIds = innings.batsmen.map((b) => b.playerId);
    const unbattedPlayerIds = teamPlayerIds.filter((id) => !battedIds.includes(id));

    // 2. Batsmen who are NOT OUT (retired limit, retired, or not dismissed)
    // and not currently occupying the crease
    const notOutBatsmen = innings.batsmen.filter(
      (b) => !b.isOut && b.playerId !== innings.currentBatsmanId
    );
    const retiredPlayerIds = notOutBatsmen.map((b) => b.playerId);

    const totalOvers = options?.totalOvers ?? innings.maxOvers ?? 10;
    const maxMatchBalls = totalOvers * 6;
    const ballsRemaining = Math.max(0, maxMatchBalls - innings.totalLegalBalls);
    let canReEnterRetired = false;
    let reEntryReason: string | undefined = undefined;

    if (retiredPlayerIds.length > 0 && ballsRemaining > 0 && !innings.isCompleted) {
      // Condition 1: No unbatted players left in squad -> any not-out batsman can bat again!
      if (unbattedPlayerIds.length === 0) {
        canReEnterRetired = true;
        reEntryReason = `Over/balls remaining (${ballsRemaining} balls left)! All unbatted batsmen have had their turn. Batsman who is NOT OUT can bat again with NO restriction!`;
      } else {
        // Condition 2: All other teammates are OUT or have faced at least 1 ball
        const allOtherTeammatesQualified = teamPlayerIds.every((id) => {
          if (retiredPlayerIds.includes(id)) return true; // Other not-out/retired teammate
          const b = innings.batsmen.find((bat) => bat.playerId === id);
          return b && (b.isOut || b.ballsFaced >= 1);
        });

        if (allOtherTeammatesQualified) {
          canReEnterRetired = true;
          reEntryReason =
            'All other teammates have faced at least 1 ball or are OUT! Batsman who is NOT OUT can bat again with NO restriction!';
        }
      }
    }

    return {
      unbattedPlayerIds,
      canReEnterRetired,
      retiredPlayerIds,
      reEntryReason
    };
  },

  // Check eligible bowlers (Dynamic overs per bowler according to format)
  getEligibleBowlers(
    innings: Innings,
    bowlingTeamPlayerIds: string[],
    currentBowlerId?: string,
    options?: {
      maxOversPerBowler?: number;
      totalOvers?: number;
    }
  ): {
    eligiblePlayerIds: string[];
    bowlerOverCounts: Record<string, number>;
    warnings: string[];
  } {
    const bowlerOverCounts: Record<string, number> = {};
    const warnings: string[] = [];

    bowlingTeamPlayerIds.forEach((id) => {
      const b = innings.bowlers.find((bw) => bw.playerId === id);
      const completed = b ? b.oversBowled : 0;
      bowlerOverCounts[id] = completed;
    });

    const totalOvers = options?.totalOvers ?? innings.maxOvers ?? 10;
    const maxLimit =
      options?.maxOversPerBowler ?? Math.max(1, Math.ceil(totalOvers / 5));

    // Rule: Bowler can bowl a highest of maxLimit overs
    // Cannot bowl consecutive overs (standard cricket rule)
    const eligiblePlayerIds = bowlingTeamPlayerIds.filter((id) => {
      const count = bowlerOverCounts[id] || 0;
      if (count >= maxLimit) return false; // Bowler quota limit
      if (id === currentBowlerId) return false; // Cannot bowl consecutive overs
      return true;
    });

    // Rule warning: Check remaining overs vs bowlers who haven't bowled
    const remainingOvers = Math.max(0, totalOvers - innings.oversCompleted);
    const bowlersWithZeroOvers = bowlingTeamPlayerIds.filter(
      (id) => (bowlerOverCounts[id] || 0) === 0
    );

    if (bowlersWithZeroOvers.length >= remainingOvers && remainingOvers > 0) {
      warnings.push(
        `⚠️ Bowling Restriction: ${bowlersWithZeroOvers.length} bowlers have not bowled yet with only ${remainingOvers} overs remaining!`
      );
    }

    return {
      eligiblePlayerIds,
      bowlerOverCounts,
      warnings
    };
  },

  // Apply DRS Review (Each team has 2 reviews per innings; retained if successful)
  handleDrsReview(
    innings: Innings,
    reviewParam:
      | boolean
      | {
          teamId: string;
          isBattingTeam: boolean;
          targetType: 'wicket' | 'boundary' | 'six_penalty' | 'extra' | 'other';
          isSuccessful: boolean;
          reason: string;
          overturnAction?: 'cancel_wicket' | 'award_wicket' | 'cancel_six_penalty' | 'add_four';
        },
    legacyReason: string = 'DRS Appeal'
  ): { updatedInnings: Innings; message: string } {
    const inn: Innings = JSON.parse(JSON.stringify(innings));

    // Ensure backwards compatibility and default values
    if (typeof inn.battingTeamReviewsRemaining !== 'number') inn.battingTeamReviewsRemaining = 2;
    if (typeof inn.bowlingTeamReviewsRemaining !== 'number') inn.bowlingTeamReviewsRemaining = 2;
    if (!Array.isArray(inn.drsHistory)) inn.drsHistory = [];

    const isBattingTeam = typeof reviewParam === 'object' ? reviewParam.isBattingTeam : true;
    const isSuccessful = typeof reviewParam === 'object' ? reviewParam.isSuccessful : reviewParam;
    const reason = typeof reviewParam === 'object' ? reviewParam.reason : legacyReason;
    const targetType = typeof reviewParam === 'object' ? reviewParam.targetType : 'other';
    const teamId = typeof reviewParam === 'object' ? reviewParam.teamId : inn.teamId;
    const overturnAction = typeof reviewParam === 'object' ? reviewParam.overturnAction : undefined;

    // Check available reviews for the reviewing team
    const currentReviews = isBattingTeam
      ? inn.battingTeamReviewsRemaining
      : inn.bowlingTeamReviewsRemaining;

    if (currentReviews <= 0) {
      return {
        updatedInnings: inn,
        message: `No reviews remaining for ${isBattingTeam ? 'Batting' : 'Bowling'} Team in this innings!`
      };
    }

    inn.reviewsUsedCount = (inn.reviewsUsedCount || 0) + 1;

    let message = '';
    let impactDescription = '';

    if (isSuccessful) {
      // Retained on success!
      // Action: Actually reverse wrongful decisions if requested!
      if (overturnAction === 'cancel_wicket' || targetType === 'wicket') {
        // Find most recently dismissed batsman or currently out batsman
        const outBatsmen = inn.batsmen.filter((b) => b.isOut);
        if (outBatsmen.length > 0) {
          const lastOut = outBatsmen[outBatsmen.length - 1];
          lastOut.isOut = false;
          lastOut.dismissalType = undefined;
          if (lastOut.bowlerId) {
            const bowler = inn.bowlers.find((bw) => bw.playerId === lastOut.bowlerId);
            if (bowler && bowler.wickets > 0) bowler.wickets -= 1;
            lastOut.bowlerId = undefined;
          }
          inn.wickets = Math.max(0, inn.wickets - 1);
          inn.currentBatsmanId = lastOut.playerId; // Return to crease
          impactDescription = 'Wicket overturned! Batsman declared NOT OUT and returned to the crease.';
        }
      } else if (overturnAction === 'cancel_six_penalty' || targetType === 'six_penalty') {
        inn.totalRuns += 4;
        const currentBat = inn.batsmen.find((b) => b.playerId === inn.currentBatsmanId);
        if (currentBat && currentBat.sixPenalties > 0) {
          currentBat.sixPenalties -= 1;
          currentBat.runs += 4;
        }
        impactDescription = 'Six penalty overturned! 4 runs restored to score.';
      } else {
        impactDescription = 'Decision overturned in favor of reviewing team.';
      }

      const remainingAfter = isBattingTeam
        ? inn.battingTeamReviewsRemaining
        : inn.bowlingTeamReviewsRemaining;

      message = `✅ REVIEW UPHELD (${reason})! Decision overturned. Review is RETAINED (${remainingAfter}/2 remaining). ${impactDescription}`;
    } else {
      // Lost on unsuccessful review! Deduct 1 review for that team
      if (isBattingTeam) {
        inn.battingTeamReviewsRemaining = Math.max(0, inn.battingTeamReviewsRemaining - 1);
      } else {
        inn.bowlingTeamReviewsRemaining = Math.max(0, inn.bowlingTeamReviewsRemaining - 1);
      }

      const remainingAfter = isBattingTeam
        ? inn.battingTeamReviewsRemaining
        : inn.bowlingTeamReviewsRemaining;

      inn.reviewsRemaining = isBattingTeam ? inn.battingTeamReviewsRemaining : inn.reviewsRemaining;

      impactDescription = 'Original on-field decision confirmed. 1 review deducted.';
      message = `❌ REVIEW LOST (${reason})! Original decision stands. 1 review deducted (${remainingAfter}/2 remaining).`;
    }

    // Save into DRS log
    inn.drsHistory.push({
      teamId,
      isBattingTeam,
      targetType,
      reason,
      isSuccessful,
      over: inn.oversCompleted,
      ball: inn.ballsInCurrentOver,
      impactDescription,
      timestamp: new Date().toISOString()
    });

    return { updatedInnings: inn, message };
  },

  // Apply Substitution
  // "There will be 1 substitution per innings"
  handleSubstitution(
    innings: Innings,
    outgoingPlayerId: string,
    incomingPlayerId: string,
    reason: string
  ): { updatedInnings: Innings; success: boolean; message: string } {
    const inn: Innings = JSON.parse(JSON.stringify(innings));

    if (inn.substitutionUsed) {
      return {
        updatedInnings: inn,
        success: false,
        message: 'Substitution limit reached: Maximum 1 substitution allowed per innings.'
      };
    }

    inn.substitutionUsed = true;
    inn.substitutions.push({
      outgoingPlayerId,
      incomingPlayerId,
      over: inn.oversCompleted,
      ball: inn.ballsInCurrentOver,
      reason
    });

    // If outgoing is currently batting, replace active batsman
    if (inn.currentBatsmanId === outgoingPlayerId) {
      inn.currentBatsmanId = incomingPlayerId;
    }
    // If outgoing is currently bowling, replace active bowler
    if (inn.currentBowlerId === outgoingPlayerId) {
      inn.currentBowlerId = incomingPlayerId;
    }

    const outPlayer = StorageService.getPlayerById(outgoingPlayerId);
    const inPlayer = StorageService.getPlayerById(incomingPlayerId);

    return {
      updatedInnings: inn,
      success: true,
      message: `🔄 SUBSTITUTION EXECUTED: ${inPlayer?.name || 'Incoming'} replaces ${outPlayer?.name || 'Outgoing'}. (1/1 substitution used).`
    };
  }
};
