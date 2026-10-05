# Team Team

Build a small React and TypeScript meeting scheduler using this react-start project.

Use the ideas written by Sueun Cho, Romir Mohan, and Diego Perez-Aguilar in the when2meet report sheet. Offer 15, 30, 45, and 60 minute intervals, use readable blue colors with text counts and checkmarks, and let the creator label a tentative event as "if needed".

Keep event creation on one form. Ask for an event name, a week starting date, a daily start and end time, an interval, and an optional "if needed" checkbox. Show the seven days in one availability table. Let people select and clear times and show how many participants are available in each cell.

Use Firebase Realtime Database so people opening the same event link share responses. Use anonymous Firebase Authentication so participants can enter a name without an account form and can update only their own response. Keep the event link visible. Show loading and save errors.

Keep the implementation small and use plain forms and a table. Do not add comments, themes, voting, calendar integrations, or recommendation features. Use the existing Firebase Hosting target named when2meet. Show the code and local preview before publishing the app.
