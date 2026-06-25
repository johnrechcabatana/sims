import frappe

def get_material_request_conditions(user):
    # This overrides the forced docstatus=1 restriction and forces 
    # the server to fetch Drafts (0), Submitted (1), and Cancelled (2)
    return "(`tabMaterial Request`.docstatus IN (0, 1, 2))"