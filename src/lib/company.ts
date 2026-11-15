/**
 * H&H contact details.
 *
 * COMPANY_PHONE is the ONLY place the company's number is written. Put the real
 * number here in international form, e.g. "+962 7 9000 0000", and the Help &
 * Contact screen starts working everywhere at once: the phone row and the
 * "Call Us" button open the dialer, and the WhatsApp row opens the chat.
 *
 * While it is left empty the screen shows the number as not set yet and the
 * buttons stay quiet, so nobody is sent to a wrong number by mistake.
 */
export const COMPANY_PHONE = "";

/** Working hours shown on the Help & Contact screen. */
export const COMPANY_HOURS = "08:00 – 18:00";

/** Digits only — what a tel: or wa.me link needs. */
const digits = COMPANY_PHONE.replace(/\D/g, "");

export const hasPhone = digits.length >= 8;
export const telLink = `tel:+${digits}`;
export const whatsappLink = `https://wa.me/${digits}`;

/** Opens the phone dialer on the company number. */
export function callCompany() {
  if (hasPhone) window.location.href = telLink;
}

/** Opens WhatsApp — the app on a phone, web on a computer. */
export function whatsappCompany() {
  if (hasPhone) window.open(whatsappLink, "_blank", "noopener,noreferrer");
}
