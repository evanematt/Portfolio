# TG card idea

A 3D staff ID card for Simon Antropov, Associate Partner and Design Director at [The Gradient](https://thegradient.com), in a black and white style.

- The card spins in behind a large "the Gradient" wordmark, which then fades out and leaves the card on its own.
- Drag to orbit and scroll to zoom. **Flip** turns the card over and **Hold** slows it to a stop.
- The **About** bar at the bottom opens a panel with Simon's role, bio, the studio's details and selected studio work. Add `#about` to the URL to open the page with the panel already up.

## Run it

It is one static file. Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Built with

- [three.js r128](https://threejs.org/), loaded from cdnjs, with OrbitControls from jsDelivr
- Google Fonts: Archivo Black, Instrument Serif, JetBrains Mono
- The card faces are drawn on a canvas at runtime. The photo is embedded in the page as base64.

Profile and project details come from The Gradient's public site.
