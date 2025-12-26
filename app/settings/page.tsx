'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { Settings as SettingsIcon, Sparkles, Cloud, Zap, Calendar, Users, Globe } from 'lucide-react'
import GoogleAuth from '@/components/GoogleAuth'
import GoogleCalendarAuth from '@/components/GoogleCalendarAuth'
import AIConfig from '@/components/AIConfig'
import SchoolDudeIntegration from '@/components/SchoolDudeIntegration'
import UsersManagement from '@/components/UsersManagement'
import Toggle from '@/components/ui/Toggle'
import { Button } from '@/components/ui/Button'

type TabType = 'users' | 'integrations' | 'public-site'

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('integrations')
  const [publicSiteSettings, setPublicSiteSettings] = useState<any>(null)
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [calendarEnabled, setCalendarEnabled] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)

  useEffect(() => {
    // Check authentication and load user
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
            // Only show Users tab if user is admin
            if (data.user.role !== 'admin' && activeTab === 'users') {
              setActiveTab('integrations')
            }
          } else {
            router.push('/login?return=/settings')
          }
        } else {
          router.push('/login?return=/settings')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.push('/login?return=/settings')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Load preferences from localStorage
    const googlePref = localStorage.getItem('integration_google_enabled')
    const calendarPref = localStorage.getItem('integration_calendar_enabled')
    const aiPref = localStorage.getItem('integration_ai_enabled')
    
    setGoogleEnabled(googlePref === 'true')
    setCalendarEnabled(calendarPref === 'true')
    setAiEnabled(aiPref === 'true')

    // Load public site settings
    if (activeTab === 'public-site') {
      loadPublicSiteSettings()
    }
  }, [router, activeTab])

  const loadPublicSiteSettings = async () => {
    setLoadingSettings(true)
    try {
      const response = await fetch('/api/public-site')
      if (response.ok) {
        const data = await response.json()
        setPublicSiteSettings(data)
      }
    } catch (error) {
      console.error('Failed to load public site settings:', error)
    } finally {
      setLoadingSettings(false)
    }
  }

  const savePublicSiteSettings = async (updates: any) => {
    try {
      const response = await fetch('/api/public-site', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...publicSiteSettings, ...updates }),
      })
      if (response.ok) {
        const data = await response.json()
        setPublicSiteSettings(data)
        alert('Public site settings saved successfully')
      } else {
        alert('Failed to save settings')
      }
    } catch (error) {
      console.error('Failed to save public site settings:', error)
      alert('Failed to save settings')
    }
  }

  const handleGoogleToggle = (enabled: boolean) => {
    setGoogleEnabled(enabled)
    localStorage.setItem('integration_google_enabled', String(enabled))
  }

  const handleCalendarToggle = (enabled: boolean) => {
    setCalendarEnabled(enabled)
    localStorage.setItem('integration_calendar_enabled', String(enabled))
  }

  const handleAIToggle = (enabled: boolean) => {
    setAiEnabled(enabled)
    localStorage.setItem('integration_ai_enabled', String(enabled))
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <div className="text-center">
            <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-500">Loading...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isAdmin = user.role === 'admin'

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Settings</h1>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-gray-200">
            {isAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Users
                </div>
              </button>
            )}
            <button
              onClick={() => setActiveTab('integrations')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'integrations'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Integrations
              </div>
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => {
                    setActiveTab('public-site')
                    loadPublicSiteSettings()
                  }}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    activeTab === 'public-site'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Public Site
                  </div>
                </button>
                <Link
                  href="/settings/public-site-editor"
                  className="px-4 py-2 font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Theme Editor
                  </div>
                </Link>
              </>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'users' && isAdmin && (
            <div className="space-y-6">
              <UsersManagement />
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
            {/* Google Drive Integration */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Cloud className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Google Drive Integration</h2>
                    <p className="text-sm text-gray-500">Sync Drive files and folders</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Toggle
                  enabled={googleEnabled}
                  onChange={handleGoogleToggle}
                  label="Enable Google Drive"
                  description="Connect to Google Drive for file syncing and document management"
                />
                
                {googleEnabled && (
                  <div className="pt-4 border-t border-gray-200">
                    <GoogleAuth />
                  </div>
                )}
              </div>
            </div>

            {/* Google Calendar Integration */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Google Calendar Integration</h2>
                    <p className="text-sm text-gray-500">Sync calendar events and import from School Dude</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Toggle
                  enabled={calendarEnabled}
                  onChange={handleCalendarToggle}
                  label="Enable Google Calendar"
                  description="Connect to Google Calendar to sync events and import from School Dude"
                />
                
                {calendarEnabled && (
                  <div className="pt-4 border-t border-gray-200">
                    <GoogleCalendarAuth />
                  </div>
                )}
              </div>
            </div>

            {/* AI Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">AI Configuration</h2>
                    <p className="text-sm text-gray-500">AI-powered content generation</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Toggle
                  enabled={aiEnabled}
                  onChange={handleAIToggle}
                  label="Enable AI Features"
                  description="Use OpenAI to generate and assist with writing page content"
                />
                
                {aiEnabled && (
                  <div className="pt-4 border-t border-gray-200">
                    <AIConfig />
                  </div>
                )}
              </div>
            </div>

            {/* School Dude Integration */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">School Dude Integration</h2>
                    <p className="text-sm text-gray-500">Sync tech events from School Dude calendar</p>
                  </div>
                </div>
              </div>
              <SchoolDudeIntegration />
            </div>

            {/* Future Integrations Placeholder */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 opacity-60">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Zap className="w-6 h-6 text-gray-400" />
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">More Integrations</h2>
                    <p className="text-sm text-gray-500">Coming soon...</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Additional integrations will be available here in future updates.
              </p>
            </div>

            {/* About */}
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-600">
                  Linfield Tech Knowledge Base v1.0.0
                </p>
                <p className="text-gray-600 mt-1">
                  Linfield Christian School - Temecula, CA
                </p>
              </div>
            </div>
            </div>
          )}

          {activeTab === 'public-site' && isAdmin && (
            <div className="space-y-6">
              {loadingSettings ? (
                <div className="text-center py-12">
                  <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                  <p className="text-gray-500">Loading settings...</p>
                </div>
              ) : publicSiteSettings ? (
                <PublicSiteSettingsEditor
                  settings={publicSiteSettings}
                  onSave={savePublicSiteSettings}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Failed to load settings</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function PublicSiteSettingsEditor({ settings, onSave }: { settings: any; onSave: (updates: any) => void }) {
  const [siteTitle, setSiteTitle] = useState(settings.siteTitle || '')
  const [siteDescription, setSiteDescription] = useState(settings.siteDescription || '')
  const [enabled, setEnabled] = useState(settings.enabled || false)
  const [searchEnabled, setSearchEnabled] = useState(settings.searchEnabled !== false)
  const [homepagePageId, setHomepagePageId] = useState(settings.homepagePageId || '')
  const [pages, setPages] = useState<Array<{ id: string; title: string }>>([])
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    try {
      return settings.navigationJson ? JSON.parse(settings.navigationJson) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    // Load pages and categories
    Promise.all([
      fetch('/api/pages').then(r => r.json()),
      fetch('/api/categories').then(r => r.json()),
    ]).then(([pagesData, categoriesData]) => {
      if (Array.isArray(pagesData)) {
        setPages(pagesData.filter((p: any) => p.isPublished))
      }
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData)
      }
    })
  }, [])

  const handleSave = () => {
    onSave({
      siteTitle,
      siteDescription,
      enabled,
      searchEnabled,
      homepagePageId: homepagePageId || null,
      navigationJson: JSON.stringify(selectedCategories),
    })
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Public Site Configuration</h2>
            <p className="text-sm text-gray-500">Configure your public-facing help center</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Toggle
          enabled={enabled}
          onChange={setEnabled}
          label="Enable Public Site"
          description="Make the help center publicly accessible at /help"
        />

        {enabled && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Title
              </label>
              <input
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                placeholder="Help Center"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Description
              </label>
              <textarea
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-gray-900"
                placeholder="Find answers to common questions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Homepage
              </label>
              <select
                value={homepagePageId}
                onChange={(e) => setHomepagePageId(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              >
                <option value="">Default (Category List)</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Select a page to use as the homepage, or use the default category list
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Navigation Categories
              </label>
              <p className="text-sm text-gray-500 mb-3">
                Select which categories appear in the main navigation
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <Toggle
              enabled={searchEnabled}
              onChange={setSearchEnabled}
              label="Enable Search"
              description="Allow visitors to search published pages"
            />

            <div className="pt-4 border-t border-gray-200 space-y-3">
              <Button onClick={handleSave} variant="primary" className="w-full">
                Save Settings
              </Button>
              <Link href="/settings/public-site-editor">
                <Button variant="secondary" className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Open Theme Editor
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
