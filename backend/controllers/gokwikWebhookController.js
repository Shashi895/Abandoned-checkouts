import Checkout from '../models/Checkout.js';
import fs from 'fs';
import path from 'path';

export const handleGoKwikWebhook = async (req, res) => {
    try {
        const payload = req.body;
        console.log('--- GOKWIK WEBHOOK RECEIVED ---');
        console.log(JSON.stringify(payload, null, 2));

        // Log to a persistent file for easy debugging
        try {
            const logDir = path.resolve('logs');
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            const logFile = path.join(logDir, 'gokwik_webhooks.log');
            const logEntry = `[${new Date().toISOString()}] Received GoKwik Webhook:\n${JSON.stringify(payload, null, 2)}\n\n`;
            fs.appendFileSync(logFile, logEntry);
        } catch (err) {
            console.error('Failed to write to gokwik_webhooks.log:', err);
        }

        // Support both nested structure (under data/body) and top-level structure
        const data = payload.data || payload.body || payload;

        // Try extracting checkout ID using all known variants
        const checkoutId = data.request_id || 
                           data.token || 
                           data.c_id || 
                           data.checkout_id || 
                           data.cart_id || 
                           data.cartId ||
                           data.id || 
                           payload.request_id || 
                           payload.token || 
                           payload.c_id || 
                           payload.checkout_id || 
                           payload.cart_id || 
                           payload.id;
        
        if (!checkoutId) {
            console.error('No ID found in GoKwik payload keys:', Object.keys(payload));
            return res.status(200).send('No ID found');
        }

        // Extracting address & customer from GoKwik structure (nested or flat)
        const address = data.address || {};
        const customer = data.customer || {};
        
        // Extract customer name
        let customer_name = `${address.firstname || customer.firstname || ''} ${address.lastname || customer.lastname || ''}`.trim();
        if (!customer_name) {
            customer_name = data.name || data.customer_name || 'Unknown';
        }

        // Extract email and phone
        const customer_email = address.email || customer.email || data.email || data.customer_email || 'No Email';
        const customer_phone = address.phone || customer.phone || data.phone || data.customer_phone || '';

        // Extract total amount (handle GoKwik's paise/rupees format if price is abnormally large)
        let rawAmount = data.total_price || data.total_amount || data.amount || 0;
        let total_amount = parseFloat(rawAmount);
        if (isNaN(total_amount)) total_amount = 0;

        // Extract checkout URL
        const checkout_url = data.abc_url || data.checkout_url || data.url || '';
        const created_at = data.created_at || payload.created_at;
        
        const full_address = address.address || data.address_line1 || data.address || '';
        const pincode = address.pincode || data.pincode || data.zip || '';

        // Extract and format products
        const items = data.items || data.cartItems || payload.items || [];
        const products = Array.isArray(items) ? items.map(item => {
            let itemPrice = parseFloat(item.price || item.amount || 0);
            if (itemPrice > 0) {
                itemPrice = itemPrice / 100; // Always convert from paise to rupees
            }
            return {
                title: item.product_title || item.title || item.name || 'Product',
                quantity: parseInt(item.quantity || 1, 10),
                price: itemPrice
            };
        }) : [];

        // Check if this is a completed/paid/placed order
        const isPaid = data.order_id || 
                       data.shopify_order_id || 
                       data.order_number ||
                       (payload.event && (payload.event.toLowerCase().includes('placed') || payload.event.toLowerCase().includes('completed') || payload.event.toLowerCase().includes('success'))) ||
                       (data.event && (data.event.toLowerCase().includes('placed') || data.event.toLowerCase().includes('completed') || data.event.toLowerCase().includes('success')));

        const status = isPaid ? 'converted' : 'abandoned';

        // Save or update in database
        const updatedLead = await Checkout.findOneAndUpdate(
            { checkout_id: checkoutId.toString() },
            {
                checkout_id: checkoutId.toString(),
                name: customer_name,
                email: customer_email,
                phone: customer_phone,
                amount: total_amount,
                currency: data.currency || payload.currency || 'INR',
                checkout_url: checkout_url,
                address: full_address,
                pincode: pincode,
                products: products,
                created_at: created_at ? new Date(created_at) : new Date(),
                status: status
            },
            { upsert: true, new: true }
        );

        console.log(`GoKwik Checkout ${checkoutId} saved successfully:`, updatedLead._id);
        res.status(200).send('GoKwik Webhook Received Successfully');
    } catch (error) {
        console.error('GoKwik Webhook Error:', error);
        res.status(500).send('Internal Server Error');
    }
};
