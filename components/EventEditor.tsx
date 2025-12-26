'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X, Loader2, Calendar, Clock, MapPin, Repeat, Plus, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'

interface Category {
  id: string
  name: string
  color: string
}

interface Equipment {
  name: string
  description: string
  quantity?: number
  category?: string
}

function EquipmentForm({ onAdd }: { onAdd: (equipment: Equipment) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState<number | ''>(1)
  const [category, setCategory] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Equipment name is required')
      return
    }

    onAdd({
      name: name.trim(),
      description: description.trim() || '',
      quantity: quantity ? Number(quantity) : undefined,
      category: category || undefined,
    })

    // Reset form
    setName('')
    setDescription('')
    setQuantity(1)
    setCategory('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Speakers, Microphone"
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value) : '')}
            placeholder="1"
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Wireless mic for presenter"
          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full pl-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        >
          <option value="">Select category...</option>
          <option value="audio">Audio</option>
          <option value="video">Video</option>
          <option value="lighting">Lighting</option>
          <option value="cables">Cables</option>
          <option value="stands">Stands</option>
          <option value="power">Power</option>
          <option value="computer">Computer</option>
          <option value="other">Other</option>
        </select>
      </div>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Equipment
      </button>
    </form>
  )
}

export default function EventEditor({ eventId, initialData }: { eventId?: string; initialData?: any }) {
  const router = useRouter()
  // Helper function to convert date to local datetime-local format (YYYY-MM-DDTHH:mm)
  const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    
    // Get local date components
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [setupTime, setSetupTime] = useState(formatDateForInput(initialData?.setupTime))
  const [startTime, setStartTime] = useState(formatDateForInput(initialData?.startTime))
  const [endTime, setEndTime] = useState(formatDateForInput(initialData?.endTime))
  const [location, setLocation] = useState(initialData?.location || '')
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '')
  const [eventType, setEventType] = useState(initialData?.eventType || 'meeting')
  const [schoolLevel, setSchoolLevel] = useState(initialData?.schoolLevel || '')
  const [isAllDay, setIsAllDay] = useState(initialData?.isAllDay || false)
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring || false)
  const [hasSetupTime, setHasSetupTime] = useState(!!initialData?.setupTime)
  const [recurrenceType, setRecurrenceType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly')
  const [recurrenceInterval, setRecurrenceInterval] = useState(1)
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([])
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  const [recurrenceCount, setRecurrenceCount] = useState<number | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [equipment, setEquipment] = useState<Equipment[]>(
    initialData?.equipment ? (typeof initialData.equipment === 'string' ? JSON.parse(initialData.equipment) : initialData.equipment) : []
  )
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [recurringEditScope, setRecurringEditScope] = useState<'this' | 'thisAndFollowing'>('this')

  useEffect(() => {
    loadCategories()
  }, [])

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData && eventId) {
      setTitle(initialData.title || '')
      setDescription(initialData.description || '')
      setSetupTime(formatDateForInput(initialData.setupTime))
      setStartTime(formatDateForInput(initialData.startTime))
      setEndTime(formatDateForInput(initialData.endTime))
      setLocation(initialData.location || '')
      setCategoryId(initialData.categoryId || '')
      setEventType(initialData.eventType || 'meeting')
      setSchoolLevel(initialData.schoolLevel || '')
      setIsAllDay(initialData.isAllDay || false)
      setIsRecurring(initialData.isRecurring || false)
      setHasSetupTime(!!initialData.setupTime)
      
      // Parse equipment
      if (initialData.equipment) {
        try {
          const parsed = typeof initialData.equipment === 'string' 
            ? JSON.parse(initialData.equipment) 
            : initialData.equipment
          setEquipment(Array.isArray(parsed) ? parsed : [])
        } catch (e) {
          setEquipment([])
        }
      } else {
        setEquipment([])
      }

      // Parse recurrence rule if it exists
      if (initialData.recurrenceRule) {
        parseRecurrenceRuleToState(initialData.recurrenceRule)
      }
    }
  }, [initialData, eventId])

  const parseRecurrenceRuleToState = (rule: string) => {
    if (!rule) return

    // Parse FREQ
    if (rule.includes('FREQ=DAILY')) {
      setRecurrenceType('daily')
    } else if (rule.includes('FREQ=WEEKLY')) {
      setRecurrenceType('weekly')
    } else if (rule.includes('FREQ=MONTHLY')) {
      setRecurrenceType('monthly')
    } else if (rule.includes('FREQ=YEARLY')) {
      setRecurrenceType('yearly')
    }

    // Parse INTERVAL
    const intervalMatch = rule.match(/INTERVAL=(\d+)/)
    if (intervalMatch) {
      setRecurrenceInterval(parseInt(intervalMatch[1]) || 1)
    }

    // Parse BYDAY for weekly
    if (rule.includes('BYDAY=')) {
      const bydayMatch = rule.match(/BYDAY=([^;]+)/)
      if (bydayMatch) {
        const days = bydayMatch[1].split(',')
        setRecurrenceDays(days)
      }
    }

    // Parse UNTIL (end date)
    const untilMatch = rule.match(/UNTIL=([^;]+)/)
    if (untilMatch) {
      try {
        const untilStr = untilMatch[1].replace(/[-:]/g, '').replace('Z', '')
        const year = untilStr.substring(0, 4)
        const month = untilStr.substring(4, 6)
        const day = untilStr.substring(6, 8)
        const date = new Date(`${year}-${month}-${day}`)
        setRecurrenceEndDate(date.toISOString().split('T')[0])
        setRecurrenceCount(null)
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Parse COUNT
    const countMatch = rule.match(/COUNT=(\d+)/)
    if (countMatch) {
      setRecurrenceCount(parseInt(countMatch[1]))
      setRecurrenceEndDate('')
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const generateRecurrenceRule = (): string | null => {
    if (!isRecurring) return null

    const startDate = new Date(startTime)
    const dayOfWeek = startDate.getDay() // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    
    let rule = ''
    
    switch (recurrenceType) {
      case 'daily':
        rule = `FREQ=DAILY;INTERVAL=${recurrenceInterval}`
        break
      case 'weekly':
        const days = recurrenceDays.length > 0 
          ? recurrenceDays.join(',') 
          : dayNames[dayOfWeek]
        rule = `FREQ=WEEKLY;INTERVAL=${recurrenceInterval};BYDAY=${days}`
        break
      case 'monthly':
        rule = `FREQ=MONTHLY;INTERVAL=${recurrenceInterval};BYMONTHDAY=${startDate.getDate()}`
        break
      case 'yearly':
        rule = `FREQ=YEARLY;INTERVAL=${recurrenceInterval};BYMONTH=${startDate.getMonth() + 1};BYMONTHDAY=${startDate.getDate()}`
        break
    }

    if (recurrenceEndDate) {
      const endDate = new Date(recurrenceEndDate)
      endDate.setHours(23, 59, 59, 999)
      rule += `;UNTIL=${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`
    } else if (recurrenceCount) {
      rule += `;COUNT=${recurrenceCount}`
    }

    return rule
  }

  const performSave = async (updateScope: 'this' | 'thisAndFollowing' = 'this') => {
    setSaving(true)
    try {
      const recurrenceRule = generateRecurrenceRule()
      
      const url = eventId ? `/api/events/${eventId}` : '/api/events'
      const method = eventId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || null,
          setupTime: setupTime || null,
          startTime,
          endTime,
          location: location || null,
          categoryId: categoryId || null,
          eventType,
          schoolLevel: schoolLevel || null,
          isAllDay,
          isRecurring,
          recurrenceRule,
          equipment: equipment.length > 0 ? JSON.stringify(equipment) : null,
          updateScope: eventId ? updateScope : undefined, // Only send updateScope when editing
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/events`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save event')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Title is required')
      return
    }

    if (!startTime || !endTime) {
      alert('Start time and end time are required')
      return
    }

    if (new Date(startTime) >= new Date(endTime)) {
      alert('End time must be after start time')
      return
    }

    if (setupTime && new Date(setupTime) >= new Date(startTime)) {
      alert('Setup time must be before start time')
      return
    }

    // Check if this is an edit of a recurring event
    if (eventId && (initialData?.isRecurring || isRecurring) && initialData?.recurrenceRule) {
      // Show modal to ask about update scope
      setShowRecurringModal(true)
      return
    }

    // For new events or non-recurring events, save directly
    await performSave()
  }

  const handleRecurringModalConfirm = async () => {
    setShowRecurringModal(false)
    await performSave(recurringEditScope)
  }

  const toggleRecurrenceDay = (day: string) => {
    setRecurrenceDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          School Level
        </label>
        <select
          value={schoolLevel}
          onChange={(e) => setSchoolLevel(e.target.value)}
          className="w-full pl-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        >
          <option value="">Select school level...</option>
          <option value="High School">High School</option>
          <option value="Middle School">Middle School</option>
          <option value="Elementary School">Elementary School</option>
          <option value="Global">Global</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Weekly Team Meeting"
          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Event description..."
          rows={4}
          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Type
        </label>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="w-full pl-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        >
          <option value="meeting">Meeting</option>
          <option value="training">Training</option>
          <option value="workshop">Workshop</option>
          <option value="maintenance">Maintenance</option>
          <option value="event">Event</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Tech Office, MS HUB"
          className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
        />
      </div>

      {/* Time Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Event Time</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              id="hasSetupTime"
              checked={hasSetupTime}
              onChange={(e) => {
                const checked = e.target.checked
                setHasSetupTime(checked)
                if (checked) {
                  if (startTime) {
                    // Set setup time to 30 minutes before start time by default
                    const start = new Date(startTime)
                    start.setMinutes(start.getMinutes() - 30)
                    setSetupTime(start.toISOString().slice(0, 16))
                  } else {
                    // If no start time, set a default time
                    const now = new Date()
                    setSetupTime(now.toISOString().slice(0, 16))
                  }
                } else {
                  setSetupTime('')
                }
              }}
              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 accent-blue-600 cursor-pointer flex-shrink-0"
              style={{ colorScheme: 'light' }}
            />
            <label htmlFor="hasSetupTime" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
              Include setup time
            </label>
          </div>
          {hasSetupTime && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Setup Time
              </label>
              <input
                type="datetime-local"
                value={setupTime}
                onChange={(e) => setSetupTime(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">Time before the event starts for setup</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isAllDay"
          checked={isAllDay}
          onChange={(e) => setIsAllDay(e.target.checked)}
          className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 accent-blue-600 cursor-pointer"
          style={{ colorScheme: 'light' }}
        />
        <label htmlFor="isAllDay" className="text-sm text-gray-700 cursor-pointer">
          All-day event
        </label>
      </div>


      {/* Equipment Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Equipment Needed</h3>
        
        {equipment.length > 0 && (
          <div className="space-y-3 mb-4">
            {equipment.map((item, index) => (
              <div
                key={index}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{item.name}</h4>
                      {item.quantity && (
                        <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                          Qty: {item.quantity}
                        </span>
                      )}
                      {item.category && (
                        <span className="px-2 py-1 bg-white text-xs text-gray-600 rounded border border-blue-200">
                          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-700">{item.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEquipment(equipment.filter((_, i) => i !== index))
                    }}
                    className="ml-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Remove equipment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Add Equipment Item</h4>
          <EquipmentForm
            onAdd={(equipmentItem) => {
              setEquipment([...equipment, equipmentItem])
            }}
          />
        </div>
      </div>

      {/* Recurring Event Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2 accent-blue-600 cursor-pointer"
            style={{ colorScheme: 'light' }}
          />
          <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700 flex items-center gap-2 cursor-pointer">
            <Repeat className="w-4 h-4" />
            Recurring Event
          </label>
        </div>

        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
            isRecurring ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className={`space-y-4 pl-6 border-l-2 border-blue-200 pb-2 ${isRecurring ? '' : 'invisible'}`}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repeat
                </label>
                <select
                  value={recurrenceType}
                  onChange={(e) => setRecurrenceType(e.target.value as any)}
                  className="w-full pl-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Every
                </label>
                <input
                  type="number"
                  min="1"
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>
            </div>

            {recurrenceType === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of Week
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'MO', label: 'Monday' },
                    { value: 'TU', label: 'Tuesday' },
                    { value: 'WE', label: 'Wednesday' },
                    { value: 'TH', label: 'Thursday' },
                    { value: 'FR', label: 'Friday' },
                    { value: 'SA', label: 'Saturday' },
                    { value: 'SU', label: 'Sunday' },
                  ].map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleRecurrenceDay(day.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        recurrenceDays.includes(day.value)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {recurrenceDays.length === 0 && startTime && (
                  <p className="text-xs text-gray-500 mt-2">
                    If no days selected, will use the day of the start date
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => {
                    setRecurrenceEndDate(e.target.value)
                    setRecurrenceCount(null)
                  }}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Occurrences (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={recurrenceCount || ''}
                  onChange={(e) => {
                    const count = e.target.value ? parseInt(e.target.value) : null
                    setRecurrenceCount(count)
                    if (count) setRecurrenceEndDate('')
                  }}
                  placeholder="e.g., 10"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Leave both empty for no end date (repeats indefinitely)
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving || !title.trim() || !startTime || !endTime}
          variant="primary"
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Event
            </>
          )}
        </Button>
        <Button
          onClick={() => router.back()}
          variant="secondary"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>

      {/* Recurring Event Edit Modal */}
      {showRecurringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Recurring Event
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                This is a recurring event. How would you like to apply your changes?
              </p>
              
              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="recurringScope"
                    value="this"
                    checked={recurringEditScope === 'this'}
                    onChange={(e) => setRecurringEditScope(e.target.value as 'this')}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 accent-blue-600"
                    style={{ colorScheme: 'light' }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Edit this event</div>
                    <div className="text-xs text-gray-500">Only update this occurrence</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="recurringScope"
                    value="thisAndFollowing"
                    checked={recurringEditScope === 'thisAndFollowing'}
                    onChange={(e) => setRecurringEditScope(e.target.value as 'thisAndFollowing')}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 focus:ring-blue-500 accent-blue-600"
                    style={{ colorScheme: 'light' }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">This and following events</div>
                    <div className="text-xs text-gray-500">Update this event and all future occurrences</div>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowRecurringModal(false)}
                  variant="secondary"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRecurringModalConfirm}
                  variant="primary"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'OK'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

