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

  // Helper to fetch products
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token")
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
      setLoading(true)
      const productsRes = await fetch(`${API_BASE_URL}/products`, { headers })
      if (!productsRes.ok) throw new Error("Failed to fetch products")
      const productsData = await productsRes.json()
      setProducts(productsData || [])
    } catch (err: any) {
      setError(err.message || "Error fetching data")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = token ? { Authorization: token } : {};
      const res = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('Failed to delete product');
      fetchProducts();
    } catch (err: any) {
      alert('Error deleting product: ' + (err.message || err));
    }
  };

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
                                <Button variant="ghost" size="sm" onClick={() => router.push(`/inventory/products/${id}/edit`)}>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
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
    </DashboardLayout>
  )
}