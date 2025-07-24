"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { io as socketIOClient } from "socket.io-client"

const reportCategories = [
  {
    title: "Financial Reports",
    reports: [
      { name: "Profit & Loss Statement", description: "Income and expenses summary", icon: TrendingUp },
      { name: "Balance Sheet", description: "Assets, liabilities, and equity", icon: BarChart3 },
      { name: "Cash Flow Statement", description: "Cash inflows and outflows", icon: DollarSign },
      { name: "Trial Balance", description: "Account balances verification", icon: Activity },
    ],
  },
  {
    title: "Sales Reports",
    reports: [
      { name: "Sales Register", description: "Detailed sales transactions", icon: FileText },
      { name: "Customer Aging", description: "Outstanding receivables by age", icon: Calendar },
      { name: "Sales Analysis", description: "Sales performance metrics", icon: TrendingUp },
      { name: "Product Sales Report", description: "Product-wise sales data", icon: PieChart },
    ],
  },
  {
    title: "Purchase Reports",
    reports: [
      { name: "Purchase Register", description: "Detailed purchase transactions", icon: FileText },
      { name: "Vendor Aging", description: "Outstanding payables by age", icon: Calendar },
      { name: "Purchase Analysis", description: "Purchase performance metrics", icon: TrendingDown },
      { name: "Expense Report", description: "Category-wise expenses", icon: BarChart3 },
    ],
  },
  {
    title: "Tax Reports",
    reports: [
      { name: "GSTR-1", description: "Outward supplies return", icon: FileText },
      { name: "GSTR-3B", description: "Monthly return summary", icon: FileText },
      { name: "TDS Summary", description: "Tax deducted at source", icon: DollarSign },
      { name: "Tax Analysis", description: "Tax liability breakdown", icon: PieChart },
    ],
  },
]

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [profitLoss, setProfitLoss] = useState<any[]>([])
  const [balanceSheet, setBalanceSheet] = useState<any>({ assets: [], liabilities: [], equity: [] })
  const [reportType, setReportType] = useState("profitLoss")
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState<string>(new Date().toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState<string>(new Date().toISOString().split('T')[0])
  const router = useRouter()

  useEffect(() => {
    async function fetchReports() {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        // Fetch sales invoices and purchase bills for P&L
        const salesRes = await fetch(`${API_BASE_URL}/sales-invoices`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (!salesRes.ok) throw new Error("Failed to fetch sales invoices")
        const sales = await salesRes.json()
        const purchaseRes = await fetch(`${API_BASE_URL}/purchase-bills`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (!purchaseRes.ok) throw new Error("Failed to fetch purchase bills")
        const purchases = await purchaseRes.json()
        // Generate Profit & Loss
        const totalSales = sales.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0)
        const totalCOGS = purchases.reduce((sum: number, bill: any) => sum + (bill.totalAmount || 0), 0)
        const grossProfit = totalSales - totalCOGS
        // For demo, treat all purchases as COGS and ignore other expenses
        setProfitLoss([
          { account: "Sales Revenue", amount: totalSales, type: "income" },
          { account: "Cost of Goods Sold", amount: totalCOGS, type: "expense" },
          { account: "Gross Profit", amount: grossProfit, type: "total" },
        ])
        // Fetch chart of accounts for balance sheet
        const accountsRes = await fetch(`${API_BASE_URL}/chart-of-accounts`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (!accountsRes.ok) throw new Error("Failed to fetch chart of accounts")
        const accounts = await accountsRes.json()
        // For demo, group accounts by type
        const assets = accounts.filter((a: any) => a.type === "Asset")
        const liabilities = accounts.filter((a: any) => a.type === "Liability")
        const equity = accounts.filter((a: any) => a.type === "Equity")
        setBalanceSheet({ assets, liabilities, equity })
      } catch (err: any) {
        setError(err.message || "Error loading reports")
      }
      setLoading(false)
    }
    fetchReports()
    const socket = socketIOClient("http://localhost:5000")
    socket.on("invoice:created", fetchReports)
    socket.on("invoice:updated", fetchReports)
    socket.on("invoice:deleted", fetchReports)
    socket.on("purchasebill:created", fetchReports)
    socket.on("purchasebill:updated", fetchReports)
    socket.on("purchasebill:deleted", fetchReports)
    socket.on("product:created", fetchReports)
    socket.on("product:updated", fetchReports)
    socket.on("product:deleted", fetchReports)
    return () => {
      socket.disconnect()
    }
  }, [])

  const generateReport = (reportName: string) => {
    setSelectedReport(reportName)
  }

  const exportReport = (format: string) => {
    alert(`Exporting ${selectedReport} as ${format}`)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-gray-600">Generate financial reports and business insights</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Report Parameters</CardTitle>
                <CardDescription>Configure report settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dateFrom">From Date</Label>
                  <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateTo">To Date</Label>
                  <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Export Format</Label>
                  <Select defaultValue="pdf">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {selectedReport && (
                  <div className="flex gap-2">
                    <Button onClick={() => exportReport("PDF")} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6 space-y-4">
              {reportCategories.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {category.reports.map((report, reportIndex) => (
                      <Button
                        key={reportIndex}
                        variant={selectedReport === report.name ? "default" : "ghost"}
                        className="w-full justify-start h-auto p-3"
                        onClick={() => generateReport(report.name)}
                      >
                        <div className="flex items-start gap-3">
                          <report.icon className="h-4 w-4 mt-0.5" />
                          <div className="text-left">
                            <div className="font-medium">{report.name}</div>
                            <div className="text-xs text-muted-foreground">{report.description}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {loading && (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Reports...</h3>
                    <p className="text-gray-600">Please wait while we fetch the financial data.</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {error && (
              <Card>
                <CardContent className="flex items-center justify-center h-96 text-red-600">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Error: {error}</h3>
                    <p className="text-gray-600">Failed to load financial reports. Please try again later.</p>
                  </div>
                </CardContent>
              </Card>
            )}
            {!loading && !error && (
              <>
                {selectedReport === "Profit & Loss Statement" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Profit & Loss Statement</CardTitle>
                      <CardDescription>
                        For the period {dateFrom} to {dateTo}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead className="text-right">Amount (₹)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profitLoss.map((item, index) => (
                            <TableRow key={index} className={item.type === "total" ? "font-semibold bg-gray-50" : ""}>
                              <TableCell className={item.type === "total" ? "font-semibold" : ""}>{item.account}</TableCell>
                              <TableCell
                                className={`text-right ${item.type === "total" ? "font-semibold" : ""} ${
                                  item.type === "expense" ? "text-red-600" : item.type === "income" ? "text-green-600" : ""
                                }`}
                              >
                                {item.amount.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {selectedReport === "Balance Sheet" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Balance Sheet</CardTitle>
                      <CardDescription>As on {dateTo}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <h3 className="font-semibold mb-4">Assets</h3>
                          <Table>
                            <TableBody>
                              {balanceSheet.assets.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell className="text-right">₹{item.currentBalance?.toLocaleString() || '0'}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="font-semibold bg-gray-50">
                                <TableCell>Total Assets</TableCell>
                                <TableCell className="text-right">
                                  ₹{balanceSheet.assets.reduce((sum: number, item: any) => sum + (item.currentBalance || 0), 0).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-4">Liabilities & Equity</h3>
                          <Table>
                            <TableBody>
                              <TableRow className="bg-gray-50">
                                <TableCell className="font-medium">Liabilities</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                              {balanceSheet.liabilities.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="pl-4">{item.name}</TableCell>
                                  <TableCell className="text-right">₹{item.currentBalance?.toLocaleString() || '0'}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="bg-gray-50">
                                <TableCell className="font-medium">Equity</TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                              {balanceSheet.equity.map((item: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="pl-4">{item.name}</TableCell>
                                  <TableCell className="text-right">₹{item.currentBalance?.toLocaleString() || '0'}</TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="font-semibold bg-gray-50">
                                <TableCell>Total Liabilities & Equity</TableCell>
                                <TableCell className="text-right">
                                  ₹
                                  {(
                                    balanceSheet.liabilities.reduce((sum: number, item: any) => sum + (item.currentBalance || 0), 0) +
                                    balanceSheet.equity.reduce((sum: number, item: any) => sum + (item.currentBalance || 0), 0)
                                  ).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!selectedReport && (
                  <Card>
                    <CardContent className="flex items-center justify-center h-96">
                      <div className="text-center">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Report</h3>
                        <p className="text-gray-600">Choose a report from the left panel to view its contents</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}