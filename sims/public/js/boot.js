frappe.ready(() => {
    if (!frappe.user.has_role("Client")) return;

    // Redirect only when landing on the default workspace
    if (window.location.pathname === "/app") {
        window.location.replace("/app/sims");
    }
});