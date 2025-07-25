"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Users, Building } from "lucide-react"
import { useRouter } from "next/navigation"
import { io as socketIOClient } from "socket.io-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

interface Customer {
  gstNumber: string | undefined
  id: string
  name: string
  email?: string
  phone?: string
  gstin?: string
  city?: string
  state?: string
  totalSales?: number
  outstanding?: number
  status?: string
}

interface Vendor {
  id: string
  name: string
  email?: string
  phone?: string
  gstin?: string
  city?: string
  state?: string
  totalPurchases?: number
  payable?: number
  status?: string
}

export default function MastersPage() {
  // State for each entity
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [invoices, setInvoices] = useState([])
  const [bills, setBills] = useState([])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState("")
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingVendors, setLoadingVendors] = useState(true)
  const [errorCustomers, setErrorCustomers] = useState("")
  const [errorVendors, setErrorVendors] = useState("")
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('products')

  // Modal state for Add/Edit
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("") // 'add' | 'edit'
  const [modalEntity, setModalEntity] = useState("") // 'product', 'customer', etc.
  const [modalData, setModalData] = useState<any>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Add state for product categories and new category modal
  const [categories, setCategories] = useState<string[]>(["General", "Electronics", "Furniture"]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // Add state for search terms for each tab
  const [productSearch, setProductSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [billSearch, setBillSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // Fetch all entities
  useEffect(() => {
    const token = localStorage.getItem("token")
    const fetchAll = async () => {
      const fetcher = async (url: string) => {
        const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        return res.ok ? res.json() : []
      }
      try {
        setLoadingCustomers(true)
        setLoadingVendors(true)
        const [productsData, customersData, vendorsData, invoicesData, billsData, usersData] = await Promise.all([
          fetcher(`${API_BASE_URL}/products`),
          fetcher(`${API_BASE_URL}/customers`),
          fetcher(`${API_BASE_URL}/vendors`),
          fetcher(`${API_BASE_URL}/sales-invoices`),
          fetcher(`${API_BASE_URL}/purchase-bills`),
          fetcher(`${API_BASE_URL}/users`)
        ])
        setProducts(productsData)
        setCustomers(customersData)
        setVendors(vendorsData)
        setInvoices(invoicesData)
        setBills(billsData)
        setUsers(usersData)
        setErrorCustomers("")
        setErrorVendors("")
      } catch (err: any) {
        setErrorCustomers("Failed to fetch customers")
        setErrorVendors("Failed to fetch vendors")
      } finally {
        setLoadingCustomers(false)
        setLoadingVendors(false)
      }
    }
    fetchAll()
    const socket = socketIOClient(API_BASE_URL.replace("/api", ""))
    socket.on("product:created", fetchAll)
    socket.on("product:updated", fetchAll)
    socket.on("product:deleted", fetchAll)
    socket.on("customer:created", fetchAll)
    socket.on("customer:updated", fetchAll)
    socket.on("customer:deleted", fetchAll)
    socket.on("vendor:created", fetchAll)
    socket.on("vendor:updated", fetchAll)
    socket.on("vendor:deleted", fetchAll)
    socket.on("invoice:created", fetchAll)
    socket.on("invoice:updated", fetchAll)
    socket.on("invoice:deleted", fetchAll)
    socket.on("purchasebill:created", fetchAll)
    socket.on("purchasebill:updated", fetchAll)
    socket.on("purchasebill:deleted", fetchAll)
    socket.on("user:created", fetchAll)
    socket.on("user:updated", fetchAll)
    socket.on("user:deleted", fetchAll)
    return () => { socket.disconnect() }
  }, [router])

  // --- CRUD handlers (example for products, repeat for others) ---
  const handleAddEntity = (entity: string) => {
    setModalType('add')
    setModalEntity(entity)
    setModalData(null)
    setShowModal(true)
  }
  const handleEditEntity = (entity: string, data: any) => {
    setModalType('edit')
    setModalEntity(entity)
    setModalData(data)
    setShowModal(true)
  }
  const handleDeleteEntity = async (entity: string, id: string) => {
    if (!window.confirm('Are you sure you want to delete this ' + entity + '?')) return
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      let url = `${API_BASE_URL}/`
      switch (entity) {
        case 'product': url += `products/${id}`; break
        case 'customer': url += `customers/${id}`; break
        case 'vendor': url += `vendors/${id}`; break
        case 'invoice': url += `sales-invoices/${id}`; break
        case 'bill': url += `purchase-bills/${id}`; break
        case 'user': url += `users/${id}`; break
        default: return
      }
      const res = await fetch(url, { method: 'DELETE', headers })
      if (!res.ok) throw new Error('Failed to delete')
      // fetchAll will be triggered by socket event
    } catch (err: any) {
      alert('Error deleting: ' + (err.message || err))
    }
  }
  // --- Modal Save Handler (pseudo, expand for each entity) ---
  const handleModalSave = async (formData: any) => {
    setModalLoading(true)
    try {
      if (modalEntity === 'user') {
        // Validate required fields
        if (!formData.name || !formData.email || !formData.password || !formData.role) {
          alert('Please fill all required fields: Name, Email, Password, Role.');
          setModalLoading(false)
          return
        }
        // Only allow add for users
        const res = await fetch(`${API_BASE_URL}/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role
          })
        })
        if (!res.ok) throw new Error('Failed to save')
        setShowModal(false)
        setModalData(null)
        // Refresh users list
        const usersRes = await fetch(`${API_BASE_URL}/users`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        if (usersRes.ok) setUsers(await usersRes.json())
        setModalLoading(false)
        return
      }
      if (modalEntity === 'bill') {
        // Validate required fields
        if (!formData.billNumber || !formData.vendorId || !formData.date || !formData.status || !formData.totalAmount || !formData.currency) {
          alert('Please fill all required fields: Bill Number, Vendor, Date, Status, Total Amount, Currency.');
          setModalLoading(false)
          return
        }
        // Only allow valid status values
        if (!["Paid", "Unpaid", "Partially Paid"].includes(formData.status)) {
          alert('Status must be Paid, Unpaid, or Partially Paid.');
          setModalLoading(false)
          return
        }
        // Default items to empty array if not present
        if (!formData.items) formData.items = []
      }
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
      let url = `${API_BASE_URL}/`
      let method = modalType === 'add' ? 'POST' : 'PUT'
      let body = JSON.stringify(formData)
      switch (modalEntity) {
        case 'product': url += modalType === 'add' ? 'products' : `products/${formData._id || formData.id}`; break
        case 'customer': url += modalType === 'add' ? 'customers' : `customers/${formData._id || formData.id}`; break
        case 'vendor': url += modalType === 'add' ? 'vendors' : `vendors/${formData._id || formData.id}`; break
        case 'invoice': url += modalType === 'add' ? 'sales-invoices' : `sales-invoices/${formData._id || formData.id}`; break
        case 'bill': url += modalType === 'add' ? 'purchase-bills' : `purchase-bills/${formData._id || formData.id}`; break
        case 'user': url += modalType === 'add' ? 'users' : `users/${formData._id || formData.id}`; break
        default: setModalLoading(false); return
      }
      const res = await fetch(url, { method, headers, body })
      if (!res.ok) throw new Error('Failed to save')
      setShowModal(false)
      setModalData(null)
      // fetchAll will be triggered by socket event
    } catch (err: any) {
      alert('Error saving: ' + (err.message || err))
    } finally {
      setModalLoading(false)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Filtered data for each tab
  const filteredProducts = products.filter((p: any) =>
    (p.name || "").toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku || "").toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredCustomers = customers.filter((c: any) =>
    (c.name || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.gstNumber || c.gstin || "").toLowerCase().includes(customerSearch.toLowerCase())
  );
  const filteredVendors = vendors.filter((v: any) =>
    (v.name || "").toLowerCase().includes(vendorSearch.toLowerCase()) ||
    (v.email || "").toLowerCase().includes(vendorSearch.toLowerCase()) ||
    (v.gstNumber || v.gstin || "").toLowerCase().includes(vendorSearch.toLowerCase())
  );
  const filteredInvoices = invoices.filter((i: any) =>
    (i.invoiceNumber || "").toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    (i.customerId?.name || "").toLowerCase().includes(invoiceSearch.toLowerCase())
  );
  const filteredBills = bills.filter((b: any) =>
    (b.billNumber || "").toLowerCase().includes(billSearch.toLowerCase()) ||
    (b.vendorId?.name || "").toLowerCase().includes(billSearch.toLowerCase())
  );
  const filteredUsers = users.filter((u: any) =>
    (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalCustomers = customers.length
  const activeCustomers = customers.filter((c) => c.status === "Active").length
  const totalVendors = vendors.length
  const activeVendors = vendors.filter((v) => v.status === "Active").length

  if (loadingCustomers || loadingVendors) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p>Loading master data...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (errorCustomers || errorVendors) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 text-red-600">
          <p>{errorCustomers || errorVendors}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Master Data Management</h1>
            <p className="text-gray-600">Manage all business entities from one place</p>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex justify-between mb-2">
              <Input placeholder="Search products..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-64" />
              <Button onClick={() => handleAddEntity('product')}>+ Add Product</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p: any) => (
                  <TableRow key={p._id || p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.sku}</TableCell>
                    <TableCell>{p.unit}</TableCell>
                    <TableCell>{p.currentStock}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell>{p.purchasePrice}</TableCell>
                    <TableCell>{p.salePrice}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEditEntity('product', p)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEntity('product', p._id || p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          {/* Customers Tab */}
          <TabsContent value="customers">
            <div className="flex justify-between mb-2">
              <Input placeholder="Search customers..." value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="w-64" />
              <Button onClick={() => handleAddEntity('customer')}>+ Add Customer</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((c: any) => (
                  <TableRow key={c._id || c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.email}</TableCell>
                    <TableCell>{c.phone}</TableCell>
                    <TableCell>{c.gstNumber}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEditEntity('customer', c)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEntity('customer', c._id || c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          {/* Vendors Tab */}
          <TabsContent value="vendors">
            <div className="flex justify-between mb-2">
              <Input placeholder="Search vendors..." value={vendorSearch} onChange={e => setVendorSearch(e.target.value)} className="w-64" />
              <Button onClick={() => handleAddEntity('vendor')}>+ Add Vendor</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>GST</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors.map((v: any) => (
                  <TableRow key={v._id || v.id}>
                    <TableCell>{v.name}</TableCell>
                    <TableCell>{v.email}</TableCell>
                    <TableCell>{v.phone}</TableCell>
                    <TableCell>{v.gstNumber}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEditEntity('vendor', v)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEntity('vendor', v._id || v.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <div className="flex justify-between mb-2">
              <Input placeholder="Search invoices..." value={invoiceSearch} onChange={e => setInvoiceSearch(e.target.value)} className="w-64" />
              <Button onClick={() => handleAddEntity('invoice')}>+ Add Invoice</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((i: any) => (
                  <TableRow key={i._id || i.id}>
                    <TableCell>{i.invoiceNumber}</TableCell>
                    <TableCell>{i.customerId?.name}</TableCell>
                    <TableCell>{i.date ? new Date(i.date).toLocaleDateString() : ''}</TableCell>
                    <TableCell>{i.status}</TableCell>
                    <TableCell>{i.totalAmount}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEditEntity('invoice', i)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEntity('invoice', i._id || i.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          {/* Bills Tab */}
          <TabsContent value="bills">
            <div className="flex justify-between mb-2">
              <Input placeholder="Search bills..." value={billSearch} onChange={e => setBillSearch(e.target.value)} className="w-64" />
              <Button onClick={() => handleAddEntity('bill')}>+ Add Bill</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((b: any) => (
                  <TableRow key={b._id || b.id}>
                    <TableCell>{b.billNumber}</TableCell>
                    <TableCell>{b.vendorId?.name}</TableCell>
                    <TableCell>{b.date ? new Date(b.date).toLocaleDateString() : ''}</TableCell>
                    <TableCell>{b.status}</TableCell>
                    <TableCell>{b.totalAmount}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEditEntity('bill', b)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEntity('bill', b._id || b.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
          {/* Users Tab */}
          <TabsContent value="users">
            <div className="flex justify-between mb-2">
              <Input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-64" />
              <Button onClick={() => handleAddEntity('user')}>+ Add User</Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u: any) => (
                  <TableRow key={u._id || u.id}>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.lastLogin ? new Date(u.lastLogin).toLocaleString() : ''}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEditEntity('user', u)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteEntity('user', u._id || u.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
        {/* Modal for Add/Edit (pseudo, you can expand forms for each entity) */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{modalType === 'add' ? 'Add' : 'Edit'} {modalEntity.charAt(0).toUpperCase() + modalEntity.slice(1)}</DialogTitle>
            </DialogHeader>
            {/* Render form fields based on modalEntity and modalType */}
            {modalEntity === 'product' && (
              <div className="space-y-2">
                <Input placeholder="Name" value={modalData?.name || ''} onChange={e => setModalData({ ...modalData, name: e.target.value })} />
                <div className="flex gap-2 items-center">
                  <Select value={modalData?.category || ''} onValueChange={val => setModalData({ ...modalData, category: val })}>
                    <SelectTrigger>{modalData?.category || 'Select Category'}</SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowNewCategory(true)}>+ New Category</Button>
                </div>
                {showNewCategory && (
                  <div className="flex gap-2 items-center mt-1">
                    <Input placeholder="New Category" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                    <Button type="button" size="sm" onClick={() => {
                      if (newCategory && !categories.includes(newCategory)) {
                        setCategories([...categories, newCategory]);
                        setModalData({ ...modalData, category: newCategory });
                        setNewCategory("");
                        setShowNewCategory(false);
                      }
                    }}>Add</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewCategory(false)}>Cancel</Button>
                  </div>
                )}
                <Input placeholder="SKU" value={modalData?.sku || ''} onChange={e => setModalData({ ...modalData, sku: e.target.value })} />
                <Input placeholder="Unit" value={modalData?.unit || ''} onChange={e => setModalData({ ...modalData, unit: e.target.value })} />
                <Input placeholder="Stock" type="number" value={modalData?.currentStock || ''} onChange={e => setModalData({ ...modalData, currentStock: e.target.value })} />
                <Input placeholder="Purchase Price" type="number" value={modalData?.purchasePrice || ''} onChange={e => setModalData({ ...modalData, purchasePrice: e.target.value })} />
                <Input placeholder="Sale Price" type="number" value={modalData?.salePrice || ''} onChange={e => setModalData({ ...modalData, salePrice: e.target.value })} />
              </div>
            )}
            {modalEntity === 'customer' && (
              <div className="space-y-2">
                <Input placeholder="Name" value={modalData?.name || ''} onChange={e => setModalData({ ...modalData, name: e.target.value })} />
                <Input placeholder="Email" value={modalData?.email || ''} onChange={e => setModalData({ ...modalData, email: e.target.value })} />
                <Input placeholder="Phone" value={modalData?.phone || ''} onChange={e => setModalData({ ...modalData, phone: e.target.value })} />
                <Input placeholder="GST Number" value={modalData?.gstNumber || ''} onChange={e => setModalData({ ...modalData, gstNumber: e.target.value })} />
              </div>
            )}
            {modalEntity === 'vendor' && (
              <div className="space-y-2">
                <Input placeholder="Name" value={modalData?.name || ''} onChange={e => setModalData({ ...modalData, name: e.target.value })} />
                <Input placeholder="Email" value={modalData?.email || ''} onChange={e => setModalData({ ...modalData, email: e.target.value })} />
                <Input placeholder="Phone" value={modalData?.phone || ''} onChange={e => setModalData({ ...modalData, phone: e.target.value })} />
                <Input placeholder="GST Number" value={modalData?.gstNumber || ''} onChange={e => setModalData({ ...modalData, gstNumber: e.target.value })} />
              </div>
            )}
            {modalEntity === 'invoice' && (
              <div className="space-y-2">
                <Input placeholder="Invoice Number" value={modalData?.invoiceNumber || ''} onChange={e => setModalData({ ...modalData, invoiceNumber: e.target.value })} />
                <Select value={modalData?.customerId || ''} onValueChange={val => setModalData({ ...modalData, customerId: val })}>
                  <SelectTrigger>{
                    customers.find(c => ((c as any)._id || c.id) === modalData?.customerId)?.name || 'Select Customer'
                  }</SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={(c as any)._id || c.id} value={(c as any)._id || c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={modalData?.date ? modalData.date.slice(0, 10) : ''} onChange={(e: any) => setModalData({ ...modalData, date: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
                <Input placeholder="Total Amount" type="number" value={modalData?.totalAmount || ''} onChange={e => setModalData({ ...modalData, totalAmount: e.target.value })} />
                <Select value={modalData?.status || ''} onValueChange={val => setModalData({ ...modalData, status: val })}>
                  <SelectTrigger>{modalData?.status || 'Select Status'}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Currency (e.g. INR)" value={modalData?.currency || ''} onChange={e => setModalData({ ...modalData, currency: e.target.value })} />
              </div>
            )}
            {modalEntity === 'bill' && (
              <div className="space-y-2">
                <Input placeholder="Bill Number" value={modalData?.billNumber || ''} onChange={e => setModalData({ ...modalData, billNumber: e.target.value })} />
                <Select value={modalData?.vendorId || ''} onValueChange={val => setModalData({ ...modalData, vendorId: val })}>
                  <SelectTrigger>{
                    vendors.find(v => ((v as any)._id || v.id) === modalData?.vendorId)?.name || 'Select Vendor'
                  }</SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => (
                      <SelectItem key={(v as any)._id || v.id} value={(v as any)._id || v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="date" value={modalData?.date ? modalData.date.slice(0, 10) : ''} onChange={(e: any) => setModalData({ ...modalData, date: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
                <Select value={modalData?.status || ''} onValueChange={val => setModalData({ ...modalData, status: val })}>
                  <SelectTrigger>{modalData?.status || 'Select Status'}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Total Amount" type="number" value={modalData?.totalAmount || ''} onChange={e => setModalData({ ...modalData, totalAmount: e.target.value })} />
                <Input placeholder="Currency (e.g. INR)" value={modalData?.currency || ''} onChange={e => setModalData({ ...modalData, currency: e.target.value })} />
              </div>
            )}
            {modalEntity === 'user' && (
              <div className="space-y-2">
                <Input placeholder="Name" value={modalData?.name || ''} onChange={e => setModalData({ ...modalData, name: e.target.value })} />
                <Input placeholder="Email" value={modalData?.email || ''} onChange={e => setModalData({ ...modalData, email: e.target.value })} />
                <Input placeholder="Password" type="password" value={modalData?.password || ''} onChange={e => setModalData({ ...modalData, password: e.target.value })} />
                <Input placeholder="Role (e.g. Admin, Accountant, Auditor)" value={modalData?.role || ''} onChange={e => setModalData({ ...modalData, role: e.target.value })} />
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowModal(false)} variant="outline">Cancel</Button>
              <Button onClick={() => handleModalSave(modalData)} disabled={modalLoading}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}