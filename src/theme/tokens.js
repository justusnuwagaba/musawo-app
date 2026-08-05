// Design tokens for Musawo — dark, neon-accented health-tech re-theme.
// Near-black surfaces with two role-coded brand hues:
//   green (primary)   = "your own" action/state (patient's CTAs, live/online
//                        status, and — on the doctor's own screens — the
//                        doctor's own actions when they're the one acting)
//   cyan (secondary)  = "the other party's" state (the doctor's presence/
//                        activity as seen by the patient; reserved for a
//                        future live map's doctor pin/ETA)
// This pairing is a deliberate, load-bearing signal — don't reuse green/cyan
// interchangeably as generic "two brand colors."

export const colors = {
  // Brand fills
  primary: '#34E58C',       // neon green
  primaryDark: '#22B871',   // pressed/active state
  primaryMuted: 'rgba(52, 229, 140, 0.14)', // background-only: soft chip/badge fills, unread accents
  secondary: '#2DD9E8',     // cyan
  secondaryDark: '#22AFBB',
  secondaryMuted: 'rgba(45, 217, 232, 0.14)', // background-only
  accent: '#F2B84B',        // amber — warm/urgency accents (NEW badges, countdown numbers, favorite/streak icons)
  accentDark: '#D99A2E',
  accentLight: 'rgba(242, 184, 75, 0.14)',    // background-only

  // Text/icon color to put ON TOP OF a solid primary/secondary/accent fill.
  // These three brand hues are all bright, so white text fails contrast on
  // them — use near-black ink instead. `onPrimaryMuted` is for de-emphasized
  // text (e.g. a subtitle line) sitting on the same solid fill.
  onPrimary: '#07120C',
  onPrimaryMuted: 'rgba(7, 18, 12, 0.62)',
  onSecondary: '#07120C',
  onSecondaryMuted: 'rgba(7, 18, 12, 0.62)',
  onAccent: '#07120C',

  // Neutral surfaces
  background: '#070B09',     // app background, near-black
  surface: '#101815',        // base panel — cards, list rows, tab bar, headers
  surfaceRaised: '#161F1B',  // nested/secondary panels — modals, bottom sheets, action sheets
  border: 'rgba(148, 178, 167, 0.16)',       // default hairline border on dark surfaces
  borderStrong: 'rgba(148, 178, 167, 0.28)', // emphasis dividers, focused inputs

  // Text
  ink: '#EAF2EE',      // primary text (near-white/mint)
  inkMuted: '#8FA79D', // secondary text
  inkFaint: '#5B6E67', // tertiary/faint/disabled text

  // Semantic status — restrained: success/info reuse the brand hues, warning
  // reuses amber, one danger red (not neon-bright, so it works both as
  // solid-fill+white text on Decline/Cancel/End-call buttons AND as legible
  // text/border on dark surfaces for status pills).
  success: '#34E58C',
  successLight: 'rgba(52, 229, 140, 0.14)',
  warning: '#F2B84B',
  warningLight: 'rgba(242, 184, 75, 0.14)',
  danger: '#E5484D',
  dangerLight: 'rgba(229, 72, 77, 0.14)',
  info: '#2DD9E8',
  infoLight: 'rgba(45, 217, 232, 0.14)',

  white: '#FFFFFF',
  black: '#000000',
};

// `*Light` tokens are background-only fills (paired with the saturated
// version of the same color as text — e.g. status pills). Never use a
// `*Light` token as a `color:` value on top of a SOLID fill of the same
// hue — use `onPrimaryMuted`/`onSecondaryMuted` for that role instead.

export const fontFamily = {
  heading: 'SpaceGrotesk_600SemiBold',
  headingBold: 'SpaceGrotesk_700Bold',
  mono: 'IBMPlexMono_500Medium',
  monoRegular: 'IBMPlexMono_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
};

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  pill: 999,
};

// Shadows barely read on near-black — elevation is primarily a subtle
// border + the surface being one step lighter than the background, with a
// low-opacity shadow as a secondary cue.
export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  raised: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
};
