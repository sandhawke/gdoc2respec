In some cases, for a simple spec, a Google Doc might suffice.

But you still want to publish it as proper HTML, using respec.

So, here we are.

You need to provide the respec-config stuff, in a JS file that imports
and runs gdoc2respec.   Something like:

```js
const convert = require('gdoc2respec')

const config = {
  gdocID: '1WWYQ33Y9ENcueiFnrb3hJzD2rxKCRw9ok8T3PrDLOB8',
  specStatus: 'WD',
  editors: ...
}

// I don't really want these in the gdoc:

config.abstractHTML = `...`

config.sotdHTML = `...`

convert(config).then(x => process.stdout.write(x))

```

## What your doc should look like

* Use proper headings, H1, H2, etc, via ctl-alt-1,2, etc or the menu
* I suggest using the 'Table of Contents' add-on, set to X.Y.Z. format, so it looks the same as respec will produce
* Only simple, ordinary, original-HTML stuff will work, like bold, italic, ordered lists, and bullet lists.

