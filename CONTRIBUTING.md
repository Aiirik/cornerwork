# Contributing to Cornerwork

## Code formatting

Before submitting changes, format the repository with:

```sh
npx --yes prettier@3.6.2 --write .
```

The shared Prettier configuration keeps HTML, CSS, JavaScript, JSON, Markdown, and workflow
files consistent. Binary font and image assets are excluded.

Thanks for helping improve Cornerwork.

## Reporting problems

Before opening an issue, check whether the problem has already been reported. Include:

- The device and browser you were using
- Whether Cornerwork was opened in a browser or from the Home Screen
- The workout settings needed to reproduce the problem
- What you expected to happen
- What happened instead

Avoid posting account details, Firebase tokens, or other private information.

## Suggesting improvements

Open an issue describing the training problem the change would solve. For new combinations or exercises, include a trustworthy coaching or training reference so they can be reviewed for practicality and safety.

## Pull requests

1. Read `PROJECT_GUIDE.md`, then fork the repository and create a focused branch.
2. Make the smallest change needed to solve the issue.
3. Test the timer on both desktop and mobile when the change affects layout or controls.
4. Confirm that keyboard controls, saved settings, and workout timing still work.
5. Run the checks documented in `PROJECT_GUIDE.md`.
6. Open a pull request explaining the change and how you tested it.

By contributing, you agree that your contribution will be licensed under the project's MIT License.
