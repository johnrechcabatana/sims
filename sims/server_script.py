import frappe

from frappe.model.naming import make_autoname
from frappe.utils import nowdate


@frappe.whitelist()
def on_cancel_mr(self, method=None):
    frappe.db.set_value("Material Request",self.name,"custom_approval_status","For Edit")
    recipients = [self.owner]
    # Optional: Add specific roles or users (e.g., Purchase Managers)
    # purchase_managers = frappe.get_all("Has Role", filters={"role": "Purchase Manager", "parenttype": "User"}, fields=["parent"])
    # recipients.extend([user.parent for user in purchase_managers])

    # 2. Trigger the notification bell for each recipient
    for user in set(recipients):
        # Don't notify the person who is doing the cancellation unless desired
        if user == frappe.session.user:
            continue
            
        doc = frappe.get_doc({
            "doctype": "Notification Log",
            "subject": f"MR {self.name} has been set to 'For Edit' by J4",
            "for_user": user,
            "type": "Alert",  # Options: 'Alert', 'Share', 'Assignment', 'Mention'
            "document_type": "Material Request",
            "document_name": self.name,
            "email_content": f"Material Request {self.name} was canceled and moved back to 'For Edit' status."
        })
        doc.insert(ignore_permissions=True)

@frappe.whitelist()
def on_validate_mr(self, method=None):
    if self.amended_from:
        old_doc_owner = frappe.db.get_value("Material Request", self.amended_from,"owner")
        # frappe.throw(f"{old_doc_owner}")
        frappe.db.set_value("Material Request",self.name, "owner",old_doc_owner)

@frappe.whitelist()
def on_submit_mr(self, method=None):
    for i in self.items:
        if i.material_request:
            frappe.db.set_value("Material Request",i.material_request,"custom_approval_status","Completed")
            owner = frappe.db.get_value("Material Request",i.material_request, "owner")
            recipients = [owner]
            # Optional: Add specific roles or users (e.g., Purchase Managers)
            # purchase_managers = frappe.get_all("Has Role", filters={"role": "Purchase Manager", "parenttype": "User"}, fields=["parent"])
            # recipients.extend([user.parent for user in purchase_managers])

            # 2. Trigger the notification bell for each recipient
            for user in set(recipients):
                # Don't notify the person who is doing the cancellation unless desired
                if user == frappe.session.user:
                    continue
                    
                doc = frappe.get_doc({
                    "doctype": "Notification Log",
                    "subject": f"MR {self.name} has been Completed",
                    "for_user": user,
                    "type": "Alert",  # Options: 'Alert', 'Share', 'Assignment', 'Mention'
                    "document_type": "Material Request",
                    "document_name": self.name,
                    "email_content": f"Material Request {self.name} was completed"
                })
                doc.insert(ignore_permissions=True)

@frappe.whitelist()
def get_dashboard_data():
    # 1. Total stock items count
    total_items = frappe.db.count('Item', {'is_stock_item': 1, 'disabled': 0})

    # 2. Fetch Items
    items = frappe.get_all(
        'Item',
        fields=['name', 'item_name', 'stock_uom', 'modified'],
        filters={'is_stock_item': 1, 'disabled': 0},
        limit_page_length=50,
        order_by='modified desc'
    )

    # 3. Fetch Bins (frappe.get_all ignores standard permission blocks on internal tables when run backend)
    bins = frappe.get_all('Bin', fields=['item_code', 'actual_qty', 'reserved_qty'])

    # 4. Fetch Reorder Levels from Child Table
    reorders = frappe.get_all('Item Reorder', fields=['parent', 'warehouse_reorder_level'])

    # 5. Fetch Material Requests
    requests = frappe.get_all(
        'Material Request',
        fields=[
            'name',
            'custom_department',
            'set_warehouse',
            'transaction_date',
            'status',
            'docstatus',
            'custom_approval_status'
        ],
        filters={
            'docstatus': 1,
            'custom_approval_status': ['in', ['Ready for Withdrawal', 'Approved', 'Recorded Request']]
        },
        order_by='modified desc'
    )
    return {
        'total_items': total_items,
        'items': items,
        'bins': bins,
        'reorders': reorders,
        'requests': requests
    }

# def autoname(self, method=None):

#     self.name = make_autoname(f"YYYY.MM.DD.#####")