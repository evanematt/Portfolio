# Portfolio

Desktop-style portfolio: draggable project icons over a blurred portrait, a menu bar with a clock, a dock, and Mac-style windows that open on click.

## Adding your work

```
assets/portrait.jpg            ← background photo of you
projects/<project-id>/folder.png ← folder icon on the desktop (transparent PNG)
projects/<project-id>/cover.jpg ← square thumbnail, used if folder.png is missing
projects/<project-id>/01.jpg    ← images shown in the project window
projects/<project-id>/02.mp4    ← videos work too, next to a 02.jpg poster
```

Then edit `projects.js`: set your name, email and Instagram, and give each project an `id` (same as its folder name), `title`, `year`, `tags`, `description` and the list of `images`. Optional `lip` is the height (in %, from the top of folder.png) of the folder's front panel edge; hover previews rise out from behind it.

Any missing image shows as a coloured placeholder, so the site works before every file is in.

## Run locally

Open `index.html` in a browser, or run `python3 -m http.server` and visit http://localhost:8000.

## Character

`character.js` walks a pixel character after the cursor along the bottom of the screen, hopping over the dock; when a window is open she jumps up and sits on its top edge with her legs dangling until it closes, then hangs in the air, falls, gets up and scolds. On the Character & Merch window she pulls on its hoodie while she sits; it stays with the window. When Mockups opens she runs to the bottom-left corner, drags in a desk with a white PC and a pink gaming chair and clicks away at it for a bit; the desk stays there, remembered in localStorage. When Llama & Mavka opens, its llama gallops across the bottom after its bird, lies down on the right and falls asleep with the bird perched on its back, and they stay there too. When Lookbook opens a big wardrobe drops from the top beside the dock; she runs over and tries on the three outfits from the lookbook films, ducking inside between them, then comes out in her own clothes and waves; the wardrobe stays as well (walk when the cursor is near, run when it's far, a random pose when she's standing still, a jump on click). Windows always open centred on the screen and on top of everything, including her and her props; they only sit low enough to leave her room above them, and she is drawn in front of a window only while she's sitting on it. Sprites live in `assets/character/` as single rows of 176×256 frames. It only runs on devices with a mouse or trackpad and is off when reduced motion is on.
