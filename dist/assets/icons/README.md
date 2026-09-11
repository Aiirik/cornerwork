# Adding a Cornerwork app icon

No HTML or JavaScript changes are required. The folder name becomes the label shown in the app exactly as written.

1. Create a folder inside `assets/icons`. Its name is used unchanged in the app.
   - `alt4` displays as **alt4**.
   - `heavy bag` displays as **heavy bag**.
   - `Heavy-Bag` displays as **Heavy-Bag**.
2. Add all four PNG files below to that folder:
   - `icon.png`, the full-size gallery and header artwork
   - `icon-192.png`, exactly 192 by 192 pixels
   - `icon-512.png`, exactly 512 by 512 pixels
   - `apple-touch-icon.png`, exactly 180 by 180 pixels
3. Commit and push the folder. The deployment automatically adds it to the icon gallery, creates its web-app manifest, and includes its files in offline caching.

The default icon uses the same four filenames directly inside `assets/icons`.
