import { collection, query, where, getAggregateFromServer, average, count } from 'firebase/firestore';
import { db as firestore } from '../config/firebaseConfig';

/** Computes a doctor's average rating + review count from the reviews collection. */
export async function getDoctorRatingSummary(doctorId) {
  try {
    const q = query(collection(firestore, 'reviews'), where('doctorId', '==', doctorId));
    const snap = await getAggregateFromServer(q, { average: average('rating'), count: count() });
    const data = snap.data();
    return { average: data.average, count: data.count };
  } catch (err) {
    console.error('[ratings] getDoctorRatingSummary error:', err);
    return { average: null, count: 0 };
  }
}

// Attaches a computed rating average/count to each doctor (replacing the old
// static doctor.rating field, which is never written anywhere). Fine at this
// app's current scale — a Cloud Function trigger denormalizing rating onto
// the doctor's own profile doc would remove this fan-out once Blaze is on.
export async function attachRatingsToDoctors(doctorList) {
  return Promise.all(
    doctorList.map(async (d) => {
      const summary = await getDoctorRatingSummary(d.id);
      return { ...d, rating: summary.average, ratingCount: summary.count };
    })
  );
}
