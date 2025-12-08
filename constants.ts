import { UserProfile, PersonaType } from './types';

// Combined text from the OCR provided in the prompt
export const ABDUL_CV_TEXT = `
ABDUL HAKEEM
Sharjah, UAE | +91 8904752904 | abdulh.work@gmail.com | LinkedIn
CONTENT & MARKETING STRATEGIST (AI, GenAI, Web3)
(On Visit Visa | Immediate Joiner)

Technical Content | Brand Strategy | Lead Generation | Digital Growth

A results-driven Content & Marketing Strategist with 4+ years of experience building high-impact brand narratives and content-led growth engines for the AI, GenAI, Web3, and Cloud sectors. Proven record of developing end-to-end marketing strategies in the UAE, Saudi Arabia, and the USA.
Instrumental in securing $2M+ in funding post-Dubai Crypto Expo 2022 by developing the core brand strategy and pitch collateral. Expert in translating complex technical concepts into compelling content.

KEY MARKETING & CONTENT HIGHLIGHTS
● Produced 150+ pieces of content across AI, GenAI, Blockchain, analytics, cloud.
● Influenced $2M+ seed funding through pitch decks and investor collateral.
● Delivered 40% increase in MQLs in Q3 2024.
● Drove 150% organic traffic growth in six months.

CORE COMPETENCIES
● Content Strategy: Technical Whitepapers, Case Studies, API Docs, UX Writing.
● Marketing: Lead Gen, SEO/SEM, GTM Strategy, A/B Testing.
● Tools: AI/GenAI, Web3, HubSpot, SEMrush, Ahrefs, Figma, Jira.

PROFESSIONAL EXPERIENCE
Product & Content Associate | Nu10 Technologies | Jul 2024 – Jan 2025
● Product Focus: GenAI Content Studio, AI Healthcare, Web3 Data Integrity.
● Authored 15+ high-impact technical assets. Drove 40% increase in MQLs.
● Created GenAI content workflow reducing production time by 25%.

Project Manager & Content Strategist | DBlockchainers | Jan 2022 – Jun 2024
● Managed 30+ AI, Blockchain projects.
● Played pivotal role in securing $2M+ seed funding.
● Managed C-suite relationships and marketing budgets.

Technical Growth and UX (Jan 2022 – Jun 2022)
● Increased organic traffic by 150%.
● Improved user engagement metrics by 20% via UX/UI enhancements.

Unity Game Developer Intern | PopGames | Jul 2021 – Sep 2021
Machine Learning Developer Intern | Verzeo | Mar 2021 – May 2021

EDUCATION
MCA (8.32 GPA) REVA University. BCA (7.1 GPA) Kristu Jayanti College.
`;

export const USER_PROFILE: UserProfile = {
  name: "Abdul Hakeem",
  email: "abdulh.work@gmail.com",
  phone: "+91 8904752904",
  location: "Sharjah, UAE",
  websites: {
    [PersonaType.MARKETING]: "https://abdulhakeem-profile-mac.netlify.app/",
    [PersonaType.PMO]: "https://abdulhakeem-profile-pmo.netlify.app/",
    [PersonaType.ULT]: "https://abdulhakeem-profile-ult.netlify.app/"
  },
  cvText: ABDUL_CV_TEXT
};

export const UAE_SEARCH_QUERIES = [
  "Marketing Strategist jobs in UAE AI Web3",
  "Technical Project Manager jobs Dubai Blockchain",
  "Content Manager jobs UAE Tech Startups",
  "Product Marketing Manager AI UAE",
  "Digital Marketing Specialist Web3 Dubai"
];