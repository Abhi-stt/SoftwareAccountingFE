"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, Save } from "lucide-react"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

const adjustmentTypes = [
  { id: "increase", name: "Stock Increase", description: "Add stock to inventory" },
  { id: "decrease", name: "Stock Decrease", description: "Remove stock from inventory" },
  { id: "damage", name: "Damaged Goods", description: "Mark items as damaged" },
  { id: "theft", name: "Theft/Loss", description: "Report stolen or lost items" },
  { id: "recount", name: "Physical Recount", description: "Adjust based on physical count" },
]

interface AdjustmentItem {
  id: string
  productId: string
  productName: string
  currentStock: number
  adjustmentQty: number
  newStock: number
  reason: string
}

export default function StockAdjustmentPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [adjustmentDate, setAdjustmentDate] = useState(new Date().toISOString().split("T")[0])
  const [adjustmentType, setAdjustmentType] = useState("")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<AdjustmentItem[]>([])

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem("token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const productsRes = await fetch(`${API_BASE_URL}/products`, { headers })
      setProducts(await productsRes.json())
    }
    fetchData()
  }, [])

  const addItem = () => {
    const newItem: AdjustmentItem = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      currentStock: 0,
      adjustmentQty: 0,
      newStock: 0,
      reason: "",
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof AdjustmentItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === "productId") {
            const product = products.find((p) => p._id === value)
            if (product) {
              updatedItem.productName = product.name
              updatedItem.currentStock = product.currentStock
            }
          }
          // Calculate new stock
          if (field === "adjustmentQty" || field === "productId") {
            updatedItem.newStock = updatedItem.currentStock + updatedItem.adjustmentQty
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleSave = async () => {
    const cleanItems = items.map(({ id, _id, ...rest }) => ({ ...rest }))
    const adjustmentData = {
      date: adjustmentDate,
      type: adjustmentType,
      reference,
      notes,
      items: cleanItems,
    }
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/stock-movements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(adjustmentData),
      })
      if (!res.ok) throw new Error("Failed to save stock adjustment")
      alert("Stock adjustment saved successfully!")
      router.push("/inventory")
    } catch (err) {
      alert("Error saving stock adjustment: " + (err.message || err))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Stock Adjustment</h1>
            <p className="text-gray-600">Adjust inventory quantities and track stock movements</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/inventory")}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Adjustment
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Adjustment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Adjustment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="adjustmentDate">Adjustment Date</Label>
                    <Input
                      id="adjustmentDate"
                      type="date"
                      value={adjustmentDate}
                      onChange={(e) => setAdjustmentDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adjustmentType">Adjustment Type</Label>
                    <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select adjustment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {adjustmentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="reference">Reference Number</Label>
                    <Input
                      id="reference"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Enter reference number (optional)"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Adjustment Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Adjustment Items</CardTitle>
                  <Button onClick={addItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Adjustment Qty</TableHead>
                      <TableHead>New Stock</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Select
                            value={item.productId}
                            onValueChange={(value) => updateItem(item.id, "productId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product._id} value={product._id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>{item.currentStock}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.adjustmentQty}
                            onChange={(e) => updateItem(item.id, "adjustmentQty", Number.parseInt(e.target.value) || 0)}
                            className="w-20"
                            placeholder="0"
                          />
                        </TableCell>
                        <TableCell className={item.newStock < 0 ? "text-red-600" : ""}>{item.newStock}</TableCell>
                        <TableCell>
                          <Input
                            value={item.reason}
                            onChange={(e) => updateItem(item.id, "reason", e.target.value)}
                            placeholder="Reason for adjustment"
                            className="w-40"
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any additional notes about this adjustment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Adjustment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Items:</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Adjustments:</span>
                  <span>{items.reduce((sum, item) => sum + Math.abs(item.adjustmentQty), 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Increases:</span>
                  <span className="text-green-600">
                    +{items.reduce((sum, item) => sum + Math.max(item.adjustmentQty, 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Decreases:</span>
                  <span className="text-red-600">
                    {items.reduce((sum, item) => sum + Math.min(item.adjustmentQty, 0), 0)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {adjustmentType && (
              <Card>
                <CardHeader>
                  <CardTitle>Adjustment Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const type = adjustmentTypes.find((t) => t.id === adjustmentType)
                    return type ? (
                      <div className="space-y-2">
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-gray-600">{type.description}</div>
                      </div>
                    ) : null
                  })()}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Important Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• Stock adjustments will immediately update inventory levels</p>
                <p>• All adjustments are tracked in the audit trail</p>
                <p>• Negative adjustments require proper authorization</p>
                <p>• Physical verification is recommended for large adjustments</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
