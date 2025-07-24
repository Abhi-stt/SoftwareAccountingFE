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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Mail, Phone } from "lucide-react"
import { useRouter } from "next/navigation"

const states = [
  { code: "MH", name: "Maharashtra" },
  { code: "KA", name: "Karnataka" },
  { code: "DL", name: "Delhi" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "GJ", name: "Gujarat" },
  { code: "RJ", name: "Rajasthan" },
]

const paymentTerms = [
  { id: "net15", name: "Net 15 Days" },
  { id: "net30", name: "Net 30 Days" },
  { id: "net45", name: "Net 45 Days" },
  { id: "net60", name: "Net 60 Days" },
  { id: "cod", name: "Cash on Delivery" },
  { id: "advance", name: "Advance Payment" },
]

export default function NewCustomerPage() {
  const router = useRouter()

  // Basic Information
  const [customerName, setCustomerName] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [customerType, setCustomerType] = useState("business")
  const [gstin, setGstin] = useState("")
  const [pan, setPan] = useState("")

  // Contact Information
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [mobile, setMobile] = useState("")
  const [website, setWebsite] = useState("")

  // Address Information
  const [billingAddress, setBillingAddress] = useState("")
  const [billingCity, setBillingCity] = useState("")
  const [billingState, setBillingState] = useState("")
  const [billingPincode, setBillingPincode] = useState("")
  const [shippingAddress, setShippingAddress] = useState("")
  const [shippingCity, setShippingCity] = useState("")
  const [shippingState, setShippingState] = useState("")
  const [shippingPincode, setShippingPincode] = useState("")
  const [sameAsBilling, setSameAsBilling] = useState(true)

  // Business Information
  const [paymentTerm, setPaymentTerm] = useState("")
  const [creditLimit, setCreditLimit] = useState("")
  const [taxRate, setTaxRate] = useState("18")
  const [isActive, setIsActive] = useState(true)

  // Contact Person
  const [contactPersonName, setContactPersonName] = useState("")
  const [contactPersonEmail, setContactPersonEmail] = useState("")
  const [contactPersonPhone, setContactPersonPhone] = useState("")
  const [contactPersonDesignation, setContactPersonDesignation] = useState("")

  const handleSave = async () => {
    const customerData = {
      name: customerName,
      email,
      phone,
      address: billingAddress,
      gstNumber: gstin,
      currency: "INR", // or use a state if you want to select currency
      // Optionally add: pan, isActive, city, state, pincode, website, etc.
      pan,
      isActive,
      city: billingCity,
      state: billingState,
      pincode: billingPincode,
      website,
      mobile,
      displayName,
      type: customerType,
      paymentTerm,
      creditLimit: Number.parseFloat(creditLimit) || 0,
      taxRate: Number.parseFloat(taxRate) || 0,
      contactPersonName,
      contactPersonEmail,
      contactPersonPhone,
      contactPersonDesignation,
    }
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("http://localhost:5000/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(customerData),
      })
      if (!res.ok) throw new Error("Failed to save customer")
      alert("Customer created successfully!")
      router.push("/masters")
    } catch (err) {
      alert("Error saving customer: " + (err.message || err))
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Add New Customer</h1>
            <p className="text-gray-600">Create a new customer record</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/masters")}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Customer
            </Button>
          </div>
        </div>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="address">Address Details</TabsTrigger>
            <TabsTrigger value="business">Business Settings</TabsTrigger>
            <TabsTrigger value="contact">Contact Person</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="customerName">Customer Name *</Label>
                        <Input
                          id="customerName"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Display name (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="customerType">Customer Type</Label>
                        <Select value={customerType} onValueChange={setCustomerType}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="business">Business</SelectItem>
                            <SelectItem value="individual">Individual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gstin">GSTIN</Label>
                        <Input
                          id="gstin"
                          value={gstin}
                          onChange={(e) => setGstin(e.target.value)}
                          placeholder="Enter GSTIN"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pan">PAN</Label>
                        <Input id="pan" value={pan} onChange={(e) => setPan(e.target.value)} placeholder="Enter PAN" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email address"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter phone number"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile</Label>
                        <Input
                          id="mobile"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="Enter mobile number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          placeholder="Enter website URL"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Active Status</Label>
                        <p className="text-sm text-muted-foreground">Customer is active for transactions</p>
                      </div>
                      <Switch checked={isActive} onCheckedChange={setIsActive} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="address">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Billing Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingAddress">Address</Label>
                    <Textarea
                      id="billingAddress"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                      placeholder="Enter billing address"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="billingCity">City</Label>
                      <Input
                        id="billingCity"
                        value={billingCity}
                        onChange={(e) => setBillingCity(e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingState">State</Label>
                      <Select value={billingState} onValueChange={setBillingState}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="billingPincode">Pincode</Label>
                      <Input
                        id="billingPincode"
                        value={billingPincode}
                        onChange={(e) => setBillingPincode(e.target.value)}
                        placeholder="Enter pincode"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Shipping Address</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Switch id="sameAsBilling" checked={sameAsBilling} onCheckedChange={setSameAsBilling} />
                      <Label htmlFor="sameAsBilling" className="text-sm">
                        Same as billing
                      </Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!sameAsBilling && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="shippingAddress">Address</Label>
                        <Textarea
                          id="shippingAddress"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          placeholder="Enter shipping address"
                          rows={3}
                        />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="shippingCity">City</Label>
                          <Input
                            id="shippingCity"
                            value={shippingCity}
                            onChange={(e) => setShippingCity(e.target.value)}
                            placeholder="Enter city"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shippingState">State</Label>
                          <Select value={shippingState} onValueChange={setShippingState}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((state) => (
                                <SelectItem key={state.code} value={state.code}>
                                  {state.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="shippingPincode">Pincode</Label>
                          <Input
                            id="shippingPincode"
                            value={shippingPincode}
                            onChange={(e) => setShippingPincode(e.target.value)}
                            placeholder="Enter pincode"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  {sameAsBilling && (
                    <div className="text-center py-8 text-gray-500">
                      Shipping address will be same as billing address
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>Business Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerm">Payment Terms</Label>
                    <Select value={paymentTerm} onValueChange={setPaymentTerm}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTerms.map((term) => (
                          <SelectItem key={term.id} value={term.id}>
                            {term.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditLimit">Credit Limit (₹)</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
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
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Primary Contact Person</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonName">Contact Person Name</Label>
                    <Input
                      id="contactPersonName"
                      value={contactPersonName}
                      onChange={(e) => setContactPersonName(e.target.value)}
                      placeholder="Enter contact person name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonDesignation">Designation</Label>
                    <Input
                      id="contactPersonDesignation"
                      value={contactPersonDesignation}
                      onChange={(e) => setContactPersonDesignation(e.target.value)}
                      placeholder="Enter designation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonEmail">Email</Label>
                    <Input
                      id="contactPersonEmail"
                      type="email"
                      value={contactPersonEmail}
                      onChange={(e) => setContactPersonEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPersonPhone">Phone</Label>
                    <Input
                      id="contactPersonPhone"
                      value={contactPersonPhone}
                      onChange={(e) => setContactPersonPhone(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
