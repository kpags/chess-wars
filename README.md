# Chess Wars

A browser game prototype based on the attached design reference.

Chess Wars uses standard chess piece movement, but captures do not resolve immediately. When one piece attacks another, both pieces enter a Showdown duel. The losing piece is removed, even when the loser was the attacker.

## Run

```powershell
npm.cmd run dev
```

Then open `http://127.0.0.1:4173`.

For two-device play, use the LAN link printed by the dev server, create a room, then share the room link shown in the Online Room panel.

## Controls

- Board: click a piece, then click a highlighted move or capture square.
- Showdown movement is now 2D: left, right, and Space to jump.
- Player 1 local ultimate: C. Player 2 local ultimate: <.
- Online and Vs AI ultimate: E.
- Online Showdown: left mouse click attacks, right mouse click blocks.

## Implemented Rules

- Local two-player mode and player-versus-AI mode.
- Pawns, rooks, horses, bishops, queen, and king use chess-style movement.
- Captures start a best-of-3 Showdown duel instead of instantly removing the defender.
- Each Showdown round lasts 60 seconds. If time expires, the piece with higher health wins the round.
- Piece HP starts from the v1.0.1 values: pawn 100, rook 115, horse 120, bishop 130, queen 150, king 200.
- Showdown attacks deal 5-10 base damage.
- Piece weapons are visible in Showdown: fists, spike club, javelin, cross, scythe, and sword & shield.
- Damage bonuses are applied by piece: pawn fixed, rook +4%, horse +5%, bishop +7%, queen +12%, king +15%.
- Critical hits have a 4 percent chance and deal double damage.
- Blocking reduces incoming damage.
- The game ends when a king is defeated.
- A weighted random powerup spawns on an empty board square after a random 4-8 completed turn counts.
- Current powerups: Heal, Dance, Revive, Restrict, Strength, Smash, and Extinct.
- Smash now arms only the receiving piece for one Showdown.
- Every piece has a 100-mana ultimate skill. Mana resets to 0 only when a new Showdown starts.

## Patch Notes v1.0.0

- Renamed Showoff to Showdown in the player-facing UI.
- Improved the board into a wooden chess-set style with frame labels, wood grain, and carved-piece silhouettes.
- Added weapons and piece-specific damage bonuses.
- Hardened Showdown input clearing to prevent stuck movement after key, pointer, or window-focus changes.
- Added sprite-style attack and block animation frames during Showdown.

## Patch Notes v1.0.1

- Added a large victory indicator when a king is defeated or Extinct wins the game.
- Updated HP values: pawns 100, rooks 115, horses 120, bishops 130, queens 150, kings 200.
- Added turn-count board powerups: Dance, Revive, Restrict, Strength, Smash, and Extinct.
- Dance lets the receiving piece move in any direction on its next move.
- Revive opens a choice list for destroyed allied pieces and returns the chosen piece at full HP.
- Restrict skips the opponent's next 2 turns.
- Strength gives the receiving piece +10% HP and +10% Showdown damage for one Showdown.
- Smash opens a choice list and removes up to 2 opponent pieces, which can return only by Revive.
- Extinct destroys the opponent's army and immediately wins the game.

## Patch Notes v1.0.2

- Added Heal powerup with a 25% spawn rate. Heal restores the receiving piece by 50 HP.
- Updated spawn rates: Dance is now 30%, Strength is now 15%.
- Powerup spawning now depends on turn counts instead of seconds.
- The next powerup appears after a random 4-8 completed turn counts.

## Patch Notes v1.0.3

- Added online room play for two devices using the same shared room link.
- The first player in a room is white/host, and the second player is black/guest.
- Updated damage bonuses: pawn fixed, rook +4%, horse +5%, bishop +7%, queen +12%, king +15%.
- Critical hits pause the action for 1 second and show who dealt the critical damage and the total damage dealt.
- Powerup pickups pause the action for 1 second and show who received the powerup and what it does.

## Patch Notes v1.0.4

- Reduced online snapshot traffic and coalesced remote snapshots to smooth invited-device movement and Showdown rendering.
- Hidden legal-move highlights and selection details from the opponent during online rooms.
- Updated Smash so it cannot target kings or queens.
- Updated Smash so it cannot target two bishops, two rooks, or two horses in the same use.
- Added online Showdown mouse controls: left click attacks and right click blocks.
- Added Space jump for Showdown, including local play.

## Patch Notes v1.0.5

- Improved invited-device responsiveness by polling room events more often.
- Smoothed invited-device Showdown rendering by interpolating remote fighter positions between host snapshots.
- Published an immediate host snapshot when Showdown ends so invited devices return to the board without freezing.
- Opponents now see the selected square during online board play, while possible-move dots remain hidden.

## Patch Notes v1.0.6

- Showdown is now best-of-3 rounds. The first piece to win 2 rounds wins the Showdown.
- Each round has a 60-second timer. If time expires, the piece with higher health wins the round.
- Online invited players now see their own Showdown piece on the left side.
- Showdown movement is now 2D only: left, right, and Space jump.
- Smash now affects only the receiving piece and expires after one Showdown.
- Added ultimate skills: Pawn Heavy Fist, Rook Fortify, Horse Dash, Bishop Blessing, Queen Barrage, and King Hard Swing.

## Patch Notes v1.0.7

- Added a large Showdown initiated sign that displays the two pieces before combat starts.
- Added a 3-second delay before Showdown combat begins.
- Added a round-finished banner that shows who won the round.
- Increased mana capacity from 50 to 100.
- Mana now resets to 0 every Showdown and is not retained after the duel.
- Updated Horse Dash to +75% movement speed and jump height for 5 seconds.
- Updated Bishop Blessing to restore 30% of the piece's total HP.
- Updated Queen Barrage to launch 5 attacks dealing 10 damage each.

## Patch Notes v1.0.8

- Confirmed mana capacity at 100.
- Mana now resets only at the start of a Showdown, not between rounds or at Showdown end.
- Selection-based powerups now require the player to make and use the selection before the board move is completed.
