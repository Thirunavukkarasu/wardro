# Wardro

Wardro is a wardrobe management app that helps users to keep track of their clothes and outfits. Users can add, edit, and delete clothes, create outfits, and view their clothes and outfits in a calendar view. Wardro also provides a weather forecast for the next 7 days to help users plan their outfits.

## Features

- Add, edit, and delete clothes
- Create outfits
- View clothes and outfits in a calendar view
- Analyze usage of clothes

## Installation

1. Clone the repository
2. Install the required packages

```bash
npm install
```

3. Start the server

```bash
npm start
```

## Technologies

- React Native (Expo) — `mobile-app/`
- Flutter — `mobile-app-flutter/`
- Neon DB
- BunJS

## Mobile apps

Two mobile clients live side by side:

| Directory | Stack | Status |
| --- | --- | --- |
| `mobile-app/` | Expo SDK 51 / React Native | Original app, untouched |
| `mobile-app-flutter/` | Flutter 3.47 | Port of every screen; auth is stubbed pending Clerk |

See `mobile-app-flutter/README.md` for run instructions and the Clerk migration path.

