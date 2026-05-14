import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  BOARD_SIZE,
  PIECE_STATS,
  TEAM,
  createInitialPieces,
  getAllLegalMoves,
  getLegalMoves,
  getPieceAt
} from "../src/rules.js";

const pieces = createInitialPieces();

assert.equal(BOARD_SIZE, 8, "board should be 8x8");
assert.equal(pieces.length, 32, "initial chess setup should have 32 pieces");
assert.equal(pieces[0].mana, 0, "pieces should start with empty ultimate mana");
assert.equal(pieces[0].smashShowdowns, 0, "pieces should start without Smash armed");
assert.equal(PIECE_STATS.pawn.hp, 100, "pawn hp follows v1.0.1 patch notes");
assert.equal(PIECE_STATS.rook.hp, 115, "rook hp follows v1.0.1 patch notes");
assert.equal(PIECE_STATS.horse.hp, 120, "horse hp follows v1.0.1 patch notes");
assert.equal(PIECE_STATS.bishop.hp, 130, "bishop hp follows v1.0.1 patch notes");
assert.equal(PIECE_STATS.queen.hp, 150, "queen hp follows v1.0.1 patch notes");
assert.equal(PIECE_STATS.king.hp, 200, "king hp follows v1.0.1 patch notes");
assert.equal(PIECE_STATS.pawn.weapon, "Fists", "pawn weapon follows v1 patch notes");
assert.equal(PIECE_STATS.rook.weapon, "Spike Club", "rook weapon follows v1 patch notes");
assert.equal(PIECE_STATS.horse.weapon, "Javelin", "horse weapon follows v1 patch notes");
assert.equal(PIECE_STATS.bishop.weapon, "Cross", "bishop weapon follows v1 patch notes");
assert.equal(PIECE_STATS.queen.weapon, "Scythe", "queen weapon follows v1 patch notes");
assert.equal(PIECE_STATS.king.weapon, "Sword & Shield", "king weapon follows v1 patch notes");
assert.equal(PIECE_STATS.pawn.damageBonus, 0, "pawn has fixed damage");
assert.equal(PIECE_STATS.rook.damageBonus, 0.04, "rook damage bonus follows v1.0.3 patch notes");
assert.equal(PIECE_STATS.horse.damageBonus, 0.05, "horse damage bonus follows v1.0.3 patch notes");
assert.equal(PIECE_STATS.bishop.damageBonus, 0.07, "bishop damage bonus follows v1.0.3 patch notes");
assert.equal(PIECE_STATS.queen.damageBonus, 0.12, "queen damage bonus follows v1.0.3 patch notes");
assert.equal(PIECE_STATS.king.damageBonus, 0.15, "king damage bonus follows v1.0.3 patch notes");

const whitePawn = getPieceAt(pieces, 4, 6);
assert.deepEqual(
  getLegalMoves(pieces, whitePawn).map((move) => `${move.x},${move.y}`),
  ["4,5", "4,4"],
  "white pawn should move one or two squares from start"
);

const whiteHorse = getPieceAt(pieces, 1, 7);
assert.deepEqual(
  getLegalMoves(pieces, whiteHorse).map((move) => `${move.x},${move.y}`).sort(),
  ["0,5", "2,5"],
  "horse should jump like a chess knight"
);

