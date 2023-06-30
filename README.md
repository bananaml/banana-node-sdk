# Banana Node/TypeScript SDK

### Getting Started

Install via npm
`npm install @banana-dev/banana-dev`

Get your API Key
- [Sign in / log in here](https://app.banana.dev)

Run:
```javascript
import { Client } from "@banana-dev/banana-dev"

const my_model = new Client(
    "YOUR_API_KEY", // Found in dashboard
    "YOUR_MODEL_KEY", // Found in model view in dashboard
    "https://YOUR_URL.run.banana.dev", // Found in model view in dashboard
    true
)

// Specify the model's input JSON
const inputs = {
    prompt: "I like [MASK].",
}

// Call your model's inference endpoint on Banana 
const {json, meta } = await my_model.call("/", inputs)
console.log(json)
```

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