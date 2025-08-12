# Tokens System Documentation

## Overview

The tokens system is designed to provide predefined prizes to users based on their unique token ID. Each token is associated with a specific prize which is determined in advance and stored in CSV files.

## CSV File Structure

The CSV files are located in `/public/tokens/` directory and are named using the date format `YYYY-MM-DD.csv`.

Each CSV file contains the following columns:
- `id`: Unique token identifier (format: ktd-YYYY-MM-DD-NNN)
- `day`: Date of the token (format: YYYY-MM-DD)
- `prize`: Predefined prize name (must match one of the prize names in the Roulette component)
- `sig`: Signature for validation
- `url`: Complete URL for accessing the token

Example:
```
id,day,prize,sig,url
ktd-2025-08-11-001,2025-08-11,chupetines,662dd0c306e1b62e56d6406185b79c71f941ed2bc458b5307c81ed6f540e40f6,https://pulserasktdrallounge.vercel.app/jugar?id=ktd-2025-08-11-001&sig=662dd0c306e1b62e56d6406185b79c71f941ed2bc458b5307c81ed6f540e40f6
```

## Important Notes

1. CSV files must be placed in the `/public/tokens/` directory to be accessible from client-side code
2. Prize names in CSV files must exactly match the names defined in the Roulette component
3. The system extracts the date from the token ID to determine which CSV file to load

## Implementation Details

The prize loading functionality is implemented in the `loadPredefinedPrize()` function in `/app/jugar/page.tsx`. This function:

1. Extracts the date from the token ID
2. Constructs a path to the corresponding CSV file
3. Fetches the CSV file from the server
4. Searches for the token ID in the file
5. Returns the associated prize name if found

Once the prize is loaded, the system uses `window.__rouletteForceByName()` to force the roulette wheel to display the correct prize.
