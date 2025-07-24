import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const transactions = [
  {
    id: "INV-001",
    customer: "Acme Corp",
    amount: "₹12,500",
    status: "Paid",
    date: "2024-01-15",
  },
  {
    id: "INV-002",
    customer: "Tech Solutions",
    amount: "₹8,750",
    status: "Pending",
    date: "2024-01-14",
  },
  {
    id: "INV-003",
    customer: "Global Industries",
    amount: "₹15,200",
    status: "Paid",
    date: "2024-01-13",
  },
  {
    id: "INV-004",
    customer: "StartUp Inc",
    amount: "₹6,300",
    status: "Overdue",
    date: "2024-01-12",
  },
  {
    id: "INV-005",
    customer: "Enterprise Ltd",
    amount: "₹22,100",
    status: "Paid",
    date: "2024-01-11",
  },
]

export function RecentTransactions() {
  return (
    <div className="space-y-8">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{transaction.customer.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{transaction.customer}</p>
            <p className="text-sm text-muted-foreground">{transaction.id}</p>
          </div>
          <div className="ml-auto font-medium">
            <div className="text-right">
              <div className="text-sm font-medium">{transaction.amount}</div>
              <div
                className={`text-xs ${
                  transaction.status === "Paid"
                    ? "text-green-600"
                    : transaction.status === "Pending"
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {transaction.status}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
