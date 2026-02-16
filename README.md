# Real-Time Poll Rooms

A simple polling app I built where you can create polls, share them with a link, and watch votes come in live. No login required.

## What it does

- Create a poll with a question and multiple choices
- Get a shareable link (like `https://real-time-poll-rooms-psi.vercel.app/poll/a8f717111117`)
- Anyone can vote once
- Results update in real-time as people vote
- Basic anti-cheat to prevent spam voting

## Tech Stack

**Frontend:**
- React (with React Router for pages)
- Socket.IO client (for live updates)
- Axios (API calls)

**Backend:**
- Node.js + Express
- Socket.IO (WebSocket server)
- MongoDB Atlas(Mongoose for data modeling)

**Deployment:**
- Frontend hosted on Vercel
- Backend hosted on Render

## How it works

1. You create a poll with a question and some options
2. Server generates a random 12-character ID for the poll
3. You get a shareable link to send to people
4. When someone visits the link, they join that poll's "room"
5. They vote, it saves to MongoDB
6. Socket.IO broadcasts the new results to everyone in that room instantly
7. The poll stays up indefinitely (no expiration)

## Anti-Abuse Stuff

I didn't want people to spam votes, so I added two layers:

### 1. LocalStorage Tracking
- When you vote, your browser stores `voted_poll_[id]` in localStorage
- If you try to vote again, it blocks you
- Works even after page refresh

**Limitation:** You can clear localStorage and vote again. But honestly, if someone's that motivated to cheat on a random poll, whatever.

### 2. IP Address Check
- Backend saves your IP when you vote
- If the same IP tries voting again on the same poll, it gets rejected
- More reliable than localStorage

**Limitation:** If you're on shared WiFi (like a coffee shop), multiple people might have the same IP and only one can vote. Not perfect but good enough.

## Edge Cases I handled

- Can't create a poll with less than 2 options
- Empty questions get rejected
- Invalid poll IDs return a proper 404
- Duplicate votes are blocked (both frontend and backend check)
- Works fine if you refresh after voting
- Multiple people can vote at the exact same time without breaking
- If socket connection drops, it reconnects automatically
- Shows "Poll not found" for broken links

## Known Issues

- No user accounts (which is kinda the point, but means no "my polls" page)
- Polls never expire, they just sit in the database forever
- The IP check can be annoying on shared networks
- You can bypass localStorage by opening incognito
- No fancy graphs, just percentage bars
- No moderation tools if someone makes an inappropriate poll

## Running this locally

**Backend:**
```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:
```
MONGODB_URI=mongodb://localhost:27017/polling-app
PORT=5000
FRONTEND_URL=http://localhost:3000
```

Then start it:
```bash
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

The app should open at `http://localhost:3000`

Make sure you have MongoDB running locally, or use MongoDB Atlas and update the connection string.

## Future ideas

(might do these, might not)

- Add poll expiration after X days
- Better results visualization (actual charts?)
- Export results as CSV
- Dark mode maybe?
- Poll password protection

---

works perfectly well for what it is.. I maintained minimal UI and focused more on functionality.
