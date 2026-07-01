---
name: GitHub Dimmed Dark
colors:
  primary: "#adbac7"       # Main text color (muted gray-white)
  secondary: "#768390"     # Captions, secondary metadata, and placeholders
  accent: "#539bf5"        # Blue for active tabs, links, and primary actions
  success: "#57ab5a"       # Green for open Pull Requests and success badges
  danger: "#e5534b"        # Red for closed PRs, merged indicators, and destructive actions
  background: "#1c2128"    # Main app background canvas
  surface: "#22272e"       # Card backgrounds, code editors, and sidebars
  border: "#444c56"        # Component borders and dividing hairlines
typography:
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
  codeFamily: "ui-monospace, SFMono-Regular, SF Pro Text, Menlo, Consolas, monospace"
  h1:
    fontSize: "2rem"
    fontWeight: "600"
  h2:
    fontSize: "1.5rem"
    fontWeight: "600"
  body-md:
    fontSize: "0.875rem"   # 14px default GitHub body layout
    lineHeight: "1.5"
rounded:
  sm: "4px"                # Buttons, badge pill shapes
  md: "6px"                # Standard container box corners, input fields
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
---

## Overview
A developer-first, functional interface built for extreme data density, readability, and speed. The interface avoids soft shadows, heavy gradients, or decorative graphics. Everything is framed explicitly using crisp border dividing lines and structural cards.

## Colors
The palette leverages a dark-mode default optimization prioritizing long-term visual comfort.
- **Background (#1c2128):** Deep canvas color providing high-contrast separation for standard panels.
- **Surface (#22272e):** Elevated block panels used for individual repositories, list boxes, and conversation threads.
- **Accent (#539bf5):** Crisp interactive blue exclusively highlighting active selections, hyperlinked labels, and focus status elements.
- **Success & Danger:** Strictly functional colors map to git workflow states (e.g., Green for Open / Red for Closed or Blocked).

## Typography
System fonts match user operating systems exactly to optimize page layout rendering times. 
- All headers use a semi-bold weight (`600`) with absolute left alignment.
- Tab items, branch selectors, and labels use the standard small body size (14px).
- Code blocks, hash commit strings, and terminal prompts must render inside the `codeFamily` block spacing.

## Layout & Border Components
Components must look tight and structured:
- **Borders:** Every box containment element requires a solid `1px` continuous outline matching `colors.border`.
- **Spacing:** Elements should stick tightly together using `8px` and `16px` constraints to maximize the information density per screen.
- **Interactive States:** Buttons default to background fills matching `colors.surface` framed with standard borders. They switch colors slightly upon click actions.