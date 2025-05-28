/**
 * Utility functions for booking operations
 */

/**
 * Generate a unique confirmation code
 */
export function generateConfirmationCode(): string {
  const prefix = "TN"; // Tuca Noronha prefix
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * Calculate total price for activity booking
 */
export function calculateActivityBookingPrice(
  basePrice: number,
  participants: number,
  ticketPrice?: number
): number {
  const pricePerPerson = ticketPrice || basePrice;
  return pricePerPerson * participants;
}

/**
 * Calculate total price for event booking
 */
export function calculateEventBookingPrice(
  basePrice: number,
  quantity: number,
  ticketPrice?: number
): number {
  const pricePerTicket = ticketPrice || basePrice;
  return pricePerTicket * quantity;
}

/**
 * Calculate total price for vehicle booking
 */
export function calculateVehicleBookingPrice(
  pricePerDay: number,
  startDate: number,
  endDate: number,
  additionalDrivers?: number
): number {
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  const basePrice = pricePerDay * days;
  const additionalDriverPrice = (additionalDrivers || 0) * 50 * days; // R$50 por motorista adicional por dia
  return basePrice + additionalDriverPrice;
}

/**
 * Check if dates conflict for vehicle booking
 */
export function hasDateConflict(
  existingStartDate: number,
  existingEndDate: number,
  newStartDate: number,
  newEndDate: number
): boolean {
  return (
    (newStartDate >= existingStartDate && newStartDate <= existingEndDate) ||
    (newEndDate >= existingStartDate && newEndDate <= existingEndDate) ||
    (newStartDate <= existingStartDate && newEndDate >= existingEndDate)
  );
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone format (Brazilian format)
 */
export function isValidPhone(phone: string): boolean {
  // Remove non-digit characters
  const digitsOnly = phone.replace(/\D/g, "");
  // Brazilian phone: 10 or 11 digits (with area code)
  return digitsOnly.length >= 10 && digitsOnly.length <= 11;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Format time for display
 */
export function formatTime(timeString: string): string {
  return timeString;
}

/**
 * Check if booking can be canceled
 */
export function canCancelBooking(
  createdAt: number,
  bookingDate?: string,
  bookingTime?: string
): boolean {
  const now = Date.now();
  const timeSinceCreation = now - createdAt;
  
  // Can cancel within 24 hours of creation
  if (timeSinceCreation < 24 * 60 * 60 * 1000) {
    return true;
  }
  
  // Can cancel if booking is more than 24 hours away
  if (bookingDate) {
    let bookingDateTime = new Date(bookingDate);
    if (bookingTime) {
      const [hours, minutes] = bookingTime.split(":").map(Number);
      bookingDateTime.setHours(hours, minutes, 0, 0);
    }
    
    const timeUntilBooking = bookingDateTime.getTime() - now;
    return timeUntilBooking > 24 * 60 * 60 * 1000;
  }
  
  return false;
}