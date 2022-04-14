import genericsUtils = require("./genericsUtils")

export async function run(apiKey: string, modelKey: string, modelInputs: object = {}, strategy: object = {}): Promise<object>{
  const out = await genericsUtils.runMain(
    apiKey = apiKey, 
    modelKey = modelKey,
    modelInputs=modelInputs,
    strategy = strategy)
  return out
}

export async function start(apiKey: string, modelKey: string, modelInputs: object = {}, strategy: object = {}): Promise<string>{
  const callID = await genericsUtils.startMain(
    apiKey = apiKey, 
    modelKey = modelKey,
    modelInputs=modelInputs,
    strategy = strategy)
  return callID
}

export async function feedback(apiKey: string, callID: string, feedback: object = {}): Promise<object>{
  const jsonOut = await genericsUtils.feedback(apiKey, callID, feedback)
  return jsonOut
}

export async function check(apiKey: string, callID: string): Promise<object>{
  const jsonOut = await genericsUtils.checkMain(apiKey, callID)
  return jsonOut
}