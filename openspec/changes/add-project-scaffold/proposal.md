# Project Scaffold Proposal

## Why
The application requires a foundational monorepo structure with separate frontend and backend packages before implementing any features. The current project lacks these directories, preventing development of the landing page and other planned capabilities.

## What Changes
- Set up pnpm workspace configuration for monorepo
- Create frontend package with React + Vite + TypeScript
- Create backend package with Node.js + Express + TypeScript
- Install and configure DaisyUI for frontend styling
- Set up basic routing with React Router v6
- Configure development scripts for concurrent frontend/backend execution
- Add .gitignore entries for node_modules and build artifacts

## Impact
- **Affected specs**: `project-setup` (new capability)
- **Affected code**: 
  - Root `pnpm-workspace.yaml` - Workspace configuration
  - Root `package.json` - Workspace scripts
  - `frontend/` - Complete frontend package setup
  - `backend/` - Complete backend package setup
  - Root `.gitignore` - Ignore patterns for dependencies and builds
- **Dependencies**: This change blocks `add-landing-page` and all future development


