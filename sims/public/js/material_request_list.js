frappe.listview_settings["Material Request"] = {
	add_fields: ["material_request_type", "status", "per_ordered", "per_received", "transfer_status","workflow_state"],
	has_indicator_for_draft: true,
	has_indicator_for_cancelled: true,
    get_indicator: function (doc) {
		var precision = frappe.defaults.get_default("float_precision");
		if (doc.status == "Stopped") {
			return [__("Stopped"), "red", "status,=,Stopped"];
		} else if(doc.docstatus == 1) { 
            if (doc.custom_approval_status == "Draft") {
                return [__("Draft"), "gray", "Draft"]; 
            } else if (doc.custom_approval_status == "For Approval") {
                return [__("For Approval"), "blue", "For Approval"];
            } else if (doc.custom_approval_status == "Rejected") {
                return [__("Rejected"), "red", "Rejected"]; 
            } else if (doc.custom_approval_status == "Approved") {
                return [__("Approved"), "blue", "Approved"]; 
            } else if (doc.custom_approval_status == "Ready for Withdrawal") {
                return [__("Ready for Withdrawal"), "blue", "Ready for Withdrawal"];
            } else if (doc.custom_approval_status == "Expired") {
                return [__("Expired"), "red", "Expired"];
            } else if (doc.custom_approval_status == "Completed") {
                return [__("Completed"), "green", "Completed"]
			} else if (doc.custom_approval_status == "Recorded Request") {
                return [__("Recorded Request"), "green", "Recorded Request"]
			}
        }else if (doc.docstatus == 2 && doc.custom_approval_status == "For Edit"){
			return [__("For Edit"), "red", "For Edit"]
		}

		else if (doc.transfer_status && doc.docstatus != 2) {
			console.log(doc.name)
			if (doc.transfer_status == "Not Started") {
				return [__("Not Started"), "orange"];
			} else if (doc.transfer_status == "In Transit") {
				return [__("In Transit"), "yellow"];
			} else if (doc.transfer_status == "Completed") {
				return [__("Completed"), "green"];
			}
		} else if (doc.docstatus == 1  && flt(doc.per_ordered, precision) == 0 && doc.workflow_state == "Ready For Withdrawal") {
			return [__("Ready For Withdrawal"), "orange", "per_ordered,=,0"];
		} else if (doc.docstatus == 1 && flt(doc.per_ordered, precision) < 100) {
			return [__("Partially ordered"), "yellow", "per_ordered,<,100"];
		} else if (doc.docstatus == 1 && flt(doc.per_ordered, precision) == 100) {
			if (
				doc.material_request_type == "Purchase" &&
				flt(doc.per_received, precision) < 100 &&
				flt(doc.per_received, precision) > 0
			) {
				return [__("Partially Received"), "yellow", "per_received,<,100"];
			} else if (doc.material_request_type == "Purchase" && flt(doc.per_received, precision) == 100) {
				return [__("Received"), "green", "per_received,=,100"];
			} else if (doc.material_request_type == "Purchase") {
				return [__("Ordered"), "green", "per_ordered,=,100"];
			} else if (doc.material_request_type == "Material Transfer") {
				return [__("Transfered"), "green", "per_ordered,=,100"];
			} else if (doc.material_request_type == "Material Issue") {
				return [__("Issued"), "green", "per_ordered,=,100"];
			} else if (doc.material_request_type == "Customer Provided") {
				return [__("Received"), "green", "per_ordered,=,100"];
			} else if (doc.material_request_type == "Manufacture") {
				return [__("Manufactured"), "green", "per_ordered,=,100"];
			}
		}
	},
};
