"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Globe, TrendingUp, TrendingDown, RefreshCw, Settings } from "lucide-react"
import { io as socketIOClient } from "socket.io-client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function CurrencyPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currencies, setCurrencies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [errorTransactions, setErrorTransactions] = useState("")
  const router = useRouter()

  // Add state for modals and forms
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState<any>(null)
  const [currencyForm, setCurrencyForm] = useState({ code: '', name: '', symbol: '', rate: '', lastUpdated: '' })
  const [showDeleteCurrencyId, setShowDeleteCurrencyId] = useState<string | null>(null)

  const [showTxnModal, setShowTxnModal] = useState(false)
  const [editingTxn, setEditingTxn] = useState<any>(null)
  const [txnForm, setTxnForm] = useState({ date: '', type: '', reference: '', customerOrVendor: '', originalCurrency: '', originalAmount: '', exchangeRate: '', inrAmount: '', gainLoss: '' })
  const [showDeleteTxnId, setShowDeleteTxnId] = useState<string | null>(null)

  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settingsForm, setSettingsForm] = useState({ baseCurrency: '', rounding: 2 })
  const [settingsLoading, setSettingsLoading] = useState(false)

  const fetchCurrencies = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/currencies`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          router.push("/login")
          return
        }
        throw new Error("Failed to fetch currencies")
      }
      const data = await res.json()
      setCurrencies(data)
    } catch (err: any) {
      setError(err.message || "Error fetching currencies")
    }
    setLoading(false)
  }
  const fetchTransactions = async () => {
    setLoadingTransactions(true)
    setErrorTransactions("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/forex-transactions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          router.push("/login")
          return
        }
        throw new Error("Failed to fetch forex transactions")
      }
      const data = await res.json()
      setTransactions(data)
    } catch (err: any) {
      setErrorTransactions(err.message || "Error fetching forex transactions")
    }
    setLoadingTransactions(false)
  }

  // Fetch currency settings (optional, if backend supports it)
  const fetchSettings = async () => {
    setSettingsLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res: Response = await fetch(`${API_BASE_URL}/currencies/settings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (res.ok) {
        const data = await res.json()
        setSettingsForm({ baseCurrency: data.baseCurrency || '', rounding: data.rounding ?? 2 })
      }
    } catch (err: any) {}
    setSettingsLoading(false)
  }

  const handleUpdateRates = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/currencies/update-rates`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to update rates')
      await fetchCurrencies()
      alert('Exchange rates updated successfully!')
    } catch (err: any) {
      alert('Error updating rates: ' + (err.message || err))
    }
  }

  const handleOpenSettings = () => {
    fetchCurrencies() // ensure currencies are loaded for dropdown
    fetchSettings()
    setShowSettingsModal(true)
  }
  const handleSaveSettings = async () => {
    try {
      setSettingsLoading(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/currencies/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(settingsForm),
      })
      if (!res.ok) throw new Error('Failed to save settings')
      setShowSettingsModal(false)
      alert('Currency settings updated!')
    } catch (err: any) {
      alert('Error saving settings: ' + (err.message || err))
    }
    setSettingsLoading(false)
  }

  useEffect(() => {
    fetchCurrencies()
    const socket = socketIOClient("http://localhost:5000")
    socket.on("currency:created", fetchCurrencies)
    socket.on("currency:updated", fetchCurrencies)
    socket.on("currency:deleted", fetchCurrencies)
    return () => {
      socket.disconnect()
    }
  }, [router])

  useEffect(() => {
    fetchTransactions()
  }, [router])

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-600" : "text-red-600"
  }

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  const getGainLossColor = (amount: number) => {
    return amount >= 0 ? "text-green-600" : "text-red-600"
  }

  const filteredTransactions = transactions.filter(
    (transaction) =>
      (transaction.customerOrVendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Compute gain/loss summary from transactions
  const gainLossSummary = transactions.reduce((acc: any, txn: any) => {
    if (!txn.originalCurrency) return acc;
    if (!acc[txn.originalCurrency]) {
      acc[txn.originalCurrency] = { currency: txn.originalCurrency, realizedGain: 0, unrealizedGain: 0, totalGain: 0 };
    }
    // For demo, treat all as realized gain; adjust if you add a field for realized/unrealized
    acc[txn.originalCurrency].realizedGain += txn.gainLoss || 0;
    acc[txn.originalCurrency].totalGain += txn.gainLoss || 0;
    return acc;
  }, {});
  const gainLossArray = Object.values(gainLossSummary);
  const totalRealizedGain = gainLossArray.reduce((sum: number, item: any) => sum + item.realizedGain, 0);
  const totalUnrealizedGain = gainLossArray.reduce((sum: number, item: any) => sum + (item.unrealizedGain || 0), 0);
  const totalGain = totalRealizedGain + totalUnrealizedGain;

  // CRUD handlers for currencies
  const handleOpenCurrencyModal = (currency?: any) => {
    if (currency) {
      setEditingCurrency(currency)
      setCurrencyForm({
        code: currency.code || '',
        name: currency.name || '',
        symbol: currency.symbol || '',
        rate: currency.rate?.toString() || '',
        lastUpdated: currency.lastUpdated ? new Date(currency.lastUpdated).toISOString().slice(0, 10) : ''
      })
    } else {
      setEditingCurrency(null)
      setCurrencyForm({ code: '', name: '', symbol: '', rate: '', lastUpdated: '' })
    }
    setShowCurrencyModal(true)
  }
  const handleSaveCurrency = async () => {
    if (!currencyForm.code || !currencyForm.name || !currencyForm.symbol || !currencyForm.rate) {
      alert('Please fill all fields')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const method = editingCurrency ? 'PUT' : 'POST'
      const url = editingCurrency ? `${API_BASE_URL}/currencies/${editingCurrency._id}` : `${API_BASE_URL}/currencies`
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code: currencyForm.code,
          name: currencyForm.name,
          symbol: currencyForm.symbol,
          rate: Number(currencyForm.rate),
          lastUpdated: currencyForm.lastUpdated ? new Date(currencyForm.lastUpdated) : new Date(),
        })
      })
      if (!res.ok) throw new Error('Failed to save currency')
      setShowCurrencyModal(false)
      setEditingCurrency(null)
      setCurrencyForm({ code: '', name: '', symbol: '', rate: '', lastUpdated: '' })
      await fetchCurrencies()
    } catch (err: any) {
      alert('Error: ' + (err.message || err))
    }
  }
  const handleDeleteCurrency = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/currencies/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to delete currency')
      setShowDeleteCurrencyId(null)
      await fetchCurrencies()
    } catch (err: any) {
      alert('Error: ' + (err.message || err))
    }
  }
  // CRUD handlers for forex transactions
  const handleOpenTxnModal = (txn?: any) => {
    if (txn) {
      setEditingTxn(txn)
      setTxnForm({
        date: txn.date ? new Date(txn.date).toISOString().slice(0, 10) : '',
        type: txn.type || '',
        reference: txn.reference || '',
        customerOrVendor: txn.customerOrVendor || '',
        originalCurrency: txn.originalCurrency || '',
        originalAmount: txn.originalAmount?.toString() || '',
        exchangeRate: txn.exchangeRate?.toString() || '',
        inrAmount: txn.inrAmount?.toString() || '',
        gainLoss: txn.gainLoss?.toString() || '',
      })
    } else {
      setEditingTxn(null)
      setTxnForm({ date: '', type: '', reference: '', customerOrVendor: '', originalCurrency: '', originalAmount: '', exchangeRate: '', inrAmount: '', gainLoss: '' })
    }
    setShowTxnModal(true)
  }
  const handleSaveTxn = async () => {
    if (!txnForm.date || !txnForm.type || !txnForm.reference || !txnForm.customerOrVendor || !txnForm.originalCurrency || !txnForm.originalAmount || !txnForm.exchangeRate || !txnForm.inrAmount) {
      alert('Please fill all fields')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const method = editingTxn ? 'PUT' : 'POST'
      const url = editingTxn ? `${API_BASE_URL}/forex-transactions/${editingTxn._id}` : `${API_BASE_URL}/forex-transactions`
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          date: new Date(txnForm.date),
          type: txnForm.type,
          reference: txnForm.reference,
          customerOrVendor: txnForm.customerOrVendor,
          originalCurrency: txnForm.originalCurrency,
          originalAmount: Number(txnForm.originalAmount),
          exchangeRate: Number(txnForm.exchangeRate),
          inrAmount: Number(txnForm.inrAmount),
          gainLoss: Number(txnForm.gainLoss) || 0,
        })
      })
      if (!res.ok) throw new Error('Failed to save transaction')
      setShowTxnModal(false)
      setEditingTxn(null)
      setTxnForm({ date: '', type: '', reference: '', customerOrVendor: '', originalCurrency: '', originalAmount: '', exchangeRate: '', inrAmount: '', gainLoss: '' })
      await fetchTransactions()
    } catch (err: any) {
      alert('Error: ' + (err.message || err))
    }
  }
  const handleDeleteTxn = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE_URL}/forex-transactions/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to delete transaction')
      setShowDeleteTxnId(null)
      await fetchTransactions()
    } catch (err: any) {
      alert('Error: ' + (err.message || err))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Multi-Currency & Forex</h1>
            <p className="text-gray-600">Manage foreign exchange rates and multi-currency transactions</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleUpdateRates}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Rates
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenSettings}
            >
              <Settings className="h-4 w-4 mr-2" />
              Currency Settings
            </Button>
            <Button variant="outline" onClick={() => handleOpenCurrencyModal()}>
              + Add Currency
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forex Gain/Loss</CardTitle>
              <Globe className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getGainLossColor(totalGain)}`}>
                ₹{Math.abs(totalGain).toLocaleString()}
                {totalGain < 0 ? " Loss" : " Gain"}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Realized Gain/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getGainLossColor(totalRealizedGain)}`}>
                ₹{Math.abs(totalRealizedGain).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">From settled transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unrealized Gain/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getGainLossColor(totalUnrealizedGain)}`}>
                ₹{Math.abs(totalUnrealizedGain).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">From open positions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Currencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "-" : currencies.length}</div>
              <p className="text-xs text-muted-foreground">Configured currencies</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="rates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
            <TabsTrigger value="transactions">Multi-Currency Transactions</TabsTrigger>
            <TabsTrigger value="gainloss">Forex Gain/Loss</TabsTrigger>
          </TabsList>

          <TabsContent value="rates">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Current Exchange Rates</CardTitle>
                    <CardDescription>Live exchange rates against INR (Indian Rupee)</CardDescription>
                  </div>
                  <Input
                    placeholder="Search currencies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Currency</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead className="text-right">Rate (INR)</TableHead>
                      <TableHead className="text-right">Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Loading currencies...
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-red-600">
                          {error}
                        </TableCell>
                      </TableRow>
                    ) : currencies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No currencies found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currencies.map((currency) => (
                        <TableRow key={currency._id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{currency.symbol}</span>
                              {currency.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{currency.code}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">₹{currency.rate.toFixed(2)}</TableCell>
                          <TableCell className="text-sm text-gray-600">{currency.lastUpdated ? new Date(currency.lastUpdated).toLocaleString() : "-"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenCurrencyModal(currency)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowDeleteCurrencyId(currency._id)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Multi-Currency Transactions</CardTitle>
                    <CardDescription>Transactions in foreign currencies with INR conversion</CardDescription>
                  </div>
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Party</TableHead>
                      <TableHead>Original Amount</TableHead>
                      <TableHead>Exchange Rate</TableHead>
                      <TableHead className="text-right">INR Amount</TableHead>
                      <TableHead className="text-right">Gain/Loss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTransactions ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading transactions...
                        </TableCell>
                      </TableRow>
                    ) : errorTransactions ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-red-600">
                          {errorTransactions}
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction: any, idx: number) => (
                        <TableRow key={transaction._id || idx}>
                          <TableCell>{transaction.date ? new Date(transaction.date).toLocaleDateString() : "-"}</TableCell>
                          <TableCell>{transaction.type}</TableCell>
                          <TableCell className="font-medium">{transaction.reference}</TableCell>
                          <TableCell>{transaction.customerOrVendor}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline">{transaction.originalCurrency}</Badge>
                              {transaction.originalAmount?.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{transaction.exchangeRate?.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{transaction.inrAmount?.toLocaleString()}</TableCell>
                          <TableCell className={`text-right ${getGainLossColor(transaction.gainLoss)}`}>
                            {transaction.gainLoss !== 0 && (
                              <>
                                {transaction.gainLoss > 0 ? "+" : ""}₹{Math.abs(transaction.gainLoss).toLocaleString()}
                              </>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleOpenTxnModal(transaction)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setShowDeleteTxnId(transaction._id)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gainloss">
            <Card>
              <CardHeader>
                <CardTitle>Forex Gain/Loss Summary</CardTitle>
                <CardDescription>Realized and unrealized gains/losses by currency</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Realized Gain/Loss</TableHead>
                      <TableHead className="text-right">Unrealized Gain/Loss</TableHead>
                      <TableHead className="text-right">Total Gain/Loss</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTransactions ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          Loading gain/loss summary...
                        </TableCell>
                      </TableRow>
                    ) : errorTransactions ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-red-600">
                          {errorTransactions}
                        </TableCell>
                      </TableRow>
                    ) : gainLossArray.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          No forex transactions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      gainLossArray.map((item: any) => (
                        <TableRow key={item.currency}>
                          <TableCell>{item.currency}</TableCell>
                          <TableCell className={`text-right ${getGainLossColor(item.realizedGain)}`}>
                            {item.realizedGain >= 0 ? "+" : "-"}₹{Math.abs(item.realizedGain).toLocaleString()}
                          </TableCell>
                          <TableCell className={`text-right ${getGainLossColor(item.unrealizedGain)}`}>
                            {item.unrealizedGain >= 0 ? "+" : "-"}₹{Math.abs(item.unrealizedGain).toLocaleString()}
                          </TableCell>
                          <TableCell className={`text-right ${getGainLossColor(item.totalGain)}`}>
                            {item.totalGain >= 0 ? "+" : "-"}₹{Math.abs(item.totalGain).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {/* Totals row */}
                    {!loadingTransactions && !errorTransactions && gainLossArray.length > 0 && (
                      <TableRow className="font-bold">
                        <TableCell>Total</TableCell>
                        <TableCell className={`text-right ${getGainLossColor(totalRealizedGain)}`}>
                          {totalRealizedGain >= 0 ? "+" : "-"}₹{Math.abs(totalRealizedGain).toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${getGainLossColor(totalUnrealizedGain)}`}>
                          {totalUnrealizedGain >= 0 ? "+" : "-"}₹{Math.abs(totalUnrealizedGain).toLocaleString()}
                        </TableCell>
                        <TableCell className={`text-right ${getGainLossColor(totalGain)}`}>
                          {totalGain >= 0 ? "+" : "-"}₹{Math.abs(totalGain).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showCurrencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">{editingCurrency ? 'Edit Currency' : 'Add Currency'}</h2>
            <label className="block mb-1">Code</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={currencyForm.code} onChange={e => setCurrencyForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. USD" />
            <label className="block mb-1">Name</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={currencyForm.name} onChange={e => setCurrencyForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. US Dollar" />
            <label className="block mb-1">Symbol</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={currencyForm.symbol} onChange={e => setCurrencyForm(f => ({ ...f, symbol: e.target.value }))} placeholder="e.g. $" />
            <label className="block mb-1">Rate (INR)</label>
            <input type="number" className="w-full border rounded px-3 py-2 mb-2" value={currencyForm.rate} onChange={e => setCurrencyForm(f => ({ ...f, rate: e.target.value }))} />
            <label className="block mb-1">Last Updated</label>
            <input type="date" className="w-full border rounded px-3 py-2 mb-4" value={currencyForm.lastUpdated} onChange={e => setCurrencyForm(f => ({ ...f, lastUpdated: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSaveCurrency}>{editingCurrency ? 'Update' : 'Create'}</Button>
              <Button variant="outline" onClick={() => setShowCurrencyModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {showDeleteCurrencyId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-lg font-bold mb-4">Delete Currency?</h2>
            <p>Are you sure you want to delete this currency?</p>
            <div className="flex gap-2 justify-end mt-4">
              <Button onClick={() => handleDeleteCurrency(showDeleteCurrencyId!)}>Delete</Button>
              <Button variant="outline" onClick={() => setShowDeleteCurrencyId(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {showTxnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">{editingTxn ? 'Edit Transaction' : 'Add Transaction'}</h2>
            <label className="block mb-1">Date</label>
            <input type="date" className="w-full border rounded px-3 py-2 mb-2" value={txnForm.date} onChange={e => setTxnForm(f => ({ ...f, date: e.target.value }))} />
            <label className="block mb-1">Type</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={txnForm.type} onChange={e => setTxnForm(f => ({ ...f, type: e.target.value }))} placeholder="e.g. Sales Invoice" />
            <label className="block mb-1">Reference</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={txnForm.reference} onChange={e => setTxnForm(f => ({ ...f, reference: e.target.value }))} placeholder="e.g. INV-USD-001" />
            <label className="block mb-1">Customer/Vendor</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={txnForm.customerOrVendor} onChange={e => setTxnForm(f => ({ ...f, customerOrVendor: e.target.value }))} placeholder="e.g. Global Corp USA" />
            <label className="block mb-1">Original Currency</label>
            <input className="w-full border rounded px-3 py-2 mb-2" value={txnForm.originalCurrency} onChange={e => setTxnForm(f => ({ ...f, originalCurrency: e.target.value }))} placeholder="e.g. USD" />
            <label className="block mb-1">Original Amount</label>
            <input type="number" className="w-full border rounded px-3 py-2 mb-2" value={txnForm.originalAmount} onChange={e => setTxnForm(f => ({ ...f, originalAmount: e.target.value }))} />
            <label className="block mb-1">Exchange Rate</label>
            <input type="number" className="w-full border rounded px-3 py-2 mb-2" value={txnForm.exchangeRate} onChange={e => setTxnForm(f => ({ ...f, exchangeRate: e.target.value }))} />
            <label className="block mb-1">INR Amount</label>
            <input type="number" className="w-full border rounded px-3 py-2 mb-2" value={txnForm.inrAmount} onChange={e => setTxnForm(f => ({ ...f, inrAmount: e.target.value }))} />
            <label className="block mb-1">Gain/Loss</label>
            <input type="number" className="w-full border rounded px-3 py-2 mb-4" value={txnForm.gainLoss} onChange={e => setTxnForm(f => ({ ...f, gainLoss: e.target.value }))} />
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSaveTxn}>{editingTxn ? 'Update' : 'Create'}</Button>
              <Button variant="outline" onClick={() => setShowTxnModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {showDeleteTxnId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h2 className="text-lg font-bold mb-4">Delete Transaction?</h2>
            <p>Are you sure you want to delete this transaction?</p>
            <div className="flex gap-2 justify-end mt-4">
              <Button onClick={() => handleDeleteTxn(showDeleteTxnId!)}>Delete</Button>
              <Button variant="outline" onClick={() => setShowDeleteTxnId(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold mb-4">Currency Settings</h2>
            <label className="block mb-1">Base Currency</label>
            <select className="w-full border rounded px-3 py-2 mb-2" value={settingsForm.baseCurrency} onChange={e => setSettingsForm(f => ({ ...f, baseCurrency: e.target.value }))}>
              <option value="">Select base currency</option>
              {currencies.map((c: any) => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
            <label className="block mb-1">Rounding (decimal places)</label>
            <input type="number" className="w-full border rounded px-3 py-2 mb-4" value={settingsForm.rounding} onChange={e => setSettingsForm(f => ({ ...f, rounding: Number(e.target.value) }))} min={0} max={6} />
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSaveSettings} disabled={settingsLoading}>{settingsLoading ? 'Saving...' : 'Save'}</Button>
              <Button variant="outline" onClick={() => setShowSettingsModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