assert.ok(getAllLegalMoves(pieces, TEAM.WHITE).length > 0, "white should have legal opening moves");
assert.ok(getAllLegalMoves(pieces, TEAM.BLACK).length > 0, "black should have legal opening moves");

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
assert.match(html, /Chess Wars/, "index should render Chess Wars");
assert.match(html, /Showdown/, "index should render Showdown wording");
assert.match(main, /SHOWDOWN/, "client should include Showdown phase rendering");
assert.match(main, /clearCombatInput/, "client should clear combat input to prevent stuck movement");
assert.match(main, /getShowdownSprite/, "client should use generated sprite frames for showdown");
assert.match(main, /POWERUP_TURN_RANGE = \{/, "powerups should use a turn-count spawn range");
assert.match(main, /min: 4/, "powerups should spawn after at least 4 turns");
assert.match(main, /max: 8/, "powerups should spawn after at most 8 turns");
assert.match(main, /type: "heal"/, "client should include Heal powerup");
assert.match(main, /piece\.hp \+ 50/, "Heal should restore 50 HP");
assert.match(main, /type: "extinct"/, "client should include Extinct powerup");
assert.match(main, /drawVictoryIndicator/, "client should render a victory indicator");
assert.match(main, /ONLINE_POLL_INTERVAL/, "client should include online room polling");
assert.match(main, /createOnlineRoom/, "client should support room creation");
assert.match(main, /CRITICAL DAMAGE/, "client should show bold critical damage text");
assert.match(main, /startCombatBanner/, "critical damage should use non-pausing combat banner");
assert.match(main, /criticalFlash/, "critical damage should tint the defender red briefly");
assert.doesNotMatch(main, /startAnnouncement\("Critical Damage"/, "critical damage should not pause the action with an announcement");
assert.match(main, /ANNOUNCEMENT_SECONDS = 1/, "client should pause announcements for 1 second");
assert.match(main, /ONLINE_POLL_INTERVAL = 0\.08/, "online room polling should be responsive for invited-device moves");
assert.match(main, /ONLINE_SNAPSHOT_INTERVAL = 0\.12/, "online Showdown snapshots should be frequent enough to avoid guest freezes");
assert.match(main, /REMOTE_SHOWDOWN_LERP = 18/, "remote Showdown positions should be smoothed on invited devices");
assert.match(main, /new EventSource/, "online rooms should use a realtime event stream when available");
assert.match(main, /openOnlineStream/, "client should open a room event stream after joining");
assert.match(main, /closeOnlineStream/, "client should close stale room event streams when leaving or switching rooms");
assert.match(main, /streamConnected/, "client should keep polling only as a fallback when realtime streaming is unavailable");
assert.match(main, /flushOnlineSnapshotEvent/, "streamed snapshots should be coalesced to animation frames");
assert.match(main, /updateRemoteShowdownVisuals/, "invited devices should animate remote Showdown snapshots locally");
assert.match(main, /preserveRemoteShowdownVisuals/, "invited devices should preserve local visual positions between snapshots");
assert.match(main, /publishSnapshot\("showdown-end"\)/, "host should publish a final snapshot when Showdown ends");
assert.match(main, /shouldPublishPeriodicSnapshot/, "client should avoid unnecessary idle board snapshots");
assert.match(main, /canViewPieceMoves/, "client should hide legal moves from online opponents");
assert.match(main, /ctx\.strokeRect\(board\.x \+ selected\.x/, "opponents should still see the selected square");
assert.match(main, /if \(!canViewPieceMoves\(selected\)\) \{\s+return;\s+\}\s+for \(const move of state\.legalMoves\)/s, "legal move dots should remain hidden from opponents");
assert.match(main, /SHOWDOWN_ROUND_SECONDS = 60/, "Showdown rounds should have a 60-second timer");
assert.match(main, /SHOWDOWN_INTRO_SECONDS = 3/, "Showdown should have a 3-second intro delay");
assert.match(main, /ROUND_RESULT_SECONDS/, "round winner banners should stay visible before advancing");
assert.match(main, /SHOWDOWN_ROUNDS_TO_WIN = 2/, "Showdown should be first to 2 round wins");
assert.match(main, /roundWins/, "Showdown should track best-of-3 round wins");
assert.match(main, /finishShowdownRound/, "Showdown should resolve each round before the whole duel");
assert.match(main, /startNextShowdownRound/, "Showdown should reset into the next round when needed");
assert.match(main, /y: 0/, "Showdown input should be 2D horizontal only");
assert.match(main, /shouldFlipShowdownPerspective/, "online guests should see their piece on the left");
assert.match(main, /MAX_MANA = 100/, "ultimate mana capacity should be 100");
assert.match(main, /attacker\.mana = 0;\s+defender\.mana = 0;/s, "ultimate mana should reset at the start of each Showdown");
assert.doesNotMatch(main, /resetShowdownMana/, "ultimate mana should not be reset at round start or Showdown end");
assert.match(main, /Heavy Fist/, "pawn ultimate should be Heavy Fist");
assert.match(main, /Fortify/, "rook ultimate should be Fortify");
assert.match(main, /DASH_MULTIPLIER = 1\.75/, "horse Dash should boost speed and jump by 75 percent");
assert.match(main, /Blessing/, "bishop ultimate should be Blessing");
assert.match(main, /piece\.maxHp \* 0\.3/, "bishop Blessing should restore 30 percent total HP");
assert.match(main, /Barrage/, "queen ultimate should be Barrage");
assert.match(main, /barrageShots = 5/, "queen Barrage should launch 5 attacks");
assert.match(main, /Hard Swing/, "king ultimate should be Hard Swing");
assert.match(main, /grantMana/, "basic attacks should grant ultimate mana");
assert.match(main, /tryUltimate/, "fighters should be able to activate ultimate skills");
assert.match(main, /smashShowdowns = 1/, "Smash should arm only the receiving piece");
assert.match(main, /SMASH_DAMAGE_BONUS/, "Smash should affect Showdown damage for one duel");
assert.match(main, /consumeSmashAfterShowdown/, "Smash should expire after one Showdown");
assert.match(main, /powerupRequiresPieceSelection/, "selection-based powerups should be identified before turn completion");
assert.match(main, /pendingPowerupMove/, "selection-based powerups should hold the board move open");
assert.match(main, /finishPendingPowerupMove/, "selection-based powerups should finish the move only after the choice is used");
assert.match(main, /attacker\.hp = attacker\.maxHp;\s+defender\.hp = defender\.maxHp;/s, "each Showdown should start both pieces at full HP");
assert.match(main, /winner\.hp = winner\.maxHp/, "remaining HP should not be retained after a Showdown");
assert.match(main, /HP activates at full value during Showdown/, "board state should not present retained HP as active");
assert.doesNotMatch(main, /drawHealthBar\(-board\.cell/, "board pieces should not draw persistent HP bars");
assert.match(main, /drawBoardPlinth/, "board should include a 3D plinth");
assert.match(main, /SHOWDOWN_SPRITE_WIDTH = 240/, "Showdown sprites should be wide enough for weapon arcs");
assert.match(main, /SHOWDOWN_SPRITE_HEIGHT = 272/, "Showdown sprites should have extra height to avoid bishop cropping");
assert.match(main, /Bold stickman legs/, "Showdown fighters should use bold stickman rendering");
assert.match(main, /moveBlend/, "Showdown fighters should blend into movement frames smoothly");
assert.match(main, /drawFighterAfterimages/, "Showdown fighters should have afterimages for fast motion");
assert.match(main, /attack-windup/, "Showdown attacks should include a windup pose");
assert.match(main, /attack-swing/, "Showdown attacks should include a swing pose");
assert.match(main, /attack-strike/, "Showdown attacks should include a strike pose");
assert.match(main, /attack-recover/, "Showdown attacks should include a recovery pose");
assert.match(main, /run-/, "Showdown fighters should have multiple running frames");
assert.match(main, /drawSpriteWeaponSweep/, "Showdown attacks should draw weapon sweep trails");
assert.match(main, /drawStickmanHeadgear/, "Showdown stickmen should keep piece identity headgear");
assert.match(main, /drawShowdownWeapon/, "Showdown should render piece-specific weapons from pose data");
assert.match(main, /drawPawnFists/, "pawns should fight with fists and no weapon");
assert.match(main, /drawSpikeClubWeapon/, "rooks should render a spike club during Showdown");
assert.match(main, /drawSpearWeapon/, "horses should render a spear or javelin during Showdown");
assert.match(main, /drawCrossWeapon/, "bishops should render a cross weapon during Showdown");
assert.match(main, /drawScytheWeapon/, "queens should render a scythe during Showdown");
assert.match(main, /drawSwordAndShieldWeapon/, "kings should render both sword and shield during Showdown");
assert.match(main, /frame\.startsWith\("block"\)/, "Showdown weapons should react to blocking poses");
assert.match(main, /pose\.weaponStart/, "Showdown weapons should attach to animated hand poses");
assert.match(main, /state\.mouse\.attack/, "client should support mouse attack controls");
assert.match(main, /jump: \[\" \", \"Space\", \"Spacebar\"\]/, "client should support Space jump controls");
assert.match(main, /Math\.random\(\) < 0\.04/, "critical chance should be 4 percent");
assert.match(main, /ULTIMATE_ATTACK_RANGE = ARENA\.attackRange/, "attack ultimates should use normal attack range checks");
assert.match(main, /isUltimateAttackInRange/, "attack ultimates should miss when the target is out of range");
assert.match(main, /missUltimateAttack/, "missed attack ultimates should show and log misses");
assert.match(main, /dealUltimateDamage\(fighter, opponent, 10, "Barrage"/, "Barrage shots should share the attack ultimate hit check");
assert.doesNotMatch(main, /ARENA\.attackRange \+ 110/, "Barrage should not use the old extended hit range");
assert.match(main, /fighter\.jumpHeld/, "Showdown jump should require a new press after landing");
assert.match(main, /randomInt\(0, 2\)/, "blocking should reduce incoming damage to a 0-2 roll");
assert.match(main, /options\.mana && damage > 0 && !blocked/, "attacking a blocking fighter should not grant mana");
assert.match(main, /battleLogCard\.classList\.toggle\("is-hidden", state\.phase !== "showoff"\)/, "battle log should only be visible during Showdown");
assert.match(html, /<header class="brand-block game-title">/, "game title should sit in the top header");
assert.match(html, /<section class="board-column"[\s\S]*id="battle-log-card"[\s\S]*<\/section>\s*<aside class="hud"/, "battle log should live below the chessboard column");
assert.doesNotMatch(html, /<aside class="hud"[\s\S]*<div class="log-card"/, "battle log should no longer live in the right-side HUD");
assert.match(styles, /grid-template-areas:\s*"title title"\s*"board hud"/, "desktop layout should place the title above board and HUD");
assert.match(styles, /\.game-title\s*\{[\s\S]*justify-self: center/, "game title should be centered at the top");
assert.match(styles, /\.board-column \.log-card\s*\{/, "battle log should have board-column layout styling");

const server = readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
assert.match(server, /\/api\/rooms/, "server should expose room endpoints");
assert.match(server, /0\.0\.0\.0/, "server should bind beyond localhost for two-device room links");
assert.match(server, /text\/event-stream/, "server should expose a realtime room event stream");
assert.match(server, /broadcastEvent/, "server should broadcast room events to open streams");
assert.match(server, /last-event-id/, "server should resume event streams without replaying stale events");

console.log("Chess Wars checks passed.");
