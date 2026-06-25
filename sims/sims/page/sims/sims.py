import frappe
import json

@frappe.whitelist()
def get_items_with_stock(search_text=""):
    """
    Fetches non-disabled stock items matching query parameters, 
    joining with total current stock balances across active bins.
    """
    conditions = "WHERE item.disabled = 0 AND item.is_stock_item = 1"
    args = {}
    
    if search_text:
        conditions += " AND (item.item_name LIKE %(search)s OR item.name LIKE %(search)s OR item.description LIKE %(search)s)  "
        args["search"] = f"%{search_text}%"

    # Fetch item metadata along with the combined actual quantity across all warehouses
    items = frappe.db.sql(f"""
        SELECT 
            item.description,
            item.name, 
            item.item_name, 
            item.image, 
            item.stock_uom,
            IFNULL((SELECT SUM(actual_qty) FROM `tabBin` WHERE item_code = item.name), 0) as actual_qty
        FROM 
            `tabItem` item
        {conditions}
        ORDER BY item.item_name ASC
        LIMIT 24
    """, args, as_dict=1)

    return items


@frappe.whitelist()
def create_material_request(items):
    """
    Builds a structured Material Request document from the submitted cart state arrays.
    """
    if isinstance(items, str):
        items = json.loads(items)
        
    if not items:
        frappe.throw("Cannot process an empty cart dataset.")
    client_full_name = frappe.utils.get_fullname(frappe.session.user)
    # Initialize a clean Material Request document
    mr_doc = frappe.get_doc({
        "doctype": "Material Request",
        "material_request_type": "Material Issue",  # Adjust option parameter to "Material Issue" or "Transfer" if internal
        "transaction_date": frappe.utils.today(),
        "items": [],
        "custom_client":client_full_name
    })

    # Append mapped layout rows down into child table properties
    for entry in items:
        mr_doc.append("items", {
            "item_code": entry.get("item_code"),
            "qty": frappe.utils.cint(entry.get("qty", 1)),
            "uom": entry.get("uom"),
            "schedule_date": frappe.utils.today()
        })

    # Save to database (Generates the Draft record status)
    mr_doc.insert()
    
    # Optional: Automatically push the workflow status instantly from Draft (0) to Submitted (1)
    # mr_doc.submit()

    return mr_doc.name

   