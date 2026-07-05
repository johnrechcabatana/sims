frappe.pages['sims'].on_page_load = function(wrapper) {
    let page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Cart Requisition',
        single_column: true
    });

    // Main App Layout States
    let cart = []; 

    // Primary Submission Action button 
    let submit_btn = page.set_primary_action('Submit Request', function() {
        if (cart.length === 0) {
            frappe.msgprint(__('Your cart is currently empty.'));
            return;
        }
        submit_cart_request(cart, page);
    });

    // Append Bootstrap Layout Styles
    page.body.append(`
        <div class="row px-3 mt-3">
            <!-- Left Side: Catalog Search Panel -->
            <div class="col-md-8 border-right">
                <div class="form-group">
                    <input type="text" id="item-search-input" class="form-control" placeholder="🔍 Search items by code or name..." style="font-size: 16px; padding: 12px;">
                </div>
                <div id="catalog-list" class="row mt-3" style="max-height: 650px; overflow-y: auto;">
                    <!-- Dynamically populated via JS -->
                </div>
            </div>
            
            <!-- Right Side: Live Cart Review -->
            <div class="col-md-4">
                <h4 class="mb-3 d-flex justify-content-between align-items-center">
                    <span>Selected Cart Items</span>
                    <span class="badge badge-primary" id="cart-counter" style="font-size: 14px;">0</span>
                </h4>
                <div id="cart-items-wrapper" class="list-group border rounded" style="min-height: 200px; max-height: 500px; overflow-y: auto; background: #fdfdfd;">
                    <div class="text-muted p-3 text-center empty-cart-msg">No items added yet.</div>
                </div>
            </div>
        </div>
    `);

    // Attach Live Input Query Event
    page.body.find('#item-search-input').on('keyup', function() {
        let query = $(this).val();
        fetch_and_render_items(query, page, cart);
    });

    // Pull initial top item list on layout launch
    fetch_and_render_items('', page, cart);
};

