

export const BIRTHDAY = new Date('1997-12-07T00:00:00');

// --- BIRTHDAY PROTOCOL CONFIG ---
// Change the year here to set the next mission launch date
export const TARGET_DATE = new Date('2025-12-07T00:00:00');

export const NAME = "Racheal Kuranchie";

// --- CONFIGURATION ARRAYS ---

export const QUOTES = [
  "The courage to begin is often the hardest line of code.",
  "Your consistency is the only dependency your success requires.",
  "I don't just solve problems; I architect reliable futures.",
 
  "My journey from Political Science to AI proves that logic is transferable.",
  "Don't minimize your achievements. It's not bragging when it's fact.",
  "Trust the timing of your life.",
  "You are building a masterpiece.",
  "Keep going, you are doing great.",
  "Every star is a victory.",
  "The universe conspires in your favor.",
  "Your potential is infinite.",
  
];

export const SHOUTOUTS = [
  "GOD",
  "Mom",
  "Dad",
  "Isaac",
  "Jojoo Imbeah",
  "Nii Koney",

  "Akua Afriyie",
  "Sandra",
  "Abigail",
  "Tonytay",
  "Salam",

  "Alhassan",
  "Kwesi Dadson",
  "Jephter",
  "Abdul Aziz",
  "ME"


  
];

export const AFFIRMATIONS = [
  "I am a Generative AI Leader and an architect of secure systems.",
  "My unique background is my greatest asset; I turn complexity into clarity for others.",
  "I speak the language of code and the language of impact.",
  "My backend foundation is strong, and my AI vision is clear.",
  "I invest in my potential, and my commitment is non-negotiable.",
  "I am capable of handling whatever comes next.",
  "I am worthy of great things.",
  "I am exactly where I need to be.",
  "I am surrounded by abundance.",
  "I trust the journey.",
  "I am enough, just as I am."
];

export const MESSAGES = [
  { id: 1, sender: "Mercy Dufie Boateng", text: "May this new age come with favour and blessings. May God align your path and may HE give you all the you deserve according to His will. Cheers to a new chapter. Happy Birthday Rachael🥂🥂🎂🎂" },
  { id: 2, sender: "Benson Yeboah", text: "Happy Birthday Racheal!🎆🎆 You’re a nice person. Openly willing to help people. And a good team player as well!" },
  { id: 3, sender: "Miky Rola", text: "Be your best" },
  { id: 4, sender: "Renaty Christian Oberku ", text: "I am happy for the lady you have turned out to be.You have shown anything is possible once you put your mind to it. God bless you more and more…PS I am waiting to be trained to start earning. Happy happy happy birthday!!!!" },
  { id: 5, sender: "Joy Adevu", text: "I pray you get all the tech on your wishlist and more. Wishing you the best and happiest birthday ever" }
];

export const INITIAL_STARS = [
 
  { 
    id: "init-5", 
    x: 50, 
    y: 18, // Was 15, moved down
    memory: "Traveled internationally for the first time to attend PyCon Africa in South Africa. 😆✈️", 
    timestamp: Date.now() 
  },
  { 
    id: "init-7", 
    x: 25, // Was 30, moved left slightly
    y: 25, 
    memory: "Attended 'I Am Remarkable' at Google, overcoming the fear of sharing my professional achievements. 🥰💪", 
    timestamp: Date.now() 
  },
  { 
    id: "init-10", 
    x: 75, // Was 70, moved right slightly
    y: 25, 
    memory: "I completed a self help book, The mountain is you 📚 😄", 
    timestamp: Date.now() 
  },


  { 
    id: "init-1", 
    x: 15, // Was 10 (Safe zone)
    y: 45, 
    memory: "Officially achieved the Google Cloud Certified Generative AI Leader certification. 😁🏆", 
    timestamp: Date.now() 
  },
  { 
    id: "init-6", 
    x: 12, // Was 8 (This was likely missing)
    y: 65, 
    memory: "Led a workshop on Mastering Prompt Engineering and NotebookLM, training organizational teams. 😊🎤", 
    timestamp: Date.now() 
  },

  // --- RIGHT FLANK (Pulled away from the right edge) ---
  { 
    id: "init-2", 
    x: 85, // Was 90 (This was likely missing)
    y: 38, 
    memory: "Successfully navigated a career transition from Political Science to Software Development. 😄💻", 
    timestamp: Date.now() 
  },
  { 
    id: "init-9", 
    x: 88, // Was 92 (This was likely missing)
    y: 65, 
    memory: "I bought a washing machine 😎💻", 
    timestamp: Date.now() 
  },

  // --- BOTTOM ZONE (Moved up to avoid scrolling issues) ---
  { 
    id: "init-4", 
    x: 80, 
    y: 75, // Was 80
    memory: "Optimized a critical Java system, reducing processing time from 23 minutes to just 55 seconds. 🤩⚡", 
    timestamp: Date.now() 
  },
  { 
    id: "init-3", 
    x: 20, 
    y: 75, // Was 80
    memory: "Guided over 370 beginners into tech roles across 6 cohorts in the last two years. 😃🌱", 
    timestamp: Date.now() 
  },
  { 
    id: "init-11", 
    x: 50, 
    y: 82, // Was 88 (moved up so it doesn't hit the quote ticker)
    memory: "I went back to my hometown after 5 years, definitely faced my fear after that terrible accident! 📝 😃", 
    timestamp: Date.now() 
  },
  
  // --- INNER FILLER ---
  {
    id: "init-8",
    x: 30, // Was 18 (Moved inward to avoid HUD overlap)
    y: 32, 
    memory: "Updated my home office with an ergonomic chair and adjusted table. 😌🏠",
    timestamp: Date.now()
  }
];

// --- UTILITY FUNCTIONS ---

/**
 * Calculates current level (Age).
 * @param referenceDate Optional date to calculate age against (e.g., TARGET_DATE for simulations)
 */
export const calculateLevel = (referenceDate: Date = new Date()): number => {
  let age = referenceDate.getFullYear() - BIRTHDAY.getFullYear();
  const m = referenceDate.getMonth() - BIRTHDAY.getMonth();
  if (m < 0 || (m === 0 && referenceDate.getDate() < BIRTHDAY.getDate())) {
    age--;
  }
  return age;
};

export const calculateXP = (): number => {
  const today = new Date();
  // Time difference in milliseconds
  const diffTime = Math.abs(today.getTime() - BIRTHDAY.getTime());
  // Convert to days
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};
