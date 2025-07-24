"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Building2,
  Wallet,
  TrendingUp,
  TrendingDown,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function AccountsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["1000", "2000", "3000", "4000", "5000"]))
  const [chartOfAccounts, setChartOfAccounts] = useState<any[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [errorAccounts, setErrorAccounts] = useState("")
  const router = useRouter()

  useEffect(() => {
    async function fetchAccounts() {
      setLoadingAccounts(true)
      setErrorAccounts("")
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(`${API_BASE_URL}/chart-of-accounts`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            localStorage.removeItem("token")
            localStorage.removeItem("user")
            router.push("/login")
            return
          }
          throw new Error("Failed to fetch chart of accounts")
        }
        const data = await res.json()
        setChartOfAccounts(data)
      } catch (err: any) {
        setErrorAccounts(err.message || "Error fetching chart of accounts")
      }
      setLoadingAccounts(false)
    }
    fetchAccounts()
  }, [router])

  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountCode, setNewAccountCode] = useState("")
  const [newAccountType, setNewAccountType] = useState("")

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case "Asset":
        return "bg-blue-100 text-blue-800"
      case "Liability":
        return "bg-red-100 text-red-800"
      case "Equity":
        return "bg-green-100 text-green-800"
      case "Income":
        return "bg-purple-100 text-purple-800"
      case "Expense":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case "Asset":
        return <Building2 className="h-4 w-4" />
      case "Liability":
        return <TrendingDown className="h-4 w-4" />
      case "Equity":
        return <Wallet className="h-4 w-4" />
      case "Income":
        return <TrendingUp className="h-4 w-4" />
      case "Expense":
        return <TrendingDown className="h-4 w-4" />
      default:
        return <Building2 className="h-4 w-4" />
    }
  }

  const renderAccountTree = (accounts: any[], parentExpanded = true) => {
    if (!parentExpanded) return null

    return accounts.map((account) => {
      const hasChildren = account.children && account.children.length > 0
      const isExpanded = expandedNodes.has(account.id)
      const shouldShow =
        !searchTerm || account.name.toLowerCase().includes(searchTerm.toLowerCase()) || account.id.includes(searchTerm)

      if (!shouldShow) return null

      return (
        <div key={account.id}>
          <TableRow className={`${account.level === 0 ? "bg-gray-50 font-semibold" : ""}`}>
            <TableCell>
              <div
                className="flex items-center cursor-pointer"
                style={{ paddingLeft: `${account.level * 20}px` }}
                onClick={() => hasChildren && toggleNode(account.id)}
              >
                {hasChildren ? (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )
                ) : (
                  <div className="w-6" />
                )}
                {getAccountTypeIcon(account.type)}
                <span className="ml-2">{account.name}</span>
              </div>
            </TableCell>
            <TableCell>{account.id}</TableCell>
            <TableCell>
              <Badge className={getAccountTypeColor(account.type)}>{account.type}</Badge>
            </TableCell>
            <TableCell className="text-right">₹{account.balance?.toLocaleString() || "0"}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  View Ledger
                </Button>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </TableCell>
          </TableRow>
          {hasChildren && renderAccountTree(account.children, isExpanded)}
        </div>
      )
    })
  }

  const totalAssets = chartOfAccounts.find((acc) => acc.id === "1000")?.balance || 0
  const totalLiabilities = chartOfAccounts.find((acc) => acc.id === "2000")?.balance || 0
  const totalEquity = chartOfAccounts.find((acc) => acc.id === "3000")?.balance || 0
  const totalIncome = chartOfAccounts.find((acc) => acc.id === "4000")?.balance || 0
  const totalExpenses = chartOfAccounts.find((acc) => acc.id === "5000")?.balance || 0

  const handleAddAccount = async () => {
    try {
      const token = localStorage.getItem("token")
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" }
      const res = await fetch(`${API_BASE_URL}/chart-of-accounts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ name: newAccountName, code: newAccountCode, type: newAccountType }),
      })
      if (!res.ok) throw new Error("Failed to save account")
      setShowAddAccount(false)
      setNewAccountName("")
      setNewAccountCode("")
      setNewAccountType("")
      // Refresh accounts
      setLoadingAccounts(true)
      const accountsRes = await fetch(`${API_BASE_URL}/chart-of-accounts`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      setChartOfAccounts(await accountsRes.json())
      setLoadingAccounts(false)
      alert(`Account "${newAccountName}" created successfully!`)
    } catch (err: any) {
      alert("Error saving account: " + (err.message || err))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Chart of Accounts</h1>
            <p className="text-gray-600">Manage your account structure and financial hierarchy</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAddAccount(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalAssets.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalLiabilities.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
              <Wallet className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalEquity.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalIncome.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalExpenses.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Account Hierarchy</CardTitle>
                <CardDescription>Navigate through your chart of accounts</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderAccountTree(chartOfAccounts)}</TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      {showAddAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Add New Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                  placeholder="Enter account name"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Code</Label>
                <Input
                  value={newAccountCode}
                  onChange={(e) => setNewAccountCode(e.target.value)}
                  placeholder="Enter account code"
                />
              </div>
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={newAccountType} onValueChange={setNewAccountType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asset">Asset</SelectItem>
                    <SelectItem value="Liability">Liability</SelectItem>
                    <SelectItem value="Equity">Equity</SelectItem>
                    <SelectItem value="Income">Income</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddAccount(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddAccount}
                  className="flex-1"
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}
