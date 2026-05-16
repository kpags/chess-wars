import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import {
  ARMORS,
  BOARD_SIZE,
  PIECE_STATS,
  TEAM,
  createInitialPieces,
  getAllLegalMoves,
  getLegalMoves,
  getPieceAt
} from "../src/rules.js";

const pieces = createInitialPieces();

function readPngSize(path) {
  const png = readFileSync(path);
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20)
  };
}

assert.equal(BOARD_SIZE, 8, "board should be 8x8");
assert.equal(pieces.length, 32, "initial chess setup should have 32 pieces");
assert.equal(pieces[0].mana, 0, "pieces should start with empty ultimate mana");
assert.equal(pieces[0].smashShowdowns, 0, "pieces should start without Smash armed");
assert.equal(pieces[0].armor, "warPlate", "pieces should carry their class armor on themselves");
assert.equal(PIECE_STATS.pawn.hp, 60, "pawn hp follows v1.2.0 patch notes");
assert.equal(PIECE_STATS.rook.hp, 85, "rook hp follows v1.2.0 patch notes");
assert.equal(PIECE_STATS.horse.hp, 70, "knight hp follows v1.2.0 patch notes");
assert.equal(PIECE_STATS.horse.name, "Knight", "horse piece should be named Knight in the UI");
assert.equal(PIECE_STATS.horse.short, "K", "knight piece should use the requested K board marker");
assert.equal(PIECE_STATS.bishop.hp, 100, "bishop hp follows v1.2.0 patch notes");
assert.equal(PIECE_STATS.queen.hp, 130, "queen hp follows v1.2.0 patch notes");
assert.equal(PIECE_STATS.king.hp, 150, "king hp follows v1.2.0 patch notes");
assert.equal(PIECE_STATS.pawn.weapon, "Fists", "pawn weapon follows v1 patch notes");
assert.equal(PIECE_STATS.rook.weapon, "Spike Club", "rook weapon follows v1 patch notes");
assert.equal(PIECE_STATS.horse.weapon, "Javelin", "horse weapon follows v1 patch notes");
assert.equal(PIECE_STATS.bishop.weapon, "Cross", "bishop weapon follows v1 patch notes");
assert.equal(PIECE_STATS.queen.weapon, "Scythe", "queen weapon follows v1 patch notes");
assert.equal(PIECE_STATS.king.weapon, "Sword & Shield", "king weapon follows v1 patch notes");
assert.equal(PIECE_STATS.pawn.damageBonus, 0, "pawn has fixed damage");
assert.equal(PIECE_STATS.rook.damageBonus, 0.04, "rook damage bonus follows v1.0.3 patch notes");
assert.equal(PIECE_STATS.horse.damageBonus, 0.05, "horse damage bonus follows v1.0.3 patch notes");
assert.equal(PIECE_STATS.bishop.damageBonus, 0.03, "bishop damage bonus follows v1.2.0 patch notes");
assert.equal(PIECE_STATS.queen.damageBonus, 0.08, "queen damage bonus follows v1.2.0 patch notes");
assert.equal(PIECE_STATS.king.damageBonus, 0.1, "king damage bonus follows v1.2.0 patch notes");
assert.equal(PIECE_STATS.pawn.armor, "ironPlate", "pawn should use Iron Plate armor");
assert.equal(PIECE_STATS.rook.armor, "warPlate", "rook should use War Plate armor");
assert.equal(PIECE_STATS.horse.armor, "blackSteelCuirass", "knight should use Black Steel Cuirass armor");
assert.equal(PIECE_STATS.bishop.armor, "lionheartMail", "bishop should use Lionheart Mail armor");
assert.equal(PIECE_STATS.queen.armor, "royalArmor", "queen should use Royal Armor");
assert.equal(PIECE_STATS.king.armor, "royalArmor", "king should use Royal Armor");
assert.equal(ARMORS.ironPlate.reduction, 0.015, "Iron Plate should reduce damage by 1.5 percent");
assert.equal(ARMORS.lionheartMail.reduction, 0.02, "Lionheart Mail should reduce damage by 2 percent");
assert.equal(ARMORS.blackSteelCuirass.reduction, 0.04, "Black Steel Cuirass should reduce damage by 4 percent");
assert.equal(ARMORS.warPlate.reduction, 0.07, "War Plate should reduce damage by 7 percent");
assert.equal(ARMORS.royalArmor.reduction, 0.15, "Royal Armor should reduce damage by 15 percent");

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
  "knight should keep the chess knight jump"
);

assert.ok(getAllLegalMoves(pieces, TEAM.WHITE).length > 0, "white should have legal opening moves");
assert.ok(getAllLegalMoves(pieces, TEAM.BLACK).length > 0, "black should have legal opening moves");

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const server = readFileSync(new URL("../server.mjs", import.meta.url), "utf8");
const pawnGeneratedFrames = {
  charge_dash: 4,
  crouch: 4,
  guard_block: 4,
  heavy_attack_double_punch: 4,
  hit_hurt: 4,
  idle_ready: 4,
  jump: 5,
  knocked_down_defeat: 4,
  light_attack_punch: 4,
  rock_throw: 3,
  taunt_command: 4,
  victory: 4,
  walk: 5,
  board_move_animation: 12
};

for (const team of [TEAM.BLACK, TEAM.WHITE]) {
  for (const [action, expectedFrames] of Object.entries(pawnGeneratedFrames)) {
    const actionDir = new URL(`../assets/sprites/pawns/${team}/${action}/`, import.meta.url);
    assert.ok(existsSync(actionDir), `generated ${team} pawn action folder should exist for ${action}`);
    const frames = readdirSync(actionDir).filter((name) => /^frame-\d+\.png$/.test(name));
    assert.equal(frames.length, expectedFrames, `generated ${team} pawn action ${action} should have ${expectedFrames} frames`);
  }
  assert.ok(existsSync(new URL(`../assets/sprites/pawns/${team}/preview-sheet.png`, import.meta.url)), `generated ${team} pawn preview sheet should exist`);
  assert.ok(existsSync(new URL(`../assets/sprites/pawns/${team}/manifest.json`, import.meta.url)), `generated ${team} pawn manifest should exist`);
}
assert.ok(existsSync(new URL("../assets/sprites/pawns/white/top_view_board_move/frame-00.png", import.meta.url)), "white top-view board frames should be generated for future board variants");

