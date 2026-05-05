import Checkout from '../models/Checkout.js';

export const handleGoKwikWebhook = async (req, res) => {
    try {
        const payload = req.body;
        console.log('--- GOKWIK WEBHOOK RECEIVED ---');
        console.log(JSON.stringify(payload, null, 2));

        // Actual GoKwik headers from documentation
        const checkoutId = payload.request_id || payload.token || payload.c_id;
        
        if (!checkoutId) {
            console.error('No ID found in GoKwik payload');
            return res.status(200).send('No ID found');
        }

        // Extracting data from GoKwik structure
        const address = payload.address || {};
        const customer = payload.customer || {};
        
        const customer_name = `${address.firstname || customer.firstname || ''} ${address.lastname || customer.lastname || ''}`.trim();
        const customer_email = address.email || customer.email || 'No Email';
        const customer_phone = address.phone || customer.phone || '';
        const total_amount = payload.total_price || 0;
        const checkout_url = payload.abc_url || '';
        const created_at = payload.created_at;
        
        const full_address = address.address || '';
        const pincode = address.pincode || '';

        const products = payload.items ? payload.items.map(item => ({
            title: item.product_title || item.title,
            quantity: item.quantity,
            price: item.price / 100 // Convert from paise to rupees if it's 47700 format
        })) : [];

        await Checkout.findOneAndUpdate(
            { checkout_id: checkoutId.toString() },
            {
                checkout_id: checkoutId.toString(),
                name: customer_name || 'Unknown',
                email: customer_email,
                phone: customer_phone,
                amount: total_amount,
                currency: payload.currency || 'INR',
                checkout_url: checkout_url,
                address: full_address,
                pincode: pincode,
                products: products,
                created_at: created_at ? new Date(created_at) : new Date(),
                status: 'abandoned'
            },
            { upsert: true }
        );



        console.log(`GoKwik Checkout ${checkoutId} saved successfully.`);
        res.status(200).send('GoKwik Webhook Received');
    } catch (error) {
        console.error('GoKwik Webhook Error:', error);
        res.status(500).send('Internal Server Error');
    }
};
