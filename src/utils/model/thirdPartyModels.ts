/**
 * Third-party model configuration (KIMI, GLM, MINIMAX, etc.)
 * These models use Anthropic-compatible API with custom baseURL and authToken.
 */

import { isDebugToStdErr, logForDebugging } from '../debug.js'

export const THIRD_PARTY_MODELS = ['KIMI', 'GLM', 'MINIMAX'] as const
export type ThirdPartyModel = (typeof THIRD_PARTY_MODELS)[number]

/**
 * Model name patterns for each third-party provider
 * Used to detect model names that don't contain the provider name
 */
const THIRD_PARTY_MODEL_PATTERNS: Record<ThirdPartyModel, RegExp[]> = {
  KIMI: [/moonshot/i, /kimi/i],
  GLM: [/glm/i],
  MINIMAX: [/abab/i, /minimax/i],
}

export interface ThirdPartyModelConfig {
  model: ThirdPartyModel
  baseURL: string
  authToken: string
  actualModelName: string // The actual model name to send to API
}

/**
 * Check if a model name belongs to a third-party provider
 */
export function isThirdPartyModel(model: string): boolean {
  return getThirdPartyModelTier(model) !== null
}

/**
 * Check if a model name is an alias (short form like 'kimi', 'glm', 'minimax')
 */
export function isThirdPartyModelAlias(model: string): boolean {
  const lower = model.toLowerCase()
  return THIRD_PARTY_MODELS.some(name => lower === name.toLowerCase())
}

/**
 * Get the tier name for a third-party model
 * Supports aliases, model name patterns, and substring matching
 */
export function getThirdPartyModelTier(model: string): ThirdPartyModel | null {
  const lower = model.toLowerCase()

  // Check for exact alias match first (kimi, glm, minimax)
  for (const name of THIRD_PARTY_MODELS) {
    if (lower === name.toLowerCase()) {
      return name
    }
  }

  // Check for known model name patterns (moonshot, glm-4, abab, etc.)
  for (const [name, patterns] of Object.entries(THIRD_PARTY_MODEL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(model)) {
        return name as ThirdPartyModel
      }
    }
  }

  return null
}

/**
 * Get the actual model name to send to the API
 * If the input is an alias (e.g., 'kimi'), returns the default model from env
 * If the input is already a full model name, returns it as-is
 */
export function getActualModelName(model: string): string {
  const tier = getThirdPartyModelTier(model)
  if (!tier) return model

  // If it's an alias, get the default model from environment
  if (isThirdPartyModelAlias(model)) {
    const defaultModel = process.env[`ANTHROPIC_DEFAULT_${tier}_MODEL`]
    if (defaultModel) return defaultModel

    // Fallback to a reasonable default based on provider
    switch (tier) {
      case 'KIMI':
        return 'moonshot-v1-8k'
      case 'GLM':
        return 'glm-4'
      case 'MINIMAX':
        return 'abab6.5-chat'
      default:
        return model
    }
  }

  // Already a full model name
  return model
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

  const actualModelName = getActualModelName(model)
  return { model: tier, baseURL, authToken, actualModelName }
}
