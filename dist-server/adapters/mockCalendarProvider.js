function todayKey() {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}
export async function mockCalendar() {
    const date = todayKey();
    return [
        { id: "cal-1", date, time: "09:30", title: "Provider architecture review", category: "Systems", durationMinutes: 45, color: "#0A84FF" },
        { id: "cal-2", date, time: "12:15", title: "Deployment prep", category: "Ops", durationMinutes: 30, color: "#FF9F0A" },
        { id: "cal-3", date, time: "16:00", title: "Dashboard QA window", category: "Product", durationMinutes: 60, color: "#30D158" }
    ];
}
