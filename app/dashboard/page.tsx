"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Building2, DollarSign, FileText, Package, Receipt, Users, Wallet, ShoppingCart } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Overview } from "@/components/overview"
import { RecentTransactions } from "@/components/recent-transactions"
import { io as socketIOClient } from "socket.io-client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(userData))
  }, [router])

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)
      setError("")
      try {
        const token = localStorage.getItem("token")
        // Fetch sales invoices
        const invoicesRes = await fetch(`${API_BASE_URL}/sales-invoices`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!invoicesRes.ok) throw new Error("Failed to fetch sales invoices")
        const invoices = await invoicesRes.json()
        // Fetch customers
        const customersRes = await fetch(`${API_BASE_URL}/customers`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!customersRes.ok) throw new Error("Failed to fetch customers")
        const customers = await customersRes.json()
        // Fetch products (for inventory value)
        const productsRes = await fetch(`${API_BASE_URL}/products`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        if (!productsRes.ok) throw new Error("Failed to fetch products")
        const products = await productsRes.json()
        // Calculate stats
        const totalRevenue = invoices.reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0)
        const outstandingInvoices = invoices.filter((inv: any) => inv.status !== "Paid").reduce((sum: number, inv: any) => sum + (inv.totalAmount || 0), 0)
        const totalCustomers = customers.length
        const inventoryValue = products.reduce((sum: number, p: any) => sum + ((p.stock || 0) * (p.unitPrice || 0)), 0)
        setStats({
          totalRevenue,
          outstandingInvoices,
          totalCustomers,
          inventoryValue,
        })
        // Revenue by month for chart
        const monthlyRevenue: { [key: string]: number } = {}
        invoices.forEach((inv: any) => {
          if (!inv.date) return
          const date = new Date(inv.date)
          const month = date.toLocaleString("default", { month: "short" })
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (inv.totalAmount || 0)
        })
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        setRevenueData(months.map(m => ({ name: m, total: monthlyRevenue[m] || 0 })))
        // Recent transactions (latest 5 invoices)
        const sortedInvoices = [...invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        setRecentTransactions(sortedInvoices.slice(0, 5))
      } catch (err: any) {
        setError(err.message || "Error loading dashboard data")
      }
      setLoading(false)
    }
    fetchDashboardData()
    const socket = socketIOClient("http://localhost:5000")
    socket.on("product:created", fetchDashboardData)
    socket.on("product:updated", fetchDashboardData)
    socket.on("product:deleted", fetchDashboardData)
    socket.on("customer:created", fetchDashboardData)
    socket.on("customer:updated", fetchDashboardData)
    socket.on("customer:deleted", fetchDashboardData)
    socket.on("invoice:created", fetchDashboardData)
    socket.on("invoice:updated", fetchDashboardData)
    socket.on("invoice:deleted", fetchDashboardData)
    // Add more events as needed
    return () => {
      socket.disconnect()
    }
  }, [])

  if (!user) return null
  if (loading) return <div className="text-center py-8">Loading dashboard...</div>
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>
  if (!stats) return <div className="text-center py-8">No dashboard data found.</div>

  const dashboardStats = [
    {
      title: "Total Revenue",
      value: ` ₹${stats.totalRevenue.toLocaleString()}`,
      change: "",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      title: "Outstanding Invoices",
      value: ` ₹${stats.outstandingInvoices.toLocaleString()}`,
      change: "",
      icon: FileText,
      color: "text-orange-600",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers.toLocaleString(),
      change: "",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Inventory Value",
      value: ` ₹${stats.inventoryValue.toLocaleString()}`,
      change: "",
      icon: Package,
      color: "text-purple-600",
    },
  ]

  const quickActions = [
    { title: "Create Sales Invoice", icon: Receipt, href: "/sales/invoices/new" },
    { title: "Add Customer", icon: Users, href: "/masters/customers/new" },
    { title: "Record Purchase", icon: ShoppingCart, href: "/purchase/invoices/new" },
    { title: "Generate Report", icon: BarChart3, href: "/reports" },
    { title: "Manage Inventory", icon: Package, href: "/inventory" },
    { title: "Bank Reconciliation", icon: Wallet, href: "/banking" },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.role}!</h1>
          <p className="text-gray-600">Here's what's happening with your business today.</p>
        </div>
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Charts and Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <Overview data={revenueData} />
            </CardContent>
          </Card>
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions transactions={recentTransactions} />
            </CardContent>
          </Card>
        </div>
        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(action.href)}>
              <CardHeader className="flex flex-row items-center gap-2">
                <action.icon className="h-5 w-5" />
                <CardTitle className="text-sm font-medium">{action.title}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Module Access Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/sales")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Sales Management
              </CardTitle>
              <CardDescription>Invoices, quotations, and customer management</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/purchase")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Purchase Management
              </CardTitle>
              <CardDescription>Purchase orders, bills, and vendor management</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/inventory")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Control
              </CardTitle>
              <CardDescription>Stock management and product catalog</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/accounts")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Chart of Accounts
              </CardTitle>
              <CardDescription>Account structure and financial setup</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/reports")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reports & Analytics
              </CardTitle>
              <CardDescription>Financial reports and business insights</CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/banking")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Banking & Reconciliation
              </CardTitle>
              <CardDescription>Bank statements and payment matching</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
