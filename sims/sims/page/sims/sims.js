frappe.pages['sims'].on_page_load = function(wrapper) {
    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Cart Requisition',
        single_column: true
    });

    // Main App Layout States
    let cart = []; 

    // Append custom styles to match UI layout colors and styling
    const custom_css = `
        <style>
            .panel-container { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .panel-number { background: #0056b3; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 8px; font-size: 14px; }
            .panel-title { font-size: 16px; font-weight: bold; color: #1e293b; display: flex; align-items: center; margin-bottom: 16px; }
            .catalog-card { border: 1px solid #e2e8f0; border-radius: 8px; transition: all 0.2s; background: #fff; display: flex; flex-direction: column; height: 100%; cursor: pointer; }
            .catalog-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-color: #0056b3; }
            .btn-add-cart { background-color: #0056b3; color: white; font-weight: 500; border-radius: 6px; border: none; padding: 8px; font-size: 14px; width: 100%; }
            .btn-add-cart:hover { background-color: #004085; color: white; }
            .btn-add-cart:disabled { background-color: #cbd5e1; color: #64748b; cursor: not-allowed; }
            .cart-item-row { border-bottom: 1px dashed #e2e8f0; padding: 12px 0; position: relative; }
            .cart-item-row:last-child { border-bottom: none; }
            .cart-remove-btn { position: absolute; right: 0; top: 12px; color: #94a3b8; cursor: pointer; border: none; background: none; font-size: 16px; }
            .cart-remove-btn:hover { color: #ef4444; }
            .btn-checkout { background-color: #0056b3; color: white; font-weight: bold; width: 100%; padding: 12px; border-radius: 6px; font-size: 15px; display: flex; justify-content: center; align-items: center; border: none; }
            .btn-checkout:hover { background-color: #004085; color: white; }
            .requisition-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
            .success-badge { color: #16a34a; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 12px; }
            .requisition-number { color: #0056b3; font-size: 20px; font-weight: bold; letter-spacing: 0.5px; margin: 8px 0; }
            .qr-container { display: flex; gap: 12px; background: #fff; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; align-items: center; text-align: left; margin-top: 12px; }
            .btn-print { background: #ffffff; border: 1px solid #0056b3; color: #0056b3; width: 100%; padding: 10px; font-weight: 600; border-radius: 6px; margin-top: 12px; cursor: pointer; transition: background 0.2s; }
            .btn-print:hover { background: #f0f7ff; }

            /* Hover Detail Card Style Rules */
            .item-hover-details-popup {
                position: fixed;
                z-index: 99999;
                background: #ffffff;
                border: 1px solid #cbd5e1;
                border-radius: 12px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                display: none;
                pointer-events: none;
                width: 480px;
                max-width: 90vw;
                overflow: hidden;
            }
            .hover-popup-content { display: flex; }
            .hover-popup-left { width: 40%; background: #f8fafc; border-right: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: center; padding: 16px; }
            .hover-popup-right { width: 60%; padding: 16px; display: flex; flex-direction: column; gap: 6px; }
            .hover-label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; margin-bottom: -2px; }
            .hover-value { font-size: 13px; color: #0f172a; margin-bottom: 4px; }

            /* Material Requests Table Styles */
            .mr-table { width: 100%; border-collapse: separate; border-spacing: 0; }
            .mr-table th { background: #f8fafc; color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
            .mr-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #334155; }
            .mr-table tr:last-child td { border-bottom: none; }
            .mr-table tr:hover td { background-color: #f8fafc; }
            .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
            .status-draft { background: #f1f5f9; color: #475569; }
            .status-submitted { background: #e0f2fe; color: #0369a1; }
            .status-stopped { background: #fee2e2; color: #991b1b; }
            .status-completed { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef3c7; color: #92400e; }
        </style>
    `;

    // Append layouts and insert an empty invisible container for our dynamic hover element 
    page.body.append(custom_css + `
        <div class="row px-3 mt-3">
            <div class="col-md-8">
                
                <div class="panel-container">
                    <div class="d-flex align-items-center mb-2">
                        <span class="panel-number">1</span>
                        <div class="input-group">
                            <input type="text" id="item-search-input" class="form-control" placeholder="Search items by name, description, code, or part number..." style="height: 42px;">
                            <div class="input-group-append">
                                <select id="filter-category-main" class="form-control" style="height: 42px; border-top-left-radius: 0; border-bottom-left-radius: 0; width: 160px;">
                                    <option value="">All Categories</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="d-flex gap-2 align-items-center mt-2 flex-wrap">
                        <select id="filter-category" class="form-control d-inline-block" style="width: auto; min-width: 140px; height: 36px;"><option value="">All Categories</option></select>
                        <select id="filter-units" class="form-control d-inline-block mx-2" style="width: auto; min-width: 120px; height: 36px;"><option value="">All Units</option></select>
                        <select id="filter-brands" class="form-control d-inline-block" style="width: auto; min-width: 120px; height: 36px;"><option value="">All Brands</option></select>
                        <button id="btn-reset-filters" class="btn btn-sm btn-light border ml-2" style="height: 36px; padding: 0 16px;">Reset</button>
                    </div>
                </div>

                <div class="panel-container">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="panel-title mb-0"><span class="panel-number">2</span> Item Catalog</div>
                        <span class="text-muted small" id="catalog-count-tracker">Showing 0 of 0 items</span>
                    </div>
                    <div id="catalog-list" class="row" style="max-height: 650px; overflow-y: auto;"></div>
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="panel-container">
                    <div class="panel-title">
                        <span class="panel-number">3</span> 
                        <i class="fa fa-shopping-cart mr-2"></i> Shopping Cart 
                        <span class="text-muted ml-1 small" id="cart-item-count">(0 items)</span>
                    </div>
                    
                    <div id="cart-items-wrapper" style="max-height: 320px; overflow-y: auto; margin-bottom: 16px;">
                        <div class="text-muted p-3 text-center empty-cart-msg">No items added yet.</div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center font-weight-bold pt-2 border-top mb-3" style="font-size: 15px;">
                        <div>Total <span id="cart-summary-count" class="text-muted font-weight-normal small">(0 items)</span></div>
                        <div id="cart-total-price">₱0.00</div>
                    </div>
                    
                    <button id="btn-proceed-checkout" class="btn-checkout">
                        Proceed to Checkout <i class="fa fa-arrow-right ml-2"></i>
                    </button>
                </div>

                <div class="panel-container d-none" id="panel-requisition-success">
                    <div class="panel-title"><span class="panel-number">4</span> Checkout & Requisition</div>
                    <div class="requisition-box">
                        <div class="success-badge">
                            <i class="fa fa-check-circle" style="font-size: 18px;"></i> Requisition generated successfully!
                        </div>
                        <div class="text-muted small">Requisition Number</div>
                        <div class="requisition-number" id="lbl-req-number"></div>
                        
                        <div class="qr-container">
                            <div id="qr-code-target"></div>
                            <div class="small text-muted" style="line-height: 1.4;">
                                Scan this QR code or use the requisition number for tracking and approval.
                            </div>
                        </div>
                    </div>
                    <button class="btn-print" id="btn-print-requisition">
                        <i class="fa fa-print mr-2"></i> Print Requisition Form
                    </button>
                </div>
            </div>
        </div>

        <!-- Material Requests Table -->
        <div class="row px-3">
            <div class="col-12">
                <div class="panel-container">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div class="panel-title mb-0">
                            <i class="fa fa-history text-primary mr-2"></i> My Material Requests
                        </div>
                        <button id="btn-refresh-requests" class="btn btn-sm btn-light border">
                            <i class="fa fa-refresh mr-1"></i> Refresh
                        </button>
                    </div>
                    <div class="table-responsive" style="max-height: 350px; overflow-y: auto;">
                        <table class="mr-table">
                            <thead>
                                <tr>
                                    <th>Request ID</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Required By</th>
                                    <th>Status</th>
                                    <th class="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody id="user-requests-table-body">
                                <tr>
                                    <td colspan="6" class="text-center text-muted p-3">Loading requests...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div id="item-hover-popup" class="item-hover-details-popup"></div>
    `);

    function trigger_filtered_reload() {
        let query = page.body.find('#item-search-input').val();
        fetch_and_render_items(query, page, cart);
    }

    page.body.find('#item-search-input').on('keyup', trigger_filtered_reload);
    
    page.body.find('#filter-category-main, #filter-category').on('change', function() {
        let active_val = $(this).val();
        page.body.find('#filter-category-main, #filter-category').val(active_val);
        trigger_filtered_reload();
    });

    page.body.find('#filter-units, #filter-brands').on('change', trigger_filtered_reload);

    page.body.find('#btn-reset-filters').on('click', function() {
        page.body.find('#item-search-input').val('');
        page.body.find('#filter-category-main, #filter-category, #filter-units, #filter-brands').val('');
        fetch_and_render_items('', page, cart);
    });

    page.body.find('#btn-proceed-checkout').on('click', function() {
        if (cart.length === 0) {
            frappe.msgprint(__('Your shopping cart is empty.'));
            return;
        }
        submit_cart_request(cart, page);
    });

    page.body.find('#btn-refresh-requests').on('click', function() {
        fetch_user_material_requests(page);
    });

    setup_filter_selectors(page, function() {
        fetch_and_render_items('', page, cart);
        fetch_user_material_requests(page);
    });
};

