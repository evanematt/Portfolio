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

Then edit `projects.js`: set your name, email and Instagram, and give each project an `id` (same as its folder name), `title`, `year`, `tags`, `description` and the list of `images`.

Any missing image shows as a coloured placeholder, so the site works before every file is in.

## Run locally

Open `index.html` in a browser, or run `python3 -m http.server` and visit http://localhost:8000.
