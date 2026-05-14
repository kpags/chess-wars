Original prompt: Based on the attached GIF, improve the showdown animations like that for fluid movements and animations.

## 2026-05-14

- Improved Showdown fighter motion with GIF-inspired stickman poses, running frames, jump/fall poses, attack phases, block braces, hit staggers, weapon sweep trails, and motion afterimages.
- Updated smoke checks to guard the new animation states and sprite dimensions.
- Local checks passed: `node --check src\main.js`, `node --check scripts\check.mjs`, `npm.cmd run check`, and `git diff --check`.
- Browser smoke check passed with Playwright CLI screenshot against `http://127.0.0.1:4293`; the canvas rendered successfully and the temporary screenshot files were removed.

## Notes

- The current game does not expose `window.render_game_to_text` or a native deterministic `window.advanceTime`, so the shared Playwright game-loop skill cannot drive deterministic Showdown state yet.
- The shared `web_game_playwright_client.js` could not resolve the transient `playwright` package from its skill folder, so this pass used Playwright's CLI screenshot command instead.
- Next useful improvement: add a small debug/test hook for starting a Showdown directly, then capture browser screenshots of idle, run, jump, block, and attack frames.

## 2026-05-14 v1.1.0

- Extracted Patch Notes v1.1.0 from `Chess_wars.docx` using a temporary workspace copy.
- Used the embedded weapon reference image from the docx (`image4.png`) to improve Showdown weapon silhouettes.
- Added pose-attached Showdown weapons: pawn fists, rook spike club, horse spear/javelin, bishop cross, queen scythe, and king sword with shield.
- Browser smoke-tested a live Horse-versus-Pawn Showdown with Playwright Chromium and inspected the captured screenshot; temporary extraction and screenshot files were removed after verification.

## 2026-05-14 Render Multiplayer Latency

- User reported that the Render deployment works, but invited players see delayed board movement and delayed Showdown response.
- Root cause in the local code path: online rooms used short HTTP polling only, so guest input could wait for guest POST, host poll, host snapshot POST, and guest poll before becoming visible.
- Added a Server-Sent Events room stream on `/api/rooms/:roomId/stream` and updated the client to use `EventSource` after joining a room.
- Kept HTTP polling as fallback when the event stream is unavailable, and coalesced streamed snapshots to animation frames for smoother invited-device rendering.
- Verified with a local two-client Playwright Chromium smoke test: host and guest each opened `/stream`, the host moved White, the guest moved Black, and the host saw the turn return to White without browser errors.

## 2026-05-14 v1.1.1

- Extracted Patch Notes v1.1.1 from `Chess_wars.docx` using a temporary workspace copy.
- Updated attack ultimates so Heavy Fist, Barrage, and Hard Swing miss when the target is outside normal attack range.
- Updated Showdown jumping so holding jump cannot auto-repeat after landing.
- Updated blocking so it rolls 0-2 damage and blocks mana gain from the attacker.
- Moved the title to the top center and relocated the battle log under the chessboard, visible only during Showdown.
