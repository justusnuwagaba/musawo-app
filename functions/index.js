const crypto = require('crypto');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentUpdated, onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const { logger } = require('firebase-functions');
const { RtcTokenBuilder, RtcRole } = require('agora-token');

initializeApp();
const auth = getAuth();
const db = getFirestore();

// Set with: firebase functions:secrets:set AGORA_APP_ID / AGORA_APP_CERTIFICATE
// The App Certificate must never reach the client — only generateAgoraToken
// (server-side) sees it. Get both from https://console.agora.io.
const agoraAppId = defineSecret('AGORA_APP_ID');
const agoraAppCertificate = defineSecret('AGORA_APP_CERTIFICATE');

function requireAuth(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'You must be signed in.');
  return request.auth;
}

function requireAdmin(request) {
  const authCtx = requireAuth(request);
  const role = authCtx.token.role;
  if (role !== 'admin' && role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Admin privileges required.');
  }
  return authCtx;
}

function requireSuperAdmin(request) {
  const authCtx = requireAuth(request);
  if (authCtx.token.role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Superadmin privileges required.');
  }
  return authCtx;
}

async function notify(uid, { type, title, body, data = {} }) {
  await db.collection('notifications').doc(uid).collection('items').add({
    type,
    title,
    body,
    data,
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });
}

async function audit(performedBy, action, targetUid, details = {}) {
  await db.collection('adminAuditLog').add({
    action,
    performedBy,
    targetUid,
    details,
    timestamp: FieldValue.serverTimestamp(),
  });
}

// Scaffold placeholder from Phase 1 — confirms the Functions codebase deploys.
exports.healthCheck = onCall(() => ({ ok: true, service: 'musawo-functions' }));

/**
 * Approves or rejects a pending doctorApplications/{uid} doc.
 * On approve: grants the 'doctor' custom claim, flips users/{uid}.isVerified.
 * On reject: leaves role as 'doctor' (still unverified) so the applicant
 * keeps seeing VerificationPendingScreen with the rejection reason, and can
 * resubmit — see src/screens/doctor/VerificationPendingScreen.js.
 */
exports.reviewDoctorApplication = onCall(async (request) => {
  const authCtx = requireAdmin(request);
  const { uid, action, rejectionReason } = request.data || {};
  if (!uid || (action !== 'approve' && action !== 'reject')) {
    throw new HttpsError('invalid-argument', 'uid and action ("approve"|"reject") are required.');
  }

  const appRef = db.collection('doctorApplications').doc(uid);
  const appSnap = await appRef.get();
  if (!appSnap.exists) throw new HttpsError('not-found', 'No application found for this user.');
  if (appSnap.data().status !== 'pending') {
    throw new HttpsError('failed-precondition', 'This application has already been reviewed.');
  }

  const userRef = db.collection('users').doc(uid);

  if (action === 'approve') {
    await auth.setCustomUserClaims(uid, { role: 'doctor' });
    await userRef.update({
      isVerified: true,
      verificationStatus: 'approved',
      updatedAt: FieldValue.serverTimestamp(),
    });
    await appRef.update({
      status: 'approved',
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: authCtx.uid,
    });
    await notify(uid, {
      type: 'doctor_approved',
      title: "You're verified!",
      body: 'Your doctor application was approved. Patients can now find and book with you.',
    });
    await audit(authCtx.uid, 'approve_doctor_application', uid);
  } else {
    await userRef.update({
      verificationStatus: 'rejected',
      rejectionReason: rejectionReason || 'Please review your submitted details and try again.',
      updatedAt: FieldValue.serverTimestamp(),
    });
    await appRef.update({
      status: 'rejected',
      rejectionReason: rejectionReason || null,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewedBy: authCtx.uid,
    });
    await audit(authCtx.uid, 'reject_doctor_application', uid, { rejectionReason });
  }

  return { success: true };
});

/**
 * Sets a user's role via custom claims. Superadmin-only — granting
 * admin/superadmin is a privilege-escalation-sensitive action that a plain
 * admin must not be able to perform (prevents an admin from making
 * themselves or a friend a superadmin).
 */
