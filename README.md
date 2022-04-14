# nodejs_client
The Nodejs client for Booste

# Building
Run the typescript compiler in watch mode. If it fails using the npx command just run without npx
cd module
npx tsc -w

This monitors all the .ts files in the module dir. If any changes, it will recompile the .ts files into .js and store in /dist

# Testing
## we use the npm link command so our tests import @banana-dev/banana-dev but use the local module repo
```bash
mkdir tests
cd tests
npx tsc --init
cd ../module
npm link
cd ../tests
npm link @banana-dev/banana-dev
npx tsc -w
```

Both the main package code in module and the testing code are compiled with typescript. Compile the tests folder and watch updates live
npx tsc -w 

in test dir you can use JS or import the js sdk from test script
modify index.ts to contain the following:

```javascript
import  banana = require("@banana-dev/banana-dev")
const  apiKey = {API KEY}
const  modelKey = {MODEL KEY}
const  modelInputs = {
    "a":  1,
    "b":  10,
}
let  run = async () => {
    var  out = await  banana.run(apiKey, modelKey, modelInputs)
    console.log(out)
}
run()
```
