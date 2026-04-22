import { useState } from 'react'
import type { LoaderFunctionArgs, ActionFunctionArgs } from 'react-router'
import { useLoaderData, useActionData, useFetcher, Form } from 'react-router'
import {
  Download,
  Upload,
  FileText,
  Package,
  Store,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'
import { Card } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  getDB,
  getItems,
  getStores,
  createItem,
  createStore,
  createPrice,
} from '~/lib/db.server'
import type { Item, Store as StoreType } from '~/types/database'

export async function loader({ context }: LoaderFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])

  const [items, stores] = await Promise.all([getItems(db, { all: true }), getStores(db, { all: true })])

  // Get prices with item and store info
  const prices = await db
    .prepare(`
      SELECT p.*, i.name as item_name, s.name as store_name
      FROM prices p
      JOIN items i ON p.item_id = i.id
      JOIN stores s ON p.store_id = s.id
      ORDER BY p.created_at DESC
    `)
    .all<{
      id: number
      item_id: number
      store_id: number
      price: number
      date_recorded: string
      source: string | null
      item_name: string
      store_name: string
    }>()

  return {
    counts: {
      items: items.length,
      stores: stores.length,
      prices: prices.results.length,
    },
    items,
    stores,
    prices: prices.results,
  }
}

interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
}

export async function action({ request, context }: ActionFunctionArgs) {
  const db = getDB(context as Parameters<typeof getDB>[0])
  const formData = await request.formData()
  const intent = formData.get('intent') as string

  // Export actions
  if (intent === 'export-items' || intent === 'export-stores' || intent === 'export-prices') {
    // Exports are handled client-side with the data from loader
    return { success: true }
  }

  // Import actions
  if (intent === 'import-items') {
    const csvData = formData.get('csv') as string
    if (!csvData) {
      return { success: false, error: 'No CSV data provided' }
    }

    const result: ImportResult = { success: true, imported: 0, skipped: 0, errors: [] }
    const lines = csvData.trim().split('\n')
    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim())

    // Validate required headers
    const requiredHeaders = ['name']
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return { success: false, error: `Missing required headers: ${missingHeaders.join(', ')}` }
    }

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length !== headers.length) {
        result.errors.push(`Line ${i + 1}: Column count mismatch`)
        continue
      }

      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx]
      })

      if (!row.name || row.name.trim() === '') {
        result.skipped++
        continue
      }

      try {
        await createItem(db, {
          name: row.name.trim(),
          description: row.description?.trim() || null,
          category: row.category?.trim() || null,
          asin: row.asin?.trim() || null,
          image_url: row.image_url?.trim() || null,
        })
        result.imported++
      } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed')) {
          result.skipped++
        } else {
          result.errors.push(`Line ${i + 1}: ${error.message || 'Unknown error'}`)
        }
      }
    }

    return { success: true, result, type: 'items' }
  }

  if (intent === 'import-stores') {
    const csvData = formData.get('csv') as string
    if (!csvData) {
      return { success: false, error: 'No CSV data provided' }
    }

    const result: ImportResult = { success: true, imported: 0, skipped: 0, errors: [] }
    const lines = csvData.trim().split('\n')
    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim())

    const requiredHeaders = ['name']
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return { success: false, error: `Missing required headers: ${missingHeaders.join(', ')}` }
    }

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length !== headers.length) {
        result.errors.push(`Line ${i + 1}: Column count mismatch`)
        continue
      }

      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx]
      })

      if (!row.name || row.name.trim() === '') {
        result.skipped++
        continue
      }

      try {
        await createStore(db, {
          name: row.name.trim(),
          store_type: row.store_type?.trim() || null,
          address: row.address?.trim() || null,
          city: row.city?.trim() || null,
          state: row.state?.trim() || null,
          zip: row.zip?.trim() || null,
          phone: row.phone?.trim() || null,
          website: row.website?.trim() || null,
          base_id: row.base_id ? parseInt(row.base_id, 10) : null,
        })
        result.imported++
      } catch (error: any) {
        if (error.message?.includes('UNIQUE constraint failed')) {
          result.skipped++
        } else {
          result.errors.push(`Line ${i + 1}: ${error.message || 'Unknown error'}`)
        }
      }
    }

    return { success: true, result, type: 'stores' }
  }

  if (intent === 'import-prices') {
    const csvData = formData.get('csv') as string
    if (!csvData) {
      return { success: false, error: 'No CSV data provided' }
    }

    const result: ImportResult = { success: true, imported: 0, skipped: 0, errors: [] }
    const lines = csvData.trim().split('\n')
    const headers = lines[0].toLowerCase().split(',').map((h) => h.trim())

    const requiredHeaders = ['item_id', 'store_id', 'price']
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return { success: false, error: `Missing required headers: ${missingHeaders.join(', ')}` }
    }

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      if (values.length !== headers.length) {
        result.errors.push(`Line ${i + 1}: Column count mismatch`)
        continue
      }

      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx]
      })

      const itemId = parseInt(row.item_id, 10)
      const storeId = parseInt(row.store_id, 10)
      const price = parseFloat(row.price)

      if (isNaN(itemId) || isNaN(storeId) || isNaN(price)) {
        result.errors.push(`Line ${i + 1}: Invalid item_id, store_id, or price`)
        continue
      }

      try {
        await createPrice(db, {
          itemId,
          storeId,
          price,
          source: row.source?.trim() || 'import',
          reportedBy: row.reported_by?.trim() || 'Admin Import',
        })
        result.imported++
      } catch (error: any) {
        result.errors.push(`Line ${i + 1}: ${error.message || 'Unknown error'}`)
      }
    }

    return { success: true, result, type: 'prices' }
  }

  return { success: false, error: 'Unknown intent' }
}

// Parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim())

  return values
}

export default function AdminImportExportPage() {
  const { counts, items, stores, prices } = useLoaderData<typeof loader>()
  const actionData = useActionData<typeof action>()
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [importType, setImportType] = useState<'items' | 'stores' | 'prices'>('items')
  const [csvContent, setCsvContent] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)

  const handleExport = (type: 'items' | 'stores' | 'prices') => {
    let csvContent = ''
    let filename = ''

    if (type === 'items') {
      csvContent = 'id,name,description,category,asin,image_url\n'
      items.forEach((item: Item) => {
        csvContent += `${item.id},"${escapeCSV(item.name)}","${escapeCSV(item.description || '')}","${escapeCSV(item.category || '')}","${escapeCSV(item.asin || '')}","${escapeCSV(item.image_url || '')}"\n`
      })
      filename = `items-export-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'stores') {
      csvContent = 'id,name,store_type,address,city,state,zip,phone,website,base_id\n'
      stores.forEach((store: StoreType) => {
        csvContent += `${store.id},"${escapeCSV(store.name)}","${escapeCSV(store.store_type || '')}","${escapeCSV(store.address || '')}","${escapeCSV(store.city || '')}","${escapeCSV(store.state || '')}","${escapeCSV(store.zip || '')}","${escapeCSV(store.phone || '')}","${escapeCSV(store.website || '')}",${store.base_id || ''}\n`
      })
      filename = `stores-export-${new Date().toISOString().split('T')[0]}.csv`
    } else if (type === 'prices') {
      csvContent = 'id,item_id,item_name,store_id,store_name,price,date_recorded,source\n'
      prices.forEach((price: any) => {
        csvContent += `${price.id},${price.item_id},"${escapeCSV(price.item_name)}",${price.store_id},"${escapeCSV(price.store_name)}",${price.price},"${price.date_recorded}","${escapeCSV(price.source || '')}"\n`
      })
      filename = `prices-export-${new Date().toISOString().split('T')[0]}.csv`
    }

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      setFileError('Please upload a CSV file')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setCsvContent(event.target?.result as string)
      setFileError(null)
    }
    reader.onerror = () => {
      setFileError('Failed to read file')
    }
    reader.readAsText(file)
  }

  const getImportTemplate = (type: 'items' | 'stores' | 'prices') => {
    if (type === 'items') {
      return 'name,description,category,asin,image_url\nExample Item,A sample item description,Clothing,,\n'
    } else if (type === 'stores') {
      return 'name,store_type,address,city,state,zip,phone,website,base_id\nExample Store,Retail,123 Main St,Fayetteville,NC,28301,555-1234,https://example.com,1\n'
    } else {
      return 'item_id,store_id,price,source,reported_by\n1,1,19.99,in_store,Admin\n'
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileText size={24} className="text-text-muted" />
          <h2 className="text-2xl font-semibold text-text-primary">Import / Export</h2>
        </div>
        <p className="text-text-secondary text-sm">
          Bulk manage items, stores, and prices via CSV
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card variant="bordered" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Package size={20} className="text-accent" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-text-primary">{counts.items}</p>
              <p className="text-xs text-text-muted">Items</p>
            </div>
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <Store size={20} className="text-info" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-text-primary">{counts.stores}</p>
              <p className="text-xs text-text-muted">Stores</p>
            </div>
          </div>
        </Card>
        <Card variant="bordered" padding="md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign size={20} className="text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-text-primary">{counts.prices}</p>
              <p className="text-xs text-text-muted">Prices</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'export' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('export')}
        >
          <Download size={16} />
          Export Data
        </Button>
        <Button
          variant={activeTab === 'import' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setActiveTab('import')}
        >
          <Upload size={16} />
          Import Data
        </Button>
      </div>

      {/* Export Section */}
      {activeTab === 'export' && (
        <Card variant="bordered" padding="lg">
          <h3 className="text-lg font-medium text-text-primary mb-4">Export to CSV</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-bg-subtle border border-border">
              <div className="flex items-center gap-3">
                <Package size={20} className="text-text-muted" />
                <div>
                  <p className="font-medium text-text-primary">Items</p>
                  <p className="text-xs text-text-muted">{counts.items} records</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleExport('items')}>
                <Download size={14} />
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-bg-subtle border border-border">
              <div className="flex items-center gap-3">
                <Store size={20} className="text-text-muted" />
                <div>
                  <p className="font-medium text-text-primary">Stores</p>
                  <p className="text-xs text-text-muted">{counts.stores} records</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleExport('stores')}>
                <Download size={14} />
                Export
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-bg-subtle border border-border">
              <div className="flex items-center gap-3">
                <DollarSign size={20} className="text-text-muted" />
                <div>
                  <p className="font-medium text-text-primary">Prices</p>
                  <p className="text-xs text-text-muted">{counts.prices} records</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleExport('prices')}>
                <Download size={14} />
                Export
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Import Section */}
      {activeTab === 'import' && (
        <Card variant="bordered" padding="lg">
          <h3 className="text-lg font-medium text-text-primary mb-4">Import from CSV</h3>

          {/* Import Result */}
          {actionData?.result && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                actionData.result.errors.length === 0
                  ? 'bg-success/10 border border-success/30'
                  : 'bg-warning/10 border border-warning/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {actionData.result.errors.length === 0 ? (
                  <CheckCircle size={18} className="text-success" />
                ) : (
                  <AlertTriangle size={18} className="text-warning" />
                )}
                <span className="font-medium text-text-primary">Import Complete</span>
              </div>
              <div className="flex gap-4 text-sm">
                <Badge variant="success">{actionData.result.imported} imported</Badge>
                <Badge variant="secondary">{actionData.result.skipped} skipped</Badge>
                {actionData.result.errors.length > 0 && (
                  <Badge variant="error">{actionData.result.errors.length} errors</Badge>
                )}
              </div>
              {actionData.result.errors.length > 0 && (
                <div className="mt-3 p-2 rounded bg-bg-elevated text-xs text-text-muted max-h-32 overflow-y-auto">
                  {actionData.result.errors.map((err: string, i: number) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {actionData?.error && (
            <div className="mb-4 p-4 rounded-lg bg-error/10 border border-error/30">
              <div className="flex items-center gap-2">
                <XCircle size={18} className="text-error" />
                <span className="text-error">{actionData.error}</span>
              </div>
            </div>
          )}

          {/* Import Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Select data type to import
            </label>
            <div className="flex gap-2">
              <Button
                variant={importType === 'items' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setImportType('items')}
              >
                <Package size={14} />
                Items
              </Button>
              <Button
                variant={importType === 'stores' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setImportType('stores')}
              >
                <Store size={14} />
                Stores
              </Button>
              <Button
                variant={importType === 'prices' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setImportType('prices')}
              >
                <DollarSign size={14} />
                Prices
              </Button>
            </div>
          </div>

          {/* Template Download */}
          <div className="mb-4 p-3 rounded-lg bg-bg-subtle border border-border">
            <p className="text-sm text-text-secondary mb-2">
              Download a template CSV for {importType}:
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const content = getImportTemplate(importType)
                const blob = new Blob([content], { type: 'text/csv' })
                const link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = `${importType}-template.csv`
                link.click()
              }}
            >
              <Download size={14} />
              Download Template
            </Button>
          </div>

          {/* File Upload */}
          <Form method="post">
            <input type="hidden" name="intent" value={`import-${importType}`} />

            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Upload CSV file
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-sm text-text-secondary
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border file:border-border
                  file:text-sm file:font-medium
                  file:bg-bg-elevated file:text-text-primary
                  hover:file:bg-bg-subtle"
              />
              {fileError && <p className="mt-1 text-sm text-error">{fileError}</p>}
            </div>

            {/* CSV Preview */}
            {csvContent && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Preview (first 5 lines)
                </label>
                <pre className="p-3 rounded-lg bg-bg-elevated border border-border text-xs text-text-muted overflow-x-auto">
                  {csvContent.split('\n').slice(0, 6).join('\n')}
                </pre>
              </div>
            )}

            <textarea name="csv" value={csvContent} readOnly className="hidden" />

            <Button type="submit" disabled={!csvContent}>
              <Upload size={16} />
              Import {importType.charAt(0).toUpperCase() + importType.slice(1)}
            </Button>
          </Form>
        </Card>
      )}
    </div>
  )
}

function escapeCSV(str: string): string {
  if (!str) return ''
  return str.replace(/"/g, '""')
}