function setup_filter_selectors(page, callback_fn) {
    frappe.call({
        method: 'sims.sims.page.sims.sims.get_filter_options',
        callback: function(r) {
            if (r.message) {
                let options = r.message;
                let category_selectors = page.body.find('#filter-category-main, #filter-category');
                options.item_groups.forEach(group => {
                    category_selectors.append(`<option value="${group}">${group}</option>`);
                });
                let unit_selector = page.body.find('#filter-units');
                options.uoms.forEach(uom => {
                    unit_selector.append(`<option value="${uom}">${uom}</option>`);
                });
                let brand_selector = page.body.find('#filter-brands');
                options.brands.forEach(brand => {
                    brand_selector.append(`<option value="${brand}">${brand}</option>`);
                });
            }
            if(callback_fn) callback_fn();
        }
    });
}

function fetch_user_material_requests(page) {
    let tbody = page.body.find('#user-requests-table-body');
    tbody.html('<tr><td colspan="6" class="text-center text-muted p-3">Loading requests...</td></tr>');
    
    frappe.call({
        method: 'frappe.client.get_list',
        args: {
            doctype: 'Material Request',
            filters: {
                owner: frappe.session.user,
                docstatus: ['in',[1,2]]
            },
            fields: ['name', 'material_request_type', 'transaction_date', 'schedule_date', 'custom_approval_status', 'docstatus'],
            order_by: 'creation desc',
        },
        callback: function(r) {
            tbody.empty();
            let docs = r.message || [];
            
            if (docs.length === 0) {
                tbody.append('<tr><td colspan="6" class="text-center text-muted p-3">No Material Requests found.</td></tr>');
                return;
            }

            docs.forEach(doc => {
                let status_class = '';
                let display_status = doc.custom_approval_status || 'Submitted';
                let status = display_status.toLowerCase();

                if (status === 'draft') status_class = 'status-draft';
                else if (status === 'submitted' || status === 'for approval' || status === 'ready for withdrawal') status_class = 'status-submitted';
                else if (status === 'rejected') status_class = 'status-stopped';
                else if (status === 'for edit') status_class = 'status-pending';
                else if (status === 'approved' || status === 'completed' || status == "recorded request") status_class = 'status-completed';
        

                let row_html = `
                    <tr>
                        <td class="font-weight-bold" style="color: #0056b3;">
                            <a href="/app/material-request/${doc.name}" style="color: #0056b3;">${doc.name}</a>
                        </td>
                        <td>${doc.material_request_type || 'Purchase'}</td>
                        <td>${frappe.datetime.str_to_user(doc.transaction_date)}</td>
                        <td>${doc.schedule_date ? frappe.datetime.str_to_user(doc.schedule_date) : '-'}</td>
                        <td><span class="status-badge ${status_class}">${display_status}</span></td>
                        <td class="text-right">
                            <a href="/app/material-request/${doc.name}" class="btn btn-xs btn-light border">
                                View <i class="fa fa-chevron-right ml-1" style="font-size: 10px;"></i>
                            </a>
                        </td>
                    </tr>
                `;
                tbody.append(row_html);
            });
        }
    });
}

