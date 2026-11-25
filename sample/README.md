# Sample capture

Put a splat of your own subject here (for example a few figurines on a table),
so the app runs without the museum capture.

1. Film it with the capture rules in the project README.
2. Train it (Postshot, Brush or LichtFeld Studio) and export a `.ply`.
3. Compress it to `sample/sample.sog`:
   ```powershell
   splat-transform -w your-scene.ply --filter-nan --filter-floaters sample/sample.sog
   ```
4. Open `http://localhost:8080/src/?src=../sample/sample.sog`.

Only commit captures you made yourself of subjects you have the right to share.
