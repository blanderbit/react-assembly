# Tagging tracks

This is an attempt to decribe the way how we work with tags in Soundsuit.
It is a crucial concept which cause misundertanding sometimes.

## Fingerprinting

### Soundcloud

We query tracks from playlists by their Soundcloud Ids, these are:
```
  '103153902', // Berlin
  '102853481', // Stockholm
  '102853290', // NYC
  '88032683', // Paris
  '52114446', // Secret
  '238301431' // Miami
```

**No other playlists are queried for tracks.**

Each track is assigned a tag by the playlist name where it resides:

```
  Berlin > berlin
  Stockholm > stockholm
  NYC > nyc
  Paris > paris
  Miami > miami
  Secret > classic_mix
```

Then, we group all tracks from all playlists by their internal soundcloud_ids to find out
tracks residing in multiple playlists.
For such tracks, we concatenate tags together. So, if a track resides in Berlin AND Secret playlists,
it is assigned two tags - `berlin` and `classic_mix`.

After, we add 'indie' tag for each track from Soundcloud.

### S3

There is a mapping from a folder name to an initial tag:
```
'mp3_africa': 'africa',
'mp3_paris': 'paris',
'mp3_nordics': 'nordics',
'mp3_nyc': 'nyc',
'mp3_berlin': 'berlin',
'mp3_brasil': 'brasil',
'mp3_miami': 'miami',
'mp3_oldies': 'oldies'
```

It there is a match, we assign that tag. If no match, we assign default `classic_mix` tag.
We also add `mainstream` tag to each S3 track.

## Playing music

When querying tracks to play, we take tags into account in 2 cases:

#### Applying User's music flavor setting

Each user has a set of music flavors selected from available flavors:
- `nyc`
- `berlin`
- `classic_mix` (equals to `No specific flavor` or when nothing is selected)
- `paris`
- `stockholm`
- `miami`

There is a mapping from these flavors to tracks' tags:
```
nyc:          nyc + classic_mix,
berlin:       berlin + classic_mix,
classic_mix:  classic_mix,
paris:        paris + classic_mix,
stockholm:    stockholm + classic_mix,
miami:        miami
```

I.e. is a User has `nyc` music flavor selected, we want matching track to have `nyc` OR `classic_mix`
tag. I.e. the set of tags have to include `nyc` tag OR `classic_mix` tag. OR is inclusive, so

- track having only `nyc` is match
- track having `nyc` AND `paris` is match
- track having `nyc` AND `paris` AND `classic_mix` is match.

As User may have multiple music flavors selected, we combine all the results using OR operator.
So, if User has `paris` and `nyc` flavors selected, we want a track to have `paris` OR `nyc` OR
`classic_mix` tag.

#### Applying User's music style setting

If `charts` is selected, we require matching track to have `mainstream` tag.

If `independent` is selected, we require matching track to have `indie` tag.

If 50/50 selected, we don't add any requirements as both `mainstream` and `indie` match.
