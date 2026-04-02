/**
 * Third-party model configuration (KIMI, GLM, MINIMAX, etc.)
 * These models use Anthropic-compatible API with custom baseURL and authToken.
 */

import { isDebugToStdErr, logForDebugging } from '../debug.js'

export const THIRD_PARTY_MODELS = ['KIMI', 'GLM', 'MINIMAX'] as const
export type ThirdPartyModel = (typeof THIRD_PARTY_MODELS)[number]

export interface ThirdPartyModelConfig {
  model: ThirdPartyModel
  baseURL: string
  authToken: string
}

/**
 * Check if a model name belongs to a third-party provider
 * Uses substring matching: model.toUpperCase().includes('KIMI')
 */
export function isThirdPartyModel(model: string): boolean {
  const upper = model.toUpperCase()
  return THIRD_PARTY_MODELS.some(name => upper.includes(name))
}

/**
 * Get the tier name for a third-party model
 */
export function getThirdPartyModelTier(model: string): ThirdPartyModel | null {
  const upper = model.toUpperCase()
  for (const name of THIRD_PARTY_MODELS) {
    if (upper.includes(name)) return name
  }
  return null
}

/**
 * Get authentication config for a third-party model
 * Returns null if not fully configured (both BASE_URL and AUTH_TOKEN required)
 */
export function getThirdPartyModelConfig(
  model: string,
): ThirdPartyModelConfig | null {
  const tier = getThirdPartyModelTier(model)
  if (!tier) return null

  const baseURL = process.env[`${tier}_BASE_URL`]
  const authToken = process.env[`${tier}_AUTH_TOKEN`]

  // Both must be set for per-model auth
  if (!baseURL || !authToken) {
    if (isDebugToStdErr()) {
      logForDebugging(
        `[API:auth] Third-party model ${model} matched tier ${tier} but config incomplete (BASE_URL: ${!!baseURL}, AUTH_TOKEN: ${!!authToken}), falling back to default auth`,
      )
    }
    return null
  }

  return { model: tier, baseURL, authToken }
}
