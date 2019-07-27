/* global describe, it */

const expect = require('chai').expect;

const extract = require('../../../server/fingerprinter/soundcloud/extract_title_and_artist');

const CASE_1 = [
  {
    trackTitle: 'Warpaint - Feeling Alright (Daughter Remix)',
    userName: 'Warpaint',
    expectedArtistName: 'Warpaint',
    expectedTitle: 'Feeling Alright (Daughter Remix)'
  },

  {
    trackTitle: '  The Range    -   Florida    ',
    userName: 'the range',
    expectedArtistName: 'The Range',
    expectedTitle: 'Florida'
  },

  {
    trackTitle: 'SomeUserName - Title - with - dashes',
    userName: 'someUserName',
    expectedArtistName: 'SomeUserName',
    expectedTitle: 'Title - with - dashes'
  },

  {
    trackTitle: 'someUserName - with - dashes - Title - with - dashes',
    userName: 'someUserName - with - dashes',
    expectedArtistName: 'someUserName - with - dashes',
    expectedTitle: 'Title - with - dashes'
  },

  {
    trackTitle: 'College feat. Nola Wren - Save the Day',
    userName: 'College',
    expectedArtistName: 'College',
    expectedTitle: 'Save the Day'
  },

  {
    trackTitle: 'KlangKuenstler ft. Hany - Hand In Hand (Vocal Mix)',
    userName: 'klangkuenstler',
    expectedArtistName: 'KlangKuenstler',
    expectedTitle: 'Hand In Hand (Vocal Mix)'
  }
];

const CASE_2 = [
  {
    trackTitle: 'Warpaint - Feeling Alright (Daughter Remix)',
    userName: 'not in the title',
    expectedArtistName: 'Warpaint',
    expectedTitle: 'Feeling Alright (Daughter Remix)'
  },

  {
    trackTitle: 'Artist - with dashes - title - with dashes',
    userName: 'not in the title',
    expectedArtistName: 'Artist',
    expectedTitle: 'with dashes - title - with dashes'
  }
];

const CASE_3 = [
  {
    trackTitle: 'sample title',
    userName: 'Username',
    expectedArtistName: 'Username',
    expectedTitle: 'sample title'
  }
];

const generateTests = (caption, testData) => {
  it(caption, () => {
    const result = extract(testData.trackTitle, testData.userName);
    expect(result.artistName).equal(testData.expectedArtistName);
    expect(result.title).equal(testData.expectedTitle);
  });
};

describe('Title and artist extractor', () => {
  describe('when artistName presents in the title', () => {
    CASE_1.forEach((testData, i) => {
      generateTests(`CASE_1: test case ${i + 1}`, testData);
    });
  });

  describe('when artistName does NOT present in the title', () => {
    CASE_2.forEach((testData, i) => {
      generateTests(`CASE_2: test case ${i + 1}`, testData);
    });
  });

  describe('last attempt', () => {
    CASE_3.forEach((testData, i) => {
      generateTests(`CASE_3: test case ${i + 1}`, testData);
    });
  });
});
