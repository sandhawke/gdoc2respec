const test = require('tape')
const convert = require('gdoc2respec')
const fs = require('fs')

const config = {
  gdocID: '1DINlpvibQjESbnNfmlsL0Mw7omPSBuo5GFYqU5VJo6E',
  title: 'some-title',
  noRecTrack: true,
  edDraftURI: 'https://example.org/ed',
  specStatus: 'ED',
  editors: [{
    name: 'Sandro Hawke',
    url: 'http://hawke.org/sandro'
  }],
  github: 'https://github.com/w3c/example',
  shortName: 'not-published-as-TR',
  abstractHTML: 'Abstract TBD',
  sotdHTML: 'TBD'
}

test('sample 1', t => {
  const expected = fs.readFileSync('test_1_output.html', 'utf8')
  convert(config)
    .then(out => {
      t.equal(out, expected)
      t.end()
    })
})
