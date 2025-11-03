# classroom-reporter
Google Classroom app that generates reports based on data in google classroom.
# Classroom Reporter

Google Apps Script web app that connects to Google Classroom and produces on-demand student summary and missing work reports.

## Features

- Web interface powered by Google Apps Script HtmlService.
- Secure Classroom API access using the Advanced Service.
- Student summary report highlighting assignment counts, late work, grades, and detailed activity.
- Dedicated missing work report filtered to overdue assignments.
- Roster caching on the client for fast student switching.

## Project structure

```
appsscript.json     # Apps Script project manifest
src/                # Server-side Apps Script files (V8 runtime)
web/                # HtmlService templates (index, scripts, styles)
```

### File overview

- `appsscript.json` – Manifest enabling the Classroom advanced service and configuring the script as a web app.
- `src/App.gs` – Entry point that handles the web app request flow and template rendering.
- `src/ClassroomService.gs` – Wrapper around the Classroom API used to load courses, rosters, and coursework details.
- `src/Reports.gs` – Report builders that assemble student summaries and missing work datasets for display.
- `src/Utilities.gs` – Date helpers and formatting utilities reused across the report logic.
- `web/index.html` – HtmlService template that defines the base layout rendered to end users.
- `web/Scripts.html` – Client-side controller powering course/student selection and asynchronous report loading.
- `web/Styles.html` – Styles applied to the interface to keep the web app readable and responsive.

## Getting started

1. Visit [script.google.com](https://script.google.com/home) and create a new project.
2. Click **Project Settings → Google Cloud Platform (GCP) project** and link or create a GCP project so you can enable APIs.
3. Open the **Editor** and choose **File → Project properties → Scopes** to ensure Classroom scopes are listed after enabling the advanced service.
4. Enable the Classroom API:
   - In the Apps Script editor, click **Services ➜ + ➜ Classroom API ➜ Add**.
   - In the linked Google Cloud project, enable the **Google Classroom API** under **APIs & Services → Library**.
5. Replace the default files with the contents of this repository. You can copy them manually or use `clasp` to push from a local clone.
6. Update the `appsscript.json` manifest if you need to change the deployment access (defaults to domain-only access and executes as the active user).

## Deploying the web app

1. In the Apps Script editor, choose **Deploy → Test deployments** to authorize the script with your Classroom account.
2. After successful authorization, open **Deploy → Manage deployments → New deployment**.
3. Select **Web app**, set *Execute as* to **User accessing the web app**, and choose who can access the app (e.g., **Only within domain**).
4. Copy the deployment URL and share it with teachers within your Workspace domain.

## Usage tips

- The first load fetches your active Classroom courses and caches student rosters per course for quick switching.
- Date filters are optional. When provided, the app restricts coursework to assignments with due dates (or updates) inside the window.
- Missing work reports only include assignments whose due dates have passed within the selected window.
- To schedule reports or send automated emails, you can extend the server-side scripts with time-driven triggers and Gmail integration.

## Local development with clasp (optional)

If you prefer to edit locally and push with [`clasp`](https://github.com/google/clasp):

```bash
npm install -g @google/clasp
clasp login
clasp create --title "Classroom Reporter" --type webapp
clasp push
```

Remember to link the pushed project with your Classroom-enabled Workspace account before deploying.

## Syncing this project to GitHub

All of the web app files in this repository are regular text assets, so you can use standard Git commands to publish them to
GitHub:

```bash
git add appsscript.json src web README.md
git commit -m "Add Classroom Reporter web app"
git push origin main
```

Adjust the branch name in the `git push` command if you are working on something other than `main`.
