import { useEffect, useState, type FormEvent } from 'react';
import { onValue, push, ref, set } from 'firebase/database';
import { database, session } from './firebase';
import './App.css';

type Person = { name: string; slots?: Record<string, boolean> };
type Meeting = {
  title: string;
  dates: string[];
  start: number;
  end: number;
  step: number;
  ifNeeded: boolean;
  creator: string;
  people?: Record<string, Person>;
};

const today = new Date();
const firstDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const timeLabel = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const timeNumber = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const App = () => {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [eventId, setEventId] = useState(() => /^[-A-Za-z0-9_]{20}$/.test(location.hash.slice(1)) ? location.hash.slice(1) : '');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    session.then(({ user }) => {
      if (active) { setUserId(user.uid); setLoading(false); }
    }).catch(() => {
      if (active) { setMessage('Could not connect. Reload to try again.'); setLoading(false); }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!eventId || !userId) return;
    return onValue(ref(database, `meetings/${eventId}`), (snapshot) => {
      setMeeting(snapshot.val());
      setLoading(false);
      if (!snapshot.exists()) setMessage('This event was not found.');
    }, () => { setMessage('Could not load this event. Reload to try again.'); setLoading(false); });
  }, [eventId, userId]);

  const create = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get('title')).trim();
    const date = String(form.get('date'));
    const start = timeNumber(String(form.get('start')));
    const end = timeNumber(String(form.get('end')));
    if (!title || end <= start) {
      setMessage('Enter an event name and choose an end time after the start time.');
      return;
    }
    const dates = Array.from({ length: 7 }, (_, index) =>
      new Date(Date.parse(`${date}T00:00:00Z`) + index * 86400000).toISOString().slice(0, 10),
    );
    setSaving(true);
    setMessage('');
    try {
      const eventRef = push(ref(database, 'meetings'));
      await set(eventRef, { title, dates, start, end, step: Number(form.get('step')), ifNeeded: form.has('ifNeeded'), creator: userId });
      history.replaceState(null, '', `#${eventRef.key}`);
      setLoading(true);
      setEventId(eventRef.key!);
    } catch {
      setMessage('Could not create the event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const join = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!meeting) return;
    const name = String(new FormData(event.currentTarget).get('name')).trim();
    if (!name) return;
    setSaving(true);
    setMessage('');
    try {
      await set(ref(database, `meetings/${eventId}/people/${userId}`), { name, slots: meeting.people?.[userId]?.slots || {} });
    } catch {
      setMessage('Could not save your name. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const currentPerson = meeting?.people?.[userId];
  const people = Object.values(meeting?.people || {});
  const toggleSlot = async (key: string) => {
    if (!currentPerson || saving) return;
    setSaving(true);
    setMessage('');
    try {
      await set(ref(database, `meetings/${eventId}/people/${userId}/slots/${key}`), currentPerson.slots?.[key] ? null : true);
    } catch {
      setMessage('Could not save this time. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const times = meeting ? Array.from(
    { length: Math.ceil((meeting.end - meeting.start) / meeting.step) },
    (_, index) => meeting.start + index * meeting.step,
  ) : [];

  return (
    <main className="meeting-page">
      <h1>Team Team</h1>
      <p>Choose a time together. All times are Central Time.</p>
      {loading && <p role="status">Loading...</p>}
      {!loading && !eventId && (
        <form className="setup-form" onSubmit={create}>
          <label>Event name<input name="title" required maxLength={100} /></label>
          <label>Week starting<input name="date" type="date" defaultValue={firstDate} required /></label>
          <label>Start time<input name="start" type="time" defaultValue="09:00" required /></label>
          <label>End time<input name="end" type="time" defaultValue="17:00" required /></label>
          <label>Time interval
            <select name="step" defaultValue="30">
              {[15, 30, 45, 60].map((step) => <option key={step} value={step}>{step} minutes</option>)}
            </select>
          </label>
          <label className="optional-label"><input name="ifNeeded" type="checkbox" />If needed</label>
          <button type="submit" disabled={!userId || saving}>{saving ? 'Creating...' : 'Create event'}</button>
        </form>
      )}
      {eventId && (
        <button onClick={() => { history.replaceState(null, '', location.pathname); setEventId(''); setMeeting(null); setLoading(false); setMessage(''); }}>New event</button>
      )}
      {meeting && (
        <>
          <h2>{meeting.title}{meeting.ifNeeded ? ' (if needed)' : ''}</h2>
          <label>Share this link<input readOnly value={`${location.origin}${location.pathname}#${eventId}`} /></label>
          <p>{meeting.step} minute intervals.</p>
          <form className="join-form" onSubmit={join}>
            <label>Your name<input name="name" required maxLength={40} defaultValue={currentPerson?.name || ''} /></label>
            <button type="submit" disabled={saving}>{currentPerson ? 'Update name' : 'Use name'}</button>
          </form>
          <p>Participants: {people.map((person) => person.name).join(', ') || 'None yet'}</p>
          <p>{currentPerson ? `Editing ${currentPerson.name}. Click a time to select or clear it.` : 'Enter your name to mark availability.'}</p>
          <p>A check marks your selection. Each cell shows the number of people available.</p>
          <div className="time-table">
            <table>
              <thead><tr><th scope="col">Time</th>{meeting.dates.map((date) => (
                <th scope="col" key={date}>{new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</th>
              ))}</tr></thead>
              <tbody>{times.map((time) => (
                <tr key={time}>
                  <th scope="row">{timeLabel(time)} to {timeLabel(Math.min(time + meeting.step, meeting.end))}</th>
                  {meeting.dates.map((date) => {
                    const key = `${date}:${time}`;
                    const selected = currentPerson?.slots?.[key] || false;
                    const count = people.filter((person) => person.slots?.[key]).length;
                    return (
                      <td key={date}>
                        <button
                          className={`slot${count ? ' has-people' : ''}${selected ? ' selected' : ''}`}
                          disabled={!currentPerson || saving}
                          aria-pressed={selected}
                          aria-label={`${date} ${timeLabel(time)}, ${count} of ${people.length} available`}
                          onClick={() => toggleSlot(key)}
                        >
                          {selected ? '✓ ' : ''}{count}/{people.length}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
      {message && <p role="alert">{message}</p>}
    </main>
  );
};

export default App;
