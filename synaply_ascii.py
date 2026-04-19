from __future__ import annotations

import math
import os
import shutil
import sys
import time

try:
    from pyfiglet import Figlet
except ImportError:
    print("Installing pyfiglet...")
    os.system(f"{sys.executable} -m pip install pyfiglet --quiet")
    from pyfiglet import Figlet


DENSITY_RAMP = " .,:-+*#%@"
STREAM_CHARS = "|/:"
SPARK_CHARS = ".+*"
CAPTION = "PROJECT -> ISSUE -> WORKFLOW -> DOC -> INBOX"

AURORA_PALETTE = [
    (2, 18, 12),
    (4, 40, 26),
    (8, 74, 48),
    (18, 118, 76),
    (30, 172, 110),
    (72, 232, 156),
    (170, 255, 218),
]

TEXT_PALETTE = [
    (16, 84, 52),
    (26, 142, 88),
    (44, 214, 128),
    (112, 255, 184),
    (194, 255, 230),
]

RESET = "\033[0m"
HIDE_CURSOR = "\033[?25l"
SHOW_CURSOR = "\033[?25h"
ENTER_ALT_SCREEN = "\033[?1049h"
EXIT_ALT_SCREEN = "\033[?1049l"


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def lerp(a: float, b: float, amount: float) -> float:
    return a + (b - a) * amount


def rgb_code(color: tuple[int, int, int]) -> str:
    r, g, b = color
    return f"\033[38;2;{r};{g};{b}m"


def color_from_palette(
    palette: list[tuple[int, int, int]],
    amount: float,
) -> tuple[int, int, int]:
    amount = clamp(amount)
    if len(palette) == 1:
        return palette[0]

    scaled = amount * (len(palette) - 1)
    index = int(scaled)
    if index >= len(palette) - 1:
        return palette[-1]

    blend = scaled - index
    current = palette[index]
    nxt = palette[index + 1]
    return (
        round(lerp(current[0], nxt[0], blend)),
        round(lerp(current[1], nxt[1], blend)),
        round(lerp(current[2], nxt[2], blend)),
    )


def get_art(text: str, font: str, width: int) -> list[str]:
    art = Figlet(font=font, width=max(width, 80)).renderText(text)
    return [line.rstrip() for line in art.splitlines() if line.strip()]


def get_logo_lines(max_width: int, max_height: int) -> list[str]:
    for font in ("slant", "standard", "small"):
        lines = get_art("Synaply", font, max_width)
        if lines and max(len(line) for line in lines) <= max_width and len(lines) <= max_height:
            return lines
    return get_art("Synaply", "small", max_width)