exports.setUserRole = onCall(async (request) => {
  const authCtx = requireSuperAdmin(request);
  const { uid, role } = request.data || {};
  const ALLOWED_ROLES = ['patient', 'doctor', 'admin', 'superadmin'];
  if (!uid || !ALLOWED_ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', `role must be one of ${ALLOWED_ROLES.join(', ')}.`);
  }

  await auth.setCustomUserClaims(uid, { role });
  await db.collection('users').doc(uid).update({ role, updatedAt: FieldValue.serverTimestamp() });
  await audit(authCtx.uid, 'set_user_role', uid, { role });

  return { success: true };
});

/** Bans/unbans a user: disables their Firebase Auth account and flags Firestore. */
exports.setUserBanStatus = onCall(async (request) => {
  const authCtx = requireAdmin(request);
  const { uid, isBanned } = request.data || {};
  if (!uid || typeof isBanned !== 'boolean') {
    throw new HttpsError('invalid-argument', 'uid and isBanned (boolean) are required.');
  }

  await auth.updateUser(uid, { disabled: isBanned });
  await db.collection('users').doc(uid).update({ isBanned, updatedAt: FieldValue.serverTimestamp() });
  await audit(authCtx.uid, isBanned ? 'ban_user' : 'unban_user', uid);

  return { success: true };
});

/**
 * Admin-assisted password reset for phone accounts, which have no real
 * inbox behind their internal @musawo.local address (see UserProvider.js).
 * Returns the temp password to the admin UI to relay to the user manually —
 * not logged anywhere, since that would defeat the purpose.
 */
exports.resetUserPassword = onCall(async (request) => {
  const authCtx = requireAdmin(request);
  const { uid } = request.data || {};
  if (!uid) throw new HttpsError('invalid-argument', 'uid is required.');

  const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
  await auth.updateUser(uid, { password: tempPassword });
  await audit(authCtx.uid, 'reset_user_password', uid);

  return { tempPassword };
});

/**
 * Mints an Agora RTC token for a call. Verifies the caller is actually a
 * participant on the referenced appointment or consultation-queue entry
 * before minting anything — the App Certificate this needs must never be
 * generated client-side (that would let anyone join anyone else's channel).
 * uid 0 is Agora's documented "wildcard" convention: the token is valid for
 * whatever uid the client's joinChannel(..., 0, ...) call gets auto-assigned,
 * so patient and doctor don't need to coordinate numeric uids up front.
 */
exports.generateAgoraToken = onCall({ secrets: [agoraAppId, agoraAppCertificate] }, async (request) => {
  const authCtx = requireAuth(request);
  const { channelId, appointmentId, queueId } = request.data || {};
  if (!channelId) throw new HttpsError('invalid-argument', 'channelId is required.');

  let authorized = false;
  if (appointmentId) {
    const snap = await db.collection('appointments').doc(appointmentId).get();
    const appt = snap.data();
    authorized = !!appt && (appt.patientId === authCtx.uid || appt.doctorId === authCtx.uid);
  } else if (queueId) {
    const snap = await db.collection('consultationQueue').doc(queueId).get();
    const queueEntry = snap.data();
    authorized = !!queueEntry && (queueEntry.patientId === authCtx.uid || queueEntry.matchedDoctorId === authCtx.uid);
  }
  if (!authorized) {
    throw new HttpsError('permission-denied', 'You are not a participant in this consultation.');
  }

  const appId = agoraAppId.value();
  const appCertificate = agoraAppCertificate.value();
  if (!appId || !appCertificate) {
    throw new HttpsError(
      'failed-precondition',
      'Agora credentials are not configured yet — set the AGORA_APP_ID and AGORA_APP_CERTIFICATE secrets from https://console.agora.io.'
    );
  }

  const expireSeconds = 3600; // both params are durations-from-now, not timestamps
  const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channelId, 0, RtcRole.PUBLISHER, expireSeconds, expireSeconds);

  return { token, appId, channelName: channelId, uid: 0, expiresAt: Date.now() + expireSeconds * 1000 };
});

