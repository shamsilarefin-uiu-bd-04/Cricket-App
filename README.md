# 🏏 Rooftop Cricket Tournament — Website & App

A specialized, full-featured progressive web application (PWA) and website engineered specifically for the **Rooftop Cricket Tournament**. Built with **React 19, Vite, TypeScript, and Tailwind CSS**.

---

## 🌟 Tournament Format & Special Rules Implemented

| Rule | Specification | In-App Enforcement |
|---|---|---|
| **Tournament Name** | Rooftop Cricket Tournament | Displayed prominently across the header, scorer, fixtures, and standings. |
| **Teams** | 4 to 6 teams | Supports 4–6 teams with full team editor, colors, logos, and captain designations. |
| **Team Squads** | 5 to 6 players per team | Squad size limit is enforced (maximum 6 players per team). |
| **Player Profiles** | Independent player identities | Creating/entering players establishes permanent player entities. |
| **Player Career Stats** | Aggregated across matches | Tracks runs, balls faced, 4s, 6 penalties, strike rate, wickets, overs, economy, dead balls, DRS calls, and substitutions. |
| **Team Switching** | Transfer players between tournaments | Players can be transferred/switched between teams while preserving their lifetime profile and match history. |
| **Batting Format** | **Single-Player Batting** | Only 1 batsman occupies the pitch at any time facing the bowler (no non-striker partner). |
| **Overs per Innings** | **9 Overs** (54 legal deliveries) | Full 9-over tracking per innings with target calculation for chasing. |
| **Coin Toss** | Digital coin toss | Interactive coin toss modal deciding Bat or Bowl first. |
| **Batsman Limit** | **Maximum 4 overs (24 legal balls)** | Scorer tracks legal balls faced (progress bar) and **automatically retires** batsman upon 24th legal ball. |
| **Late Re-entry** | Return at the very end | Previously retired batsmen can return to bat at the very end once all other squad members have batted. |
| **Boundary Shots** | **Only 4-run shots allowed** | Keypad supports 0, 1, 2, 3, and 4. |
| **Six Penalty** | **-4 Runs Deduction** | Hitting a 6 results in a penalty of **minus 4 runs** from team and batsman score. |
| **Extras** | Wides & No-Balls | Wides (+1) and No-Balls (+1) are re-bowled and not counted as legal deliveries in the over. |
| **No-Ball + 4** | 5 runs total, ball not counted | Hitting a 4 on a no-ball adds 5 runs (1 NB + 4 bat) and does not increment legal ball count. |
| **Dead Ball Escalation** | +1 extra after 2 dead balls | 1st & 2nd dead balls in an over = 0 runs (re-bowl); 3rd and subsequent dead balls in that over award **+1 extra run penalty**! |
| **Bowler Limits** | **Min 1, Max 3 overs** | Enforces maximum 3 overs per bowler, prohibits consecutive overs, and warns when bowlers must bowl their minimum 1 over. |
| **DRS Reviews** | **2 per innings (Retained on win)** | 2 reviews per innings; **retained if successful**, lost if unsuccessful. |
| **Substitutions** | **1 per innings** | 1 tactical player substitution per innings with reasons logged in scorecard. |

---

## 🚀 Key Modules & Features

1. **Live Scorer (`/scorer`)**:
   - Broadcast-quality scoreboard banner displaying total runs, wickets, overs, CRR, target, and RRR.
   - Solo batsman card with 24-ball visual meter and automatic retirement triggers.
   - Bowler card with 3-over slot indicators and economy calculations.
   - High-contrast, touch-optimized keypad with 0, 1, 2, 3, 4, 6 Penalty (-4), Wides, No-Balls, No-Ball + 4, and Dead Ball counters.
   - Ball-by-ball chips with color coding and instant Undo capability.

2. **Fixtures & Results (`/fixtures`)**:
   - Filter by All, Scheduled, Live, and Completed.
   - Add custom fixture or edit date, time, court/venue, and stage.
   - One-click **Auto Round Robin Generator** for 4 to 6 teams.
   - Start or resume scoring directly from any fixture.

3. **Tournament Standings (`/standings`)**:
   - Real-time Points Table with Played, Won, Lost, Tied, Points (2 for Win, 1 for Tie), Net Run Rate (NRR), and Form guide (last 5 games).

4. **Teams Management (`/teams`)**:
   - 4 to 6 teams with custom names, short codes, emojis, colors, and squad rosters (5–6 players).
   - Edit team details and assign captains.

5. **Player Profiles & Career Stats (`/players`)**:
   - Searchable player directory with role filters.
   - Detailed modal showcasing career batting and bowling metrics.
   - **Switch Team Tool** to transfer players between teams for upcoming tournaments.
   - Form to create new player profiles.

6. **Official Scorecard (`/scorecard`)**:
   - Detailed batting breakdowns (Runs, Balls, 4s, 6 Penalties, SR, dismissal or retirement status).
   - Bowling figures (Overs, Maidens, Runs, Wickets, Economy, Extras).
   - DRS and Substitution audit logs.

7. **Rules Guide (`/rules`)**:
   - Comprehensive interactive rulebook explaining all unique rooftop cricket conventions.

8. **Data Backup & Restore**:
   - Full JSON export and import for tournament records.
   - One-click Reset to Demo Tournament default state.

---

## 💻 Getting Started

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Running Test Suite
Execute the automated test suite verifying all 12 cricket rules:
```bash
npx tsx test-rules.ts
```
