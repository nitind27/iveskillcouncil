/** Official council identity used across the public user panel (header, footer, CTA). */
export const COUNCIL = {
  shortName: "IVESDC",
  fullName: "Institute of Vocational Education & Skill Development Council",
  mission: "Building a Skilled and Self-Reliant Nation",
  motto: "Learn · Skill · Grow · Achieve",
  helpline: "9925222523",
  address: "Shivaji Nagar, Fort-Songadh, Dist-Tapi, Gujarat - 394670",
  cin: "U88900GJ2026NPL175855",
  email: "iveskillcouncil@gmail.com",
} as const;

export const COUNCIL_TEAM: { name: string; role: string; phone?: string; photo: string }[] = [
  { name: "Yashvantbhai Prajapati", role: "Managing Director", phone: "9824817111", photo: "/Leader/YASHVANT%20SIR.png" },
  { name: "Sonali Prajapati", role: "Chief Executive Officer", phone: "9689271627", photo: "/Leader/SONALI%20MEM%2C.png" },
  { name: "Rajendra Sandanshiv", role: "Executive Director", phone: "9638019997", photo: "/Leader/RAJENDRA%20SIR.png" },
  { name: "Nileshbhai K. Vasava", role: "Chief Technology Officer (CTO) and Examination Officer", photo: "/Leader/Nileshbhai.jpeg" },
];
