import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CSVImport from '../components/import/CSVImport'

export default function ImportAthletes() {
  const navigate = useNavigate()
  const [showImport, setShowImport] = useState(false)

  return (
    <div className="p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Import Athletes</h1>
        <p className="text-gray-500 mb-8">Import your athlete roster from CSV, Excel, or Google Sheets</p>

        {!showImport ? (
          <div className="space-y-6">
            {/* Import Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setShowImport(true)}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">CSV File</h3>
                <p className="text-sm text-gray-500 mt-1">Upload a .csv file from Excel or Google Sheets</p>
              </button>

              <button
                onClick={() => setShowImport(true)}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">Excel File</h3>
                <p className="text-sm text-gray-500 mt-1">.xlsx or .xls files</p>
              </button>

              <button
                onClick={() => alert('Google Sheets integration coming soon! For now, please export as CSV.')}
                className="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow text-left"
              >
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900">Google Sheets</h3>
                <p className="text-sm text-gray-500 mt-1">Connect directly to Google Sheets</p>
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="font-medium text-blue-900 mb-2">How to Import</h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Upload your Excel (.xlsx) or CSV file directly</li>
                <li>Make sure your file has a header row with column names</li>
                <li>Click any option above and select your file</li>
                <li>Preview the data and click Import</li>
              </ol>
              
              <div className="mt-4 pt-4 border-t border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Supported Columns</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>• First Name / Last Name</div>
                  <div>• Sex / Gender</div>
                  <div>• DOB / Date of Birth</div>
                  <div>• Age</div>
                  <div>• Category (Mountain/Day/Class)</div>
                  <div>• Mobile Number #1 / #2</div>
                  <div>• Allergies/Medications</div>
                  <div>• Medical Conditions</div>
                  <div className="col-span-2">• Attendance dates (X = present)</div>
                </div>
              </div>
            </div>

            {/* Template Download */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-2">Need a Template?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Download a sample CSV file to see the expected format
              </p>
              <button
                onClick={() => {
                  const csv = 'First Name,Last Name,Sex,DOB,Age,Category,Mobile Number#1,Mobile Number#2,Allergies/Medications,Medical Conditions,2024-01-15,2024-01-22,2024-01-29\nJohn,Smith,Male,2010-03-15,14,Grouse/Monday/Advanced,555-0123,555-0124,None,None,x,x,\nSarah,Johnson,Female,2009-07-22,15,Seymour/Wednesday/Intermediate,555-0125,555-0126,Penicillin,None,x,,x'
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'athlete-import-template.csv'
                  a.click()
                }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Download Template CSV →
              </button>
            </div>
          </div>
        ) : (
          <CSVImport
            onImportComplete={() => {
              navigate('/roster', { replace: true })
              window.location.reload()
            }}
            onCancel={() => setShowImport(false)}
          />
        )}
      </div>
    </div>
  )
}
