# Soundsuit - Fingerprinter

Fingerprinter is a tool that runs over all mp3 files stored on S3 and gathers various information about the file from different sources. It mashes them up and saves in our database. Using this data Soundsuit searches for suitable songs for given users.

## How to run

You can run it using `bin/analyze`

## How it works
1. Fingerprinter gets list of mp3 files stored on S3
2. Files that no longer exists on S3 are being removed from database
2. S3 files list is matched with records available in DB. When given track is in DB and is already successfully fingerprinted it's ignored.
3. Files that left (either new or incompletely fingerprinted) are run through steps pipeline. Each step does one thing (e.g. upload to Echonest, read ID3 tags). After each step modified record is saved back to database with corresponding status.
4. When all steps are done without error song gets status `complete`
5. When there is no songs to process fingerprinter quits.

There may be an error in any step of fingerprinter. When one is found all subsequent steps are omitted. Depending on error nature song gets status `error` (which means it will not be processed again) or processing is resumed on next round.
