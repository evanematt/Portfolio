// Edit this file to add / rename projects.
// Files live in projects/<id>/ — folder.png is the desktop folder icon
// (cover.jpg is used in the Projects window and as a fallback),
// `images` are shown in the window that opens on click.
// `sections` (optional): headed paragraphs shown under the description, e.g. brief, role, process, result.
// `qa` (optional): playful questions shown beside the character while she sits on the window, with her answers.
// `images` can mix photos (.jpg/.png) and videos (.mp4); each video needs a
// poster with the same name ending in .jpg (e.g. 01.mp4 + 01.jpg).
// x / y are optional starting positions in % of the screen (0–100);
// leave them out and the icon is placed automatically around the centre.

window.SITE = {
  name: "eva nemat",
  about:
    "Designer working across visual identity, art direction, motion and AI-generated film. " +
    "Click a project to open it, drag icons around the desktop.",
  email: "hello@example.com",
  instagram: "https://instagram.com/",
  portrait: "assets/portrait.jpg",
};

window.PROJECTS = [
  {
    id: "mockups", lip: 27,
    title: "Mockups",
    year: "2026",
    tags: "Product · Motion",
    description:
      "Product mockups and films: a health app shown on real-life table scenes (timelapse, nutrition, activity, sleep), " +
      "and Dila's “We found you a better deal” flow, in-branch TV queue screen and a self-service kiosk in the mountains.",
    images: ["01.mp4", "02.mp4", "03.mp4", "04.mp4", "05.mp4", "06.jpg", "07.mp4", "08.mp4"],
    // placeholder sections, to be written: each is a heading and a paragraph under the description
    sections: [
      { title: "Brief", text: "Placeholder. What the project was, who it was for and what it needed to do." },
      { title: "Role", text: "Placeholder. What I did on it: direction, design, motion, AI generation, editing." },
      { title: "Process", text: "Placeholder. How it came together: references, first explorations, the tools and the steps that shaped the final look." },
      { title: "Result", text: "Placeholder. What came out of it and where it was used." },
    ],
    qa: [
      { q: "Would you use that health app?", a: "I tracked my sleep with it once. It said “concerning”. I said “creative”." },
      { q: "Why is there a kiosk in the mountains?", a: "Even yetis deserve a smooth self-service experience." },
      { q: "Did you build the desk too?", a: "I dragged it in myself, remember? The pink chair was non-negotiable." },
    ],
  },
  {
    id: "chess-club", lip: 44,
    title: "Chess Club",
    year: "2026",
    tags: "Product · AI visuals",
    description:
      "A foldable purple-and-white chess set: packshots, on-the-go scenes on trains and mountain tops, " +
      "and short product films.",
    images: ["01.jpg", "02.jpg", "03.mp4", "04.mp4", "05.jpg", "06.jpg", "07.mp4", "08.mp4", "09.jpg"],
    // placeholder sections, to be written: each is a heading and a paragraph under the description
    sections: [
      { title: "Brief", text: "Placeholder. What the project was, who it was for and what it needed to do." },
      { title: "Role", text: "Placeholder. What I did on it: direction, design, motion, AI generation, editing." },
      { title: "Process", text: "Placeholder. How it came together: references, first explorations, the tools and the steps that shaped the final look." },
      { title: "Result", text: "Placeholder. What came out of it and where it was used." },
    ],
    qa: [
      { q: "Can you beat me at chess?", a: "Easily. And if I start losing, I just fold the board. That's why it's compact." },
      { q: "Why is the chess set purple?", a: "Black and white had a long run. Purple deserves a turn." },
      { q: "Where do you play it?", a: "Trains, mountain tops, my lap. Anywhere a knight can't fall off." },
    ],
  },
  {
    id: "llama-mavka", lip: 42,
    title: "Llama & Mavka",
    year: "2026",
    tags: "AI film",
    description:
      "Two AI shorts: a pastel llama wandering through clouds, mirrors and neon, and Mavka, " +
      "the forest spirit from Ukrainian folklore, reimagined as a glowing chrome figure.",
    images: ["01.mp4", "02.mp4", "03.mp4", "04.mp4", "05.mp4", "06.mp4"],
    // placeholder sections, to be written: each is a heading and a paragraph under the description
    sections: [
      { title: "Brief", text: "Placeholder. What the project was, who it was for and what it needed to do." },
      { title: "Role", text: "Placeholder. What I did on it: direction, design, motion, AI generation, editing." },
      { title: "Process", text: "Placeholder. How it came together: references, first explorations, the tools and the steps that shaped the final look." },
      { title: "Result", text: "Placeholder. What came out of it and where it was used." },
    ],
    qa: [
      { q: "Is the llama friends with the bird?", a: "Best friends. The bird does the navigation, the llama does the napping." },
      { q: "Who's Mavka?", a: "A forest spirit from Ukrainian folklore. I gave her chrome, she gave me goosebumps." },
      { q: "Can I pet the llama?", a: "Only if you're quiet. She's had a long day running across your screen." },
    ],
  },
  {
    id: "character", lip: 26,
    title: "Character & Merch",
    year: "2026",
    tags: "Character · Merch",
    description:
      "A horned character in an oversized hoodie with the arrow mark: turnaround sheet, " +
      "a street film and the hoodie itself.",
    images: ["01.jpg", "02.jpg", "03.mp4", "04.jpg", "05.jpg"],
    // placeholder sections, to be written: each is a heading and a paragraph under the description
    sections: [
      { title: "Brief", text: "Placeholder. What the project was, who it was for and what it needed to do." },
      { title: "Role", text: "Placeholder. What I did on it: direction, design, motion, AI generation, editing." },
      { title: "Process", text: "Placeholder. How it came together: references, first explorations, the tools and the steps that shaped the final look." },
      { title: "Result", text: "Placeholder. What came out of it and where it was used." },
    ],
    qa: [
      { q: "Can I buy the hoodie?", a: "Get in line. I already borrowed one and I'm not giving it back." },
      { q: "What's with the horns?", a: "Every creative dictator needs a crown. Horns are the budget version." },
      { q: "Who's cooler, you or him?", a: "I'm wearing his hoodie. Draw your own conclusions." },
    ],
  },
  {
    id: "lookbook", lip: 22,
    title: "Lookbook",
    year: "2026",
    tags: "Fashion · AI film",
    description: "Streetwear lookbook films, from city corners and night streets to free-falling through the clouds.",
    images: ["01.mp4", "02.mp4", "03.mp4", "04.mp4", "05.mp4"],
    // placeholder sections, to be written: each is a heading and a paragraph under the description
    sections: [
      { title: "Brief", text: "Placeholder. What the project was, who it was for and what it needed to do." },
      { title: "Role", text: "Placeholder. What I did on it: direction, design, motion, AI generation, editing." },
      { title: "Process", text: "Placeholder. How it came together: references, first explorations, the tools and the steps that shaped the final look." },
      { title: "Result", text: "Placeholder. What came out of it and where it was used." },
    ],
    qa: [
      { q: "Did you really jump out of a plane?", a: "Free-falling through clouds is easy when gravity is just a prompt." },
      { q: "Can I borrow an outfit?", a: "Ask the wardrobe. It's had trust issues since it fell from the sky." },
      { q: "What's your favourite look?", a: "The striped sweater. It goes great with my angry face." },
    ],
  },
  {
    id: "experiments", lip: 38,
    title: "Experiments",
    year: "2026",
    tags: "Motion · Illustration",
    description:
      "Smaller motion pieces and experiments: kinetic type, illustrated loops, fisheye portraits, colour studies " +
      "and a stylised 3D skater rolling through the old-town streets.",
    images: ["01.mp4", "02.mp4", "03.mp4", "04.mp4", "05.mp4"],
    // placeholder sections, to be written: each is a heading and a paragraph under the description
    sections: [
      { title: "Brief", text: "Placeholder. What the project was, who it was for and what it needed to do." },
      { title: "Role", text: "Placeholder. What I did on it: direction, design, motion, AI generation, editing." },
      { title: "Process", text: "Placeholder. How it came together: references, first explorations, the tools and the steps that shaped the final look." },
      { title: "Result", text: "Placeholder. What came out of it and where it was used." },
    ],
    qa: [
      { q: "What counts as an experiment?", a: "Anything that didn't fit in another folder but was too fun to delete." },
      { q: "Can the skater do a kickflip?", a: "He rolled through an entire old town. Kickflips are in the sequel." },
      { q: "What's a fisheye portrait?", a: "It's what I look like when you lean too close to the screen." },
    ],
  },
];

// Extra desktop icons that aren't projects: a YouTube video that opens in a small player window.
// The tabs in the middle of the menu bar. Give a project `mode: "<id>"` to put it under another tab
// (no `mode` = the first tab); an empty tab shows its title and `empty` text instead of icons.
window.MODES = [
  { id: "visual", title: "Visual" },
  { id: "product", title: "Product", empty: "product design portfolio, coming soon" },
  { id: "lab", title: "Lab", empty: "coming soon" },
];

window.EXTRAS = [
  { id: "adhd", title: "for ADHD", youtube: "rk84ndVMwbY", icon: "assets/adhd-icon.jpg", speed: 3 },
];
