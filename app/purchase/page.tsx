"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, Download, Eye, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { io as socketIOClient } from "socket.io-client"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function PurchasePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [purchaseInvoices, setPurchaseInvoices] = useState<any[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [errorInvoices, setErrorInvoices] = useState("")
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [errorOrders, setErrorOrders] = useState("")

  const router = useRouter()

  const fetchInvoices = async () => {
    setLoadingInvoices(true)
    setErrorInvoices("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/purchase-bills`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          router.push("/login")
          return
        }
        throw new Error("Failed to fetch purchase bills")
      }
      const data = await res.json()
      setPurchaseInvoices(data)
    } catch (err: any) {
      setErrorInvoices(err.message || "Error fetching purchase bills")
    } finally {
      setLoadingInvoices(false)
    }
  }

  const fetchOrders = async () => {
    setLoadingOrders(true)
    setErrorOrders("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/purchase-orders`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error("Failed to fetch purchase orders")
      setPurchaseOrders(await res.json())
    } catch (err: any) {
      setErrorOrders(err.message || "Error fetching purchase orders")
    } finally {
      setLoadingOrders(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
    fetchOrders()
    // Socket.IO real-time updates
    const socket = socketIOClient("http://localhost:5000")
    socket.on("purchasebill:created", fetchInvoices)
    socket.on("purchasebill:updated", fetchInvoices)
    socket.on("purchasebill:deleted", fetchInvoices)
    socket.on("purchaseorder:created", fetchOrders)
    socket.on("purchaseorder:updated", fetchOrders)
    socket.on("purchaseorder:deleted", fetchOrders)
    return () => {
      socket.disconnect()
    }
  }, [router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800"
      case "Pending":
        return "bg-yellow-100 text-yellow-800"
      case "Approved":
        return "bg-blue-100 text-blue-800"
      case "Overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredInvoices = purchaseInvoices.filter(
    (invoice) =>
      (invoice.vendor?.name || invoice.vendor || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.billNumber || invoice.id || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredOrders = purchaseOrders.filter(
    (order) =>
      (order.vendorId?.name?.toLowerCase() || order.vendor?.name?.toLowerCase() || order.vendorId?.toLowerCase() || order.vendor?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (order.orderNumber || order._id || order.id || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDeleteBill = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/purchase-bills/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete bill');
      fetchInvoices();
    } catch (err: any) {
      alert('Error deleting bill: ' + (err.message || err));
    }
  };
  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/purchase-orders/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete order');
      fetchOrders();
    } catch (err: any) {
      alert('Error deleting order: ' + (err.message || err));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Purchase Management</h1>
            <p className="text-gray-600">Manage purchase orders, bills, and vendor transactions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/purchase/orders/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
            <Button onClick={() => router.push("/purchase/invoices/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Bill
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹2,55,000</div>
              <p className="text-xs text-muted-foreground">+8.2% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹1,25,000</div>
              <p className="text-xs text-muted-foreground">1 bill pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹1,85,000</div>
              <p className="text-xs text-muted-foreground">12 transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">3 new this month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="invoices">Purchase Bills</TabsTrigger>
              <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
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

          <TabsContent value="invoices">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Bills</CardTitle>
                <CardDescription>Manage vendor bills and track payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill ID</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingInvoices ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading bills...
                        </TableCell>
                      </TableRow>
                    ) : errorInvoices ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-red-500">
                          {errorInvoices}
                        </TableCell>
                      </TableRow>
                    ) : filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No bills found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice._id || invoice.id}>
                          <TableCell className="font-medium">{invoice.billNumber || invoice._id || invoice.id}</TableCell>
                          <TableCell>{invoice.vendorId?.name || invoice.vendor?.name || invoice.vendorId || invoice.vendor || '-'}</TableCell>
                          <TableCell>{invoice.date ? new Date(invoice.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>₹{typeof invoice.totalAmount === 'number' ? invoice.totalAmount.toLocaleString() : '-'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(invoice.status)}>{invoice.status || '-'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(invoice)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => router.push(`/purchase/invoices/${invoice._id || invoice.id}/edit`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteBill(invoice._id || invoice.id)}>
                                <Trash2 className="h-4 w-4" />
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

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Purchase Orders</CardTitle>
                <CardDescription>Manage purchase orders and approvals</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO ID</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Expected Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingOrders ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading orders...
                        </TableCell>
                      </TableRow>
                    ) : errorOrders ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-red-500">
                          {errorOrders}
                        </TableCell>
                      </TableRow>
                    ) : purchaseOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order._id || order.id}>
                          <TableCell className="font-medium">{order.orderNumber || order._id || order.id}</TableCell>
                          <TableCell>{order.vendorId?.name || order.vendor?.name || order.vendorId || order.vendor || '-'}</TableCell>
                          <TableCell>{order.date ? new Date(order.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>₹{typeof order.totalAmount === 'number' ? order.totalAmount.toLocaleString() : '-'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>{order.status || '-'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => router.push(`/purchase/orders/${order._id || order.id}/edit`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteOrder(order._id || order.id)}>
                                <Trash2 className="h-4 w-4" />
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
      </div>

      {selectedInvoice && (
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Invoice Details: {selectedInvoice.billNumber}</DialogTitle>
              <DialogDescription>
                Vendor: {selectedInvoice.vendor?.name || selectedInvoice.vendor}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Badge className={`col-span-3 ${getStatusColor(selectedInvoice.status)}`}>{selectedInvoice.status}</Badge>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <p id="amount" className="col-span-3">
                  ₹{selectedInvoice.totalAmount?.toLocaleString()}
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <p id="date" className="col-span-3">
                  {new Date(selectedInvoice.date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedInvoice(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Order Details: {selectedOrder.id}</DialogTitle>
              <DialogDescription>
                Vendor: {selectedOrder.vendor}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Badge className={`col-span-3 ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</Badge>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Amount
                </Label>
                <p id="amount" className="col-span-3">
                  ₹{selectedOrder.amount?.toLocaleString()}
                </p>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Expected Date
                </Label>
                <p id="date" className="col-span-3">
                  {new Date(selectedOrder.expectedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedOrder(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  )
}