/** Notifies the doctor when a patient books a new appointment. */
exports.onAppointmentCreated = onDocumentCreated('appointments/{appointmentId}', async (event) => {
  const appt = event.data.data();
  if (!appt?.doctorId) return;
  await notify(appt.doctorId, {
    type: 'appointment_status',
    title: 'New appointment request',
    body: `${appt.patientName || 'A patient'} requested a ${appt.type} consultation.`,
    data: { appointmentId: event.params.appointmentId },
  });
});

/**
 * Notifies the other chat participant of a new message. This writes an
 * in-app notification (notifications/{uid}/items), which is what
 * DrNotificationsScreen and (once built) the patient equivalent read from —
 * it is NOT a device push notification. Real push requires registering the
 * app in the Firebase console (google-services.json /
 * GoogleService-Info.plist) and capturing device tokens, which is a manual
 * console step outside what this codebase can do on its own.
 */
exports.onMessageCreated = onDocumentCreated('chats/{chatId}/messages/{messageId}', async (event) => {
  const message = event.data.data();
  const chatSnap = await db.collection('chats').doc(event.params.chatId).get();
  if (!chatSnap.exists) return;

  const chat = chatSnap.data();
  const recipientUid = (chat.participants || []).find((uid) => uid !== message.senderId);
  if (!recipientUid) return;

  const senderName = chat.participantNames?.[message.senderId] || 'Someone';
  await notify(recipientUid, {
    type: 'new_message',
    title: senderName,
    body: message.content,
    data: { appointmentId: event.params.chatId },
  });
});

/** Notifies the relevant party when an appointment's status changes. */
exports.onAppointmentStatusChanged = onDocumentUpdated('appointments/{appointmentId}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (before.status === after.status) return;

  const appointmentId = event.params.appointmentId;

  if (after.status === 'confirmed') {
    await notify(after.patientId, {
      type: 'appointment_status',
      title: 'Appointment confirmed',
      body: `Dr. ${after.doctorName || ''} confirmed your appointment.`,
      data: { appointmentId },
    });
  } else if (after.status === 'cancelled') {
    await Promise.all([
      notify(after.patientId, {
        type: 'appointment_status',
        title: 'Appointment cancelled',
        body: `Your appointment with Dr. ${after.doctorName || ''} was cancelled.`,
        data: { appointmentId },
      }),
      notify(after.doctorId, {
        type: 'appointment_status',
        title: 'Appointment cancelled',
        body: `${after.patientName || 'A patient'} cancelled their appointment.`,
        data: { appointmentId },
      }),
    ]);
  }
});

function generateOtpCode() {
  return String(crypto.randomInt(100000, 1000000)); // 6 digits
}

/**
 * Phone-OTP upgrade path — NOT wired into any screen yet (see
 * UserProvider.js: phone accounts currently use a phone+password mechanism,
 * documented there as not OTP-verified). Everything here is real and
 * testable except the actual SMS send, which needs an Africa's Talking (or
 * similar) account this codebase doesn't have credentials for.
 */
exports.sendOtp = onCall(async (request) => {
  const { phone } = request.data || {};
  if (!phone) throw new HttpsError('invalid-argument', 'phone is required.');

  const code = generateOtpCode();
  await db.collection('otps').doc(phone).set({
    code,
    attempts: 0,
    expiresAt: Date.now() + 5 * 60 * 1000,
    createdAt: FieldValue.serverTimestamp(),
  });

  // TODO Africa's Talking: send `code` to `phone` via SMS here, e.g.
  //   await africasTalking.SMS.send({ to: phone, message: `Your Musawo code is ${code}` });
  // Until an account is configured, the code only reaches these logs.
  logger.info(`[sendOtp] Generated OTP for ${phone} (not sent — no SMS provider configured yet)`);

  return { success: true };
});

