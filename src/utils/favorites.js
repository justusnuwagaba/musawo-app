export function isFavoriteDoctor(profile, doctorId) {
  return !!profile?.favoriteDoctorIds?.includes(doctorId);
}

export async function toggleFavoriteDoctor(profile, updateProfile, doctorId) {
  const current = profile?.favoriteDoctorIds || [];
  const next = current.includes(doctorId) ? current.filter((id) => id !== doctorId) : [...current, doctorId];
  await updateProfile({ favoriteDoctorIds: next });
}
