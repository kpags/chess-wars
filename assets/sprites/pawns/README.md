# Pawn Sprite Sheets

Place the two source sheets here:

- `black-pawn-sheet.png`
- `white-pawn-sheet.png`

The game reads these full sheets directly, crops the configured frame boxes in `src/main.js`, removes the gray sheet background at runtime, and uses the result for pawn board tokens and Showdown animations.

Keep the sheet layout matching the provided references: side-view actions above and the top-view board row at the bottom. If the exported image size changes, adjust `PAWN_SPRITE_BASE_SIZE` and `PAWN_SPRITE_ATLAS` in `src/main.js`.

Black and white pawns also support normalized frame folders generated from `assets/gif/<team>_pawns/*.gif`:

```powershell
npm.cmd run build:pawn-sprites
```

Those generated frames live in `assets/sprites/pawns/<team>/<action>/frame-00.png` and are preferred for pawn Showdown animation. `board_move_animation` is used for top-view pawn movement on the board.
