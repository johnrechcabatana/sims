import frappe

def boot_session(login_manager):
    """
    Checks user roles on successful authentication and sets 
    the home page path to /app/sims or /sims depending on the role.
    """
    # Replace 'Specific Role Name' with the target role (e.g., 'SIMS User' or 'System Manager')
    TARGET_ROLE = "Client"
    
    user = frappe.session.user
    roles = frappe.get_roles(user)
    
    if TARGET_ROLE in roles:
        # For a standard Desk workspace/page inside ERPNext:
        frappe.local.response["home_page"] = "/app/sims"
        
        # If 'sims' is a public Web Page (outside /app):
        # frappe.local.response["home_page"] = "/sims"