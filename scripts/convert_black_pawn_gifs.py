from __future__ import annotations

from pathlib import Path
import json
import math

from PIL import Image, ImageSequence


ROOT = Path(__file__).resolve().parents[1]

COMMON_ACTION_FILES = {
    "charge_dash": "charge_dash.gif",
    "crouch": "crouch.gif",
    "guard_block": "guard_block.gif",
    "heavy_attack_double_punch": "heavy_attack_double_punch.gif",
    "hit_hurt": "hit_hurt.gif",
    "idle_ready": "idle_ready.gif",
    "jump": "jump.gif",
    "knocked_down_defeat": "knocked_down_defeat.gif",
    "light_attack_punch": "light_attack_punch.gif",
    "rock_throw": "rock_throw.gif",
    "taunt_command": "taunt_command.gif",
    "victory": "victory.gif",
    "walk": "walk.gif",
}

TEAM_ACTION_FILES = {
    "black": {
        **COMMON_ACTION_FILES,
        "board_move_animation": "board_move_animation.gif",
    },
    "white": {
        **COMMON_ACTION_FILES,
        "board_move_animation": "white_pawn_board_move_animation.gif",
        "top_view_board_move": "top_view_board_move.gif",
    },
}


def main() -> None:
    for team, action_files in TEAM_ACTION_FILES.items():
        convert_team(team, action_files)


def convert_team(team: str, action_files: dict[str, str]) -> None:
    source_dir = ROOT / "assets" / "gif" / f"{team}_pawns"
    output_dir = ROOT / "assets" / "sprites" / "pawns" / team
    preview_path = output_dir / "preview-sheet.png"
    manifest_path = output_dir / "manifest.json"

    if not source_dir.exists():
        raise SystemExit(f"Missing source GIF directory: {source_dir}")

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = {"team": team, "source": str(source_dir.relative_to(ROOT)).replace("\\", "/"), "actions": {}}
    preview_rows: list[tuple[str, list[Image.Image]]] = []

    for action, filename in action_files.items():
        source = source_dir / filename
        if not source.exists():
            raise SystemExit(f"Missing source GIF: {source}")

        action_dir = output_dir / action
        action_dir.mkdir(parents=True, exist_ok=True)
        frames, durations = convert_gif(source, action_dir)
        manifest["actions"][action] = {
            "frames": len(frames),
            "durationsMs": durations,
            "path": str(action_dir.relative_to(ROOT)).replace("\\", "/"),
        }
        preview_rows.append((action, frames))

    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    render_preview(preview_rows, preview_path)
    print(f"Generated {team} pawn frames in {output_dir.relative_to(ROOT)}")


def convert_gif(source: Path, output_dir: Path) -> tuple[list[Image.Image], list[int]]:
    frames: list[Image.Image] = []
    durations: list[int] = []

    with Image.open(source) as gif:
        for index, raw_frame in enumerate(ImageSequence.Iterator(gif)):
            duration = raw_frame.info.get("duration", gif.info.get("duration", 0)) or 0
            frame = remove_gray_background(raw_frame.convert("RGBA"))
            frame = trim_transparent(frame, padding=6)
            frame_path = output_dir / f"frame-{index:02}.png"
            frame.save(frame_path)
            frames.append(frame)
            durations.append(duration)

    return frames, durations


def remove_gray_background(frame: Image.Image) -> Image.Image:
    background = average_corner_color(frame)
    pixels = frame.load()
    width, height = frame.size

    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            distance = color_distance((red, green, blue), background)
            if distance < 38:
                pixels[x, y] = (red, green, blue, 0)
            elif distance < 54:
                pixels[x, y] = (red, green, blue, min(alpha, round((distance - 38) * 16)))

    return frame


def average_corner_color(frame: Image.Image) -> tuple[float, float, float]:
    width, height = frame.size
    points = [
        (1, 1),
        (width - 2, 1),
        (1, height - 2),
        (width - 2, height - 2),
        (width // 2, 1),
    ]
    pixels = frame.load()
    totals = [0, 0, 0]
    for x, y in points:
        red, green, blue, _ = pixels[clamp(x, 0, width - 1), clamp(y, 0, height - 1)]
        totals[0] += red
        totals[1] += green
        totals[2] += blue
    return (totals[0] / len(points), totals[1] / len(points), totals[2] / len(points))


def color_distance(color: tuple[int, int, int], target: tuple[float, float, float]) -> float:
    return math.sqrt(sum((color[index] - target[index]) ** 2 for index in range(3)))


def trim_transparent(frame: Image.Image, padding: int) -> Image.Image:
    alpha = frame.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        return frame

    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(frame.width, right + padding)
    bottom = min(frame.height, bottom + padding)
    return frame.crop((left, top, right, bottom))


def render_preview(rows: list[tuple[str, list[Image.Image]]], preview_path: Path) -> None:
    cell_w = 176
    cell_h = 132
    label_h = 18
    max_frames = max(len(frames) for _, frames in rows)
    preview = Image.new("RGBA", (max_frames * cell_w, len(rows) * cell_h), (28, 24, 22, 255))

    for row_index, (action, frames) in enumerate(rows):
        for frame_index, frame in enumerate(frames):
            cell_x = frame_index * cell_w
            cell_y = row_index * cell_h
            scale = min((cell_w - 24) / frame.width, (cell_h - label_h - 18) / frame.height)
            width = max(1, round(frame.width * scale))
            height = max(1, round(frame.height * scale))
            resized = frame.resize((width, height), Image.Resampling.NEAREST)
            x = cell_x + (cell_w - width) // 2
            y = cell_y + cell_h - 12 - height
            preview.alpha_composite(resized, (x, y))

    preview.save(preview_path)


def clamp(value: int, minimum: int, maximum: int) -> int:
    return max(minimum, min(maximum, value))


if __name__ == "__main__":
    main()