const blackRookSourceGifs = [
  "idle_ready.gif",
  "walk.gif",
  "charge_dash.gif",
  "light_attack_punch.gif",
  "heavy_attack_double_crush.gif",
  "ground_smash.gif",
  "jump.gif",
  "guard_block.gif",
  "hit_hurt.gif",
  "victory.gif",
  "knocked_down_defeat.gif",
  "board_idle.gif",
  "board_up.gif",
  "board_down.gif",
  "board_left.gif",
  "board_right.gif",
  "board_up_left.gif",
  "board_up_right.gif",
  "board_down_left.gif",
  "board_down_right.gif"
];

for (const asset of blackRookSourceGifs) {
  assert.ok(existsSync(new URL(`../assets/gif/black_rooks/${asset}`, import.meta.url)), `black rook source GIF should exist: ${asset}`);
}

const blackRookGeneratedFrames = {
  board_down: 1,
  board_down_left: 1,
  board_down_right: 1,
  board_idle: 1,
  board_left: 1,
  board_right: 1,
  board_step_1: 1,
  board_step_2: 1,
  board_turn: 1,
  board_up: 1,
  board_up_left: 1,
  board_up_right: 1,
  charge_dash: 5,
  crouch: 4,
  ground_smash: 5,
  guard_block: 4,
  heavy_attack_double_crush: 4,
  hit_hurt: 4,
  idle_ready: 4,
  jump: 5,
  knocked_down_defeat: 4,
  light_attack_punch: 4,
  taunt_command: 4,
  top_view_board_move: 12,
  victory: 5,
  walk: 5
};

const blackRookShowdownGeneratedFrames = new Set([
  "charge_dash",
  "crouch",
  "ground_smash",
  "guard_block",
  "heavy_attack_double_crush",
  "hit_hurt",
  "idle_ready",
  "jump",
  "knocked_down_defeat",
  "light_attack_punch",
  "taunt_command",
  "victory",
  "walk"
]);
let blackRookShowdownFrameSize = null;

for (const [action, expectedFrames] of Object.entries(blackRookGeneratedFrames)) {
  const actionDir = new URL(`../assets/sprites/rooks/black/${action}/`, import.meta.url);
  assert.ok(existsSync(actionDir), `generated black rook action folder should exist for ${action}`);
  const frames = readdirSync(actionDir).filter((name) => /^frame-\d+\.png$/.test(name));
  assert.equal(frames.length, expectedFrames, `generated black rook action ${action} should have ${expectedFrames} frames`);

  if (blackRookShowdownGeneratedFrames.has(action)) {
    for (const frame of frames) {
      const size = readPngSize(new URL(frame, actionDir));
      blackRookShowdownFrameSize ??= size;
      assert.deepEqual(size, blackRookShowdownFrameSize, `black rook Showdown frame ${action}/${frame} should use the shared canvas size`);
    }
  }
}
assert.ok(existsSync(new URL("../assets/sprites/rooks/black/preview-sheet.png", import.meta.url)), "generated black rook preview sheet should exist");
assert.ok(existsSync(new URL("../assets/sprites/rooks/black/manifest.json", import.meta.url)), "generated black rook manifest should exist");

const whiteRookSourceGifs = [
  "idle_ready.gif",
  "walk.gif",
  "advance_lunge.gif",
  "light_attack_crushing_punch.gif",
  "heavy_attack_ground_smash.gif",
  "jump.gif",
  "crouch_lower_stance.gif",
  "get_hit.gif",
  "taunt_roar.gif",
  "die_fall.gif",
  "top_view_board_move.gif",
  "board_idle.gif",
  "board_up.gif",
  "board_down.gif",
  "board_left.gif",
  "board_right.gif",
  "board_up_left.gif",
  "board_up_right.gif",
  "board_down_left.gif",
  "board_down_right.gif"
];

for (const asset of whiteRookSourceGifs) {
  assert.ok(existsSync(new URL(`../assets/gif/white_rooks/${asset}`, import.meta.url)), `white rook source GIF should exist: ${asset}`);
}

const whiteRookGeneratedFrames = {
  board_down: 1,
  board_down_left: 1,
  board_down_right: 1,
  board_idle: 1,
  board_left: 1,
  board_right: 1,
  board_step_1: 1,
  board_step_2: 1,
  board_turn: 1,
  board_up: 1,
  board_up_left: 1,
  board_up_right: 1,
  charge_dash: 4,
  crouch: 5,
  ground_smash: 5,
  guard_block: 5,
  heavy_attack_double_crush: 5,
  hit_hurt: 4,
  idle_ready: 5,
  jump: 6,
  knocked_down_defeat: 5,
  light_attack_punch: 5,
  taunt_command: 5,
  top_view_board_move: 12,
  victory: 5,
  walk: 5
};
let whiteRookShowdownFrameSize = null;

