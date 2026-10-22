// Edit this file to add / rename projects.
// Files live in projects/<id>/ — folder.png is the desktop folder icon
// (cover.jpg is used in the Projects window and as a fallback),
// `images` are shown in the window that opens on click.
// `qa` (optional): questions shown beside the character while she sits on the window, with her answers.
// `images` can mix photos (.jpg/.png) and videos (.mp4); each video needs a
// poster with the same name ending in .jpg (e.g. 01.mp4 + 01.jpg).
// x / y are optional starting positions in % of the screen (0–100);
// leave them out and the icon is placed automatically around the centre.

window.SITE = {
  name: "Your Name",
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
    qa: [
      { q: "What tools did you use?", a: "All of it was made in Higgsfield, with Nano Banana Pro, Cinematic Studio and Seedream 2." },
      { q: "Where did the idea come from?", a: "Some good friends of mine started their own chess club in Lviv, and their idea of a compact, foldable chess set was too good not to show off." },
      { q: "What was the hardest part?", a: "Keeping the shape of every chess piece true from shot to shot, so a knight still looks like a knight in every frame." },
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
  },
  {
    id: "lookbook", lip: 22,
    title: "Lookbook",
    year: "2026",
    tags: "Fashion · AI film",
    description: "Streetwear lookbook films, from city corners and night streets to free-falling through the clouds.",
    images: ["01.mp4", "02.mp4", "03.mp4", "04.mp4", "05.mp4"],
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
  },
];