function fetch_and_render_items(query, page, cart) {
    let catalog = page.body.find('#catalog-list');
    let popup = $('#item-hover-popup');
    
    let selected_category = page.body.find('#filter-category').val();
    let selected_uom = page.body.find('#filter-units').val();
    let selected_brand = page.body.find('#filter-brands').val();

    frappe.call({
        method: 'sims.sims.page.sims.sims.get_items_with_stock', 
        args: { 
            search_text: query,
            item_group: selected_category,
            stock_uom: selected_uom,
            brand: selected_brand
        },
        callback: function(r) {
            catalog.empty();
            let items = r.message || [];
            
            page.body.find('#catalog-count-tracker').text(`Showing ${items.length} of ${items.length} items`);
            
            if (items.length === 0) {
                catalog.append('<div class="col-12 text-muted p-4 text-center">No matching office items found.</div>');
                return;
            }

            items.forEach(item => {
                let img_src = item.image ? item.image : '/assets/frappe/images/fallback_image.svg';
                let available_stock = flt(item.actual_qty, 2);
                let rate = flt(item.valuation_rate || 0.00, 2);
                
                let part_number = item.custom_part_number || 'N/A';
                let condition = item.custom_condition || 'N/A';
                
                let cart_item = cart.find(i => i.item_code === item.name);
                let current_cart_qty = cart_item ? cart_item.qty : 0;
                
                let is_disabled = (available_stock <= 0 || current_cart_qty >= available_stock);
                let button_text = is_disabled ? '<i class="fa fa-ban mr-1"></i> Out of Stock' : '<i class="fa fa-shopping-cart mr-1"></i> Add to Cart';

                let clean_desc = strip_html(item.description || 'No description layout configured.');

                let card_html = `
                    <div class="col-sm-6 col-md-3 mb-3">
                        <div class="catalog-card p-3 item-target-card" 
                            data-code="${item.name}"
                            data-name="${item.item_name}"
                            data-group="${item.item_group || 'Office Supplies'}"
                            data-uom="${item.stock_uom || 'pcs'}"
                            data-desc="${clean_desc.replace(/"/g, '&quot;')}"
                            data-part-number="${part_number.replace(/"/g, '&quot;')}"
                            data-condition="${condition.replace(/"/g, '&quot;')}"
                            data-img="${img_src}">
                            <div class="text-muted small mb-1">${item.name}</div>
                            <div class="text-truncate font-weight-bold mb-1" style="color:#0f172a; font-size:14px;" title="${item.item_name}">${item.item_name}</div>
                            
                            <!-- Display Part Number & Condition on Item Card -->
                            <div class="text-muted small mb-1 d-flex justify-content-between">
                                <span>Part #: <b>${part_number}</b></span>
                                <span>Condition: <b>${condition}</b></span>
                            </div>

                            <div class="text-muted small mb-3">Available: <b class="${available_stock <= 0 ? 'text-danger' : 'text-success'}">${available_stock}</b> ${item.stock_uom || 'pcs'}</div>
                            
                            <div class="text-center my-auto py-2" style="height: 100px; display: flex; align-items: center; justify-content: center;">
                                <img src="${img_src}" style="max-height: 100%; max-width: 100%; object-fit: contain;">
                            </div>
                            
                            <div class="mt-3">
                                <button class="btn-add-cart add-to-cart-btn" 
                                    data-item="${item.name}" 
                                    data-name="${item.item_name}" 
                                    data-uom="${item.stock_uom || 'pcs'}" 
                                    data-rate="${rate}"
                                    data-stock="${available_stock}"
                                    data-img="${img_src}"
                                    data-part-number="${part_number.replace(/"/g, '&quot;')}"
                                    data-condition="${condition.replace(/"/g, '&quot;')}"
                                    ${is_disabled ? 'disabled' : ''}>
                                    ${button_text}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                catalog.append(card_html);
            });

            // Hover Event Handlers
            catalog.find('.item-target-card').on('mouseenter', function() {
                let card = $(this);
                let code = card.data('code');
                let name = card.data('name');
                let group = card.data('group');
                let uom = card.data('uom');
                let desc = card.data('desc');
                let img = card.data('img');
                let part_num = card.data('part-number');
                let cond = card.data('condition');

                popup.html(`
                    <div class="hover-popup-content">
                        <div class="hover-popup-left">
                            <img src="${img}" style="max-height: 160px; max-width: 100%; object-fit: contain;">
                        </div>
                        <div class="hover-popup-right">
                            <div class="hover-label">Item Code</div>
                            <div class="hover-value" style="font-weight: bold; color: #0056b3;">${code}</div>
                            
                            <div class="hover-label">Item Name</div>
                            <div class="hover-value" style="font-weight: 500;">${name}</div>
                            
                            <div class="hover-label">Part Number</div>
                            <div class="hover-value" style="font-weight: 500; color: #0f172a;">${part_num}</div>
                            
                            <div class="hover-label">Condition</div>
                            <div class="hover-value"><span class="badge badge-info">${cond}</span></div>
                            
                            <div class="hover-label">Categories</div>
                            <div class="hover-value">${group}</div>
                            
                            <div class="hover-label">UOM</div>
                            <div class="hover-value"><span class="badge badge-light border">${uom}</span></div>
                            
                            <div class="hover-label">Description</div>
                            <div class="hover-value text-muted small" style="line-height: 1.4; max-height: 50px; overflow-y: auto;">${desc}</div>
                        </div>
                    </div>
                `).stop(true, true).fadeIn(150);
            }).on('mousemove', function(e) {
                let mouseX = e.clientX + 20;
                let mouseY = e.clientY + 20;
                
                if (mouseX + popup.outerWidth() > $(window).width()) {
                    mouseX = e.clientX - popup.outerWidth() - 20;
                }
                if (mouseY + popup.outerHeight() > $(window).height()) {
                    mouseY = e.clientY - popup.outerHeight() - 20;
                }
                
                popup.css({ top: mouseY, left: mouseX });
            }).on('mouseleave', function() {
                popup.stop(true, true).fadeOut(100);
            });

            // Add to Cart Event Handler
            catalog.find('.add-to-cart-btn').off('click').on('click', function(e) {
                e.stopPropagation();
                let btn = $(this);
                let item_code = btn.data('item');
                let item_name = btn.data('name');
                let uom = btn.data('uom');
                let rate = flt(btn.data('rate'));
                let max_stock = flt(btn.data('stock'));
                let img = btn.data('img');
                let part_num = btn.data('part-number');
                let cond = btn.data('condition');

                let existing = cart.find(i => i.item_code === item_code);
                if (existing) {
                    if (existing.qty < max_stock) {
                        existing.qty += 1;
                    } else {
                        frappe.show_alert({ message: __('Cannot exceed total stock available'), indicator: 'orange' });
                        return;
                    }
                } else {
                    cart.push({ 
                        item_code: item_code, 
                        item_name: item_name, 
                        qty: 1, 
                        uom: uom, 
                        rate: rate, 
                        max_stock: max_stock,
                        image: img,
                        custom_part_number: part_num,
                        custom_condition: cond
                    });
                }
                
                refresh_cart_view(page, cart);
                fetch_and_render_items(page.body.find('#item-search-input').val(), page, cart);
            });
        }
    });
}

function refresh_cart_view(page, cart) {
    let wrapper = page.body.find('#cart-items-wrapper');
    wrapper.empty();
    
    let total_items = cart.reduce((total, i) => total + i.qty, 0);
    let total_amount = cart.reduce((total, i) => total + (i.qty * i.rate), 0);
    
    page.body.find('#cart-item-count').text(`(${cart.length} items)`);
    page.body.find('#cart-summary-count').text(`(${total_items} items)`);
    page.body.find('#cart-total-price').text(`₱${format_currency(total_amount)}`);

    if (cart.length === 0) {
        wrapper.append('<div class="text-muted p-3 text-center empty-cart-msg">No items added yet.</div>');
        return;
    }

    cart.forEach((item, index) => {
        let img_html = item.image ? 
            `<img src="${item.image}" style="width: 44px; height: 44px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 6px; margin-right: 12px; background: #fff;" alt="img">` : 
            '';

        let row_html = `
            <div class="cart-item-row d-flex align-items-start">
                ${img_html}
                <div style="flex: 1; padding-right: 24px;">
                    <div class="font-weight-bold text-truncate text-sm" style="color: #1e293b; max-width: 90%;" title="${item.item_name}">${item.item_name}</div>
                    <div class="text-muted small">${item.item_code} | P/N: ${item.custom_part_number || 'N/A'}</div>
                    <div class="d-flex justify-content-between align-items-center mt-1">
                        <div class="text-muted small">Qty: <input type="number" class="d-inline-block text-center form-control form-control-sm cart-qty-input" data-index="${index}" value="${item.qty}" min="1" max="${item.max_stock}" style="width: 55px; height:24px; padding:2px;"> ${item.uom}</div>
                        <div class="font-weight-bold text-sm" style="color:#0f172a;">₱${format_currency(item.rate * item.qty)}</div>
                    </div>
                </div>
                <button class="cart-remove-btn" data-index="${index}">&times;</button>
            </div>
        `;
        wrapper.append(row_html);
    });

    wrapper.find('.cart-qty-input').on('change', function() {
        let idx = $(this).data('index');
        let val = flt($(this).val()) || 1;
        let item = cart[idx];
        
        if (val > item.max_stock) {
            val = item.max_stock;
            frappe.show_alert({ message: __('Max stock limit reached ({0})', [item.max_stock]), indicator: 'orange' });
        }
        if (val < 1) val = 1;
        
        item.qty = val;
        refresh_cart_view(page, cart);
        fetch_and_render_items(page.body.find('#item-search-input').val(), page, cart);
    });

    wrapper.find('.cart-remove-btn').on('click', function() {
        let idx = $(this).data('index');
        cart.splice(idx, 1);
        refresh_cart_view(page, cart);
        fetch_and_render_items(page.body.find('#item-search-input').val(), page, cart);
    });
}

function submit_cart_request(cart, page) {
    frappe.confirm(__('Are you sure you want to submit this request?'), function() {
        frappe.call({
            method: 'sims.sims.page.sims.sims.create_material_request', 
            args: { items: cart },
            freeze: true,
            callback: function(r) {
                if (!r.exc && r.message) {
                    const req_number = r.message;
                    const tracking_url = `${req_number}`;
                    
                    let panel_4 = page.body.find('#panel-requisition-success');
                    panel_4.removeClass('d-none');
                    page.body.find('#lbl-req-number').text(req_number);
                    
                    let qr_img_url = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(tracking_url)}`;
                    page.body.find('#qr-code-target').html(`<img src="${qr_img_url}" width="100" height="100" alt="QR Link">`);
                    
                    page.body.find('#btn-print-requisition').off('click').on('click', function() {
                        frappe.utils.print("Material Request", req_number, "SIMS REQ", 0, frappe.boot.lang);
                    });

                    cart.length = 0;
                    refresh_cart_view(page, cart);
                    page.body.find('#item-search-input').val('');
                    page.body.find('#filter-category-main, #filter-category, #filter-units, #filter-brands').val('');
                    fetch_and_render_items('', page, cart);
                    
                    fetch_user_material_requests(page);
                    
                    frappe.show_alert({ message: __('Material Request generated successfully!'), indicator: 'green' });
                }
            }
        });
    });
}

function format_currency(val) {
    return flt(val, 2).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function strip_html(html) {
    let tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}