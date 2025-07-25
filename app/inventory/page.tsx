"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, Package, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { io as socketIOClient } from "socket.io-client"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  status: string;
}

interface StockMovement {
  id: string;
  date: string;
  productId?: {
    name: string;
  };
  type: string;
  quantity: number;
  reference?: string;
  balance: number;
}

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([])
  const [loadingMovements, setLoadingMovements] = useState(true)
  const [errorMovements, setErrorMovements] = useState("")
  const router = useRouter()

  // Add state for product and stock movement modals
  const [showEditProductModal, setShowEditProductModal] = useState(false)
  const [editProductData, setEditProductData] = useState<any>(null)
  const [showEditMovementModal, setShowEditMovementModal] = useState(false)
  const [editMovementData, setEditMovementData] = useState<any>(null)

  // Add at the top, after useState for products:
  const [categories, setCategories] = useState<string[]>(["General", "Electronics", "Furniture"]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  // Helper to fetch products
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token")
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      setLoading(true)
      const productsRes = await fetch(`${API_BASE_URL}/products`, { headers })
      if (!productsRes.ok) throw new Error("Failed to fetch products")
      const productsData = await productsRes.json()
      setProducts((productsData || []).map((p: any) => ({ ...p, id: p._id || p.id })))
    } catch (err: any) {
      setError(err.message || "Error fetching data")
    } finally {
      setLoading(false)
    }
  }

  // Edit handler for products
  const handleEditProduct = (product: any) => {
    setEditProductData({ ...product })
    setShowEditProductModal(true)
  }
  const handleSaveEditProduct = async () => {
    if (!editProductData.name || !editProductData.sku || !editProductData.category || !editProductData.currentStock || !editProductData.unit || !editProductData.unitPrice) {
      alert('Please fill all required fields.');
      return
    }
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
    const payload = { ...editProductData };
    const res = await fetch(`${API_BASE_URL}/products/${editProductData._id || editProductData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      alert('Failed to save changes')
      return
    }
    setShowEditProductModal(false)
    setEditProductData(null)
    fetchProducts()
  }
  // Add handler for new product
  const handleAddProduct = () => {
    setEditProductData({ name: '', sku: '', category: '', currentStock: 0, unit: '', unitPrice: 0, minStock: 0, status: 'In Stock' })
    setShowEditProductModal(true)
  }
  const handleSaveNewProduct = async () => {
    if (!editProductData.name || !editProductData.sku || !editProductData.category || !editProductData.currentStock || !editProductData.unit || !editProductData.unitPrice) {
      alert('Please fill all required fields.');
      return
    }
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
    const payload = { ...editProductData };
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      alert('Failed to save product')
      return
    }
    setShowEditProductModal(false)
    setEditProductData(null)
    fetchProducts()
  }
  // Delete handler for products
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete product');
      // fetchProducts will be triggered by socket event
    } catch (err: any) {
      alert('Error deleting product: ' + (err.message || err));
    }
  }

  const handleDeleteMovement = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this stock movement?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/stock-movements/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete stock movement');
      // fetchStockMovements will be triggered by socket event
    } catch (err: any) {
      alert('Error deleting stock movement: ' + (err.message || err));
    }
  }

  // Helper to fetch stock movements
  const fetchStockMovements = async () => {
    try {
      const token = localStorage.getItem("token")
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      setLoadingMovements(true)
      const movementsRes = await fetch(`${API_BASE_URL}/stock-movements`, { headers })
      if (!movementsRes.ok) throw new Error("Failed to fetch stock movements")
      const movementsData = await movementsRes.json()
      setStockMovements(movementsData || [])
    } catch (err: any) {
      setErrorMovements(err.message || "Error fetching data")
    } finally {
      setLoadingMovements(false)
    }
  }

  // Edit handler for stock movements
  const handleEditMovement = (movement: any) => {
    setEditMovementData({ ...movement })
    setShowEditMovementModal(true)
  }
  const handleSaveEditMovement = async () => {
    if (!editMovementData.productId || !editMovementData.type || !editMovementData.quantity || !editMovementData.date) {
      alert('Please fill all required fields.');
      return
    }
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
    const payload = { ...editMovementData };
    const res = await fetch(`${API_BASE_URL}/stock-movements/${editMovementData._id || editMovementData.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      alert('Failed to save changes')
      return
    }
    setShowEditMovementModal(false)
    setEditMovementData(null)
    fetchStockMovements()
  }
  // Add handler for new stock movement
  const handleAddMovement = () => {
    setEditMovementData({ productId: '', type: '', quantity: 0, date: '', reference: '', balance: 0 })
    setShowEditMovementModal(true)
  }
  const handleSaveNewMovement = async () => {
    if (!editMovementData.productId || !editMovementData.type || !editMovementData.quantity || !editMovementData.date) {
      alert('Please fill all required fields.');
      return
    }
    const token = localStorage.getItem('token')
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
    const payload = { ...editMovementData };
    const res = await fetch(`${API_BASE_URL}/stock-movements`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    if (!res.ok) {
      alert('Failed to save stock movement')
      return
    }
    setShowEditMovementModal(false)
    setEditMovementData(null)
    fetchStockMovements()
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token")
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

        // Fetch products
        await fetchProducts()

        // Fetch stock movements
        setLoadingMovements(true)
        const movementHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
        const movementsRes = await fetch(`${API_BASE_URL}/stock-movements`, { headers: movementHeaders })
        if (!movementsRes.ok) {
          throw new Error("Failed to fetch stock movements")
        }
        const movementsData = await movementsRes.json()
        setStockMovements(movementsData || [])
      } catch (err: any) {
        setError(err.message || "Error fetching data")
        setErrorMovements(err.message || "Error fetching data")
      } finally {
        setLoading(false)
        setLoadingMovements(false)
      }
    }

    fetchData()

    // Socket.IO real-time updates
    const socket = socketIOClient("http://localhost:5000")
    socket.on("product:created", fetchProducts)
    socket.on("product:updated", fetchProducts)
    socket.on("product:deleted", fetchProducts)
    socket.on("stockmovement:created", fetchStockMovements)
    socket.on("stockmovement:updated", fetchStockMovements)
    socket.on("stockmovement:deleted", fetchStockMovements)

    return () => {
      socket.disconnect()
    }
  }, [router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-100 text-green-800"
      case "Low Stock":
        return "bg-yellow-100 text-yellow-800"
      case "Out of Stock":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case "Sale":
        return "text-red-600"
      case "Purchase":
        return "text-green-600"
      case "Adjustment":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredMovements = stockMovements.filter(
    (movement) =>
      (movement.productId?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movement.reference || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalInventoryValue = products.reduce(
    (sum, product) => sum + (product.totalValue || 0),
    0
  )
  const lowStockItems = products.filter(
    (product) => product.currentStock <= (product.minStock || 0)
  ).length
  const outOfStockItems = products.filter(
    (product) => (product.currentStock || 0) === 0
  ).length

  if (loading || loadingMovements) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p>Loading inventory data...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || errorMovements) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64 text-red-600">
          <p>{error || errorMovements}</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-gray-600">Track stock levels, manage products, and monitor inventory movements</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/inventory/adjustment")}>
              <Plus className="h-4 w-4 mr-2" />
              Stock Adjustment
            </Button>
            <Button onClick={() => router.push("/inventory/products/new")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{totalInventoryValue?.toLocaleString() || '0'}
              </div>
              <p className="text-xs text-muted-foreground">Across all products</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">Active products</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Need reordering</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{outOfStockItems}</div>
              <p className="text-xs text-muted-foreground">Urgent attention</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="movements">Stock Movements</TabsTrigger>
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

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Product Inventory</CardTitle>
                <CardDescription>Manage your product catalog and stock levels</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No products found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => {
                        const id = (product as any)._id || product.id;
                        const salePrice = (product as any).salePrice || product.unitPrice || 0;
                        return (
                          <TableRow key={id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.sku}</TableCell>
                            <TableCell>{product.category || '-'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {product.currentStock} {product.unit || '-'}
                                {product.currentStock <= (product.minStock || 0) && (
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>₹{salePrice.toLocaleString()}</TableCell>
                            <TableCell>₹{((product.currentStock * salePrice) || 0).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(product.status || (product.currentStock === 0 ? 'Out of Stock' : product.currentStock <= (product.minStock || 0) ? 'Low Stock' : 'In Stock'))}>
                                {product.status || (product.currentStock === 0 ? 'Out of Stock' : product.currentStock <= (product.minStock || 0) ? 'Low Stock' : 'In Stock')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle>Stock Movements</CardTitle>
                <CardDescription>Track all inventory transactions and adjustments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No stock movements found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMovements.map((movement) => {
                        const id = (movement as any)._id || movement.id;
                        return (
                          <TableRow key={id}>
                            <TableCell>{movement.date ? new Date(movement.date).toLocaleDateString() : '-'}</TableCell>
                            <TableCell className="font-medium">{movement.productId?.name || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getMovementColor(movement.type)}>
                                {movement.type}
                              </Badge>
                            </TableCell>
                            <TableCell className={getMovementColor(movement.type)}>
                              {typeof movement.quantity === 'number' ? (movement.quantity > 0 ? '+' : '') + movement.quantity : '-'}
                            </TableCell>
                            <TableCell>{movement.reference || '-'}</TableCell>
                            <TableCell>{typeof movement.balance === 'number' ? movement.balance : '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => handleEditMovement(movement)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteMovement(id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals for editing/adding Products and Stock Movements */}
      <Dialog open={showEditProductModal} onOpenChange={setShowEditProductModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editProductData?._id || editProductData?.id ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input placeholder="Name" value={editProductData?.name || ''} onChange={e => setEditProductData({ ...editProductData, name: e.target.value })} />
            <Input placeholder="SKU" value={editProductData?.sku || ''} onChange={e => setEditProductData({ ...editProductData, sku: e.target.value })} />
            <div className="flex gap-2 items-center">
              <Select value={editProductData?.category || ''} onValueChange={val => setEditProductData({ ...editProductData, category: val })}>
                <SelectTrigger>{editProductData?.category || 'Select Category'}</SelectTrigger>
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
                    setEditProductData({ ...editProductData, category: newCategory });
                    setNewCategory("");
                    setShowNewCategory(false);
                  }
                }}>Add</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewCategory(false)}>Cancel</Button>
              </div>
            )}
            <Input placeholder="Current Stock" type="number" value={editProductData?.currentStock || ''} onChange={e => setEditProductData({ ...editProductData, currentStock: e.target.value })} />
            <Input placeholder="Min Stock" type="number" value={editProductData?.minStock || ''} onChange={e => setEditProductData({ ...editProductData, minStock: e.target.value })} />
            <Input placeholder="Unit" value={editProductData?.unit || ''} onChange={e => setEditProductData({ ...editProductData, unit: e.target.value })} />
            <Input placeholder="Unit Price" type="number" value={editProductData?.unitPrice || ''} onChange={e => setEditProductData({ ...editProductData, unitPrice: e.target.value })} />
            <Select value={editProductData?.status || ''} onValueChange={val => setEditProductData({ ...editProductData, status: val })}>
              <SelectTrigger>{editProductData?.status || 'Select Status'}</SelectTrigger>
              <SelectContent>
                <SelectItem value="In Stock">In Stock</SelectItem>
                <SelectItem value="Low Stock">Low Stock</SelectItem>
                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowEditProductModal(false)} variant="outline">Cancel</Button>
            <Button onClick={editProductData?._id || editProductData?.id ? handleSaveEditProduct : handleSaveNewProduct}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showEditMovementModal} onOpenChange={setShowEditMovementModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMovementData?._id || editMovementData?.id ? 'Edit Stock Movement' : 'Add Stock Movement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input type="date" value={editMovementData?.date ? editMovementData.date.slice(0, 10) : ''} onChange={e => setEditMovementData({ ...editMovementData, date: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
            <Select value={editMovementData?.productId || ''} onValueChange={val => setEditMovementData({ ...editMovementData, productId: val })}>
              <SelectTrigger>{products.find(p => ((p as any)._id || p.id) === editMovementData?.productId)?.name || 'Select Product'}</SelectTrigger>
              <SelectContent>
                {products.map(p => (
                  <SelectItem key={(p as any)._id || p.id} value={(p as any)._id || p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Type (Sale, Purchase, Adjustment)" value={editMovementData?.type || ''} onChange={e => setEditMovementData({ ...editMovementData, type: e.target.value })} />
            <Input placeholder="Quantity" type="number" value={editMovementData?.quantity || ''} onChange={e => setEditMovementData({ ...editMovementData, quantity: e.target.value })} />
            <Input placeholder="Reference" value={editMovementData?.reference || ''} onChange={e => setEditMovementData({ ...editMovementData, reference: e.target.value })} />
            <Input placeholder="Balance" type="number" value={editMovementData?.balance || ''} onChange={e => setEditMovementData({ ...editMovementData, balance: e.target.value })} />
          </div>
          <DialogFooter>
            <Button onClick={() => setShowEditMovementModal(false)} variant="outline">Cancel</Button>
            <Button onClick={editMovementData?._id || editMovementData?.id ? handleSaveEditMovement : handleSaveNewMovement}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}