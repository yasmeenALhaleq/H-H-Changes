/**
 * Opening the company's phone number on the customer's device.
 *
 * The number itself is not written here — the operations team saves it in the
 * admin dashboard (Settings → Contact), it lives in the database, and the app
 * reads it from the store. These helpers only turn whatever number is saved
 * into a working dialer or WhatsApp link.
 */

/** Digits only — what a tel: or wa.me link needs. */
const digitsOf = (phone: string) => phone.replace(/\D/g, "");

/** True once a saved number is long enough to actually dial. */
export const canCall = (phone: string) => digitsOf(phone).length >= 8;

/** Opens the phone dialer on the company number. */
export function callCompany(phone: string) {
  if (canCall(phone)) window.location.href = `tel:+${digitsOf(phone)}`;
}

/** Opens WhatsApp — the app on a phone, web on a computer. */
export function whatsappCompany(phone: string) {
  if (canCall(phone))
    window.open(`https://wa.me/${digitsOf(phone)}`, "_blank", "noopener,noreferrer");
}
