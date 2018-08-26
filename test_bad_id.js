const test = require('tape')
const convert = require('gdoc2respec')

const config = {
  gdocID: 'https://github.com/sandhawke/gdoc2respec'
}

test('bad id', t => {
  t.plan(1)
  convert(config)
    .catch(e => {
      t.equal(e.message, 'Missing or bad gdocID')
      t.end()
    })
})
