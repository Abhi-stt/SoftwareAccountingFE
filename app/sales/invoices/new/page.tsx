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
import { Plus, Trash2, Save, Send } from "lucide-react"
import { useRouter } from "next/navigation"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api"

interface InvoiceItem {
  id: string
  productId: string
  productName: string
  hsn: string
  quantity: number
  rate: number
  discount: number
  taxRate: number
  amount: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function fetchData() {
      const token = localStorage.getItem("token")
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const productsRes = await fetch(`${API_BASE_URL}/products`, { headers })
      const customersRes = await fetch(`${API_BASE_URL}/customers`, { headers })
      setProducts(await productsRes.json())
      setCustomers(await customersRes.json())
    }
    fetchData()
  }, [])

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      hsn: "",
      quantity: 1,
      rate: 0,
      discount: 0,
      taxRate: 18,
      amount: 0,
    }
    setItems([...items, newItem])
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === "productId") {
            const product = products.find((p) => p._id === value)
            if (product) {
              updatedItem.productName = product.name
              updatedItem.hsn = product.hsnCode || product.hsn
              updatedItem.rate = product.unitPrice || product.rate
            }
          }
          // Calculate amount
          const subtotal = updatedItem.quantity * updatedItem.rate
          const discountAmount = (subtotal * updatedItem.discount) / 100
          const taxableAmount = subtotal - discountAmount
          const taxAmount = (taxableAmount * updatedItem.taxRate) / 100
          updatedItem.amount = taxableAmount + taxAmount
          return updatedItem
        }
        return item
      }),
    )
  }

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0)
    const totalDiscount = items.reduce((sum, item) => sum + (item.quantity * item.rate * item.discount) / 100, 0)
    const taxableAmount = subtotal - totalDiscount
    const totalTax = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.rate
      const itemDiscount = (itemSubtotal * item.discount) / 100
      const itemTaxable = itemSubtotal - itemDiscount
      return sum + (itemTaxable * item.taxRate) / 100
    }, 0)
    const total = taxableAmount + totalTax

    return { subtotal, totalDiscount, taxableAmount, totalTax, total }
  }

  const totals = calculateTotals()

  const handleSave = () => {
    // Save as draft
    alert("Invoice saved as draft!")
  }

  const handleSend = async () => {
    const cleanItems = items.map(({ id, _id, ...rest }) => ({ ...rest, productId: rest.productId }))
    const totalAmount = cleanItems.reduce((sum, item) => sum + (item.amount || 0), 0)
    const invoiceData = {
      customerId: selectedCustomer,
      date: invoiceDate,
      dueDate,
      items: cleanItems,
      notes,
      totalAmount,
      status: "Unpaid",
    }
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_BASE_URL}/sales-invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(invoiceData),
      })
      if (!res.ok) throw new Error("Failed to save invoice")
      alert("Invoice sent to customer!")
      router.push("/sales")
    } catch (err) {
      alert("Error saving invoice: " + (err.message || err))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Create Sales Invoice</h1>
            <p className="text-gray-600">Generate a new sales invoice for your customer</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/sales")}>
              Cancel
            </Button>
            <Button variant="outline" onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={handleSend}>
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Customer & Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer._id} value={customer._id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Invoice Date</Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoiceNumber">Invoice Number</Label>
                    <Input id="invoiceNumber" value="INV-2024-005" readOnly className="bg-gray-50" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Line Items</CardTitle>
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
                      <TableHead>Product/Service</TableHead>
                      <TableHead>HSN</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Discount %</TableHead>
                      <TableHead>Tax %</TableHead>
                      <TableHead>Amount</TableHead>
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
                        <TableCell>
                          <Input
                            value={item.hsn}
                            onChange={(e) => updateItem(item.id, "hsn", e.target.value)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, "quantity", Number.parseFloat(e.target.value) || 0)}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, "rate", Number.parseFloat(e.target.value) || 0)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, "discount", Number.parseFloat(e.target.value) || 0)}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) => updateItem(item.id, "taxRate", Number.parseFloat(e.target.value) || 0)}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>₹{item.amount.toFixed(2)}</TableCell>
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
                  placeholder="Add any additional notes or terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span>-₹{totals.totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Amount:</span>
                  <span>₹{totals.taxableAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Tax:</span>
                  <span>₹{totals.totalTax.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>₹{totals.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {selectedCustomer && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const customer = customers.find((c) => c._id === selectedCustomer)
                    return customer ? (
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Name:</strong> {customer.name}
                        </div>
                        <div>
                          <strong>Email:</strong> {customer.email}
                        </div>
                        <div>
                          <strong>GSTIN:</strong> {customer.gstin}
                        </div>
                      </div>
                    ) : null
                  })()}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