for (const [action, expectedFrames] of Object.entries(whiteRookGeneratedFrames)) {
  const actionDir = new URL(`../assets/sprites/rooks/white/${action}/`, import.meta.url);
  assert.ok(existsSync(actionDir), `generated white rook action folder should exist for ${action}`);
  const frames = readdirSync(actionDir).filter((name) => /^frame-\d+\.png$/.test(name));
  assert.equal(frames.length, expectedFrames, `generated white rook action ${action} should have ${expectedFrames} frames`);

  if (blackRookShowdownGeneratedFrames.has(action)) {
    for (const frame of frames) {
      const size = readPngSize(new URL(frame, actionDir));
      whiteRookShowdownFrameSize ??= size;
      assert.deepEqual(size, whiteRookShowdownFrameSize, `white rook Showdown frame ${action}/${frame} should use the shared canvas size`);
    }
  }
}
assert.ok(existsSync(new URL("../assets/sprites/rooks/white/preview-sheet.png", import.meta.url)), "generated white rook preview sheet should exist");
assert.ok(existsSync(new URL("../assets/sprites/rooks/white/manifest.json", import.meta.url)), "generated white rook manifest should exist");
const whiteRookManifest = JSON.parse(readFileSync(new URL("../assets/sprites/rooks/white/manifest.json", import.meta.url), "utf8").replace(/^\uFEFF/, ""));
assert.equal(whiteRookManifest.showdownContentSize?.width, 198, "white rook Showdown frames should normalize visible content width");
assert.equal(whiteRookManifest.showdownContentSize?.height, 168, "white rook Showdown frames should normalize visible content height");

assert.match(server, /"\.webp": "image\/webp"/, "dev server should serve WebP animation assets with the right MIME type");

