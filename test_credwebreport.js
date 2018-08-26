const test = require('tape')
const convert = require('gdoc2respec')
const fs = require('fs')

const config = {
  gdocID: '1WWYQ33Y9ENcueiFnrb3hJzD2rxKCRw9ok8T3PrDLOB8',
  title: 'Technological Approaches to Improving Credibility Assessment on the Web',
  format: 'markdown',
  noRecTrack: true,
  edDraftURI: 'https://credweb.org/report/snapshot',
  specStatus: 'ED',
  editors: [{
    name: 'Sandro Hawke',
    url: 'http://hawke.org/sandro'
  }],
  github: 'https://github.com/w3c/credweb',
  shortName: 'not-published-as-TR',
  abstractHTML: 'Abstract TBD',
  sotdHTML: 'TBD'
}

test('sample 1', t => {
  convert(config)
    .then(out => {
      fs.writeFileSync('credwebreport.html', out, 'utf8')
      console.warn('## MANUALLY CHECK: credwebreport.html')
      t.pass()
      t.end()
    })
})
