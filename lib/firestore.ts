import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { habitConverter, type Habit } from "./habit";

/**
 * Firestore access for habits — the same documents and atomic operations the
 * native apps use (`users/{uid}/habits/{habitId}`). Toggling a day is an
 * `arrayUnion` / `arrayRemove`, so completions stay race-free across devices.
 */

function habitsCol(uid: string) {
  return collection(db, "users", uid, "habits").withConverter(habitConverter);
}

function habitDoc(uid: string, habitId: string) {
  return doc(db, "users", uid, "habits", habitId).withConverter(habitConverter);
}

/** Live subscription to a user's habits, ordered by sortOrder (matches native). */
export function watchHabits(
  uid: string,
  onChange: (habits: Habit[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe {
  const q = query(habitsCol(uid), orderBy("sortOrder", "asc"));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => d.data())),
    (err) => onError?.(err),
  );
}

/** Create a habit. `createdAt` is set server-side; sortOrder defaults to "now". */
export async function createHabit(
  uid: string,
  habit: Habit,
): Promise<string> {
  const data = habitConverter.toFirestore({
    ...habit,
    sortOrder: habit.sortOrder || Date.now(),
  });
  const ref = await addDoc(collection(db, "users", uid, "habits"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Update editable fields of an existing habit (never touches createdAt). */
export async function updateHabit(
  uid: string,
  habitId: string,
  patch: Partial<Habit>,
): Promise<void> {
  const { id: _id, createdAt: _createdAt, ...rest } = patch;
  void _id;
  void _createdAt;
  await updateDoc(doc(db, "users", uid, "habits", habitId), rest);
}

/** Mark a single date done / not-done (atomic, race-free). */
export async function setDayDone(
  uid: string,
  habitId: string,
  dateStr: string,
  done: boolean,
): Promise<void> {
  await updateDoc(doc(db, "users", uid, "habits", habitId), {
    completedDates: done ? arrayUnion(dateStr) : arrayRemove(dateStr),
  });
}

export function archiveHabit(uid: string, habitId: string): Promise<void> {
  return updateHabit(uid, habitId, { archived: true });
}

export function restoreHabit(uid: string, habitId: string): Promise<void> {
  return updateHabit(uid, habitId, { archived: false });
}

export async function deleteHabit(uid: string, habitId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "habits", habitId));
}

/** Persist a new manual order by rewriting sortOrder for each habit. */
export async function persistOrder(uid: string, orderedIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  orderedIds.forEach((id, index) => {
    batch.update(habitDoc(uid, id), { sortOrder: index });
  });
  await batch.commit();
}
