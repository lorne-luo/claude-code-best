import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import {
  THIRD_PARTY_MODELS,
  isThirdPartyModel,
  getThirdPartyModelTier,
  getThirdPartyModelConfig,
} from '../src/utils/model/thirdPartyModels.js'

describe('thirdPartyModels', () => {
  describe('THIRD_PARTY_MODELS constant', () => {
    it('contains KIMI, GLM, MINIMAX', () => {
      expect(THIRD_PARTY_MODELS).toEqual(['KIMI', 'GLM', 'MINIMAX'])
    })
  })

  describe('isThirdPartyModel', () => {
    it('returns true for model containing tier name', () => {
      expect(isThirdPartyModel('kimi-v1')).toBe(true)
      expect(isThirdPartyModel('KIMI')).toBe(true)
      expect(isThirdPartyModel('my-kimi-model')).toBe(true)
    })

    it('returns false for model without tier name', () => {
      expect(isThirdPartyModel('moonshot-v1-8k')).toBe(false)
      expect(isThirdPartyModel('opus')).toBe(false)
      expect(isThirdPartyModel('sonnet')).toBe(false)
      expect(isThirdPartyModel('haiku')).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isThirdPartyModel('')).toBe(false)
    })
  })

  describe('getThirdPartyModelTier', () => {
    it('returns correct tier for known models', () => {
      expect(getThirdPartyModelTier('kimi-v1')).toBe('KIMI')
      expect(getThirdPartyModelTier('KIMI')).toBe('KIMI')
      expect(getThirdPartyModelTier('glm-4')).toBe('GLM')
      expect(getThirdPartyModelTier('GLM-pro')).toBe('GLM')
      expect(getThirdPartyModelTier('minimax-text')).toBe('MINIMAX')
    })

    it('returns null for non-third-party models', () => {
      expect(getThirdPartyModelTier('opus')).toBe(null)
      expect(getThirdPartyModelTier('sonnet')).toBe(null)
      expect(getThirdPartyModelTier('')).toBe(null)
    })
  })

  describe('getThirdPartyModelConfig', () => {
    const originalEnv = process.env

    beforeEach(() => {
      // Clear any existing third-party env vars
      delete process.env.KIMI_BASE_URL
      delete process.env.KIMI_AUTH_TOKEN
      delete process.env.GLM_BASE_URL
      delete process.env.GLM_AUTH_TOKEN
      delete process.env.MINIMAX_BASE_URL
      delete process.env.MINIMAX_AUTH_TOKEN
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('returns config when all vars set for KIMI', () => {
      process.env.KIMI_BASE_URL = 'https://api.moonshot.cn'
      process.env.KIMI_AUTH_TOKEN = 'test-kimi-token'

      const config = getThirdPartyModelConfig('kimi-v1')
      expect(config).toEqual({
        model: 'KIMI',
        baseURL: 'https://api.moonshot.cn',
        authToken: 'test-kimi-token',
      })
    })

    it('returns config when all vars set for GLM', () => {
      process.env.GLM_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'
      process.env.GLM_AUTH_TOKEN = 'test-glm-token'

      const config = getThirdPartyModelConfig('glm-4')
      expect(config).toEqual({
        model: 'GLM',
        baseURL: 'https://open.bigmodel.cn/api/paas/v4',
        authToken: 'test-glm-token',
      })
    })

    it('returns config when all vars set for MINIMAX', () => {
      process.env.MINIMAX_BASE_URL = 'https://api.minimax.chat/v1'
      process.env.MINIMAX_AUTH_TOKEN = 'test-minimax-token'

      const config = getThirdPartyModelConfig('minimax-pro')
      expect(config).toEqual({
        model: 'MINIMAX',
        baseURL: 'https://api.minimax.chat/v1',
        authToken: 'test-minimax-token',
      })
    })

    it('returns null when BASE_URL is missing', () => {
      process.env.KIMI_AUTH_TOKEN = 'test-token'
      // KIMI_BASE_URL not set

      const config = getThirdPartyModelConfig('kimi-v1')
      expect(config).toBe(null)
    })

    it('returns null when AUTH_TOKEN is missing', () => {
      process.env.KIMI_BASE_URL = 'https://api.moonshot.cn'
      // KIMI_AUTH_TOKEN not set

      const config = getThirdPartyModelConfig('kimi-v1')
      expect(config).toBe(null)
    })

    it('returns null when both are missing', () => {
      const config = getThirdPartyModelConfig('kimi-v1')
      expect(config).toBe(null)
    })

    it('returns null for non-third-party model', () => {
      process.env.KIMI_BASE_URL = 'https://api.moonshot.cn'
      process.env.KIMI_AUTH_TOKEN = 'test-token'

      const config = getThirdPartyModelConfig('opus')
      expect(config).toBe(null)
    })

    it('handles empty string model', () => {
      const config = getThirdPartyModelConfig('')
      expect(config).toBe(null)
    })
  })
})
