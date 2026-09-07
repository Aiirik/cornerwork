# Cornerwork

A glove-friendly boxing combo coach and configurable round timer for bag work, shadowboxing, kickboxing, and other striking workouts.

[Open Cornerwork](https://aiirik.github.io/cornerwork/) | [Report a problem](https://github.com/Aiirik/cornerwork/issues) | [MIT License](LICENSE)

## What it does

Cornerwork builds varied workouts from practical combinations instead of repeating a fixed routine. The interface is designed to remain readable from a distance and easy to control while wearing boxing gloves.

### Highlights

- Beginner, intermediate, and advanced skill levels
- Adjustable rounds, warmup, rest, and combo frequency
- Punches, body shots, defense, footwork, kicks, knees, and elbows
- Optional round focuses and structured training blocks
- Customizable allowed combinations
- Numbers or full punch-name callouts
- Adjustable voice timing, warning sounds, and boxing bells
- Keyboard shortcuts and glove-friendly controls
- Saved workout presets with shareable links
- Optional Google sign-in for syncing saved workouts between devices
- Responsive desktop and mobile layouts

## Controls

| Action | Default key |
| --- | --- |
| Start or pause | Space |
| Next round | N |
| Previous round | R |
| Mute voice | M |

Shortcuts can be changed in Cornerwork's settings.

## Saved workouts and privacy

Cornerwork works without an account. Workout settings are stored locally in the browser.

Google sign-in is optional and is used only to sync saved workout presets through Firebase. General display, audio, and workout preferences remain specific to each browser or device.

## Development

Cornerwork is a static web application. The published files are inside the `dist` directory and do not require a build step.

To run it locally, serve the repository with any static HTTP server and open `dist/index.html`. Some browser features, including authentication and wake lock, may require HTTPS or an approved local origin.

## Deployment

Changes to the `dist` directory on the `main` branch are automatically deployed to GitHub Pages by the repository's GitHub Actions workflow.

## Contributing

Bug reports and improvements are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

Cornerwork is open-source software licensed under the [MIT License](LICENSE).

Copyright (c) 2026 Erik P. (Aiirik).
