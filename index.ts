import {checkMain, runMain, startMain, BananaError} from "./genericsUtils"

type Object = { [key: string]: any }

export async function run(apiKey: string, modelKey: string, modelInputs: object = {}): Promise<Object>{
  const out = await runMain(
    apiKey = apiKey, 
    modelKey = modelKey,
    modelInputs=modelInputs)
  return out
}

export async function start(apiKey: string, modelKey: string, modelInputs: object = {}): Promise<string>{
  const callID = await startMain(
    apiKey = apiKey, 
    modelKey = modelKey,
    modelInputs=modelInputs)
  return callID
}

export async function check(apiKey: string, callID: string): Promise<Object>{
  const jsonOut = await checkMain(apiKey, callID)
  return jsonOut
}

export { BananaError }