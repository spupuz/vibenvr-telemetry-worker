# Style Guide - VibeNVR Telemetry

This document outlines the visual standards and design patterns used in the VibeNVR Telemetry Dashboard.

## 🎨 Color System

### Primary Palette (Blue)
The dashboard uses a blue-centric color system to represent data and branding.
- **Primary Blue (`--primary`)**: `#3b82f6` (Light) / `#58a6ff` (Dark)
- **Primary Light**: Background for active elements and hover states.
- **Primary Dark**: Hover states for buttons.

### Chart Colors
Bar charts use a progressive blue scale to indicate volume/variety:
- `[#1d4ed8, #2563eb, #3b82f6, #60a5fa, #93c5fd, #bfdbfe, #dbeafe]`
- Colors are assigned automatically by Chart.js based on the dataset order.

### Accent & Status
- **Success (`--success`)**: `#10b981` (Used for the "Live" badge).
- **Accent (`--accent`)**: `#8b5cf6` (Purple, used in pie/doughnut charts for secondary metrics).

## 🧱 Component Standards

### KPI Cards
- **Values**: Should use the default text color (`var(--text)`) or primary blue for emphasis. Avoid using purple/accent for primary metrics unless specifically justified.
- **Borders**: All cards use `var(--border)`. Subtle borders are used for structure, and a highlight border (`var(--primary)`) is applied only on `:hover`.
- **Icons**: SVG icons are used with a `stroke` of `var(--primary)` and a subtle `drop-shadow`.

### Typography
- **Font Family**: 'Inter', sans-serif.
- **Headings**: Semi-bold to Bold (600-800) with slight negative letter-spacing for a premium feel.

## 🌗 Dark Mode
- **Background**: `#0d1117`
- **Surface**: `#161b22`
- **Border**: `#21262d`
- **Text**: `#e6edf3`

The theme toggle switches the `.dark` class on the `<html>` element, which updates these CSS variables.
