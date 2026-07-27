import frappe
import json

@frappe.whitelist()
def get_items_with_stock(search_text="", item_group="", stock_uom="", brand=""):
    """
    Fetches non-disabled stock items matching query parameters, 
    joining with total current stock balances across active bins.
    """
    conditions = ["item.disabled = 0", "item.is_stock_item = 1"]
    args = {}
    
    # 1. Text Search Input Filter
    if search_text:
        conditions.append("(item.item_name LIKE %(search)s OR item.name LIKE %(search)s OR item.description LIKE %(search)s)")
        args["search"] = f"%{search_text}%"
        
    # 2. Dropdown Filter Extensions
    if item_group:
        conditions.append("item.item_group = %(item_group)s")
        args["item_group"] = item_group
        
    if stock_uom:
        conditions.append("item.stock_uom = %(stock_uom)s")
        args["stock_uom"] = stock_uom
        
    if brand:
        conditions.append("item.brand = %(brand)s")
        args["brand"] = brand

    where_clause = "WHERE " + " AND ".join(conditions)

    items = frappe.db.sql(f"""
        SELECT 
            item.description,
            item.name,
            item.item_group,
            item.item_name, 
            item.image, 
            item.stock_uom,
            item.valuation_rate,
            IFNULL(SUM(bin.actual_qty), 0) as actual_qty
        FROM 
            `tabItem` item
        LEFT JOIN 
            `tabBin` bin ON bin.item_code = item.name
        {where_clause}
        GROUP BY 
            item.name
        ORDER BY 
            item.item_name ASC
        LIMIT 24
    """, args, as_dict=1)

    return items


@frappe.whitelist()
def get_filter_options():
    """
    Fetches active select distinct variables to populate layout dropdown selectors.
    """
    return {
        "item_groups": [ig.name for ig in frappe.get_all("Item Group", filters={"is_group": 0}, order_by="name asc")],
        "uoms": [uom.name for uom in frappe.get_all("UOM", order_by="name asc")],
        "brands": [b.name for b in frappe.get_all("Brand", order_by="name asc")]
    }


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
    
    mr_doc = frappe.get_doc({
        "doctype": "Material Request",
        "material_request_type": "Material Issue", 
        "transaction_date": frappe.utils.today(),
        "items": [],
        "custom_client": client_full_name,
        "custom_approval_status":"For Approval"
    })

    for entry in items:
        item_code = entry.get("item_code")
    
        default_warehouse = frappe.db.get_value("Bin", {"item_code": item_code, "actual_qty": (">", 0)}, "warehouse")

        mr_doc.append("items", {
            "item_code": item_code,
            "qty": entry.get("qty", 1),
            "uom": entry.get("uom"),
            "warehouse": default_warehouse,
            "schedule_date": frappe.utils.today()
        })

    mr_doc.submit()
    return mr_doc.name

@frappe.whitelist()
def get_material_request_items(material_request):
    return frappe.get_all(
        "Material Request Item",
        filters={"parent": material_request},
        fields=[
            "item_code",
            "item_name",
            "qty",
            "uom",
            "warehouse",
            "schedule_date"
        ],
        order_by="idx"
    )