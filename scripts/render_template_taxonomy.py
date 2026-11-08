#!/usr/bin/env python3
"""Plot only the Templates n (%) columns transcribed from the two source PNGs.

Requires matplotlib: python -m pip install matplotlib
Run: python scripts/render_template_taxonomy.py
Data: images/outcome-tasks/template_taxonomy.json
Outputs: SVG (website) and PNG (slides), with the website's #F5F5F5 background.
Primary intents are single-label; semantic/reasoning tags are multi-label.
"""
import json
import math
import textwrap
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Patch
from matplotlib.ticker import PercentFormatter

ROOT = Path(__file__).resolve().parents[1] / "images" / "outcome-tasks"
BACKGROUND = "#f5f5f5"
TEXT = "#24333d"
MUTED = "#596b77"
COLORS = ["#17647e", "#438fa3", "#6d9d73", "#b3a34e", "#c98347",
          "#b96871", "#8976a4", "#6684ad", "#86b4b0", "#a39a8c", "#c2c8ce"]


def save(fig, stem):
    for extension in ("svg", "png"):
        fig.savefig(ROOT / f"{stem}.{extension}", dpi=200,
                    facecolor=BACKGROUND,
                    metadata={"Date": None} if extension == "svg" else None)
        if extension == "svg":
            svg = ROOT / f"{stem}.svg"
            svg.write_text("\n".join(line.rstrip() for line in svg.read_text(encoding="utf-8").splitlines()) + "\n", encoding="utf-8")
    plt.close(fig)


def render():
    data = json.loads((ROOT / "template_taxonomy.json").read_text(encoding="utf-8"))
    total = data["total_templates"]
    primary = data["primary_intent"]
    tags = data["semantic_reasoning"]
    assert total == 200
    assert sum(row["n"] for row in primary) == total
    for row in primary + tags:
        assert 0 <= row["n"] <= total
        assert math.isclose(row["percent"], 100 * row["n"] / total)

    plt.rcParams.update({
        "font.family": "DejaVu Sans", "font.size": 12,
        "text.color": TEXT, "axes.labelcolor": MUTED,
        "xtick.color": MUTED, "ytick.color": TEXT,
        "figure.facecolor": BACKGROUND, "axes.facecolor": BACKGROUND,
        "svg.fonttype": "none", "svg.hashsalt": "manitaskot200-templates",
    })

    fig = plt.figure(figsize=(12, 7.2))
    fig.text(0.035, 0.94, "Primary Intent", fontsize=20, fontweight="bold")
    fig.text(0.035, 0.895, "200 templates · One primary intent per template", fontsize=12, color=MUTED)
    ax = fig.add_axes([0.015, 0.16, 0.43, 0.66])
    ax.pie([row["n"] for row in primary], colors=COLORS,
           startangle=90, counterclock=False,
           wedgeprops={"width": 0.40, "edgecolor": BACKGROUND, "linewidth": 1.5})
    ax.text(0, 0.06, "200", ha="center", va="center", fontsize=32, fontweight="bold")
    ax.text(0, -0.17, "templates", ha="center", va="center", fontsize=13, color=MUTED)
    ax.set_aspect("equal")
    legend_ax = fig.add_axes([0.47, 0.055, 0.50, 0.79])
    legend_ax.axis("off")
    labels = [textwrap.fill(row["label"], width=42) + f"  —  {row['n']} ({row['percent']:.1f}%)" for row in primary]
    legend_ax.legend([Patch(facecolor=color) for color in COLORS], labels,
                     loc="center left", frameon=False, fontsize=11.5,
                     handlelength=1.1, handleheight=1.1, labelspacing=0.95, borderaxespad=0)
    save(fig, "primary_intent_templates_pie")

    fig, ax = plt.subplots(figsize=(12, 7.6))
    fig.subplots_adjust(left=0.37, right=0.96, top=0.82, bottom=0.14)
    fig.text(0.035, 0.94, "Semantic / Reasoning Tags", fontsize=20, fontweight="bold")
    fig.text(0.035, 0.895, "200 templates · Multiple tags per template; percentages need not sum to 100%", fontsize=12, color=MUTED)
    positions = list(range(len(tags)))
    percentages = [row["percent"] for row in tags]
    ax.barh(positions, percentages, height=0.62, color="#438fa3")
    ax.set_yticks(positions, [textwrap.fill(row["label"], width=36) for row in tags], fontsize=11.5)
    ax.invert_yaxis()
    ax.set_xlim(0, 60)
    ax.set_xticks([0, 10, 20, 30, 40, 50, 60])
    ax.xaxis.set_major_formatter(PercentFormatter(xmax=100, decimals=0))
    ax.set_xlabel("Share of templates (%)", labelpad=12)
    ax.set_axisbelow(True)
    ax.grid(axis="x", color="#dce4e8", linewidth=0.8)
    ax.tick_params(axis="y", length=0, pad=12)
    ax.tick_params(axis="x", length=0)
    for spine in ax.spines.values():
        spine.set_visible(False)
    for y, row in enumerate(tags):
        ax.text(row["percent"] + 0.8, y, f"{row['n']} ({row['percent']:.1f}%)",
                va="center", fontsize=11.5)
    fig.text(0.035, 0.025, "Bar labels: Templates n (%) · Denominator: 200 templates", fontsize=11, color=MUTED)
    save(fig, "semantic_reasoning_templates_bar")
    print("Rendered two template-only charts as SVG and PNG. No instance data used.")


if __name__ == "__main__":
    render()
