import { cronJobs } from "convex/server";
import { internal } from "../../_generated/api";

const crons = cronJobs();

// Run every 5 minutes to check for expired draft bookings
crons.interval(
  "expire-draft-bookings",
  { minutes: 5 },
  internal.domains.bookings.mutations.expireIncompletedBookings
);

// Run every hour to update booking statuses based on activity dates
crons.hourly(
  "update-booking-statuses", 
  { minuteUTC: 0 },
  internal.domains.bookings.mutations.updateBookingStatusesByDate
);

// Run daily to mark no-shows for past bookings that were confirmed but not completed
crons.daily(
  "mark-no-shows",
  { hourUTC: 2, minuteUTC: 0 }, // Run at 2 AM UTC
  internal.domains.bookings.mutations.markNoShowBookings
);

export default crons; 