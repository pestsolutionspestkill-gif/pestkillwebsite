// Policy pages. They state only what PestKill actually does; anything not decided by the owner is
// described as "set out in your quotation / order confirmation" rather than invented here.
import businessConfig from './businessConfig';
import { GST_NOTE } from './catalog';

const { businessName, officeAddress, phoneNumber, email, gstin, udyam, licenceNumber, saleLicenceNumber } = businessConfig;
const contact = `${businessName}, ${officeAddress}. Phone / WhatsApp: ${phoneNumber}. Email: ${email}.`;
export const POLICY_UPDATED = '2026-11-25';

export const POLICIES = {
  'privacy-policy': {
    title: 'Privacy policy',
    intro: `This policy explains what information ${businessName} collects through this website and how it is used.`,
    sections: [
      ['What we collect', [
        'Details you give us: name, phone number, email, address, city, PIN code and the service or products you ask about.',
        'Booking details: preferred date and slot, property details and optional household notes (for example, children or pets) used to plan a safe treatment.',
        'For professional (PCO) buyers: firm name, licence number and validity, GSTIN and copies of the licence and GST certificate you upload.',
        'For orders: items, delivery address, payment method and payment references recorded by our team.',
        'Photos you upload, such as pack labels for a replacement request, and job photos taken by our technicians.',
        'Basic technical records (such as IP address and time of request) kept for security and to prevent misuse.',
      ]],
      ['How we use it', [
        'To respond to enquiries, schedule visits, carry out treatments and send reports and invoices.',
        'To verify professional buyers before selling restricted products, and to process and deliver orders.',
        'To keep records required for tax, licensing and accounts.',
      ]],
      ['Who can see it', [
        'Only staff who need it for their work. Technicians see the details of jobs assigned to them.',
        'PCO licence and GST documents are visible only to the owner and staff with buyer-verification rights.',
        'We do not sell your information. We share it only when needed to deliver a service or order (for example, a courier needs your address) or when the law requires it.',
      ]],
      ['WhatsApp, phone and email', [
        'If you choose to contact us on WhatsApp, your message is handled under WhatsApp’s own terms as well as this policy.',
      ]],
      ['Storage on your device', [
        'The website stores your sign-in token, cart and display preference in your browser so you stay signed in and keep your cart. It does not use advertising or analytics trackers.',
      ]],
      ['Your choices', [
        'You can view and update your profile in your account. To correct or delete your information, contact us; records we must keep by law (such as invoices) are retained for the required period.',
      ]],
      ['Contact', [contact]],
    ],
  },
  terms: {
    title: 'Terms & conditions',
    intro: `These terms apply to services booked with, and products bought from, ${businessName}.`,
    sections: [
      ['Business details', [
        `${businessName}, ${officeAddress}.`,
        `GSTIN ${gstin}. Udyam registration ${udyam}.`,
        `Pest Control Licence ${licenceNumber}. Pesticide Sale Licence ${saleLicenceNumber}.`,
      ]],
      ['Service area and appointments', [
        businessConfig.dispatchNote,
        'A booking made on the website is a request. An appointment is confirmed only when our team confirms availability with you by phone or WhatsApp.',
        'Visit dates outside Jaipur depend on distance, job size and team availability.',
      ]],
      ['Prices', [
        GST_NOTE,
        'Published prices are starting prices for typical homes. The final price is confirmed after inspection and stated on your quotation before work starts. Larger homes, commercial, industrial and complex sites are quoted after inspection.',
      ]],
      ['Treatment and safety', [
        'Products are applied by trained technicians as the product label directs. Please follow the preparation and after-care instructions we give you, including how long to keep treated areas closed.',
        'Tell us about children, pets, elderly people, anyone with asthma or allergies, and any food or water storage areas before the visit.',
      ]],
      ['Warranty', [
        'A warranty applies only where it is written on your quotation or invoice for that job, with its period and conditions. No other warranty is implied by this website.',
      ]],
      ['Cancellation and rescheduling', [
        'To cancel or reschedule a visit, contact us as early as possible by phone or WhatsApp. Any terms for contract (AMC) or project work are set out in that quotation or agreement.',
        'Shop orders can be cancelled from your account until we confirm them; after that, contact us.',
      ]],
      ['Professional products (PCO shop)', [
        'Professional products are sold only to licensed pest control operators whose account we have verified. A valid, unexpired licence must be on record.',
        'Products must be used only as directed on the label and under the Insecticides Act, 1968 and the rules made under it.',
        'Payment is by cash on delivery, UPI or bank transfer. An order is marked paid only after we confirm receipt of payment.',
        'Replacement is available only for products that were already expired when supplied: see the product replacement policy.',
      ]],
      ['Contact', [contact]],
    ],
  },
  'shipping-delivery': {
    title: 'Shipping & delivery policy',
    intro: 'How professional product orders are dispatched and delivered.',
    sections: [
      ['Where we deliver', [
        'We deliver professional pest control products across India to verified PCO buyers. Orders are dispatched from Jaipur.',
      ]],
      ['Delivery time and charges', [
        'Delivery time depends on your location and on transport or courier availability for the products ordered. We confirm the expected dispatch and delivery timeline when we call you to confirm the order.',
        'Any delivery charge is confirmed with you before dispatch.',
        'Some pesticides have transport restrictions; if a product cannot be sent to your location by the usual route, we tell you before dispatch.',
      ]],
      ['On delivery', [
        'Please check that packs are sealed and undamaged, and check the batch number and expiry date on the label. If a product supplied was already expired, report it as set out in the product replacement policy.',
      ]],
      ['Contact', [contact]],
    ],
  },
  'replacement-policy': {
    title: 'Product replacement policy',
    intro: 'Our only replacement commitment for professional products.',
    sections: [
      ['What we replace', [
        'If a pesticide we supplied to you was already expired at the time of supply, the affected packs can be returned and replaced with a fresh lot.',
        'We do not offer returns, refunds or replacements for any other reason unless we agree to it in writing for a specific order.',
      ]],
      ['How to report it', [
        'Sign in, open My account → Shop orders, and choose "Received an expired product? Request a replacement" on the delivered order.',
        'Give the order, the product, the batch number and the expiry date exactly as printed, and add 1 to 3 clear photos of the pack label showing the batch number and expiry date.',
        `You can also contact us on ${phoneNumber} with the same details and photos.`,
      ]],
      ['What happens next', [
        'We check the batch and expiry against our dispatch record. If the product was expired when supplied, we arrange the return of the affected packs and send a fresh lot.',
        'Keep the affected packs sealed and stored safely until we collect or replace them.',
      ]],
      ['Contact', [contact]],
    ],
  },
  disclaimer: {
    title: 'Disclaimer',
    intro: 'Please read this before relying on information on this website.',
    sections: [
      ['Product information', [
        'Product names, active ingredients and pack sizes are taken from manufacturers’ information. The label and leaflet supplied with each pack are the authority for use, dose, safety and first aid.',
        'Images are for identification; the pack you receive carries the manufacturer’s current label.',
      ]],
      ['Dose calculator and technical references', [
        'The dosage calculator gives starting quantities only. Figures marked with IS 6313 come from that code of practice; others are entered by you or verified by our team from the label. Always check the product label before use.',
        'Listing a standard on this website is not a claim of BIS certification.',
      ]],
      ['Guides and articles', [
        'Pest guides and articles are general information, not a substitute for an inspection of your site.',
      ]],
      ['Prices', [
        `${GST_NOTE} Prices and availability may change; the price on your quotation or order confirmation applies.`,
      ]],
      ['Contact', [contact]],
    ],
  },
};
