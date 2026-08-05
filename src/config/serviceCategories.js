// Per-category behavior for the generic service-booking mechanism
// (ServiceScreenTemplate.js / ServiceBookingScreen.js). Added once it became
// clear the six catalog categories don't all have the same real-world shape:
// insurance isn't a physical fulfillment at all, pharmacy needs delivery
// language not "home visit" language, and only some categories genuinely
// benefit from real nearby-doctor matching. One small config object here
// beats forking the booking screen per category.

export const SERVICE_CATEGORY_CONFIG = {
  lab: {
    fulfillmentLabels: { home: 'Home sample collection', facility: 'Visit a lab' },
    confirmLabel: 'Request test',
    supportsHomeMatching: false, // sample collection by a phlebotomist, not a doctor — different role, not built yet
    showsFulfillmentChoice: true,
  },
  vaccination: {
    fulfillmentLabels: { home: 'Home visit', facility: 'Visit a facility' },
    confirmLabel: 'Request vaccination',
    supportsHomeMatching: true, // real nearby-doctor matching — see ServiceBookingScreen
    showsFulfillmentChoice: true,
  },
  healthScreening: {
    fulfillmentLabels: { home: 'Home visit', facility: 'Visit a facility' },
    confirmLabel: 'Book screening',
    supportsHomeMatching: true, // basic screenings (BP, glucose) are within a general doctor's scope at home
    showsFulfillmentChoice: true,
  },
  pharmacy: {
    fulfillmentLabels: { home: 'Deliver to me', facility: 'Pick up at a partner pharmacy' },
    confirmLabel: 'Request order',
    supportsHomeMatching: false, // needs a courier/delivery dispatch, not a doctor — different role, not built yet
    showsFulfillmentChoice: true,
  },
  insurance: {
    // Not a real in-app purchase — Musawo doesn't underwrite insurance.
    // This is an honest inquiry/lead flow that connects the patient to a
    // real partner, so there's no "how do you want this done" question.
    confirmLabel: 'Request info',
    supportsHomeMatching: false,
    showsFulfillmentChoice: false,
  },
  // chronicIllness intentionally has no entry — ChronicHome.js no longer
  // routes through ServiceScreenTemplate/ServiceBookingScreen at all (see
  // ChronicHome.js), since ongoing condition management doesn't fit a
  // one-time catalog purchase.
};

export function getServiceCategoryConfig(category) {
  return (
    SERVICE_CATEGORY_CONFIG[category] ?? {
      fulfillmentLabels: { home: 'Home', facility: 'Visit a facility' },
      confirmLabel: 'Request',
      supportsHomeMatching: false,
      showsFulfillmentChoice: true,
    }
  );
}
