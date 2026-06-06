export async function mockFinance() {
    return {
        bankConnected: false,
        todayTotal: 42.7,
        weekTotal: 318.4,
        sevenDaySpend: [
            { day: "Sun", amount: 30 },
            { day: "Mon", amount: 74 },
            { day: "Tue", amount: 52 },
            { day: "Wed", amount: 19 },
            { day: "Thu", amount: 88 },
            { day: "Fri", amount: 64 },
            { day: "Sat", amount: 43 }
        ],
        transactions: [
            { id: "txn-1", name: "Railcard renewal", category: "Travel", amount: 30, day: "Today" },
            { id: "txn-2", name: "Groceries", category: "Food", amount: 12.7, day: "Today" },
            { id: "txn-3", name: "Cloudflare", category: "Services", amount: 7.5, day: "Yesterday" }
        ]
    };
}
