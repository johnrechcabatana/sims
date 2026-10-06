import frappe
from frappe.utils import add_months, getdate, nowdate, flt

@frappe.whitelist()
def get_dashboard_metrics():
    # 1. Executive KPIs
    total_val = frappe.db.sql("SELECT SUM(stock_value) FROM `tabBin`")[0][0] or 0.0

    low_stock_count = frappe.db.sql("""
        SELECT COUNT(DISTINCT b.item_code)
        FROM `tabBin` b
        LEFT JOIN `tabItem Reorder` r ON b.item_code = r.parent
        WHERE (r.warehouse = b.warehouse AND b.projected_qty < r.warehouse_reorder_level)
           OR (r.warehouse IS NULL AND b.projected_qty < 0)
    """)[0][0] or 0

    pending_reqs = frappe.db.count('Material Request', filters={
        'custom_approval_status': ['in', ['For Approval','For Edit','Recorded Request', 'Ready for Withdrawal']]
    })

    start_of_month = getdate(nowdate()).replace(day=1)
    approved_reqs = frappe.db.count('Material Request', filters={
        'docstatus': 1,
        'custom_approval_status':'Approved'
        # 'creation': ['>=', start_of_month]
    })

    # 2. Stock Levels by Item Category / Group
    stock_by_group = frappe.db.sql("""
        SELECT 
            i.item_group,
            SUM(b.stock_value) as total_value
        FROM `tabBin` b
        INNER JOIN `tabItem` i ON b.item_code = i.name
        GROUP BY i.item_group
        HAVING total_value > 0
        ORDER BY total_value DESC
        LIMIT 4
    """, as_dict=True)

    total_group_val = sum([flt(x['total_value']) for x in stock_by_group]) or 1.0
    for row in stock_by_group:
        row['percent'] = round((flt(row['total_value']) / total_group_val) * 100, 1)

    # 3. Requests for Action Table
    action_requests = frappe.get_all('Material Request',
        fields=['name', 'custom_client', 'material_request_type', 'transaction_date', 'custom_approval_status'],
        filters={'custom_approval_status':['in',['For Approval','For Edit','Recorded Request', 'Ready for Withdrawal']]},
        order_by='creation desc',
        limit=10
    )

    # 4. Historical Withdrawals (Using standard MariaDB DATE functions to avoid % escaping issues entirely)
    six_months_ago_str = str(add_months(nowdate(), -6))
    withdrawals_data = frappe.db.sql(f"""
        SELECT 
            CONCAT(LEFT(MONTHNAME(posting_date), 3), " '", RIGHT(YEAR(posting_date), 2)) as month_label,
            SUM(ABS(stock_value_difference)) as total_withdrawn,
            CONCAT(YEAR(posting_date), '-', LPAD(MONTH(posting_date), 2, '0')) as sort_date
        FROM `tabStock Ledger Entry`
        WHERE actual_qty < 0 
          AND posting_date >= '{six_months_ago_str}'
        GROUP BY sort_date, month_label
        ORDER BY sort_date ASC
    """, as_dict=True)

    # 5. Executive Analytics - Top Withdrawn Categories
    start_of_month_str = str(start_of_month)
    top_withdrawn = frappe.db.sql(f"""
        SELECT 
            i.item_group,
            SUM(ABS(sle.stock_value_difference)) as val
        FROM `tabStock Ledger Entry` sle
        JOIN `tabItem` i ON sle.item_code = i.name
        WHERE sle.actual_qty < 0 
          AND sle.posting_date >= '{start_of_month_str}'
        GROUP BY i.item_group
        ORDER BY val DESC
        LIMIT 4
    """, as_dict=True)

    max_withdrawn = max([flt(x['val']) for x in top_withdrawn], default=1.0) or 1.0
    for item in top_withdrawn:
        item['bar_pct'] = min(100, round((flt(item['val']) / max_withdrawn) * 100))

    # 5b. Inventory Health
    health_stats = frappe.db.sql("""
        SELECT 
            SUM(CASE WHEN b.actual_qty > 0 AND b.projected_qty >= IFNULL(r.warehouse_reorder_level, 0) THEN b.stock_value ELSE 0 END) as healthy,
            SUM(CASE WHEN b.projected_qty < IFNULL(r.warehouse_reorder_level, 0) AND b.actual_qty > 0 THEN b.stock_value ELSE 0 END) as at_risk,
            SUM(CASE WHEN b.actual_qty <= 0 THEN b.stock_value ELSE 0 END) as critical
        FROM `tabBin` b
        LEFT JOIN `tabItem Reorder` r ON b.item_code = r.parent AND b.warehouse = r.warehouse
    """, as_dict=True)[0]

    return {
        "kpis": {
            "total_value": f"₱ {flt(total_val/1000000, 1)}M" if total_val >= 1000000 else f"₱ {flt(total_val/1000, 1)}K",
            "low_stock": low_stock_count,
            "pending": pending_reqs,
            "approved": approved_reqs
        },
        "stock_by_group": stock_by_group,
        "action_requests": action_requests,
        "historical_withdrawals": withdrawals_data,
        "top_withdrawn": top_withdrawn,
        "health": {
            "healthy": flt(health_stats.get('healthy', 0)),
            "at_risk": flt(health_stats.get('at_risk', 0)),
            "critical": flt(health_stats.get('critical', 0))
        }
    }