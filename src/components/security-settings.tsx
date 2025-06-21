'use client'

import { useState } from 'react'
import { Shield, Lock, Timer, Eye, EyeOff, Settings, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SecurityManager, SecureEmailConfig } from '@/lib/security/security-manager'
import { SelfDestructManager } from '@/lib/security/self-destruct'

interface SecuritySettingsProps {
  config: SecureEmailConfig
  onChange: (config: SecureEmailConfig) => void
  onPresetSelect: (preset: 'maximum' | 'high' | 'medium') => void
}

export function SecuritySettings({ config, onChange, onPresetSelect }: SecuritySettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const updateConfig = (updates: Partial<SecureEmailConfig>) => {
    onChange({ ...config, ...updates })
  }

  const updateEncryption = (updates: Partial<SecureEmailConfig['encryption']>) => {
    updateConfig({ encryption: { ...config.encryption, ...updates } })
  }

  const updateSelfDestruct = (updates: Partial<SecureEmailConfig['selfDestruct']>) => {
    updateConfig({ selfDestruct: { ...config.selfDestruct, ...updates } })
  }

  const updateBlockchainSigning = (updates: Partial<SecureEmailConfig['blockchainSigning']>) => {
    updateConfig({ blockchainSigning: { ...config.blockchainSigning, ...updates } })
  }

  const updateMetadataStripping = (updates: Partial<SecureEmailConfig['metadataStripping']>) => {
    updateConfig({ metadataStripping: { ...config.metadataStripping, ...updates } })
  }

  const updateZeroKnowledge = (updates: Partial<SecureEmailConfig['zeroKnowledge']>) => {
    updateConfig({ zeroKnowledge: { ...config.zeroKnowledge, ...updates } })
  }

  const getSecurityLevel = () => {
    let score = 0
    if (config.encryption.enabled) score += 30
    if (config.blockchainSigning.enabled) score += 25
    if (config.selfDestruct.enabled) score += 20
    if (config.metadataStripping.stripIPAddresses) score += 15
    if (config.zeroKnowledge.enabled) score += 10

    if (score >= 90) return { level: 'Maximum', color: 'green', icon: '🔒' }
    if (score >= 70) return { level: 'High', color: 'blue', icon: '🛡️' }
    if (score >= 50) return { level: 'Medium', color: 'yellow', icon: '⚠️' }
    return { level: 'Basic', color: 'red', icon: '🔓' }
  }

  const securityLevel = getSecurityLevel()
  const presets = SelfDestructManager.getPresetConfigs()

  return (
    <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-blue-400" />
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                Security Settings
                <Badge variant={securityLevel.color as any} className="text-xs">
                  {securityLevel.icon} {securityLevel.level}
                </Badge>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Configure encryption and privacy settings
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-300 hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-6 space-y-6">
          {/* Security Presets */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Security Presets</h4>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPresetSelect('maximum')}
                className="border-green-500/20 text-green-400 hover:bg-green-500/10"
              >
                🔒 Maximum
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPresetSelect('high')}
                className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
              >
                🛡️ High
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onPresetSelect('medium')}
                className="border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10"
              >
                ⚠️ Medium
              </Button>
            </div>
          </div>

          {/* End-to-End Encryption */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">End-to-End Encryption</span>
              </div>
              <input
                type="checkbox"
                checked={config.encryption.enabled}
                onChange={(e) => updateEncryption({ enabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            {config.encryption.enabled && (
              <div className="ml-6 space-y-2">
                <select
                  value={config.encryption.algorithm}
                  onChange={(e) => updateEncryption({ algorithm: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="AES-256" className="bg-gray-800">AES-256 (Fast)</option>
                  <option value="PGP" className="bg-gray-800">PGP (Compatible)</option>
                  <option value="HYBRID" className="bg-gray-800">Hybrid (Safe)</option>
                </select>
              </div>
            )}
          </div>

          {/* Self-Destructing Emails */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-white">Self-Destructing Messages</span>
              </div>
              <input
                type="checkbox"
                checked={config.selfDestruct.enabled}
                onChange={(e) => updateSelfDestruct({ enabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            {config.selfDestruct.enabled && (
              <div className="ml-6 space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Expires after:</label>
                  <select
                    value={config.selfDestruct.expiresAfter?.toString() || '0'}
                    onChange={(e) => updateSelfDestruct({
                      expiresAfter: e.target.value === '0' ? undefined : parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="0" className="bg-gray-800">Never</option>
                    <option value={String(60 * 60 * 1000)} className="bg-gray-800">1 Hour</option>
                    <option value={String(24 * 60 * 60 * 1000)} className="bg-gray-800">24 Hours</option>
                    <option value={String(7 * 24 * 60 * 60 * 1000)} className="bg-gray-800">7 Days</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Delete after reading</span>
                  <input
                    type="checkbox"
                    checked={config.selfDestruct.deleteAfterRead || false}
                    onChange={(e) => updateSelfDestruct({ deleteAfterRead: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Blockchain Signing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">Blockchain Signing</span>
              </div>
              <input
                type="checkbox"
                checked={config.blockchainSigning.enabled}
                onChange={(e) => updateBlockchainSigning({ enabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            {config.blockchainSigning.enabled && (
              <div className="ml-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">On-chain verification</span>
                  <input
                    type="checkbox"
                    checked={config.blockchainSigning.requireOnChainProof}
                    onChange={(e) => updateBlockchainSigning({ requireOnChainProof: e.target.checked })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Advanced Settings */}
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-gray-400 hover:text-white p-0"
            >
              {showAdvanced ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              Advanced Settings
            </Button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 border-t border-white/10 pt-4">
              {/* Metadata Stripping */}
              <div>
                <h5 className="text-sm font-medium text-white mb-3">Metadata Cleaning</h5>
                <div className="space-y-2 ml-4">
                  {[
                    { key: 'stripTimestamps', label: 'Timestamps' },
                    { key: 'stripIPAddresses', label: 'IP Addresses' },
                    { key: 'stripUserAgent', label: 'User Agent' },
                    { key: 'stripDeviceInfo', label: 'Device information' },
                    { key: 'stripLocationData', label: 'Location data' },
                    { key: 'stripFileMetadata', label: 'File metadata' },
                    { key: 'anonymizeHeaders', label: 'Anonymize headers' },
                    { key: 'useRandomDelay', label: 'Random delay' }
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{label}</span>
                      <input
                        type="checkbox"
                        checked={config.metadataStripping[key as keyof typeof config.metadataStripping] as boolean}
                        onChange={(e) => updateMetadataStripping({ [key]: e.target.checked })}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Zero-Knowledge Storage */}
              <div>
                <h5 className="text-sm font-medium text-white mb-3">Zero-Knowledge Storage</h5>
                <div className="space-y-2 ml-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Enable</span>
                    <input
                      type="checkbox"
                      checked={config.zeroKnowledge.enabled}
                      onChange={(e) => updateZeroKnowledge({ enabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  {config.zeroKnowledge.enabled && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Server-side encryption</span>
                      <input
                        type="checkbox"
                        checked={config.zeroKnowledge.serverSideEncryption}
                        onChange={(e) => updateZeroKnowledge({ serverSideEncryption: e.target.checked })}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Warnings */}
          {securityLevel.level === 'Basic' && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                <div>
                  <h6 className="text-sm font-medium text-red-300">Security Warning</h6>
                  <p className="text-xs text-red-200 mt-1">
                    Security level is low. Enable more options for better protection.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
