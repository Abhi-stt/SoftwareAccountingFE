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
  const [searchTerm, setSearchTerm] = useState("")
  const [customers, setCustomers] = useState<Customer[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingVendors, setLoadingVendors] = useState(true)
  const [errorCustomers, setErrorCustomers] = useState("")
  const [errorVendors, setErrorVendors] = useState("")
  const router = useRouter()

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token")
      setLoadingCustomers(true)
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const customersRes = await fetch(`${API_BASE_URL}/customers`, { headers })
      if (!customersRes.ok) throw new Error("Failed to fetch customers")
      const customersData = await customersRes.json()
      setCustomers(customersData || [])
    } catch (err: any) {
      setErrorCustomers(err.message || "Error fetching customers")
    } finally {
      setLoadingCustomers(false)
    }
  }
  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem("token")
      setLoadingVendors(true)
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      const vendorsRes = await fetch(`${API_BASE_URL}/vendors`, { headers })
      if (!vendorsRes.ok) throw new Error("Failed to fetch vendors")
      const vendorsData = await vendorsRes.json()
      setVendors(vendorsData || [])
    } catch (err: any) {
      setErrorVendors(err.message || "Error fetching vendors")
    } finally {
      setLoadingVendors(false)
    }
  }
  useEffect(() => {
    const fetchData = async () => {
      await fetchCustomers()
      await fetchVendors()
    }
    fetchData()
    // Socket.IO real-time updates
    const socket = socketIOClient("http://localhost:5000")
    socket.on("customer:created", fetchCustomers)
    socket.on("customer:updated", fetchCustomers)
    socket.on("customer:deleted", fetchCustomers)
    socket.on("vendor:created", fetchVendors)
    socket.on("vendor:updated", fetchVendors)
    socket.on("vendor:deleted", fetchVendors)
    return () => {
      socket.disconnect()
    }
  }, [router])

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

  const filteredCustomers = customers.filter(
    (customer) =>
      (customer.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.gstNumber || customer.gstin || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredVendors = vendors.filter(
    (vendor) =>
      (vendor.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (vendor.gstin || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/customers/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete customer');
      fetchCustomers();
    } catch (err: any) {
      alert('Error deleting customer: ' + (err.message || err));
    }
  };
  const handleDeleteVendor = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/vendors/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete vendor');
      fetchVendors();
    } catch (err: any) {
      alert('Error deleting vendor: ' + (err.message || err));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Master Data Management</h1>
            <p className="text-gray-600">Manage customers, vendors, and business partners</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/masters/vendors/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
            <Button onClick={() => router.push("/masters/customers/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCustomers}</div>
              <p className="text-xs text-muted-foreground">{activeCustomers} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVendors}</div>
              <p className="text-xs text-muted-foreground">{activeVendors} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Receivables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹1,50,500</div>
              <p className="text-xs text-muted-foreground">From customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Payables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹1,25,000</div>
              <p className="text-xs text-muted-foreground">To vendors</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="customers" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
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

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>Customer Master</CardTitle>
                <CardDescription>Manage customer information and track sales</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Total Sales</TableHead>
                      <TableHead>Outstanding</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          No customers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((customer: any) => (
                        <TableRow key={customer._id || customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email || '-'}</TableCell>
                          <TableCell>{customer.phone || '-'}</TableCell>
                          <TableCell>{customer.gstNumber || '-'}</TableCell>
                          <TableCell>{customer.city || ''}{customer.city && customer.state ? ', ' : ''}{customer.state || ''}</TableCell>
                          <TableCell>₹{(customer.totalPurchases || 0).toLocaleString()}</TableCell>
                          <TableCell className={(customer.payable || 0) > 0 ? 'text-red-600' : 'text-green-600'}>
                            ₹{(customer.payable || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(customer.status)}>
                              {customer.status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => router.push(`/masters/customers/${customer._id || customer.id}/edit`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteCustomer(customer._id || customer.id)}>
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

          <TabsContent value="vendors">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Master</CardTitle>
                <CardDescription>Manage vendor information and track purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>GSTIN</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Total Purchases</TableHead>
                      <TableHead>Payable</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          No vendors found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredVendors.map((vendor: any) => (
                        <TableRow key={vendor._id || vendor.id}>
                          <TableCell className="font-medium">{vendor.name}</TableCell>
                          <TableCell>{vendor.email || '-'}</TableCell>
                          <TableCell>{vendor.phone || '-'}</TableCell>
                          <TableCell>{vendor.gstNumber || '-'}</TableCell>
                          <TableCell>{vendor.city || ''}{vendor.city && vendor.state ? ', ' : ''}{vendor.state || ''}</TableCell>
                          <TableCell>₹{(vendor.totalPurchases || 0).toLocaleString()}</TableCell>
                          <TableCell className={(vendor.payable || 0) > 0 ? 'text-red-600' : 'text-green-600'}>
                            ₹{(vendor.payable || 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(vendor.status)}>
                              {vendor.status || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => router.push(`/masters/vendors/${vendor._id || vendor.id}/edit`)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteVendor(vendor._id || vendor.id)}>
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
    </DashboardLayout>
  )
}