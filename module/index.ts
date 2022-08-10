import genericsUtils = require("./genericsUtils")

export async function run(apiKey: string, modelKey: string, modelInputs: object = {}): Promise<object>{
  const out = await genericsUtils.runMain(
    apiKey = apiKey, 
    modelKey = modelKey,
    modelInputs=modelInputs)
  return out
}

export async function start(apiKey: string, modelKey: string, modelInputs: object = {}): Promise<string>{
  const callID = await genericsUtils.startMain(
    apiKey = apiKey, 
    modelKey = modelKey,
    modelInputs=modelInputs)
  return callID
}

export async function check(apiKey: string, callID: string): Promise<object>{
  const jsonOut = await genericsUtils.checkMain(apiKey, callID)
  return jsonOut
}