# Banana Node/TypeScript SDK

### Getting Started

Install via npm
`npm install @banana-dev/banana-dev`

Get your API Key
- [Sign in / log in here](https://app.banana.dev)

Run:
```javascript
import banana = require("@banana-dev/banana-dev")

const apiKey = "demo" // "YOUR_API_KEY"
const modelKey = "carrot" // "YOUR_MODEL_KEY"

const modelInputs = {
    // a json specific to your model. For example:
    "imageURL":  "https://demo-images-banana.s3.us-west-1.amazonaws.com/image2.jpg"
}

let run = async () => {
    var out = await banana.run(apiKey, modelKey, modelInputs)
    console.log(out)
}
run()

```

Return type:
```javascript
{
    "id": "12345678-1234-1234-1234-123456789012", 
    "message": "success", 
    "created": 1649712752, 
    "apiVersion": "26 Nov 2021", 
    "modelOutputs": [
        {
            // a json specific to your model. In this example, the caption of the image
            "caption": "a baseball player throwing a ball"
        }
    ]
}
```

Parse the server output:
```javascript
modelOut = out["modelOutputs"][0]
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