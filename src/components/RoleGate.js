import { useUserContext } from '../context/UserProvider';

// <RoleGate allow={['superadmin']}>...</RoleGate> — UI-level convenience
// only. Every privileged action this gates must also be enforced server-side
// (Cloud Functions checking the caller's custom claim) since a client-side
// check can always be bypassed.
export default function RoleGate({ allow, children, fallback = null }) {
  const { role } = useUserContext();
  return allow.includes(role) ? children : fallback;
}
