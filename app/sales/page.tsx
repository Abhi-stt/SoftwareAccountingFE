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
import { io as socketIOClient } from "socket.io-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectContent, SelectItem } from '@/components/ui/select'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [salesInvoices, setSalesInvoices] = useState<any[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(true)
  const [errorInvoices, setErrorInvoices] = useState("")
  const [quotations, setQuotations] = useState<any[]>([])
  const [loadingQuotations, setLoadingQuotations] = useState(true)
  const [errorQuotations, setErrorQuotations] = useState("")
  const router = useRouter()
  const [showEditModal, setShowEditModal] = useState(false)
  const [editInvoiceData, setEditInvoiceData] = useState<any>(null)
  // Add state for edit modals for quotations
  const [showEditQuotationModal, setShowEditQuotationModal] = useState(false)
  const [editQuotationData, setEditQuotationData] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])

  const fetchInvoices = async () => {
    setLoadingInvoices(true)
    setErrorInvoices("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/sales-invoices`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          router.push("/login")
          return
        }
        throw new Error("Failed to fetch sales invoices")
      }
      const data = await res.json()
      setSalesInvoices(data)
    } catch (err: any) {
      setErrorInvoices(err.message || "Error fetching sales invoices")
    } finally {
      setLoadingInvoices(false)
    }
  }
  const fetchQuotations = async () => {
    setLoadingQuotations(true)
    setErrorQuotations("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/quotations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          router.push("/login")
          return
        }
        throw new Error("Failed to fetch quotations")
      }
      const data = await res.json()
      setQuotations(data)
    } catch (err: any) {
      setErrorQuotations(err.message || "Error fetching quotations")
    } finally {
      setLoadingQuotations(false)
    }
  }
  const fetchCustomers = async () => {
    setLoadingInvoices(true)
    setErrorInvoices("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/customers`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          router.push("/login")
          return
        }
        throw new Error("Failed to fetch customers")
      }
      const data = await res.json()
      setCustomers(data)
    } catch (err: any) {
      setErrorInvoices(err.message || "Error fetching customers")
    } finally {
      setLoadingInvoices(false)
    }
  }
  useEffect(() => {
    fetchInvoices()
    fetchQuotations()
    fetchCustomers()
    // Socket.IO real-time updates
    const socket = socketIOClient("http://localhost:5000")
    socket.on("invoice:created", fetchInvoices)
    socket.on("invoice:updated", fetchInvoices)
    socket.on("invoice:deleted", fetchInvoices)
    socket.on("quotation:created", fetchQuotations)
    socket.on("quotation:updated", fetchQuotations)
    socket.on("quotation:deleted", fetchQuotations)
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
      case "Overdue":
        return "bg-red-100 text-red-800"
      case "Sent":
        return "bg-blue-100 text-blue-800"
      case "Accepted":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredInvoices = salesInvoices.filter(
    (invoice) =>
      (invoice.customer?.name || invoice.customer || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.invoiceNumber || invoice.id || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredQuotations = quotations.filter(
    (quote) =>
      (quote.customerId?.name || quote.customer || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.quotationNumber || quote.id || "").toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/sales-invoices/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete invoice');
      fetchInvoices();
    } catch (err: any) {
      alert('Error deleting invoice: ' + (err.message || err));
    }
  };
  const handleDeleteQuotation = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this quotation?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/quotations/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete quotation');
      fetchQuotations();
    } catch (err: any) {
      alert('Error deleting quotation: ' + (err.message || err));
    }
  };

  const handleEditInvoice = (invoice: any) => {
    setEditInvoiceData({ ...invoice })
    setShowEditModal(true)
  }
  const handleSaveEditInvoice = async () => {
    if (!editInvoiceData.invoiceNumber || !editInvoiceData.customerId || !editInvoiceData.date || !editInvoiceData.status || !editInvoiceData.totalAmount || !editInvoiceData.currency) {
      alert('Please fill all required fields.');
      return
    }
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
    const payload = { ...editInvoiceData };
    if (payload.dueDate === '' || !payload.dueDate) delete payload.dueDate;
    const res = await fetch(`${API_BASE_URL}/sales-invoices/${editInvoiceData._id || editInvoiceData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      alert('Failed to save changes')
      return
    }
    setShowEditModal(false)
    setEditInvoiceData(null)
    fetchInvoices()
  }

  // Edit handler for quotations
  const handleEditQuotation = (quote: any) => {
    setEditQuotationData({ ...quote })
    setShowEditQuotationModal(true)
  }
  const handleSaveEditQuotation = async () => {
    if (!editQuotationData.quotationNumber || !editQuotationData.customerId || !editQuotationData.date || !editQuotationData.status || !editQuotationData.totalAmount || !editQuotationData.currency) {
      alert('Please fill all required fields.');
      return
    }
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
    const payload = { ...editQuotationData };
    if (payload.validUntil === '' || !payload.validUntil) delete payload.validUntil;
    const res = await fetch(`${API_BASE_URL}/quotations/${editQuotationData._id || editQuotationData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      alert('Failed to save changes')
      return
    }
    setShowEditQuotationModal(false)
    setEditQuotationData(null)
    fetchQuotations()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Sales Management</h1>
            <p className="text-gray-600">Manage invoices, quotations, and customer transactions</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/sales/quotations/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Quotation
            </Button>
            <Button onClick={() => router.push("/sales/invoices/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹4,27,500</div>
              <p className="text-xs text-muted-foreground">+12.5% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹1,50,500</div>
              <p className="text-xs text-muted-foreground">2 overdue invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹2,77,000</div>
              <p className="text-xs text-muted-foreground">18 invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹1,06,875</div>
              <p className="text-xs text-muted-foreground">Per transaction</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="invoices">Sales Invoices</TabsTrigger>
              <TabsTrigger value="quotations">Quotations</TabsTrigger>
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
                <CardTitle>Sales Invoices</CardTitle>
                <CardDescription>Manage your sales invoices and track payments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Customer</TableHead>
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
                          Loading invoices...
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
                          No invoices found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice._id || invoice.id}>
                          <TableCell className="font-medium">{invoice.invoiceNumber || invoice._id || invoice.id}</TableCell>
                          <TableCell>{invoice.customerId?.name || invoice.customer?.name || invoice.customerId || invoice.customer || '-'}</TableCell>
                          <TableCell>{invoice.date ? new Date(invoice.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : ''}</TableCell>
                          <TableCell>₹{typeof invoice.totalAmount === 'number' ? invoice.totalAmount.toLocaleString() : '-'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(invoice.status)}>{invoice.status || '-'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/sales/invoices/${invoice._id || invoice.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditInvoice(invoice)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteInvoice(invoice._id || invoice.id)}>
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

          <TabsContent value="quotations">
            <Card>
              <CardHeader>
                <CardTitle>Quotations</CardTitle>
                <CardDescription>Manage quotations and convert to invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quote ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Valid Until</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingQuotations ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading quotations...
                        </TableCell>
                      </TableRow>
                    ) : errorQuotations ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-red-500">
                          {errorQuotations}
                        </TableCell>
                      </TableRow>
                    ) : filteredQuotations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No quotations found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredQuotations.map((quote) => (
                        <TableRow key={quote._id || quote.id}>
                          <TableCell className="font-medium">{quote.quotationNumber || quote._id || quote.id}</TableCell>
                          <TableCell>{quote.customerId?.name || quote.customer?.name || quote.customerId || quote.customer || '-'}</TableCell>
                          <TableCell>{quote.date ? new Date(quote.date).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>{quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : '-'}</TableCell>
                          <TableCell>₹{typeof quote.totalAmount === 'number' ? quote.totalAmount.toLocaleString() : '-'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(quote.status)}>{quote.status || '-'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/sales/quotations/${quote._id || quote.id}`)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditQuotation(quote)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteQuotation(quote._id || quote.id)}>
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

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input placeholder="Invoice Number" value={editInvoiceData?.invoiceNumber || ''} onChange={e => setEditInvoiceData({ ...editInvoiceData, invoiceNumber: e.target.value })} />
            <Select value={editInvoiceData?.customerId || ''} onValueChange={val => setEditInvoiceData({ ...editInvoiceData, customerId: val })}>
              <SelectTrigger>{
                customers.find(c => ((c as any)._id || c.id) === editInvoiceData?.customerId)?.name || 'Select Customer'
              }</SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={(c as any)._id || c.id} value={(c as any)._id || c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={editInvoiceData?.date ? editInvoiceData.date.slice(0, 10) : ''} onChange={e => setEditInvoiceData({ ...editInvoiceData, date: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
            <Input type="date" value={editInvoiceData?.dueDate ? editInvoiceData.dueDate.slice(0, 10) : ''} onChange={e => setEditInvoiceData({ ...editInvoiceData, dueDate: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
            <Input placeholder="Total Amount" type="number" value={editInvoiceData?.totalAmount || ''} onChange={e => setEditInvoiceData({ ...editInvoiceData, totalAmount: e.target.value })} />
            <Select value={editInvoiceData?.status || ''} onValueChange={val => setEditInvoiceData({ ...editInvoiceData, status: val })}>
              <SelectTrigger>{editInvoiceData?.status || 'Select Status'}</SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Unpaid">Unpaid</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Currency (e.g. INR)" value={editInvoiceData?.currency || ''} onChange={e => setEditInvoiceData({ ...editInvoiceData, currency: e.target.value })} />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowEditModal(false)} variant="outline">Cancel</Button>
            <Button onClick={handleSaveEditInvoice}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditQuotationModal} onOpenChange={setShowEditQuotationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input placeholder="Quotation Number" value={editQuotationData?.quotationNumber || ''} onChange={e => setEditQuotationData({ ...editQuotationData, quotationNumber: e.target.value })} />
            <Select value={editQuotationData?.customerId || ''} onValueChange={val => setEditQuotationData({ ...editQuotationData, customerId: val })}>
              <SelectTrigger>{
                customers.find(c => ((c as any)._id || c.id) === editQuotationData?.customerId)?.name || 'Select Customer'
              }</SelectTrigger>
              <SelectContent>
                {customers.map(c => (
                  <SelectItem key={(c as any)._id || c.id} value={(c as any)._id || c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={editQuotationData?.date ? editQuotationData.date.slice(0, 10) : ''} onChange={e => setEditQuotationData({ ...editQuotationData, date: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
            <Input type="date" value={editQuotationData?.validUntil ? editQuotationData.validUntil.slice(0, 10) : ''} onChange={e => setEditQuotationData({ ...editQuotationData, validUntil: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
            <Input placeholder="Total Amount" type="number" value={editQuotationData?.totalAmount || ''} onChange={e => setEditQuotationData({ ...editQuotationData, totalAmount: e.target.value })} />
            <Select value={editQuotationData?.status || ''} onValueChange={val => setEditQuotationData({ ...editQuotationData, status: val })}>
              <SelectTrigger>{editQuotationData?.status || 'Select Status'}</SelectTrigger>
              <SelectContent>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Accepted">Accepted</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Currency (e.g. INR)" value={editQuotationData?.currency || ''} onChange={e => setEditQuotationData({ ...editQuotationData, currency: e.target.value })} />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowEditQuotationModal(false)} variant="outline">Cancel</Button>
            <Button onClick={handleSaveEditQuotation}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

