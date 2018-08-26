In some cases, for a simple spec, a Google Doc might suffice.

But you still want to publish it as proper HTML, using respec.

So, here we are.

You need to provide the respec-config stuff, in a JS file that imports
and runs gdoc2respec.   Something like:

```js
const convert = require('gdoc2respec')

const config = {
  gdocID: '1WWYQ33Y9ENcueiFnrb3hJzD2rxKCRw9ok8T3PrDLOB8',
  title: 'My Doc Id',
  specStatus: 'WD',
  editors: ...
}

config.abstractHTML = `...`

config.sotdHTML = `...`

convert(config).then(x => process.stdout.write(x))

```