const businessConfig = {
  businessName: "Pest Kill Pest Solutions",
  tagline: "Professional Pest Control You Can Trust",
  phoneNumber: "+91-6375338302",
  whatsappNumber: "+91-6375338302",
  email: "pestsolutionspestkill@gmail.com",
  officeAddress: "F-52 Balaji Tower 1st, Vidhyadhar Nagar, Jaipur, Rajasthan, India",
  googleMapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3502.567974718769!3d75.924789!3d26.924789!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzbCsDU1JzQ2LjYiTiA3NcKwNTUnMjQuMk4!5e0!3m2!1sen!2sin!4v1600000000000",
  googleMapLink: "https://www.google.com/maps/search/F-52+Balaji+Tower+Vidhyadhar+Nagar+Jaipur",
  workingHours: "Mon-Sat: 9:00 AM - 7:00 PM",
  // Business licences, exactly as printed on the licences. Shown site-wide; the owner manages
  // visibility, the licence copy and the verified authority/validity in Admin → Licences.
  licenceNumber: "PCO/Jaipur/DD/2025-26/68",
  saleLicenceNumber: "SL/Jaipur/DD/2025-26/63",
  licences: [
    { key: "pco", title: "Pest Control Licence", number: "PCO/Jaipur/DD/2025-26/68", activity: "Pest management services" },
    { key: "sale", title: "Pesticide Sale Licence", number: "SL/Jaipur/DD/2025-26/63", activity: "Sale of pesticides" }
  ],
  // Official social / directory profile URLs (Google Business Profile, Facebook, Instagram, Justdial…).
  // Added to the search structured data as "sameAs"; list only profiles you own.
  socialProfiles: [],
  // GST registration number. When set, invoices are titled "Tax Invoice" and show it.
  gstin: "",
  services: [
    { name: "Anti-Termite Piping", slug: "anti-termite-piping", icon: "piping", desc: "Pre-construction porous pipe system with external refill points" },
    { name: "Termite Control", slug: "termite-control", icon: "termite", desc: "10-year warranty with government-certified treatment" },
    { name: "Cockroach Control", slug: "cockroach-control", icon: "cockroach", desc: "90-day guarantee with gel baiting treatment" },
    { name: "Rodent Control", slug: "rodent-control", icon: "rodent", desc: "1-year warranty with proofing solutions" },
    { name: "Bed Bug Treatment", slug: "bed-bugs", icon: "bedbug", desc: "Heat treatment with chemical application" },
    { name: "General Pest Control", slug: "general-pest-control", icon: "pest", desc: "Annual contract with regular maintenance" }
  ],
  serviceCoverage: [
    // Rajasthan
    "Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Bharatpur", "Sikar",
    "Pali", "Sri Ganganagar", "Hanumangarh", "Jhunjhunu", "Dungarpur", "Banswara", "Chittorgarh", "Rajsamand", "Nagaur",
    "Churu", "Dausa", "Karauli", "Dholpur", "Bundi", "Jhalawar", "Jalore", "Sirohi", "Beawar",
    // Delhi NCR
    "New Delhi", "Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", "Central Delhi",
    "Gurgaon", "Faridabad", "Noida", "Ghaziabad", "Dwarka", "Rohini", "Pitampura", "Mayur Vihar",
    "Saket", "Hauz Khas", "Vasant Kunj", "Malviya Nagar", "Greater Kailash", "Sarita Vihar",
    // UP
    "Lucknow", "Kanpur", "Agra", "Mathura", "Varanasi", "Allahabad", "Prayagraj", "Ayodhya",
    "Bareilly", "Moradabad", "Aligarh", "Meerut", "Vrindavan", "Gorakhpur", "Jhansi", "Greater Noida"
  ],
  experience: {
    governmentProjects: 15,
    multinationalProjects: "Multiple"
  },
  brands: [
    "Envu",
    "Syngenta",
    "Heranba Industries",
    "Arbuda Agrochemicals",
    "Kalyani"
  ],
  formulations: [
    "WP", "SC", "EC", "SL", "WG", "GR", "DP", "Gel", "Aerosol", "ULV", "Fumigants", "Baits"
  ],
  menu: [
    { label: "Home", path: "/" },
    { label: "Services", path: "/services" },
    { label: "Shop", path: "/shop" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
    { label: "Login", path: "/login" }
  ]
};

export default businessConfig;