// 1. Fetch Items and their Real-time stock counts based on live search criteria
function fetch_and_render_items(query, page, cart) {
    let catalog = page.body.find('#catalog-list');
    
    // Call our server method to get items along with their stock balances
    frappe.call({
        method: 'sims.sims.page.sims.sims.get_items_with_stock', // Update with your python namespace
        args: { search_text: query },
        callback: function(r) {
            catalog.empty();
            if (!r.message || r.message.length === 0) {
                catalog.append('<div class="col-12 text-muted p-3 text-center">No matching stock items found.</div>');
                return;
            }

            r.message.forEach(item => {
                let img_src = item.image ? item.image : '/assets/frappe/images/fallback_image.svg';
                
                // Track how many are already in the cart to calculate remaining allowed quantity
                let cart_item = cart.find(i => i.item_code === item.name);
                let current_cart_qty = cart_item ? cart_item.qty : 0;
                let available_stock = item.actual_qty || 0;
                
                // Set badge style depending on availability
                let stock_badge_class = available_stock <= 0 ? 'badge-danger' : (available_stock < 5 ? 'badge-warning' : 'badge-success');
                
                // Determine if button should be disabled
                let is_disabled = (available_stock <= 0 || current_cart_qty >= available_stock);
                let btn_text = is_disabled ? '🚫 Out of Stock' : '➕ Add to Cart';
                let btn_class = is_disabled ? 'btn-secondary disabled' : 'btn-primary-light';

                let card_html = `
                    <div class="col-sm-6 col-md-4 mb-3" id="item-card-${item.name.replace(/[^a-zA-Z0-9]/g, '_')}">
                        <div class="card h-100 shadow-sm text-center p-2">
                            <div style="height: 120px; display: flex; align-items: center; justify-content: center; position: relative;">
                                <img src="${img_src}" style="max-height: 100%; max-width: 100%; object-fit: contain;" class="rounded">
                                <span class="badge ${stock_badge_class}" style="position: absolute; top: 5px; right: 5px; font-size: 11px;">
                                    Stock: ${available_stock}
                                </span>
                            </div>
                            <div class="card-body p-2 d-flex flex-column justify-content-between">
                                <div class="text-truncate font-weight-bold mb-1" title="${item.item_name}">${item.item_name}</div>
                                <div class="text-muted text-xs mb-2 small">${item.name}</div>
                                <button class="btn btn-sm add-to-cart-btn btn-block ${btn_class}" 
                                    data-item="${item.name}" 
                                    data-name="${item.item_name}" 
                                    data-uom="${item.stock_uom}" 
                                    data-stock="${available_stock}"
                                    ${is_disabled ? 'disabled' : ''}>
                                    ${btn_text}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                catalog.append(card_html);
            });

            // Bind click event handlers
            catalog.find('.add-to-cart-btn').on('click', function() {
                let btn = $(this);
                let item_code = btn.data('item');
                let item_name = btn.data('name');
                let uom = btn.data('uom');
                let max_stock = parseFloat(btn.data('stock'));

                let dynamic_item = cart.find(i => i.item_code === item_code);
                if (dynamic_item) {
                    if (dynamic_item.qty < max_stock) {
                        dynamic_item.qty += 1;
                    }
                } else {
                    if (max_stock > 0) {
                        cart.push({ item_code: item_code, item_name: item_name, qty: 1, uom: uom, max_stock: max_stock });
                    }
                }
                refresh_cart_view(page, cart);
                update_catalog_buttons(page, cart);
            });
        }
    });
}

// Helper to refresh catalog button constraints without executing full searches repeatedly
function update_catalog_buttons(page, cart) {
    page.body.find('.add-to-cart-btn').each(function() {
        let btn = $(this);
        let item_code = btn.data('item');
        let max_stock = parseFloat(btn.data('stock'));
        let cart_item = cart.find(i => i.item_code === item_code);
        let cart_qty = cart_item ? cart_item.qty : 0;

        if (max_stock <= 0 || cart_qty >= max_stock) {
            btn.addClass('btn-secondary disabled').removeClass('btn-primary-light').attr('disabled', true).text('🚫 Out of Stock');
        } else {
            btn.addClass('btn-primary-light').removeClass('btn-secondary disabled').attr('disabled', false).text('➕ Add to Cart');
        }
    });
}

// 2. Sync State modifications down into UI Card Panel Lists
function refresh_cart_view(page, cart) {
    let wrapper = page.body.find('#cart-items-wrapper');
    let counter = page.body.find('#cart-counter');
    wrapper.empty();
    
    counter.text(cart.reduce((total, i) => total + i.qty, 0));

    if (cart.length === 0) {
        wrapper.append('<div class="text-muted p-3 text-center empty-cart-msg">No items added yet.</div>');
        return;
    }

    cart.forEach((item, index) => {
        html = `
            <div class="list-group-item d-flex justify-content-between align-items-center p-2 border-bottom">
                <div style="max-width: 55%;">
                    <div class="text-truncate font-weight-bold text-sm" title="${item.item_name}">${item.item_name}</div>
                    <small class="text-muted">${item.item_code}</small>
                </div>
                <div class="d-flex align-items-center">
                    <input type="number" class="form-control form-control-sm qty-input text-center mx-1" 
                        data-index="${index}" value="${item.qty}" min="1" max="${item.max_stock}" style="width: 65px;">
                    <button class="btn btn-sm btn-link text-danger remove-cart-item" data-index="${index}">❌</button>
                </div>
            </div>
        `;
        wrapper.append(html);
    });

    // Handle Quantity adjustments inside Cart panel
    wrapper.find('.qty-input').on('change', function() {
        let idx = $(this).data('index');
        let target_item = cart[idx];
        let val = parseInt($(this).val()) || 1;
        
        // Clamp quantity values between 1 and total stock limits
        if (val < 1) val = 1;
        if (val > target_item.max_stock) {
            val = target_item.max_stock;
            frappe.show_alert({message: __('Cannot exceed total stock available ({0})', [target_item.max_stock]), indicator: 'orange'});
        }
        
        target_item.qty = val;
        refresh_cart_view(page, cart);
        update_catalog_buttons(page, cart);
    });

    // Handle Removing item altogether
    wrapper.find('.remove-cart-item').on('click', function() {
        let idx = $(this).data('index');
        cart.splice(idx, 1);
        refresh_cart_view(page, cart);
        update_catalog_buttons(page, cart);
    });
}

// 3. Dispatch structured Array payload to local API endpoint to build Material Request
function submit_cart_request(cart, page) {
    frappe.confirm(__('Are you sure you want to submit this request?'), function() {
        frappe.call({
            method: 'sims.sims.page.sims.sims.create_material_request', 
            args: { items: cart },
            callback: function(r) {
                if (!r.exc) {
                    const mr = r.message;
                    const url = `${window.location.origin}/app/material-request/${mr}`;
                    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(url)}`;

                    frappe.msgprint({
                        title: __('Success'),
                        indicator: 'green',
                        message: `
                            <p>
                                Material Request
                                <b><a href="/app/material-request/${mr}">${mr}</a></b>
                                has been generated.
                            </p>
                            <p>&nbsp;</p>
                            <p style = "text-align:center"><strong> Capture the QR code</strong></p>

                            <div style="text-align:center;">
                                <img src="${qr}" width="180" height="180">
                            </div>
                        `
                    });

                    // Reset variables
                    cart.length = 0;
                    refresh_cart_view(page, cart);
                    let query = page.body.find('#item-search-input').val();
                    fetch_and_render_items(query, page, cart);
                }
            }
        });
    });
}