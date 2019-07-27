export default function() {
  return function(input) {
    switch (input) {
      case 'SoundcloudSong':
        return 'Soundcloud';
      case 'Song':
        return 'S3';
      default:
        return input;
    }
  };
}
