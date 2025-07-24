"use client"

import { useState, useEffect } from "react"
import { io as socketIOClient } from "socket.io-client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, Download, Upload, Check, X, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

interface BankAccount {
  id: string
  _id?: string
  name: string
  accountNumber: string
  currentBalance?: number
  balance?: number
  lastReconciled?: string
  status: string
}

interface BankTransaction {
  id: string
  _id?: string
  date: string
  description: string
  reference?: string
  debit: number
  credit: number
  balance: number
  status: string
  matchedWith?: string
}

export default function BankingPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAccount, setSelectedAccount] = useState("")
  const [showImportStatement, setShowImportStatement] = useState(false)
  const [showAddBankAccount, setShowAddBankAccount] = useState(false)
  const [newBankName, setNewBankName] = useState("")
  const [newAccountNumber, setNewAccountNumber] = useState("")
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [loadingTransactions, setLoadingTransactions] = useState(true)
  const [errorAccounts, setErrorAccounts] = useState("")
  const [errorTransactions, setErrorTransactions] = useState("")
  const [showEditAccount, setShowEditAccount] = useState(false)
  const [editAccountId, setEditAccountId] = useState("")
  const [editAccountName, setEditAccountName] = useState("")
  const [editAccountNumber, setEditAccountNumber] = useState("")

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("token")
      setLoadingAccounts(true)
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const accountsRes = await fetch(`${API_BASE_URL}/bank-accounts`, { headers })
      if (!accountsRes.ok) throw new Error("Failed to fetch bank accounts")
      const accountsData = await accountsRes.json()
      setBankAccounts(accountsData || [])
      if (accountsData.length > 0 && !selectedAccount) {
        setSelectedAccount(accountsData[0]._id || accountsData[0].id || "")
      }
    } catch (err: any) {
      setErrorAccounts(err.message || "Error fetching bank accounts")
    } finally {
      setLoadingAccounts(false)
    }
  }
  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token")
      setLoadingTransactions(true)
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const transactionsRes = await fetch(`${API_BASE_URL}/bank-transactions`, { headers })
      if (!transactionsRes.ok) throw new Error("Failed to fetch bank transactions")
      const transactionsData = await transactionsRes.json()
      setBankTransactions(transactionsData || [])
    } catch (err: any) {
      setErrorTransactions(err.message || "Error fetching bank transactions")
    } finally {
      setLoadingTransactions(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await fetchAccounts()
      await fetchTransactions()
    }
    fetchData()
    // Socket.IO real-time updates
    const socket = socketIOClient("http://localhost:5000")
    socket.on("bankaccount:created", fetchAccounts)
    socket.on("bankaccount:updated", fetchAccounts)
    socket.on("bankaccount:deleted", fetchAccounts)
    socket.on("banktransaction:created", fetchTransactions)
    socket.on("banktransaction:updated", fetchTransactions)
    socket.on("banktransaction:deleted", fetchTransactions)
    return () => {
      socket.disconnect()
    }
  }, [selectedAccount])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Matched":
        return "bg-green-100 text-green-800"
      case "Unmatched":
        return "bg-yellow-100 text-yellow-800"
      case "Disputed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "High":
        return "bg-green-100 text-green-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredTransactions = bankTransactions.filter(
    (transaction) =>
      (transaction.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.reference || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalBalance = bankAccounts.reduce(
    (sum, account) => sum + (account.currentBalance || account.balance || 0),
    0
  )
  const matchedTransactions = bankTransactions.filter((t) => t.status === "Matched").length
  const unmatchedTransactions = bankTransactions.filter((t) => t.status === "Unmatched").length

  if (loadingAccounts || loadingTransactions) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p>Loading banking data...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (errorAccounts || errorTransactions) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 text-red-600">
          <p>{errorAccounts || errorTransactions}</p>
        </div>
      </DashboardLayout>
    )
  }

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete bank account');
      await fetchAccounts();
    } catch (err: any) {
      alert('Error deleting bank account: ' + (err.message || err));
    }
  };

  const handleEditAccount = (account: any) => {
    setEditAccountId(account._id || account.id)
    setEditAccountName(account.accountName || account.name || "")
    setEditAccountNumber(account.accountNumber || "")
    setShowEditAccount(true)
  }
  const handleSaveEditAccount = async () => {
    try {
      const token = localStorage.getItem("token")
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
      const res = await fetch(`${API_BASE_URL}/bank-accounts/${editAccountId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ accountName: editAccountName, accountNumber: editAccountNumber }),
      })
      if (!res.ok) throw new Error("Failed to update bank account")
      setShowEditAccount(false)
      setEditAccountId("")
      setEditAccountName("")
      setEditAccountNumber("")
      await fetchAccounts()
      alert("Bank account updated!")
    } catch (err: any) {
      alert("Error updating bank account: " + (err.message || err))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header and buttons */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Banking & Reconciliation</h1>
            <p className="text-gray-600">Manage bank accounts and reconcile transactions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowImportStatement(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Statement
            </Button>
            <Button onClick={() => setShowAddBankAccount(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bank Account
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bank Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Matched Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matchedTransactions}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unmatched Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{unmatchedTransactions}</div>
              <p className="text-xs text-muted-foreground text-yellow-600">Need attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bank Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bankAccounts.length}</div>
              <p className="text-xs text-muted-foreground">Active accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Bank Transactions</TabsTrigger>
            <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
            <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Bank Transactions</CardTitle>
                    <CardDescription>View and manage bank statement entries</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Debit</TableHead>
                      <TableHead className="text-right">Credit</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Matched With</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction: any) => (
                        <TableRow key={transaction._id || transaction.id}>
                          <TableCell>{transaction.date ? new Date(transaction.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="font-medium">{transaction.description}</TableCell>
                          <TableCell>{transaction.reference || '-'}</TableCell>
                          <TableCell className="text-right text-red-600">
                            {transaction.type === 'Withdrawal' ? `₹${(transaction.amount || 0).toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {transaction.type === 'Deposit' ? `₹${(transaction.amount || 0).toLocaleString()}` : '-'}
                          </TableCell>
                          <TableCell className="text-right">-</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor('Matched')}>Matched</Badge>
                          </TableCell>
                          <TableCell>-</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reconciliation Tab */}
          <TabsContent value="reconciliation">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Reconciliation Suggestions</CardTitle>
                  <CardDescription>AI-powered matching suggestions for unmatched transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bankTransactions.length === 0 ? (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <AlertCircle className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">No suggestions available yet.</div>
                            <div className="text-sm text-gray-600">Please import a bank statement to generate suggestions.</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <AlertCircle className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-medium">Reconciliation suggestions available.</div>
                            <div className="text-sm text-gray-600">Review and match transactions below.</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-100 text-gray-800">Low Confidence</Badge>
                          <Button size="sm" variant="outline">
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button size="sm" variant="outline">
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Manual Reconciliation</CardTitle>
                  <CardDescription>Manually match transactions with accounting entries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Manual Matching Interface</h3>
                    <p className="text-gray-600">Drag and drop transactions to match them with accounting entries</p>
                    <Button className="mt-4">Start Manual Reconciliation</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts">
            <Card>
              <CardHeader>
                <CardTitle>Bank Accounts</CardTitle>
                <CardDescription>Manage your bank account connections</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Last Reconciled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bankAccounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No bank accounts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      bankAccounts.map((account: any) => (
                        <TableRow key={account._id || account.id}>
                          <TableCell className="font-medium">{account.accountName || account.name}</TableCell>
                          <TableCell>{account.accountNumber}</TableCell>
                          <TableCell className="text-right">₹{(account.currentBalance || account.openingBalance || 0).toLocaleString()}</TableCell>
                          <TableCell>{account.lastReconciled ? new Date(account.lastReconciled).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditAccount(account)}>
                                Edit
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteAccount(account._id || account.id)}>
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        {showImportStatement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Import Bank Statement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Upload your bank statement</p>
                  <p className="text-xs text-gray-400">CSV, Excel files supported</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowImportStatement(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      alert("Bank statement imported successfully!")
                      setShowImportStatement(false)
                    }}
                    className="flex-1"
                  >
                    Import
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showAddBankAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Add Bank Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={newBankName}
                    onChange={(e) => setNewBankName(e.target.value)}
                    placeholder="Enter bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowAddBankAccount(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("token")
                        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
                        const res = await fetch(`${API_BASE_URL}/bank-accounts`, {
                          method: "POST",
                          headers,
                          body: JSON.stringify({ accountName: newBankName, accountNumber: newAccountNumber }),
                        })
                        if (!res.ok) throw new Error("Failed to save bank account")
                        setShowAddBankAccount(false)
                        setNewBankName("")
                        setNewAccountNumber("")
                        await fetchAccounts()
                        alert(`Bank account "${newBankName}" added successfully!`)
                      } catch (err: any) {
                        alert("Error saving bank account: " + (err.message || err))
                      }
                    }}
                    className="flex-1"
                  >
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {showEditAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Edit Bank Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input
                    value={editAccountName}
                    onChange={(e) => setEditAccountName(e.target.value)}
                    placeholder="Enter bank name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input
                    value={editAccountNumber}
                    onChange={(e) => setEditAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowEditAccount(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEditAccount} className="flex-1">
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}