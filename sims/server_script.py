import frappe

@frappe.whitelist()
def on_cancel_mr(self, method=None):
    frappe.db.set_value("Material Request",self.name,"custom_approval_status","For Edit")

@frappe.whitelist()
def on_validate_mr(self, method=None):
    old_doc_owner = frappe.db.get_value("Material Request", self.amended_from,"owner")
    # frappe.throw(f"{old_doc_owner}")
    frappe.db.set_value("Material Request",self.name, "owner",old_doc_owner)