frappe.ui.form.on("Stock Entry", {
    refresh(frm) {
        if (frm.doc.docstatus === 0) {
            frm.add_custom_button(__("Material Request"), function () {

                erpnext.utils.map_current_doc({
                    method: "your_app.api.make_stock_entry_from_material_request",

                    source_doctype: "Material Request",

                    target: frm,

                    setters: {
                        material_request_type: "Material Issue"
                    },

                    get_query_filters: {
                        docstatus: 1,
                        status: ["!=", "Stopped"]
                    }
                });

            }, __("Get Items From"));
        }
    }
});