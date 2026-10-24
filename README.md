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

`window.MODES` lists the portfolio tabs in the middle of the menu bar. A project with `mode: "<tab id>"` shows under that tab; without one it belongs to the first tab. A tab with nothing in it shows its title and `empty` text. The open tab is kept in the URL (`#product`), so each portfolio has its own link.

Any missing image shows as a coloured placeholder, so the site works before every file is in.

## Run locally

Open `index.html` in a browser, or run `python3 -m http.server` and visit http://localhost:8000.

## Character

`character.js` walks a pixel character after the cursor along the bottom of the screen, hopping over the dock; when a window is open she jumps up and sits on its top edge with her legs dangling until it closes, then hangs in the air, falls, gets up and scolds. While she sits on a project window three playful questions about it (`qa` in `projects.js`) appear beside her; pick one and she types out a joke answer in a speech bubble. Drag the window she's sitting on up under the menu bar and she gets squashed against it, kicking, shaking her fist and swearing, and the window stops before she's flattened. On the Character & Merch window she pulls on its hoodie while she sits; it stays with the window. When Mockups opens she runs to the bottom-left corner, drags in a desk with a white PC and a pink gaming chair and clicks away at it for a bit; the desk stays there. When Llama & Mavka opens, its llama gallops across the bottom after its bird, lies down on the right and falls asleep with the bird perched on its back, and they stay there too. When Lookbook opens a big wardrobe drops from the top beside the dock; she runs over and tries on the three outfits from the lookbook films, ducking inside between them, then comes out in her own clothes and waves; the wardrobe stays as well, and a page reload clears them all so every scene plays again (walk when the cursor is near, run when it's far, a random pose when she's standing still, a jump on click). Windows always open centred on the screen, a little above the middle and clear of the dock, and on top of everything, including her and her props; Mockups, Lookbook and Llama & Mavka open beside their own scene instead of over it, and windows leave her room above them, and she is drawn in front of a window only while she's sitting on it. Sprites live in `assets/character/` as single rows of 176×256 frames. It only runs on devices with a mouse or trackpad and is off when reduced motion is on.

## Phone

On screens up to 640px wide `mobile.js` swaps the desktop for a phone home screen (styles at the end of `styles.css`, the desktop itself is untouched). Each tab in `window.MODES` is a home screen page you swipe between, with a pill above the dock to jump between them; the first page has a clock widget with your name, the others a widget with the tab's title (and its `empty` text when it has nothing yet). Projects are frosted folders showing `cover.jpg` and the three `peek-*.jpg`, extras are app tiles. Tapping one zooms it up to full screen like an app: an App Store-style header, the description and the gallery; go back with the Home button, by pulling down from the top, or by tapping or swiping up the home bar. The dock opens About as a note, All projects as a photo library, Instagram and Mail. A notification drops in once per visit. `character.js` follows a mouse, so on phones `phone-buddy.js` draws a smaller version of her instead: on the home screen she strolls and poses on top of the page switcher, behind the icons, and inside a project she plays its desktop scene along the bottom (the desk for Mockups, the llama and bird for Llama & Mavka, the wardrobe for Lookbook, the hoodie for Character & Merch, which she then stands in, a stroll for the rest), ducking down while the page scrolls. Tap her and she jumps.

## Updates

`index.html` loads `styles.css`, `projects.js`, `app.js`, `mobile.js`, `phone-buddy.js` and `character.js` with a `?v=` version, and the character sprites reuse it. Bump that version (the same string in every tag) whenever code or sprites change: browsers then fetch the new files on a normal load, and an open page reloads itself within about half a minute of the new version going live, or as soon as you switch back to its tab.

Extra desktop icons that aren't projects live in `window.EXTRAS` in `projects.js`; an entry with `youtube: "<video id>"` shows the video's thumbnail (or, with `icon: "<path>"`, that picture as a rounded app tile) and opens it in a borderless player window (just the video, controls appear on hover) that the character doesn't sit on; drag its bottom-right corner to resize it, or click the green light to make it big and back. `speed: 3` asks the player to start at that playback rate (YouTube caps it at the fastest rate it offers, usually 2x).