assert.match(html, /Chess Wars/, "index should render Chess Wars");
assert.match(html, /Showdown/, "index should render Showdown wording");
assert.match(html, /id="online-presence"/, "online room should include invited-player presence indicator");
assert.match(html, /id="online-chat"/, "online room should include a text-only chat panel");
assert.match(html, /id="online-chat-input"[\s\S]*maxlength="160"/, "online chat input should limit message length");
assert.match(html, /id="ai-side-picker"/, "Vs AI mode should include a side picker");
assert.match(html, /id="ai-side-white"[\s\S]*id="ai-side-black"/, "AI side picker should let the user choose White or Black");
assert.match(html, /id="confirm-overlay"[\s\S]*id="confirm-title"[\s\S]*id="confirm-detail"[\s\S]*id="confirm-no"[\s\S]*id="confirm-yes"/, "game reset confirmations should use a custom modal");
assert.match(html, /Confirm this action\?[\s\S]*Cancel[\s\S]*OK/, "confirmation modal should use the requested title and button labels");
assert.match(main, /function confirmGameChange/, "mode and new-game buttons should confirm before resetting progress");
assert.match(main, /function showConfirmDialog/, "confirmation should be rendered with the in-game modal");
assert.match(main, /function resolveConfirmation/, "confirmation modal should resolve through game UI buttons");
assert.match(main, /confirmAiSideChange/, "AI side buttons should confirm before changing sides");
assert.match(main, /confirmGameChange\("Switch to Vs AI\?", "The current game will reset\."\)/, "Vs AI button should confirm before switching");
assert.match(main, /confirmGameChange\("Switch to Local 2P\?", "The current game will reset\."\)/, "Local 2P button should confirm before switching");
assert.match(main, /confirmGameChange\("Start a new game\?", "The current game will reset\."\)/, "New Game button should confirm before resetting");
assert.match(main, /confirmGameChange\(`Choose \$\{sideName\} side\?`, "The current Vs AI game will reset\."\)/, "AI side buttons should confirm before resetting");
assert.doesNotMatch(main, /window\.confirm/, "confirmation should not use the browser default confirm dialog");
assert.match(main, /SHOWDOWN/, "client should include Showdown phase rendering");
assert.match(main, /clearCombatInput/, "client should clear combat input to prevent stuck movement");
assert.match(main, /getShowdownSprite/, "client should use generated sprite frames for showdown");
assert.match(main, /POWERUPS_ENABLED = false/, "powerups should be disabled for balance");
assert.match(main, /if \(!POWERUPS_ENABLED\) \{\s+state\.powerup = null;\s+state\.powerupTurnsRemaining = null;/s, "disabled powerups should not spawn or remain on the board");
assert.match(main, /els\.powerupCard\.classList\.toggle\("is-hidden", !POWERUPS_ENABLED\)/, "powerup HUD should hide while powerups are disabled");
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
assert.match(main, /drawCriticalModelTint/, "critical damage should tint only the fighter model");
assert.match(main, /drawHitModelTint/, "normal Showdown damage should tint the fighter model gray-white");
assert.match(main, /rgba\(226, 232, 232, \$\{alpha\}\)/, "normal damage tint should use a grayish white overlay");
assert.doesNotMatch(main, /ctx\.globalCompositeOperation = "source-atop";\s+ctx\.fillStyle = `rgba\(214, 37, 43,/s, "critical damage should not draw a red rectangle over the arena");
assert.doesNotMatch(main, /ctx\.ellipse\(0, -81, 81, 117/, "Showdown damage feedback should not draw the old circular hit ring");
assert.doesNotMatch(main, /startAnnouncement\("Critical Damage"/, "critical damage should not pause the action with an announcement");
assert.match(main, /ANNOUNCEMENT_SECONDS = 1/, "client should pause announcements for 1 second");
assert.match(main, /ONLINE_POLL_INTERVAL = 0\.08/, "online room polling should be responsive for invited-device moves");
assert.match(main, /ONLINE_SNAPSHOT_INTERVAL = 0\.12/, "online Showdown snapshots should be frequent enough to avoid guest freezes");
assert.match(main, /REMOTE_SHOWDOWN_LERP = 18/, "remote Showdown positions should be smoothed on invited devices");
assert.match(main, /new EventSource/, "online rooms should use a realtime event stream when available");
assert.match(main, /openOnlineStream/, "client should open a room event stream after joining");
assert.match(main, /closeOnlineStream/, "client should close stale room event streams when leaving or switching rooms");
assert.match(main, /streamConnected/, "client should keep polling only as a fallback when realtime streaming is unavailable");
assert.match(main, /guestJoined/, "online rooms should track whether the invited player has joined");
assert.match(main, /getOnlinePresenceMessage/, "online HUD should show invited-player join status");
assert.match(main, /sendOnlineChatMessage/, "online rooms should support sending text chat messages");
assert.match(main, /receiveOnlineChatMessage/, "online rooms should support receiving text chat messages");
assert.match(main, /sendOnlineEvent\("chat"/, "chat should use the existing online room event channel");
assert.match(main, /flushOnlineSnapshotEvent/, "streamed snapshots should be coalesced to animation frames");
assert.match(main, /updateRemoteShowdownVisuals/, "invited devices should animate remote Showdown snapshots locally");
assert.match(main, /preserveRemoteShowdownVisuals/, "invited devices should preserve local visual positions between snapshots");
assert.match(main, /publishSnapshot\("showdown-end"\)/, "host should publish a final snapshot when Showdown ends");
assert.match(main, /shouldPublishPeriodicSnapshot/, "client should avoid unnecessary idle board snapshots");
assert.match(main, /canViewPieceMoves/, "client should hide legal moves from online opponents");
assert.match(main, /gameBoardPositionToViewPosition\(selected\)/, "opponents should still see the selected square through board perspective");
assert.match(main, /if \(!canViewPieceMoves\(selected\)\) \{\s+return;\s+\}\s+for \(const move of state\.legalMoves\)/s, "legal move dots should remain hidden from opponents");
assert.match(main, /function getLocalBoardTeam/, "board perspective should track the local player's side");
assert.match(main, /function shouldFlipBoardPerspective/, "board should flip when the local player is black");
assert.match(main, /viewBoardSquareToGameSquare/, "board clicks should map from local view squares back to game squares");
assert.match(main, /SHOWDOWN_ROUND_SECONDS = 60/, "Showdown rounds should have a 60-second timer");
assert.match(main, /SHOWDOWN_INTRO_SECONDS = 3/, "Showdown should have a 3-second intro delay");
assert.match(main, /ROUND_RESULT_SECONDS/, "round winner banners should stay visible before advancing");
assert.match(main, /SHOWDOWN_ROUNDS_TO_WIN = 2/, "Showdown should be first to 2 round wins");
assert.match(main, /roundWins/, "Showdown should track best-of-3 round wins");
assert.match(main, /finishShowdownRound/, "Showdown should resolve each round before the whole duel");
assert.match(main, /startNextShowdownRound/, "Showdown should reset into the next round when needed");
assert.match(main, /showoff\.started = false;\s+showoff\.introTimer = SHOWDOWN_INTRO_SECONDS;/s, "each new Showdown round should get the ready countdown");
assert.match(main, /y: 0/, "Showdown input should be 2D horizontal only");
assert.match(main, /return getLocalShowdownTeam\(\) === TEAM\.BLACK;/, "black-side players should see their Showdown piece on the left");
assert.match(main, /shouldInvertLocalShowdownInput/, "local black-side Showdown controls should follow the flipped view");
assert.match(main, /MAX_MANA = 100/, "ultimate mana capacity should be 100");
assert.match(main, /SHOWDOWN_JUMP_HEIGHT_MULTIPLIER = 1\.4/, "Showdown jump height should be increased by 40 percent");
assert.match(main, /SHOWDOWN_JUMP_VELOCITY = Math\.round\(SHOWDOWN_BASE_JUMP_VELOCITY \* Math\.sqrt\(SHOWDOWN_JUMP_HEIGHT_MULTIPLIER\)\)/, "jump velocity should scale to produce 40 percent more height");
assert.match(main, /fighter\.vz = SHOWDOWN_JUMP_VELOCITY \* dashMultiplier/, "Showdown jumps should use the v1.2.1 jump velocity");
assert.match(main, /attacker\.mana = 0;\s+defender\.mana = 0;/s, "ultimate mana should reset at the start of each Showdown");
assert.doesNotMatch(main, /resetShowdownMana/, "ultimate mana should not be reset at round start or Showdown end");
assert.match(main, /Heavy Fist/, "pawn ultimate should be Heavy Fist");
assert.match(main, /Fortify/, "rook ultimate should be Fortify");
assert.match(main, /Stampede/, "horse ultimate should be Stampede");
assert.match(main, /STAMPEDE_DURATION = 3/, "horse Stampede should last 3 seconds");
assert.match(main, /STAMPEDE_SPEED_MULTIPLIER = 2/, "horse Stampede should move at 200 percent speed");
assert.match(main, /STAMPEDE_DAMAGE = 12/, "horse Stampede should deal 12 damage on each pass");
assert.match(main, /label: "Stampede",\s+mana: false,\s+ignoreBlock: true,/s, "Stampede should ignore block damage reduction");
assert.match(main, /updateStampede/, "horse Stampede should move back and forth during Showdown");
assert.match(main, /STAMPEDE_DASH_INTERVAL = 0\.07/, "horse Stampede should use frequent dash frames");
assert.match(main, /STAMPEDE_DASH_DISTANCE = 96/, "horse Stampede should use shorter smooth dash bursts");
assert.match(main, /performStampedeDash/, "horse Stampede should teleport between dash positions");
assert.match(main, /drawStampedeDashEffect/, "horse Stampede should draw a dash smear effect");
assert.match(main, /function isStampeding\(fighter\)/, "horse Stampede should share one active-skill visibility check");
assert.match(main, /if \(isStampeding\(fighter\)\) \{\s+drawStampedeDashEffect\(fighter, viewX, jumpHeight\);\s+ctx\.restore\(\);\s+return;/s, "horse piece should be hidden while Stampede is active");
assert.match(main, /if \(!isStampeding\(fighter\)\) \{\s+return;\s+\}/s, "horse Stampede dash effects should not linger after the skill ends");
assert.match(main, /stampedeTrailFrom/, "horse Stampede should remember the dash trail start");
assert.match(main, /stampedeTrailTo/, "horse Stampede should remember the dash trail end");
assert.match(main, /Blessing/, "bishop ultimate should be Blessing");
assert.match(main, /piece\.maxHp \* 0\.3/, "bishop Blessing should restore 30 percent total HP");
assert.match(main, /Barrage/, "queen ultimate should be Barrage");
assert.match(main, /barrageShots = 5/, "queen Barrage should launch 5 attacks");
assert.match(main, /Hard Swing/, "king ultimate should be Hard Swing");
assert.match(main, /grantMana/, "basic attacks should grant ultimate mana");
assert.match(main, /tryUltimate/, "fighters should be able to activate ultimate skills");
assert.match(main, /const blocked = !options\.ignoreBlock && Boolean\(opponent\.block\)/, "damage ultimates should be able to ignore block effects");
assert.match(main, /dealCombatDamage\(fighter, opponent, boostedDamage,[\s\S]*ignoreBlock: true/, "damage-dealing ultimates should ignore block effects");
assert.match(main, /PASSIVE_TRIGGER_CHANCE = 0\.1/, "class passive skills should have a 10 percent activation chance");
assert.match(main, /PASSIVE_PLUS_DAMAGE = 3/, "pawn passive should add 3 attack damage");
assert.match(main, /PASSIVE_PLUS_DAMAGE_SECONDS = 3/, "pawn passive should last 3 seconds");
assert.match(main, /PASSIVE_STUN_SECONDS = 1/, "rook passive should stun for 1 second");
assert.match(main, /PASSIVE_SPEED_MULTIPLIER = 1\.5/, "knight passive should add a 50 percent speed boost");
assert.match(main, /PASSIVE_SPEED_SECONDS = 3/, "knight passive should last 3 seconds");
assert.match(main, /PASSIVE_LIFE_STEAL = 8/, "bishop passive should steal 8 HP");
assert.match(main, /PASSIVE_INTIMIDATE_SECONDS = 2/, "queen passive should last 2 seconds");
assert.match(main, /PASSIVE_INTIMIDATE_COOLDOWN_MULTIPLIER = 4 \/ 3/, "queen passive should reduce opponent attack speed by 25 percent");
assert.match(main, /PASSIVE_DOMINANCE_SECONDS = 3/, "king passive should last 3 seconds");
assert.match(main, /PASSIVE_DOMINANCE_DAMAGE = 10/, "king passive should add 10 attack damage");
assert.match(main, /PASSIVE_DOMINANCE_REDUCTION = 5/, "king passive should reduce incoming damage by 5");
assert.match(main, /maybeActivatePassiveSkill/, "Showdown attacks should roll for class passives");
assert.match(main, /showPassiveActivation/, "passive activations should show the source piece and skill");
assert.match(main, /drawPassiveIndicator/, "active passives should draw an in-Showdown indicator");
assert.match(main, /drawStunEffect/, "stunned pieces should show a stun effect above the head");
assert.match(main, /opponent\.stunTimer = Math\.max\(opponent\.stunTimer \?\? 0, options\.stun \?\? 0\)/, "stun effects should disappear when the stun timer ends");
assert.match(main, /applyArmorReduction/, "armor should reduce incoming Showdown damage");
assert.match(main, /getPieceArmor/, "piece equipment should be read from armor stats");
assert.match(main, /piece\.armor = piece\.armor \?\? PIECE_STATS\[piece\.type\]\.armor/, "each piece should keep its own class armor assignment");
assert.match(main, /return ARMORS\[piece\?\.armor \?\? PIECE_STATS\[piece\?\.type\]\?\.armor\] \?\? null;/, "damage reduction should read armor from the receiving piece");
assert.match(main, /smashShowdowns = 1/, "Smash should arm only the receiving piece");
assert.match(main, /SMASH_DAMAGE_BONUS/, "Smash should affect Showdown damage for one duel");
assert.match(main, /consumeSmashAfterShowdown/, "Smash should expire after one Showdown");
assert.match(main, /powerupRequiresPieceSelection/, "selection-based powerups should be identified before turn completion");
assert.match(main, /pendingPowerupMove/, "selection-based powerups should hold the board move open");
assert.match(main, /finishPendingPowerupMove/, "selection-based powerups should finish the move only after the choice is used");
assert.match(main, /pendingShowdownPreview/, "capturing board moves should preview before Showdown starts");
assert.match(main, /SHOWDOWN_PREVIEW_SECONDS/, "Showdown-starting captures should have a visible board move preview duration");
assert.match(main, /beginShowdownMovePreview/, "capture moves should begin a board preview before Showdown");
assert.match(main, /updateShowdownMovePreview/, "board preview should start Showdown after the preview finishes");
assert.match(main, /drawShowdownMovePreview/, "board should draw the move that started Showdown");
assert.match(main, /attacker\.hp = attacker\.maxHp;\s+defender\.hp = defender\.maxHp;/s, "each Showdown should start both pieces at full HP");
assert.match(main, /winner\.hp = winner\.maxHp/, "remaining HP should not be retained after a Showdown");
assert.match(main, /HP activates at full value during Showdown/, "board state should not present retained HP as active");
assert.doesNotMatch(main, /drawHealthBar\(-board\.cell/, "board pieces should not draw persistent HP bars");
assert.doesNotMatch(main, /drawHealthBar\(-76/, "Showdown HP bars should not overlay fighter sprites");
assert.doesNotMatch(main, /drawManaBar\(-76/, "Showdown mana bars should not overlay fighter sprites");
assert.match(main, /drawBoardPlinth/, "board should include a 3D plinth");
assert.match(main, /SHOWDOWN_SPRITE_WIDTH = 460/, "Showdown sprites should be wide enough for weapon arcs");
assert.match(main, /SHOWDOWN_SPRITE_HEIGHT = 320/, "Showdown sprites should have extra height to avoid weapon cropping");
assert.match(main, /SHOWDOWN_SPRITE_BODY_Y = 246/, "Showdown sprite art should be shifted down to keep weapons visible");
assert.match(main, /SHOWDOWN_SPRITE_FLOOR_Y = 284/, "Showdown sprite drawing should keep the fighter feet anchored");
assert.match(main, /SHOWDOWN_FIGHTER_SCALE = 1\.5/, "Showdown fighters should render 50 percent larger");
assert.match(main, /ctx\.drawImage\(sprite, spriteX, spriteY, SHOWDOWN_DRAW_WIDTH, SHOWDOWN_DRAW_HEIGHT\)/, "Showdown fighters should use the scaled draw size");
assert.match(main, /Bold stickman legs/, "Showdown fighters should use bold stickman rendering");
assert.match(main, /moveBlend/, "Showdown fighters should blend into movement frames smoothly");
assert.match(main, /drawFighterAfterimages/, "Showdown fighters should have afterimages for fast motion");
assert.match(main, /drawShowdownHudSide/, "Showdown should draw fighting-game style side HUD bars");
assert.match(main, /drawShowdownHudBar/, "Showdown HUD should render top health and mana bars");
assert.match(main, /drawShowdownTimerBadge/, "Showdown timer should be centered between the top bars");
assert.match(main, /drawShowdownRoundBoxes/, "Showdown HUD should show two round-win boxes for each side");
assert.match(main, /drawShowdownReadyOverlay/, "Showdown intro should use a big ready-count overlay");
assert.match(main, /timer === null \? "VS"/, "Showdown intro countdown should not appear between the top bars");
assert.match(main, /SHOWDOWN_READY_PANEL_HEIGHT = 208/, "Showdown ready countdown should fit inside a taller panel");
assert.match(main, /SHOWDOWN_READY_COUNT_FONT = 84/, "Showdown ready countdown number should not spill outside the panel");
assert.match(main, /SHOWDOWN_MANA_FULL_GLOW/, "full mana bars should glow light blue");
assert.match(main, /showdownHudHealthTrails/, "Showdown health bars should track delayed damage animation state");
assert.match(main, /SHOWDOWN_HEALTH_TRAIL_HOLD_SECONDS/, "Showdown health damage trail should wait before draining");
assert.match(main, /SHOWDOWN_HEALTH_TRAIL_DRAIN_SPEED/, "Showdown health damage trail should animate down after the hold");
assert.match(main, /ctx\.ellipse\(0, 34, Math\.max\(48, 96 - jumpHeight \* 0\.2\)/, "Showdown fighter shadows should sit closer to the model");
assert.match(main, /drawDistantPalace/, "Showdown should use a distant palace battlefield backdrop");
assert.match(main, /drawSideRuin/, "Showdown battlefield should include side ruins like the reference arena");
assert.match(main, /drawArenaGroundPatch/, "Showdown battlefield should paint cracked grass and dirt ground patches");
assert.match(main, /drawArenaGroundCracks/, "Showdown battlefield should include cracked arena ground details");
assert.match(main, /wins Showdown/, "finished Showdown banner should name the winning piece");
assert.doesNotMatch(main, /SHOWDOWN WON/, "finished Showdown banner should not use the generic Showdown won label");
assert.doesNotMatch(main, /Showdown winner decided/, "Showdown HUD title should name the winner instead of using a generic decision label");
assert.match(main, /attack-windup/, "Showdown attacks should include a windup pose");
assert.match(main, /attack-swing/, "Showdown attacks should include a swing pose");
assert.match(main, /attack-strike/, "Showdown attacks should include a strike pose");
assert.match(main, /attack-recover/, "Showdown attacks should include a recovery pose");
assert.match(main, /run-/, "Showdown fighters should have multiple running frames");
assert.match(main, /drawSpriteWeaponSweep/, "Showdown attacks should draw weapon sweep trails");
assert.match(main, /drawStickmanHeadgear/, "Showdown stickmen should keep piece identity headgear");
assert.match(main, /drawShowdownWeapon/, "Showdown should render piece-specific weapons from pose data");
assert.match(main, /drawPawnFists/, "pawns should fight with fists and no weapon");
assert.match(main, /drawPawnBoardTopView/, "pawns should use top-view board tokens");
assert.match(main, /getPawnShowdownPalette/, "pawns should use separate black and white Showdown palettes");
assert.match(main, /getPawnStickPose/, "pawns should have dedicated Showdown poses");
assert.match(main, /PAWN_SPRITE_SHEETS/, "pawns should support external sprite-sheet assets");
assert.match(main, /black-pawn-sheet\.png/, "black pawn sprite sheet should have a known asset path");
assert.match(main, /white-pawn-sheet\.png/, "white pawn sprite sheet should have a known asset path");
assert.match(main, /PAWN_SPRITE_ATLAS/, "pawn sprite sheets should use a configured frame atlas");
assert.match(main, /getPawnShowdownSprite/, "pawn Showdown rendering should prefer loaded sprite-sheet frames");
assert.match(main, /drawPawnBoardSprite/, "pawn board rendering should prefer loaded top-view sprite frames");
assert.match(main, /keyOutPawnSheetBackground/, "sprite-sheet crops should remove the gray sheet background");
assert.match(main, /BLACK_PAWN_GIF_ANIMATIONS/, "black pawns should support normalized GIF-derived frame animations");
assert.match(main, /WHITE_PAWN_GIF_ANIMATIONS/, "white pawns should support normalized GIF-derived frame animations");
assert.match(main, /loadPawnGifFrames/, "pawn GIF-derived frames should be preloaded");
assert.match(main, /getPawnGifShowdownSprite/, "pawns should prefer GIF-derived Showdown frames");
assert.match(main, /board_move_animation/, "pawns should include top-view board-move animation frames");
assert.match(main, /assets\/sprites\/pawns\/white\/board_move_animation/, "white pawn board movement should use generated white_pawn_board_move_animation GIF frames");
assert.doesNotMatch(main, /assets\/sprites\/pawns\/white\/white_pawn_board_move_animation/, "white pawn board movement should not point at a non-generated folder name");
assert.match(main, /function shouldFlipPawnBoardSprite\(piece\)/, "white pawn board sprites should have an orientation helper");
assert.match(main, /return piece\?\.team === getLocalBoardTeam\(\);/, "bottom-side pawn board sprites should face toward the opponent");
assert.match(main, /dy \*= -1;/, "white pawn board movement frames should keep their visual direction after flipping");
assert.match(main, /BLACK_ROOK_SHOWDOWN_ANIMATIONS/, "black rooks should support generated Showdown frame animations");
assert.match(main, /WHITE_ROOK_SHOWDOWN_ANIMATIONS/, "white rooks should support generated Showdown frame animations");
assert.match(main, /ROOK_SHOWDOWN_ANIMATIONS/, "rook Showdown animations should be selectable by team");
assert.match(main, /BLACK_ROOK_SHOWDOWN_DRAW/, "black rook Showdown actions should share one rendered size");
assert.match(main, /WHITE_ROOK_SHOWDOWN_DRAW/, "white rook Showdown actions should share one rendered size");
assert.match(main, /draw: BLACK_ROOK_SHOWDOWN_DRAW/, "black rook Showdown configs should use the shared rendered size");
assert.match(main, /draw: WHITE_ROOK_SHOWDOWN_DRAW/, "white rook Showdown configs should use the shared rendered size");
assert.match(main, /BLACK_ROOK_BOARD_ANIMATIONS/, "black rooks should support generated board frame models");
assert.match(main, /WHITE_ROOK_BOARD_ANIMATIONS/, "white rooks should support generated board frame models");
assert.match(main, /ROOK_BOARD_ANIMATIONS/, "rook board animations should be selectable by team");
assert.match(main, /BLACK_ROOK_BOARD_IDLE_ACTION = "down"/, "black rook board idle state should use the down-facing sprite");
assert.match(main, /loadBlackRookAnimations/, "black rook animations should be preloaded at boot");
assert.match(main, /getBlackRookShowdownSprite/, "black rook Showdown rendering should prefer loaded generated frames");
assert.match(main, /drawBlackRookBoardSprite/, "black rook board rendering should prefer loaded top-view frames");
assert.match(main, /blackRookAnimationFrames/, "black rook frame folders should be cached like pawn GIF-derived frames");
assert.match(main, /getBlackRookAnimationFrame/, "black rook rendering should pick individual generated frames");
assert.match(main, /\$\{team\}:\$\{section\}:\$\{action\}/, "rook frame caches should include the piece team");
assert.match(main, /heavy_attack_double_crush/, "black rook critical strikes should use the double-crush animation frames");
assert.match(main, /ground_smash/, "black rook ultimate casting should use the ground-smash animation frames");
assert.match(main, /isRookSpritePiece/, "rook sprite support should include generated black and white rooks");
assert.match(main, /playerTeam: TEAM\.WHITE/, "AI games should track the human player's selected side");
assert.match(main, /function setAiPlayerTeam/, "AI side picker should update the selected human side");
assert.match(main, /function getAiTeam/, "AI ownership should be derived from the player's selected side");
assert.match(main, /state\.currentTeam !== aiTeam/, "AI board turns should work for either selected side");
assert.match(main, /boardMoveAnimations/, "board move animation state should be tracked");
assert.match(main, /startBoardMoveAnimation/, "pawn board moves should trigger top-view animations");
assert.match(main, /criticalAttackTimer/, "critical attacks should have an attacker animation state");
assert.match(main, /critical-strike/, "critical attacks should render a dedicated strike frame");
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
assert.match(main, /SMALL_SCREEN_QUERY = "\(max-width: 720px\), \(pointer: coarse\)"/, "small screens and coarse pointers should use mobile restrictions");
assert.match(main, /els\.modeLocal\.disabled = localDisabled/, "local play should be disabled on smaller screens");
assert.match(main, /mode === "local" && isSmallScreenMode\(\)/, "local play mode should be blocked when the screen is small");
assert.match(main, /single-touch-controls/, "small screens should use the single-set touch-control layout");
assert.match(main, /shouldHideP2ShowdownControls/, "AI and online Showdowns should hide player 2 controls");
assert.match(main, /state\.mode === "ai" \|\| state\.mode === "online" \|\| isSmallScreenMode\(\)/, "player 2 controls should hide in AI, online, and small-screen Showdowns");
assert.match(main, /hide-p2-touch-controls/, "touch controls should have a class for hiding player 2 controls");
assert.match(main, /setPointerCapture\?\.\(event\.pointerId\)/, "held touch controls should capture the pointer");
assert.match(main, /pointerleave[\s\S]*event\.pointerType === "mouse" && event\.buttons === 0/, "held touch controls should keep moving when a pressed pointer drifts off the button");
assert.match(main, /setTouchPointer\(event\.pointerId, button\.dataset\.touch\)/, "held touch controls should keep movement, attack, and block active while pressed");
assert.match(main, /touchPointers: new Map\(\)/, "touch controls should track each active pointer independently");
assert.match(main, /state\.touchPointers\.set\(pointerId, touchKey\)/, "touch controls should map each pointer to its own held button");
assert.match(main, /state\.touch = new Set\(state\.touchPointers\.values\(\)\)/, "touch controls should preserve movement while attack or block is tapped with another pointer");
assert.doesNotMatch(main, /pointerup"[\s\S]{0,260}state\.touch\.clear\(\)/, "releasing one touch button should not clear every held touch button");
assert.match(html, /data-touch="p1-left"[\s\S]*icon-left[\s\S]*data-touch="p1-right"[\s\S]*icon-right[\s\S]*data-touch="p1-attack"[\s\S]*icon-sword[\s\S]*data-touch="p1-block"[\s\S]*icon-shield[\s\S]*data-touch="p1-ultimate"[\s\S]*icon-fist[\s\S]*data-touch="p1-jump"[\s\S]*icon-jump/, "small-screen P1 touch buttons should be ordered as icons: left, right, sword, shield, fist, jump");
assert.match(html, /data-touch="p2-left"[\s\S]*icon-left[\s\S]*data-touch="p2-right"[\s\S]*icon-right[\s\S]*data-touch="p2-attack"[\s\S]*icon-sword[\s\S]*data-touch="p2-block"[\s\S]*icon-shield[\s\S]*data-touch="p2-ultimate"[\s\S]*icon-fist[\s\S]*data-touch="p2-jump"[\s\S]*icon-jump/, "small-screen P2 touch buttons should be ordered as icons: left, right, sword, shield, fist, jump");
assert.match(html, /sr-only/, "touch icon buttons should keep accessible text for screen readers");
assert.match(styles, /@media \(max-width: 1020px\)[\s\S]*\.touch-grid\s*\{[\s\S]*grid-template-columns: repeat\(4, minmax\(48px, 1fr\)\)/, "smaller screens should place four touch icons on the first row and two on the second");
assert.match(styles, /body\.single-touch-controls \.touch-bank\[data-side="p2"\]\s*\{\s+display: none;/, "small screens should show only one touch-control set");
assert.match(styles, /\.touch-controls\.hide-p2-touch-controls \.touch-bank\[data-side="p2"\]\s*\{\s+display: none;/, "AI and online Showdowns should hide the P2 touch-control bank");
assert.match(styles, /\.online-presence\s*\{/, "online presence indicator should be styled");
assert.match(styles, /\.online-chat-log\s*\{/, "online chat log should be styled");
assert.match(styles, /\.online-chat-form\s*\{/, "online chat form should be styled");
assert.match(styles, /grid-template-areas:\s*"left right \. \. attack block"\s*"\. \. ultimate jump \. \."/s, "single touch controls should match the reference image layout");
assert.match(styles, /column-gap: 14px/, "single touch controls should keep a small gap between each button pair");
assert.match(styles, /-webkit-tap-highlight-color: transparent/, "held touch controls should not show mobile tap highlights");
assert.match(styles, /@media \(hover: none\), \(pointer: coarse\)[\s\S]*\.touch-controls button:hover,[\s\S]*\.touch-controls button:active,[\s\S]*\.touch-controls button:focus/s, "held touch controls should avoid hover, active, and focus highlighting on touch devices");
assert.match(styles, /#mode-local\s*\{\s+display: none;/, "mobile screens should hide the local play button");
assert.match(styles, /\.icon-sword::before/, "touch controls should include a sword attack icon");
assert.match(styles, /\.icon-shield::before/, "touch controls should include a shield block icon");
assert.match(styles, /\.icon-fist::before/, "touch controls should include a closed fist ultimate icon");
assert.match(styles, /\.icon-jump::before/, "touch controls should include a jump icon");
assert.match(main, /markShowdownEndPoses/, "Showdown end should mark winner and loser animation states");
assert.match(main, /defeated-fall-/, "defeated pieces should fall down to the floor");
assert.match(main, /victory-wave-/, "winning pieces should raise both hands in a wave celebration");
assert.match(main, /victoryTimer/, "winner celebration should animate smoothly over time");
assert.match(main, /ULTIMATE_ATTACK_RANGE = ARENA\.attackRange/, "attack ultimates should use normal attack range checks");
assert.match(main, /isUltimateAttackInRange/, "attack ultimates should miss when the target is out of range");
assert.match(main, /missUltimateAttack/, "missed attack ultimates should show and log misses");
assert.match(main, /dealUltimateDamage\(fighter, opponent, 10, "Barrage"/, "Barrage shots should share the attack ultimate hit check");
assert.doesNotMatch(main, /ARENA\.attackRange \+ 110/, "Barrage should not use the old extended hit range");
assert.match(main, /fighter\.jumpHeld/, "Showdown jump should require a new press after landing");
assert.match(main, /randomInt\(0, 2\)/, "blocking should reduce incoming damage to a 0-2 roll");
assert.match(main, /const criticalBlocked = blocked && Boolean\(options\.critical\)/, "critical hits against blocking pieces should use a special block rule");
assert.match(main, /damage = roundDamage\(Math\.max\(1, damage \* 0\.5\)\)/, "critical hits against blocking pieces should deal 50 percent damage");
assert.match(main, /options\.mana && damage > 0 && !blocked/, "attacking a blocking fighter should not grant mana");
assert.match(main, /battleLogCard\.classList\.toggle\("is-hidden", state\.phase !== "showoff"\)/, "battle log should only be visible during Showdown");
assert.match(html, /<header class="brand-block game-title">/, "game title should sit in the top header");
assert.match(html, /<section class="board-column"[\s\S]*id="battle-log-card"[\s\S]*<\/section>\s*<aside class="hud"/, "battle log should live below the chessboard column");
assert.doesNotMatch(html, /<aside class="hud"[\s\S]*<div class="log-card"/, "battle log should no longer live in the right-side HUD");
assert.match(styles, /grid-template-areas:\s*"title title"\s*"board hud"/, "desktop layout should place the title above board and HUD");
assert.match(styles, /\.game-title\s*\{[\s\S]*justify-self: center/, "game title should be centered at the top");
assert.match(styles, /\.board-column \.log-card\s*\{/, "battle log should have board-column layout styling");
assert.match(styles, /\.confirm-overlay\s*\{[\s\S]*position: fixed/, "confirmation modal should dim the page");
assert.match(styles, /\.confirm-dialog\s*\{[\s\S]*border-radius: 14px/, "confirmation modal should use the rounded reference panel style");
assert.match(styles, /\.confirm-dialog h2\s*\{[\s\S]*color: #ffe6ad/, "confirmation title should use the game gold theme");
assert.match(styles, /#confirm-yes\s*\{[\s\S]*background: linear-gradient\(180deg, #ffd166, #c6882d\)/, "confirmation OK action should use the game gold theme");

assert.match(server, /\/api\/rooms/, "server should expose room endpoints");
assert.match(server, /0\.0\.0\.0/, "server should bind beyond localhost for two-device room links");
assert.match(server, /text\/event-stream/, "server should expose a realtime room event stream");
assert.match(server, /broadcastEvent/, "server should broadcast room events to open streams");
assert.match(server, /last-event-id/, "server should resume event streams without replaying stale events");
assert.match(server, /hasGuest: Boolean\(room\.guestId\)/, "server should report whether the invited guest has joined");

console.log("Chess Wars checks passed.");
