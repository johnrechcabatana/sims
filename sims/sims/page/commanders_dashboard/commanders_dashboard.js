frappe.pages['commanders-dashboard'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: __('Material Request & Inventory Dashboard'),
        single_column: true
    });

    // Render HTML Layout
    $(wrapper).find('.layout-main-section').html(`
        <style>
            .dash-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
            .kpi-box { display: flex; align-items: center; justify-content: space-between; }
            .kpi-icon { width: 52px; height: 52px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; color: #fff; }
            .kpi-title { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
            .kpi-val { font-size: 26px; font-weight: 800; color: #0f172a; margin: 4px 0 2px; }
            .kpi-sub { font-size: 11px; color: #64748b; }
            
            .sec-header { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 800; color: #1e293b; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
            .sec-badge { background: #2563eb; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; margin-right: 6px; }

            .badge-status { padding: 4px 5px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
            .status-for-approval { background: #fef3c7; color: #d97706; }
            .status-for-review { background: #dbeafe; color: #2563eb; }
            .status-pending { background: #f3e8ff; color: #7c3aed; }

            .insight-item { display: flex; align-items: flex-start; gap: 10px; font-size: 12px; padding: 10px; border-radius: 8px; background: #f8fafc; border: 1px solid #f1f5f9; margin-bottom: 8px; }
            .progress-bar-custom { height: 8px; border-radius: 4px; background: #e2e8f0; overflow: hidden; margin-top: 4px; margin-bottom: 12px; }
            .progress-fill { height: 100%; background: #2563eb; border-radius: 4px; }
        </style>

        <div class="container-fluid p-2">
            <!-- 1. EXECUTIVE KPIs -->
            <div class="row">
                <div class="col-md-3">
                    <div class="dash-card kpi-box">
                        <div>
                            <div class="kpi-title">Total Inventory Value</div>
                            <div class="kpi-val" id="kpi-val-total">₱ 0.0M</div>
                            <div class="kpi-sub">All Warehouses</div>
                        </div>
                        <div class="kpi-icon" style="background: #1d4ed8;"><i class="fa fa-cube"></i></div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="dash-card kpi-box">
                        <div>
                            <div class="kpi-title">Low-Stock Items</div>
                            <div class="kpi-val" id="kpi-val-lowstock">0</div>
                            <div class="kpi-sub">Below Reorder Level</div>
                        </div>
                        <div class="kpi-icon" style="background: #ea580c;"><i class="fa fa-exclamation-triangle"></i></div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="dash-card kpi-box">
                        <div>
                            <div class="kpi-title">Pending Requests</div>
                            <div class="kpi-val" id="kpi-val-pending">0</div>
                            <div class="kpi-sub">Awaiting Action</div>
                        </div>
                        <div class="kpi-icon" style="background: #7c3aed;"><i class="fa fa-edit"></i></div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="dash-card kpi-box">
                        <div>
                            <div class="kpi-title">Approved Requests</div>
                            <div class="kpi-val" id="kpi-val-approved">0</div>
                            <div class="kpi-sub">This Month</div>
                        </div>
                        <div class="kpi-icon" style="background: #16a34a;"><i class="fa fa-check-circle"></i></div>
                    </div>
                </div>
            </div>

            <!-- ROW 2: Stock Levels & Requests For Action -->
            <div class="row">
                <div class="col-md-6">
                    <div class="dash-card">
                        <div class="sec-header">
                            <div><span class="sec-badge">2</span> Stock Levels <span style="font-weight: 500; color: #64748b; font-size: 12px;">(by Item Category)</span></div>
                        </div>
                        <div class="row align-items-center">
                            <div class="col-md-6"><div id="chart-stock-levels" style="height: 190px;"></div></div>
                            <div class="col-md-6">
                                <table class="table table-borderless table-sm mb-0" style="font-size: 12px;">
                                    <thead><tr style="color: #64748b;"><th>Category</th><th class="text-right">Value (P)</th><th class="text-right">% Total</th></tr></thead>
                                    <tbody id="tbl-stock-breakdown"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="dash-card">
                        <div class="sec-header">
                            <div><span class="sec-badge">3</span> Requests for Action</div>
                            <a href="/app/material-request" class="btn btn-xs btn-default">View All ></a>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover table-sm mb-0" style="font-size: 12px;">
                                <thead>
                                    <tr style="color: #64748b;">
                                        <th>Request ID</th><th>Requested By</th><th>Type</th><th>Date</th><th>Status</th>
                                    </tr>
                                </thead>
                                <tbody id="tbl-requests-action"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ROW 3: Historical Withdrawals & Executive Analytics -->
            <div class="row">
                <!-- 4. HISTORICAL WITHDRAWALS -->
                <div class="col-md-6">
                    <div class="dash-card">
                        <div class="sec-header">
                            <div><span class="sec-badge">4</span> Historical Withdrawals <span style="font-weight: 500; color: #64748b; font-size: 12px;">(Over Time)</span></div>
                            <span class="badge badge-light">Last 6 Months</span>
                        </div>
                        <div id="chart-historical-line" style="height: 220px;"></div>
                    </div>
                </div>

                <!-- 5. EXECUTIVE ANALYTICS -->
                <div class="col-md-6">
                    <div class="dash-card">
                        <div class="sec-header">
                            <div><span class="sec-badge">5</span> Executive Analytics</div>
                        </div>
                        <div class="row">
                            <!-- Top Withdrawn -->
                            <div class="col-md-4">
                                <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase;">Top Withdrawn Categories <span style="font-weight:400; font-size:10px;">(This Month)</span></div>
                                <div id="container-top-withdrawn"></div>
                            </div>

                            <!-- Inventory Health -->
                            <div class="col-md-4 text-center">
                                <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase;">Inventory Health <span style="font-weight:400; font-size:10px;">(By Value)</span></div>
                                <div id="chart-inventory-health" style="height: 140px;"></div>
                            </div>

                            <!-- Key Insights -->
                            <div class="col-md-4">
                                <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 8px; text-transform: uppercase;">Key Insights</div>
                                <div class="insight-item">
                                    <i class="fa fa-check-circle text-success" style="font-size: 16px; margin-top:2px;"></i>
                                    <div>Inventory value increased <b>12% vs last month</b>.</div>
                                </div>
                                <div class="insight-item">
                                    <i class="fa fa-exclamation-triangle text-warning" style="font-size: 16px; margin-top:2px;"></i>
                                    <div><b id="insight-lowstock-count">0 items</b> are below reorder level.</div>
                                </div>
                                <div class="insight-item">
                                    <i class="fa fa-info-circle text-info" style="font-size: 16px; margin-top:2px;"></i>
                                    <div>Pending requests require timely attention.</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);

    // Fetch data from backend Python script
    load_dashboard_data();
};

function load_dashboard_data() {
    frappe.call({
        method: "sims.sims.page.commanders_dashboard.commanders_dashboard.get_dashboard_metrics",
        callback: function(r) {
            if (!r.message) return;
            var data = r.message;

            // 1. Update KPIs
            $("#kpi-val-total").text(data.kpis.total_value);
            $("#kpi-val-lowstock").text(data.kpis.low_stock);
            $("#kpi-val-pending").text(data.kpis.pending);
            $("#kpi-val-approved").text(data.kpis.approved);
            $("#insight-lowstock-count").text(data.kpis.low_stock + " items");

            // 2. Render Stock Levels Breakdown Table & Chart
            if (data.stock_by_group && data.stock_by_group.length) {
                var colors = ['#2563eb', '#16a34a', '#f97316', '#9333ea'];
                var tblHtml = "";
                data.stock_by_group.forEach(function(row, idx) {
                    var c = colors[idx % colors.length];
                    tblHtml += `<tr>
                        <td><i class="fa fa-circle" style="color:${c}; margin-right: 4px;"></i> ${row.item_group}</td>
                        <td class="text-right"><b>₱ ${(row.total_value/1000000).toFixed(1)}M</b></td>
                        <td class="text-right">${row.percent}%</td>
                    </tr>`;
                });
                $("#tbl-stock-breakdown").html(tblHtml);

                new frappe.Chart("#chart-stock-levels", {
                    data: {
                        labels: data.stock_by_group.map(d => d.item_group),
                        datasets: [{ values: data.stock_by_group.map(d => d.total_value) }]
                    },
                    type: 'donut',
                    height: 180,
                    colors: colors
                });
            }

            // 3. Render Requests Table
            var reqHtml = "";
            (data.action_requests || []).forEach(function(row) {
                var statusClass = row.custom_approval_status === 'Pending' ? 'status-for-approval' : 'status-for-review';
                reqHtml += `<tr>
                    <td><a href="/app/material-request/${row.name}"><b>${row.name}</b></a></td>
                    <td>${row.custom_client}</td>
                    <td>${row.material_request_type}</td>
                    <td>${row.transaction_date || ''}</td>
                    <td><span class="badge-status ${statusClass}">${row.custom_approval_status}</span></td>
                </tr>`;
            });
            $("#tbl-requests-action").html(reqHtml || "<tr><td colspan='5' class='text-muted text-center'>No pending requests</td></tr>");

            // 4. Render Historical Withdrawals Line Chart
            if (data.historical_withdrawals && data.historical_withdrawals.length) {
                new frappe.Chart("#chart-historical-line", {
                    data: {
                        labels: data.historical_withdrawals.map(d => d.month_label),
                        datasets: [{ name: "Withdrawn Value (P)", values: data.historical_withdrawals.map(d => d.total_withdrawn) }]
                    },
                    type: 'line',
                    height: 200,
                    colors: ['#2563eb'],
                    lineOptions: {
                        regionFill: 1, // Adds area shading under line
                        dotSize: 6
                    }
                });
            }

            // 5. Executive Analytics - Top Withdrawn Categories
            if (data.top_withdrawn && data.top_withdrawn.length) {
                var topHtml = "";
                data.top_withdrawn.forEach(function(item) {
                    var valStr = item.val >= 1000000 ? (item.val/1000000).toFixed(1) + 'M' : (item.val/1000).toFixed(0) + 'K';
                    topHtml += `
                        <div style="font-size: 11px; margin-top: 6px;">
                            <div>${item.item_group} <span class="float-right"><b>₱ ${valStr}</b></span></div>
                            <div class="progress-bar-custom">
                                <div class="progress-fill" style="width: ${item.bar_pct}%;"></div>
                            </div>
                        </div>
                    `;
                });
                $("#container-top-withdrawn").html(topHtml);
            }

            // 5b. Inventory Health Donut Chart
            var h = data.health || { healthy: 1, at_risk: 0, critical: 0 };
            new frappe.Chart("#chart-inventory-health", {
                data: {
                    labels: ["Healthy", "At Risk", "Critical"],
                    datasets: [{ values: [h.healthy, h.at_risk, h.critical] }]
                },
                type: 'donut',
                height: 140,
                colors: ['#16a34a', '#f97316', '#dc2626']
            });
        }
    });
}