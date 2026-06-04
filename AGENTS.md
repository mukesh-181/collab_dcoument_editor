# AGENTS Context & Log

**Purpose**: This file provides immediate context to any AI model/agent working on the `collab_docx` project.

## Current Architecture & Stack
- **Framework**: Next.js (App Router)
- **Database**: Supabase
- **Authentication**: Auth.js + Supabase SDK (`@supabase/supabase-js`, `@supabase/ssr`). No Prisma.
- **Styling**: Tailwind CSS (with Shadcn/Radix for UI components if needed)

## Implementation Rules
- **Database Interaction**: ALWAYS use the Supabase SDK for client and server interactions. DO NOT use Prisma.
- **Phased Approach**: Implement features step-by-step. Do not attempt massive monolithic PRs/changes.
- **Documentation**: For every major feature, create an explanatory markdown file inside `docx/project/`.

## Progress Log
- **2026-06-04**: Starting Authentication implementation. Decided on Auth.js + Supabase SDK step-by-step approach. (Refer to `docx/project/auth.md` for details).
