# API

All the endpoints are expected to be used with `Content-Type:application/json` header provided.

## Authentication

`POST /api/login`


#### Request

JSON body of the request have to contain `email` and `password` fields.

#### Response

`401 Unathorized` in case provided credentials are wrong.

If credentials are correct, but user is not verified, `400 Bad request` with the following JSON body is responded:
```json
{
  "success": "false",
  "message": "You have not been verified. Please check your email for the verification link."
}
```

In case of successful authentication, `200 OK` with the following body is responded:

```json
{
  "success": "true",
  "token": "<Authentication token here>"
}
```

The token provided should be used for further API requests.
Token is valid for 30 days.

**To query any of protected endpoints, token should be provided in the `authorization` header of the request.**

#### Example

```sh
curl -H "Content-Type: application/json" -X POST -d '{"email":"foo@bar.com","password":"xyz"}' https://soundsuit-stage.herokuapp.com/api/login
```

```json
{
  "success": true,
  "token": "JWT eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiNTU2ZTIxZDVmOGY0MzEwZTAwZTIxNmExIiwiaWF0IjoxNDQyODE4MzU2LCJleHAiOjE0NDU0MTAzNTZ9.LAhLrWfD9GV6F0GXDYFEYGxnudTL-a30sDieWSkKljU"
}
```


## Get next songs to play

`GET /api/next`

Authentication is required.

#### Request

Parameters (as query string):

- count {Numer} - Optional. Number of songs to return. Default is 5.
- now {String} - Required. Client date string in format of DD-MM-YYYY HH:mm
- mood {Number} - Required. Mood [-3...3], integer
- mostRecent {true | false} - Optional. Take some most recently uploaded songs first. On the first app run should be true; false for other requests. Default is false.
- reject {[String]} - Optional. Array of song ids that shouldn't be included in search results.


#### Response
JSON array of track entities from database, such as:

```json
[{
  "_id": "555e33b1db3e5e701325ca98",
  "bpm": 60,
  "coverImage": "https://i1.sndcdn.com/artworks-000017229568-53ccp8-t500x500.jpg",
  "createdDate": "2015-05-21T19:36:17.000Z",
  "file": "https://api.soundcloud.com/tracks/34319398/stream?client_id=fb669ffd24c7c5ad4d033eac55995c4d",
  "id": "555e33b1db3e5e701325ca98",
  "isLiked": false,
  "artistName": "Karuan",
  "title": "Live Your Life"
}]
```

#### Example:

```
GET /api/next?count=5&now=14-09-2015%2022%3A24&mood=-3&mostRecent=false&reject=559314b2a9136f3b42ab90de&reject=555e33b1db3e5e701325cab2&reject=55c99a5c5da3133b434a5112&reject=545ee6fb490a050200c47e54&reject=555e33b1db3e5e701325ca4b&reject=545d95832dda540200645d07
```

## Add songs to last played

`POST /api/last_played`

Authentication is required.

Needed to be done when the song is started to being played to avoid songs repetition during the interval specified by `NO_REPEAT_INTERVAL_MINUTES` environment variable (default is 120 minutes).

#### Request

Parameters (JSON body):

- songId {String} - Required. Song id to mark as played. Should be a valid stringified ObjectId.

#### Response
JSON object containing already played songs, such as:

```json
{
  "lastPlayed": [
    {
      "_id": "5600e6ca74ea4bf752b9085f",
      "time_played": "2015-09-22T05:27:38.686Z",
      "track": "55dd557d81d3d8d45c9d2f7d"
    }
  ]
}
```

## Add song to loved

`POST /api/like`

Authentication is required.

#### Request

Parameters (JSON body):

- songId {String} - Required. Song id to mark song as loved. Should be a valid stringified ObjectId.


## Remove song from loved

`POST /api/unlike`

Authentication is required.

#### Request

Parameters (JSON body):

- songId {String} - Required. Song id to remove from list of loved. Should be a valid stringified ObjectId.
