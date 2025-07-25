"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Save, Upload } from "lucide-react"
import { useRouter } from "next/navigation"

const initialCategories = [
  { id: "1", name: "Software" },
  { id: "2", name: "Hardware" },
  { id: "3", name: "Services" },
  { id: "4", name: "Materials" },
];

const units = [
  { id: "1", name: "Piece", code: "PCS" },
  { id: "2", name: "Set", code: "SET" },
  { id: "3", name: "Hour", code: "HR" },
  { id: "4", name: "License", code: "LIC" },
  { id: "5", name: "Kilogram", code: "KG" },
]

export default function NewProductPage() {
  const router = useRouter()
  const [productName, setProductName] = useState("")
  const [sku, setSku] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [hsn, setHsn] = useState("")
  const [unit, setUnit] = useState("")
  const [unitPrice, setUnitPrice] = useState("")
  const [minStock, setMinStock] = useState("")
  const [maxStock, setMaxStock] = useState("")
  const [currentStock, setCurrentStock] = useState("")
  const [reorderLevel, setReorderLevel] = useState("")
  const [taxRate, setTaxRate] = useState("18")
  const [isActive, setIsActive] = useState(true)
  const [trackInventory, setTrackInventory] = useState(true)
  const [categories, setCategories] = useState(initialCategories);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const handleSave = async () => {
    const productData = {
      name: productName,
      sku,
      category,
      description,
      hsn,
      unit,
      unitPrice: Number.parseFloat(unitPrice) || 0,
      minStock: Number.parseInt(minStock) || 0,
      maxStock: Number.parseInt(maxStock) || 0,
      currentStock: Number.parseInt(currentStock) || 0,
      reorderLevel: Number.parseInt(reorderLevel) || 0,
      taxRate: Number.parseFloat(taxRate) || 0,
      isActive,
      trackInventory,
    }
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(productData),
      })
      if (!res.ok) throw new Error("Failed to save product")
      alert("Product created successfully!")
      router.push("/inventory")
    } catch (err) {
      alert("Error saving product: " + (err.message || err))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Add New Product</h1>
            <p className="text-gray-600">Create a new product in your inventory</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/inventory")}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Product
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name *</Label>
                    <Input
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Enter product name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU *</Label>
                    <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Enter SKU" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <div className="flex gap-2 items-center">
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowNewCategory(true)}>+ New Category</Button>
                    </div>
                    {showNewCategory && (
                      <div className="flex gap-2 items-center mt-1">
                        <Input placeholder="New Category" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
                        <Button type="button" size="sm" onClick={() => {
                          if (newCategory && !categories.some(c => c.name.toLowerCase() === newCategory.toLowerCase())) {
                            const newCatObj = { id: (categories.length + 1).toString(), name: newCategory };
                            setCategories([...categories, newCatObj]);
                            setCategory(newCategory);
                            setNewCategory("");
                            setShowNewCategory(false);
                          }
                        }}>Add</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewCategory(false)}>Cancel</Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hsn">HSN/SAC Code</Label>
                    <Input
                      id="hsn"
                      value={hsn}
                      onChange={(e) => setHsn(e.target.value)}
                      placeholder="Enter HSN/SAC code"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Tax */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Tax</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit of Measure</Label>
                    <Select value={unit} onValueChange={setUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name} ({u.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price (₹)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Select value={taxRate} onValueChange={setTaxRate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Management */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Track Inventory</Label>
                    <p className="text-sm text-muted-foreground">Enable inventory tracking for this product</p>
                  </div>
                  <Switch checked={trackInventory} onCheckedChange={setTrackInventory} />
                </div>

                {trackInventory && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="currentStock">Current Stock</Label>
                      <Input
                        id="currentStock"
                        type="number"
                        value={currentStock}
                        onChange={(e) => setCurrentStock(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reorderLevel">Reorder Level</Label>
                      <Input
                        id="reorderLevel"
                        type="number"
                        value={reorderLevel}
                        onChange={(e) => setReorderLevel(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minStock">Minimum Stock</Label>
                      <Input
                        id="minStock"
                        type="number"
                        value={minStock}
                        onChange={(e) => setMinStock(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxStock">Maximum Stock</Label>
                      <Input
                        id="maxStock"
                        type="number"
                        value={maxStock}
                        onChange={(e) => setMaxStock(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active Status</Label>
                    <p className="text-sm text-muted-foreground">Product is available for sale</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload product image</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 2MB</p>
                </div>
                <Button variant="outline" className="w-full bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  Duplicate Product
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  Import from Template
                </Button>
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  Bulk Upload
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
