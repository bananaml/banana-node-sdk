import { fetch } from 'native-fetch'
const { v4: uuidv4 } = require('uuid')

let endpoint: string = 'https://api.banana.dev/'
if ("BANANA_URL" in process.env){
    endpoint = process.env.BANANA_URL!
    console.log("Running from", endpoint)
    if (process.env.BANANA_URL === "local"){
        // console.log("Running from local")
        endpoint = "http://localhost/"
    }
}

type Object = { [key: string]: any }

export async function runMain(apiKey: string, modelKey: string, modelInputs: Object = {}): Promise<any>{
    const startOut = await startAPI(apiKey, modelKey, modelInputs)
    if (startOut["finished"] == true){
        const res = {
            "id": startOut["id"],
            "message": startOut["message"],
            "created": startOut["created"],
            "apiVersion": startOut["apiVersion"],
            "modelOutputs": startOut["modelOutputs"]
        }
        return res
    }

    // else it's long running, so poll for result
    while (true) {
        const jsonOut = await checkAPI(apiKey, startOut["callID"])
        if (jsonOut !== undefined){
            if (jsonOut.message.toLowerCase() === "success"){
                return jsonOut
            }
        }
    }

}

export async function startMain(apiKey: string, modelKey: string, modelInputs: Object = {}): Promise<string>{
    const jsonOut = await startAPI(apiKey, modelKey, modelInputs, true)
    return jsonOut["callID"]
}


export async function checkMain(apiKey: string, callID: string): Promise<Object>{
    const jsonOut = await checkAPI(apiKey, callID)
    return jsonOut
}

const startAPI = async (apiKey: string, modelKey: string, modelInputs: Object, startOnly: boolean = false): Promise<any> => {
    const urlStart = endpoint.concat("start/v4/")
    const payload = {
        "id": uuidv4(),
        "created": Math.floor(new Date().getTime() / 1000),
        "apiKey" : apiKey,
        "modelKey" : modelKey,
        "modelInputs" : modelInputs,
        "startOnly": startOnly,
    }
    
    const response = await fetch(urlStart, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    const jsonOut = await getBananaJsonOutput(response)

    return jsonOut
}

async function getBananaJsonOutput(response: Response) {
    const text = await response.text()
    let jsonOut: any = null
    try {
        jsonOut = JSON.parse(text)
    } catch {
        throw new BananaError(`Could not parse response from server: ${text}`, )
    }
    
    if (!response.ok) {
        if (jsonOut.response) {
            throw new BananaError(`${response.status}: server error: status code ${jsonOut.response.status}`, jsonOut)
        } else if (jsonOut.request) {
            throw new BananaError( `${response.status}: server error: endpoint busy or not available.`, jsonOut)
        } else {
            console.log(jsonOut)
            throw new BananaError(`${response.status}: misc error. Please email erik@banana.dev with above error`, jsonOut)
        }
    }

    if (jsonOut.message.toLowerCase().includes("error")){
        throw new BananaError(jsonOut.message, jsonOut)
    }
    return jsonOut
}

class BananaError extends Error {
    jsonOutput: any
    constructor(message: string, jsonOutput: any = null) {
        super(message)
        this.name = "BananaError"
        this.jsonOutput = jsonOutput
    }
}

const checkAPI = async (apiKey: string, callID: string): Promise<any> => {
    const urlCheck = endpoint.concat("check/v4/")

    const payload = {
        "id": uuidv4(),
        "created": Math.floor(new Date().getTime() / 1000),
        "longPoll": true,
        "apiKey" : apiKey,
         "callID" : callID
    }
    const response = await fetch(urlCheck, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json'
        }
    })

    const jsonOut = await getBananaJsonOutput(response)
    return jsonOut
}