def prepare_logo_layout(
    width: int,
    height: int,
) -> dict[str, object]:
    lines = get_logo_lines(max_width=max(24, width - 8), max_height=max(6, height - 7))
    logo_width = max(len(line) for line in lines)
    logo_height = len(lines)
    origin_x = max(0, (width - logo_width) // 2)
    origin_y = max(1, (height - logo_height) // 2 - 1)

    cells: list[tuple[int, int, str, int, int]] = []
    for local_y, line in enumerate(lines):
        for local_x, char in enumerate(line):
            if char != " ":
                cells.append(
                    (
                        origin_x + local_x,
                        origin_y + local_y,
                        char,
                        local_x,
                        local_y,
                    )
                )

    caption_y = origin_y + logo_height + 1
    return {
        "cells": cells,
        "width": logo_width,
        "height": logo_height,
        "origin_x": origin_x,
        "origin_y": origin_y,
        "caption_y": caption_y,
    }


def aurora_field(x: int, y: int, width: int, height: int, t: float) -> float:
    nx = x / max(width - 1, 1)
    ny = y / max(height - 1, 1)

    ridge_center = (
        0.28
        + 0.16 * math.sin(nx * 4.4 + t * 0.65)
        + 0.05 * math.sin(nx * 12.0 - t * 1.3)
    )
    ridge = math.exp(-((ny - ridge_center) * 6.5) ** 2)
    weave = 0.5 + 0.5 * math.sin(nx * 10.0 - t * 1.2 + math.sin(ny * 8.0 + t * 0.8))
    ripple = 0.5 + 0.5 * math.sin((nx * 13.0 + ny * 6.0) - t * 1.8)
    pulse = 0.5 + 0.5 * math.sin((nx - ny * 0.35) * 18.0 + t * 2.2)
    vignette = clamp(1.15 - ((nx - 0.5) ** 2 * 2.2 + (ny - 0.46) ** 2 * 3.2), 0.15, 1.0)

    value = ridge * (0.55 + weave * 0.7) + ripple * 0.12 + pulse * 0.08
    return clamp(value * vignette)


def render_frame(width: int, height: int, t: float, layout: dict[str, object]) -> str:
    chars = [[" " for _ in range(width)] for _ in range(height)]
    colors: list[list[tuple[int, int, int] | None]] = [[None for _ in range(width)] for _ in range(height)]
    weights = [[-1.0 for _ in range(width)] for _ in range(height)]

    def plot(
        x: int,
        y: int,
        char: str,
        color: tuple[int, int, int] | None,
        weight: float,
    ) -> None:
        if not (0 <= x < width and 0 <= y < height):
            return
        if weight < weights[y][x]:
            return
        chars[y][x] = char
        colors[y][x] = color
        weights[y][x] = weight

    for y in range(height):
        for x in range(width):
            intensity = aurora_field(x, y, width, height, t)
            if intensity < 0.06:
                continue
            ramp_index = int(clamp(intensity**0.92) * (len(DENSITY_RAMP) - 1))
            char = DENSITY_RAMP[ramp_index]
            color = color_from_palette(AURORA_PALETTE, intensity**0.8)
            plot(x, y, char, color, intensity * 0.28)

    logo_width = int(layout["width"])
    logo_height = int(layout["height"])
    center_x = int(layout["origin_x"]) + logo_width // 2
    center_y = int(layout["origin_y"]) + logo_height // 2

    stream_count = max(8, width // 14)
    stream_safe_radius = logo_width // 2 + 8
    for index in range(stream_count):
        base_x = int(((index + 0.5) / stream_count) * width)
        offset_x = int(3.0 * math.sin(t * 0.55 + index * 1.7))
        x = base_x + offset_x
        if abs(x - center_x) < stream_safe_radius:
            continue

        speed = 6.0 + (index % 4) * 1.1
        head = int((t * speed + index * 5.3) % (height + 14)) - 7
        length = 4 + (index % 5)
        for step in range(length):
            y = head - step
            if not (0 <= y < height):
                continue
            strength = 1.0 - step / max(length, 1)
            char = STREAM_CHARS[min(step, len(STREAM_CHARS) - 1)]
            color = color_from_palette(TEXT_PALETTE, 0.35 + strength * 0.5)
            plot(x, y, char, color, 0.32 + strength * 0.28)

    spark_count = max(12, width // 10)
    orbit_x = logo_width * 0.72
    orbit_y = max(4.0, logo_height * 1.3)
    for index in range(spark_count):
        angle = t * 0.5 + index * 0.78
        drift = 1.0 + 0.16 * math.sin(t * 1.4 + index * 0.6)
        x = int(center_x + math.cos(angle) * orbit_x * drift + math.sin(t * 1.2 + index) * 2.2)
        y = int(center_y + math.sin(angle * 1.3) * orbit_y * 0.45)
        if 0 <= x < width and 0 <= y < height:
            sparkle = 0.6 + 0.4 * math.sin(t * 5.0 + index * 1.1)
            char = SPARK_CHARS[index % len(SPARK_CHARS)]
            color = color_from_palette(TEXT_PALETTE, 0.55 + sparkle * 0.35)
            plot(x, y, char, color, 0.58 + sparkle * 0.22)

    clear_x_radius = logo_width * 0.62 + 7
    clear_y_radius = logo_height * 0.95 + 3
    clear_left = max(0, int(center_x - clear_x_radius))
    clear_right = min(width, int(center_x + clear_x_radius) + 1)
    clear_top = max(0, int(center_y - clear_y_radius))
    clear_bottom = min(height, int(center_y + clear_y_radius) + 1)
    for y in range(clear_top, clear_bottom):
        for x in range(clear_left, clear_right):
            dx = (x - center_x) / max(clear_x_radius, 1)
            dy = (y - center_y) / max(clear_y_radius, 1)
            hush = clamp(1.08 - math.sqrt(dx * dx + dy * dy))
            if hush > 0.08:
                plot(x, y, " ", None, 0.42 + hush * 0.22)

    sweep_position = ((math.sin(t * 0.85) * 0.5) + 0.5) * (logo_width + 12) - 6
    for cell_x, cell_y, char, local_x, local_y in layout["cells"]:
        distance = abs(local_x - sweep_position)
        highlight = math.exp(-((distance**2) / 10.0))
        shimmer = 0.5 + 0.5 * math.sin(t * 2.4 + local_x * 0.18 + local_y * 0.9)
        energy = clamp(0.45 + shimmer * 0.28 + highlight * 0.55)
        color = color_from_palette(TEXT_PALETTE, energy)
        plot(cell_x, cell_y, char, color, 1.6 + energy)

    caption_y = int(layout["caption_y"])
    if 0 <= caption_y < height:
        caption_x = max(0, (width - len(CAPTION)) // 2)
        caption_left = max(0, caption_x - 2)
        caption_right = min(width, caption_x + len(CAPTION) + 2)
        for band_y in range(max(0, caption_y - 1), min(height, caption_y + 2)):
            for x in range(caption_left, caption_right):
                horizontal = 1.0 - abs(x - (caption_left + caption_right - 1) / 2) / max(
                    (caption_right - caption_left) / 2,
                    1,
                )
                vertical = 1.0 - abs(band_y - caption_y) * 0.7
                hush = clamp(horizontal * vertical)
                if hush > 0.08:
                    plot(x, band_y, " ", None, 0.9 + hush * 0.12)
        caption_scan = ((math.sin(t * 1.3) * 0.5) + 0.5) * len(CAPTION)
        for index, char in enumerate(CAPTION):
            if caption_x + index >= width or char == " ":
                continue
            distance = abs(index - caption_scan)
            glow = math.exp(-((distance**2) / 26.0))
            pulse = 0.35 + 0.25 * math.sin(t * 2.0 + index * 0.25)
            color = color_from_palette(TEXT_PALETTE, clamp(0.28 + pulse + glow * 0.35))
            plot(caption_x + index, caption_y, char, color, 1.18 + glow)

    rows: list[str] = []
    for y in range(height):
        row: list[str] = []
        active_color: tuple[int, int, int] | None = None
        for x in range(width):
            color = colors[y][x]
            if color != active_color:
                row.append(RESET if color is None else rgb_code(color))
                active_color = color
            row.append(chars[y][x])
        if active_color is not None:
            row.append(RESET)
        rows.append("".join(row))
    return "\n".join(rows)


def terminal_size() -> tuple[int, int]:
    size = shutil.get_terminal_size((120, 36))
    return size.columns, size.lines


def enter_terminal_mode() -> None:
    sys.stdout.write(ENTER_ALT_SCREEN + HIDE_CURSOR + "\033[2J\033[H")
    sys.stdout.flush()


def leave_terminal_mode() -> None:
    sys.stdout.write(RESET + SHOW_CURSOR + EXIT_ALT_SCREEN)
    sys.stdout.flush()


def main() -> None:
    enter_terminal_mode()
    layout_cache: tuple[int, int] | None = None
    layout: dict[str, object] | None = None
    start = time.monotonic()

    try:
        while True:
            width, height = terminal_size()
            width = max(width, 40)
            height = max(height, 18)

            if layout is None or layout_cache != (width, height):
                layout = prepare_logo_layout(width, height)
                layout_cache = (width, height)

            t = time.monotonic() - start
            frame = render_frame(width, height, t, layout)
            sys.stdout.write("\033[H" + frame)
            sys.stdout.flush()
            time.sleep(1 / 24)
    except KeyboardInterrupt:
        pass
    finally:
        leave_terminal_mode()
        print("Synaply aurora animation stopped.\n")


if __name__ == "__main__":
    main()
