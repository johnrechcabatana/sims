frappe.pages['sims'].on_page_load = function(wrapper) {
    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Cart Requisition',
        single_column: true
    });

    // Main App Layout States
    let cart = []; 

    // Append custom custom styles to match UI layout colors and styling
    const custom_css = `
        <style>
            .panel-container { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
            .panel-number { background: #0056b3; color: white; border-radius: 50%; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 8px; font-size: 14px; }
            .panel-title { font-size: 16px; font-weight: bold; color: #1e293b; display: flex; align-items: center; margin-bottom: 16px; }
            .catalog-card { border: 1px solid #e2e8f0; border-radius: 8px; transition: all 0.2s; background: #fff; display: flex; flex-direction: column; height: 100%; }
            .catalog-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
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
        </style>
    `;

    // Append structural layout mimicking sections 1, 2, 3, and 4
    page.body.append(custom_css + `
        <div class="row px-3 mt-3">
            <div class="col-md-8">
                
                <div class="panel-container">
                    <div class="d-flex align-items-center mb-2">
                        <span class="panel-number">1</span>
                        <div class="input-group">
                            <input type="text" id="item-search-input" class="form-control" placeholder="Search items by name, description, or code..." style="height: 42px;">
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
                    <div id="catalog-list" class="row" style="max-height: 650px; overflow-y: auto;">
                        </div>
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
    `);

    // Attach Event Actions
    page.body.find('#item-search-input').on('keyup', function() {
        fetch_and_render_items($(this).val(), page, cart);
    });

    page.body.find('#btn-reset-filters').on('click', function() {
        page.body.find('#item-search-input').val('');
        fetch_and_render_items('', page, cart);
    });

    page.body.find('#btn-proceed-checkout').on('click', function() {
        if (cart.length === 0) {
            frappe.msgprint(__('Your shopping cart is empty.'));
            return;
        }
        submit_cart_request(cart, page);
    });

    // Populate Catalog View initially
    fetch_and_render_items('', page, cart);
};

// 1. Fetch items data using Python SQL joins
function fetch_and_render_items(query, page, cart) {
    let catalog = page.body.find('#catalog-list');
    
    frappe.call({
        method: 'sims.sims.page.sims.sims.get_items_with_stock', 
        args: { search_text: query },
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
                
                let cart_item = cart.find(i => i.item_code === item.name);
                let current_cart_qty = cart_item ? cart_item.qty : 0;
                
                let is_disabled = (available_stock <= 0 || current_cart_qty >= available_stock);
                let button_text = is_disabled ? '<i class="fa fa-ban mr-1"></i> Out of Stock' : '<i class="fa fa-shopping-cart mr-1"></i> Add to Cart';

                let card_html = `
                    <div class="col-sm-6 col-md-3 mb-3">
                        <div class="catalog-card p-3">
                            <div class="text-muted small mb-1">${item.name}</div>
                            <div class="text-truncate font-weight-bold mb-1" style="color:#0f172a; font-size:14px;" title="${item.item_name}">${item.item_name}</div>
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
                                    data-stock="${available_stock}" ${is_disabled ? 'disabled' : ''}>
                                    ${button_text}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                catalog.append(card_html);
            });

            // Handle Add To Cart logic
            catalog.find('.add-to-cart-btn').off('click').on('click', function() {
                let btn = $(this);
                let item_code = btn.data('item');
                let item_name = btn.data('name');
                let uom = btn.data('uom');
                let rate = flt(btn.data('rate'));
                let max_stock = flt(btn.data('stock'));

                let existing = cart.find(i => i.item_code === item_code);
                if (existing) {
                    if (existing.qty < max_stock) {
                        existing.qty += 1;
                    } else {
                        frappe.show_alert({ message: __('Cannot exceed total stock available'), indicator: 'orange' });
                        return;
                    }
                } else {
                    cart.push({ item_code: item_code, item_name: item_name, qty: 1, uom: uom, rate: rate, max_stock: max_stock });
                }
                
                refresh_cart_view(page, cart);
                fetch_and_render_items(page.body.find('#item-search-input').val(), page, cart);
            });
        }
    });
}

// 2. Refresh Shopping Cart calculations
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
        let row_html = `
            <div class="cart-item-row">
                <div style="padding-right: 24px;">
                    <div class="font-weight-bold text-truncate text-sm" style="color: #1e293b; max-width: 85%;" title="${item.item_name}">${item.item_name}</div>
                    <div class="text-muted small">${item.item_code}</div>
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

    // Update quantity inputs
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

    // Remove single entry from selections
    wrapper.find('.cart-remove-btn').on('click', function() {
        let idx = $(this).data('index');
        cart.splice(idx, 1);
        refresh_cart_view(page, cart);
        fetch_and_render_items(page.body.find('#item-search-input').val(), page, cart);
    });
}

// 3. Document Submission and Native Print view binding execution
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
                    
                    // Show Panel 4 Success Screen Container
                    let panel_4 = page.body.find('#panel-requisition-success');
                    panel_4.removeClass('d-none');
                    page.body.find('#lbl-req-number').text(req_number);
                    
                    // Render status tracker QR code context
                    let qr_img_url = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(tracking_url)}`;
                    page.body.find('#qr-code-target').html(`<img src="${qr_img_url}" width="100" height="100" alt="QR Link">`);
                    
                    // CORE PRINT FIX: Dynamic routing using Frappe's native printing window utilities
                    page.body.find('#btn-print-requisition').off('click').on('click', function() {
                        frappe.utils.print(
                            "Material Request",   // Doctype Name
                            req_number,          // Document Name/ID
                            "Material Request",          // Target Print Format name (Change to custom name if needed)
                            0,                   // No letterhead flag (0 = Include letterhead, 1 = Exclude)
                            frappe.boot.lang     // Current User preference Language encoding
                        );
                    });

                    // Flush fields and reload items catalog layout
                    cart.length = 0;
                    refresh_cart_view(page, cart);
                    page.body.find('#item-search-input').val('');
                    fetch_and_render_items('', page, cart);
                    
                    frappe.show_alert({ message: __('Material Request generated successfully!'), indicator: 'green' });
                }
            }
        });
    });
}

// Formats number variables to localized Philippine Peso standard layouts
function format_currency(val) {
    return flt(val, 2).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}