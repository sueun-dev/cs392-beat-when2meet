# Team Team

A small meeting scheduler with 15, 30, 45, and 60 minute intervals, an optional "if needed" event label, and shared availability counts.

Copy `.env.example` to `.env.local` and enter the web API key from the Team Team app in Firebase project `cs392-react-challenges-3d0d7`.

Run `npm install` and `npm run dev`. Check with `npm run build` and `npm run lint`.

Firebase Realtime Database stores each event and participant response. Anonymous Authentication keeps each browser's response separate. Share the event link to invite participants. Anyone with the link can view the names and availability. Responses belong to the browser that created them.

Publish with `firebase deploy --only hosting:when2meet,database,auth --project cs392-react-challenges-3d0d7` after reviewing the code.

The implementation prompt is in `src/docs/teamTeam.md`.
