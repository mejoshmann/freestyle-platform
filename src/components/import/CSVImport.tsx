import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

interface CSVImportProps {
  onImportComplete: () => void
  onCancel: () => void
}

interface ParsedAthlete {
  full_name: string
  first_name: string
  last_name: string
  email?: string
  parent_email?: string
  parent_email2?: string
  sex?: string
  date_of_birth?: string
  age?: string
  category?: string
  phone?: string
  phone2?: string
  allergies?: string
  medical_conditions?: string
  attendance?: Record<string, 'present' | 'absent' | 'future'>
  rowNumber: number
}

export default function CSVImport({ onImportComplete, onCancel }: CSVImportProps) {
  const { coach } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'error'>('upload')
  const [parsedData, setParsedData] = useState<ParsedAthlete[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 })
  const [importResults, setImportResults] = useState<{ success: number; failed: number } | null>(null)

  function parseData(headers: string[], rows: any[][]): ParsedAthlete[] {
    // Find column indices
    const firstNameIndex = headers.findIndex(h => h.includes('first'))
    const lastNameIndex = headers.findIndex(h => h.includes('last'))
    const fullNameIndex = headers.findIndex(h => h === 'name' || h === 'fullname')
    const emailIndex = headers.findIndex(h => h === 'email')
    const parentEmailIndex = headers.findIndex(h => h.includes('parent') && h.includes('email') && !h.includes('2') && !h.includes('#2'))
    const parentEmail2Index = headers.findIndex(h => h.includes('parent') && h.includes('email') && (h.includes('2') || h.includes('#2')))
    const sexIndex = headers.findIndex(h => h.includes('sex') || h.includes('gender'))
    const dobIndex = headers.findIndex(h => h.includes('dob') || h.includes('birth') || (h.includes('date') && h.includes('birth')))
    const ageIndex = headers.findIndex(h => h === 'age')
    const categoryIndex = headers.findIndex(h => h.includes('category'))
    const phoneIndex = headers.findIndex(h => h.includes('mobile') || h.includes('phone'))
    const phone2Index = headers.findIndex(h => (h.includes('mobile') || h.includes('phone')) && (h.includes('2') || h.includes('#2') || h.includes('secondary')))
    const allergiesIndex = headers.findIndex(h => h.includes('allerg'))
    const medicalIndex = headers.findIndex(h => h.includes('medical') || h.includes('condition'))
    
    // Find attendance date columns (columns with dates like "2024-01-15" or "Jan 15")
    const attendanceIndices = headers.map((h, i) => {
      const datePatterns = [/\d{4}-\d{2}-\d{2}/, /\d{1,2}\/\d{1,2}\/\d{2,4}/, /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i]
      const isDate = datePatterns.some(p => p.test(h))
      return isDate ? { index: i, date: h } : null
    }).filter(Boolean) as { index: number; date: string }[]

    const athletes: ParsedAthlete[] = []
    const parseErrors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const values = rows[i].map((v: any) => String(v || '').trim())
      
      if (values.length < 2) continue

      // Build full name from first + last, or use full name column
      let fullName = ''
      if (firstNameIndex >= 0 && lastNameIndex >= 0) {
        fullName = `${values[firstNameIndex]} ${values[lastNameIndex]}`.trim()
      } else if (fullNameIndex >= 0) {
        fullName = values[fullNameIndex]
      } else {
        fullName = values[0] // Fallback to first column
      }
      
      if (!fullName || fullName.trim() === '') {
        parseErrors.push(`Row ${i + 2}: Missing name`)
        continue
      }

      // Parse attendance
      const attendance: Record<string, 'present' | 'absent' | 'future'> = {}
      attendanceIndices.forEach(({ index, date }) => {
        const value = values[index]?.toLowerCase().trim()
        if (value === 'x') {
          attendance[date] = 'present'
        } else if (value && value !== '') {
          attendance[date] = 'absent'
        } else {
          attendance[date] = 'future'
        }
      })

      athletes.push({
        full_name: fullName,
        first_name: firstNameIndex >= 0 ? values[firstNameIndex] : fullName.split(' ')[0],
        last_name: lastNameIndex >= 0 ? values[lastNameIndex] : fullName.split(' ').slice(1).join(' '),
        email: emailIndex >= 0 ? values[emailIndex] : undefined,
        parent_email: parentEmailIndex >= 0 ? values[parentEmailIndex] : undefined,
        parent_email2: parentEmail2Index >= 0 ? values[parentEmail2Index] : undefined,
        sex: sexIndex >= 0 ? values[sexIndex] : undefined,
        date_of_birth: dobIndex >= 0 ? values[dobIndex] : undefined,
        age: ageIndex >= 0 ? values[ageIndex] : undefined,
        category: categoryIndex >= 0 ? values[categoryIndex] : undefined,
        phone: phoneIndex >= 0 ? values[phoneIndex] : undefined,
        phone2: phone2Index >= 0 ? values[phone2Index] : undefined,
        allergies: allergiesIndex >= 0 ? values[allergiesIndex] : undefined,
        medical_conditions: medicalIndex >= 0 ? values[medicalIndex] : undefined,
        attendance,
        rowNumber: i + 2
      })
    }

    setErrors(parseErrors)
    return athletes
  }

  function parseCSV(text: string): ParsedAthlete[] {
    const lines = text.trim().split('\n')
    if (lines.length < 2) return []

    // Parse CSV properly handling quoted fields
    function parseLine(line: string): string[] {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    // Find the header row (look for "first name" or "last name" or "#" column)
    let headerIndex = 0
    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i].toLowerCase()
      if (line.includes('first name') || line.includes('last name') || line.includes(',reg id,')) {
        headerIndex = i
        break
      }
    }

    const headers = parseLine(lines[headerIndex]).map(h => h.toLowerCase().replace(/"/g, ''))
    const rows = lines.slice(headerIndex + 1)
      .filter(line => line.trim() !== '' && !line.startsWith('DEXTER')) // Skip empty lines and DEXTER row
      .map(line => parseLine(line).map(v => v.replace(/"/g, '')))
    
    return parseData(headers, rows)
  }

  function parseExcel(data: ArrayBuffer): ParsedAthlete[] {
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]
    
    if (jsonData.length < 2) return []

    const headers = jsonData[0].map((h: any) => String(h).trim().toLowerCase())
    const rows = jsonData.slice(1)
    
    return parseData(headers, rows)
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls')

    const reader = new FileReader()
    reader.onload = (e) => {
      let athletes: ParsedAthlete[] = []
      
      if (isExcel) {
        const data = e.target?.result as ArrayBuffer
        athletes = parseExcel(data)
      } else {
        const text = e.target?.result as string
        athletes = parseCSV(text)
      }
      
      setParsedData(athletes)
      setStep('preview')
    }
    
    if (isExcel) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  }

  async function importAthletes() {
    if (!coach) {
      alert('You must be logged in to import athletes')
      return
    }
    if (parsedData.length === 0) return
    
    console.log('Importing with coach:', coach.id)

    setStep('importing')
    setImportProgress({ current: 0, total: parsedData.length })

    let successCount = 0
    let errorCount = 0
    const importErrors: string[] = []

    for (let i = 0; i < parsedData.length; i++) {
      const athlete = parsedData[i]
      
      // Build full name
      const fullName = athlete.full_name || `${athlete.first_name} ${athlete.last_name}`.trim()
      
      if (!fullName || fullName.trim() === '') {
        errorCount++
        importErrors.push(`Row ${i + 2}: Missing name`)
        setImportProgress({ current: i + 1, total: parsedData.length })
        continue
      }
      
      // Try to insert with basic fields only
      // Note: Only using columns that exist in the database
      const insertData: any = {
        coach_id: coach.id,
        full_name: fullName
      }
      
      // Only add fields if they exist and have values
      // These columns must exist in your Supabase athletes table
      if (athlete.date_of_birth) insertData.date_of_birth = athlete.date_of_birth
      if (athlete.email) insertData.email = athlete.email
      // Note: group_name column doesn't exist - category stored in memory only for now
      
      const { error } = await supabase.from('athletes').insert(insertData)

      if (error) {
        errorCount++
        console.error('Import error for', fullName, ':', error)
        importErrors.push(`${fullName}: ${error.message}`)
      } else {
        successCount++
      }

      setImportProgress({ current: i + 1, total: parsedData.length })
    }

    if (errorCount > 0) {
      setErrors(importErrors.slice(0, 10))
      setImportResults({ success: successCount, failed: errorCount })
      setStep('error')
    } else {
      onImportComplete()
    }
  }

  if (step === 'upload') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Import Athletes</h2>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Upload CSV, Excel, or Google Sheets export
            </p>
            <p className="text-xs text-gray-500 mt-1">
              File should have columns: First Name, Last Name, Email, Parent Email, DOB, etc.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Select File
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Expected Format</h3>
            <p className="text-sm text-gray-600 mb-2">
              Your file should have a header row with these columns:
            </p>
            <div className="text-xs text-gray-500 font-mono bg-white p-2 rounded">
              First Name, Last Name, Email, Parent Email, DOB, Category, Mobile Number
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'preview') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Preview ({parsedData.length} athletes)
        </h2>

        {errors.length > 0 && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-800 mb-2">Warnings</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              {errors.slice(0, 5).map((error, i) => (
                <li key={i}>{error}</li>
              ))}
              {errors.length > 5 && (
                <li>...and {errors.length - 5} more</li>
              )}
            </ul>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sex</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Parent Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {parsedData.slice(0, 10).map((athlete, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-sm text-gray-900">{athlete.full_name}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{athlete.sex || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{athlete.date_of_birth || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{athlete.category || '-'}</td>
                  <td className="px-4 py-2 text-sm text-gray-500">{athlete.parent_email || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {parsedData.length > 10 && (
            <p className="text-center text-sm text-gray-500 py-2">
              ...and {parsedData.length - 10} more
            </p>
          )}
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={importAthletes}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Import {parsedData.length} Athletes
          </button>
          <button
            onClick={() => setStep('upload')}
            className="py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  if (step === 'importing') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Importing...</h2>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
          />
        </div>
        <p className="text-gray-600">
          {importProgress.current} of {importProgress.total} athletes imported
        </p>
      </div>
    )
  }

  if (step === 'error') {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Import Errors</h2>
        {importResults && (
          <p className="text-gray-600 mb-4">
            {importResults.success} imported successfully, {importResults.failed} failed
          </p>
        )}

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-red-800 mb-2">Error Details:</h3>
          <ul className="text-sm text-red-700 space-y-1 max-h-60 overflow-y-auto">
            {errors.map((error, i) => (
              <li key={i} className="font-mono">{error}</li>
            ))}
          </ul>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Common Fixes:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Make sure you're logged in</li>
            <li>• Check that athlete names are not empty</li>
            <li>• If you see "column does not exist", the database schema needs updating</li>
            <li>• Try importing fewer athletes at once</li>
            <li>• Check browser console for more details (F12)</li>
          </ul>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setStep('preview')}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Preview
          </button>
          <button
            onClick={onCancel}
            className="py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return null
}