/** Verifies a code from sendOtp and signs the matching account in via a custom token. */
exports.confirmOtp = onCall(async (request) => {
  const { phone, code } = request.data || {};
  if (!phone || !code) throw new HttpsError('invalid-argument', 'phone and code are required.');

  const otpRef = db.collection('otps').doc(phone);
  const otpSnap = await otpRef.get();
  if (!otpSnap.exists) throw new HttpsError('not-found', 'No OTP request found for this number.');

  const otp = otpSnap.data();
  if (Date.now() > otp.expiresAt) throw new HttpsError('deadline-exceeded', 'This code has expired.');
  if (otp.attempts >= 5) throw new HttpsError('resource-exhausted', 'Too many attempts. Request a new code.');

  if (otp.code !== code) {
    await otpRef.update({ attempts: FieldValue.increment(1) });
    throw new HttpsError('invalid-argument', 'Incorrect code.');
  }

  await otpRef.delete();

  const usersSnap = await db.collection('users').where('phone', '==', phone).limit(1).get();
  if (usersSnap.empty) throw new HttpsError('not-found', 'No account found for this phone number.');

  const customToken = await auth.createCustomToken(usersSnap.docs[0].id);
  return { customToken };
});

async function ussdAppointmentStatus(phoneNumber) {
  const usersSnap = await db.collection('users').where('phone', '==', phoneNumber).limit(1).get();
  if (usersSnap.empty) return "END We couldn't find a Musawo account for this number.";

  const apptSnap = await db.collection('appointments').where('patientId', '==', usersSnap.docs[0].id).get();
  const upcoming = apptSnap.docs
    .map((d) => d.data())
    .filter((a) => a.status === 'requested' || a.status === 'confirmed')
    .sort((a, b) => (a.scheduledAt?.toMillis?.() ?? 0) - (b.scheduledAt?.toMillis?.() ?? 0))[0];

  if (!upcoming) return 'END You have no upcoming appointments.';
  const when = upcoming.scheduledAt?.toDate ? upcoming.scheduledAt.toDate().toLocaleString() : 'soon';
  return `END Your next appointment with Dr. ${upcoming.doctorName || ''} is ${when} (${upcoming.status}).`;
}

/**
 * USSD menu stub — mirrors the request shape Africa's Talking's USSD
 * gateway POSTs (sessionId, phoneNumber, text) and the CON/END response
 * format it expects, so wiring up a real shortcode later is a config change,
 * not a rewrite. No live shortcode is provisioned; this is reachable today
 * only via a direct HTTP POST (curl/emulator), not a real phone dial.
 * "Find a nearby doctor" is left as a documented future step rather than a
 * fabricated result, since USSD has no real way to show a scrollable list —
 * it would need its own paged-menu design.
 */
exports.ussdCallback = onRequest(async (req, res) => {
  try {
    const body = req.body || {};
    const sessionId = body.sessionId;
    const phoneNumber = body.phoneNumber;
    const text = body.text || '';
    const steps = text.split('*').filter(Boolean);

    await db
      .collection('ussdSessions')
      .doc(sessionId || `session_${Date.now()}`)
      .set(
        { sessionId, phoneNumber, currentMenu: text, input: steps[steps.length - 1] ?? '', createdAt: FieldValue.serverTimestamp() },
        { merge: true }
      );

    let response;
    if (text === '') {
      response = 'CON Welcome to Musawo\n1. Check my next appointment\n2. Find a nearby doctor\n3. Request a callback';
    } else if (steps[0] === '1') {
      response = await ussdAppointmentStatus(phoneNumber);
    } else if (steps[0] === '2') {
      response = 'END Doctor search via USSD is coming soon. Please use the Musawo app to find a doctor near you.';
    } else if (steps[0] === '3') {
      response = "END Thanks - we've logged your callback request. A Musawo team member will call you back soon.";
    } else {
      response = 'END Invalid option. Please try again.';
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
  } catch (err) {
    logger.error('[ussdCallback] error:', err);
    res.set('Content-Type', 'text/plain');
    res.status(200).send('END Sorry, something went wrong. Please try again later.');
  }
});
