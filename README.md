# Banana Node/TypeScript SDK

# Usage

For usage docs please refer to our [Banana SDK documentation](https://docs.banana.dev/banana-docs/core-concepts/sdks/node.js)

# ----------------------
# Developing on the SDK:

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
npm install
npm link
cd ../tests
npm link @banana-dev/banana-dev
npx tsc -w
```

If you're seeing any import errors make sure you've ran npm install in the module directory

Both the main package code in module and the testing code are compiled with typescript. Compile the tests folder and watch updates live
npx tsc -w 

in test dir you can use JS or import the js sdk from test script
modify index.ts to contain the code snippet above.
