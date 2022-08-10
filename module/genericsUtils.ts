import axios, {AxiosError} from 'axios'
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


export async function runMain(apiKey: string, modelKey: string, modelInputs: object = {}): Promise<any>{
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

export async function startMain(apiKey: string, modelKey: string, modelInputs: object = {}): Promise<string>{
    const jsonOut = await startAPI(apiKey, modelKey, modelInputs, true)
    return jsonOut["callID"]
}


export async function checkMain(apiKey: string, callID: string): Promise<object>{
    const jsonOut = await checkAPI(apiKey, callID)
    return jsonOut
}

const startAPI = async (apiKey: string, modelKey: string, modelInputs: object, startOnly: boolean = false): Promise<any> => {
    const urlStart = endpoint.concat("start/v4/")
    const payload = {
        "id": uuidv4(),
        "created": Math.floor(new Date().getTime() / 1000),
        "apiKey" : apiKey,
        "modelKey" : modelKey,
        "modelInputs" : modelInputs,
        "startOnly": startOnly,
    }
    
    const response = await axios.post(urlStart, payload).catch(err => {
        if (err.response) {
            throw `server error: status code ${err.response.status}`
        } else if (err.request) {
            throw 'server error: endpoint busy or not available.'
        } else {
            console.log(err)
            throw "Misc axios error. Please email erik@banana.dev with above error"
        }
    })
    const jsonOut = response.data
    
    if (jsonOut.message.toLowerCase().includes("error")){
        throw jsonOut.message
    }

    return jsonOut
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
    
    const response = await axios.post(urlCheck, payload).catch(err => {
        if (err.response) {
            throw `server error: status code ${err.response.status}`
        } else if (err.request) {
            throw 'server error: endpoint busy or not available.'
        } else {
            console.log(err)
            throw "Misc axios error. Please email erik@banana.dev with above error"
        }
    })
    const jsonOut = response.data
    
    if (jsonOut.message.toLowerCase().includes("error")){
        throw jsonOut.message
    }
    return jsonOut
}
