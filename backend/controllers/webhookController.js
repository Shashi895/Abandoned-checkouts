import crypto from 'crypto';
import Checkout from '../models/Checkout.js';
import { sendToGoQuick } from '../services/crmService.js';

// Verify Shopify Webhook HMAC
export const verifyShopifyWebhook = (req, res, next) => {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    const body = req.rawBody; 
    
    if (!hmac || !body) {
        return res.status(401).send('Webhook verification failed');
    }

    const generatedHash = crypto
        .createHmac('sha256', process.env.SHOPIFY_WEBHOOK_SECRET)
        .update(body, 'utf8')
        .digest('base64');

    if (generatedHash !== hmac) {
        return res.status(401).send('HMAC verification failed');
    }

    next();
};

export const handleCheckoutWebhook = async (req, res) => {
    try {
        const payload = req.body;
        console.log('--- FULL WEBHOOK PAYLOAD ---');
        console.log(JSON.stringify(payload, null, 2));
        
        // Shopify checkouts can have id or token
        const checkoutId = payload.id || payload.token || payload.checkout_id;
        
        if (!checkoutId) {
            console.error('No ID found in payload');
            return res.status(200).send('No ID found, but request received');
        }

        console.log('Processing Checkout ID:', checkoutId);
        
        // Extract data
        const {
            email,
            total_price,
            currency,
            abandoned_checkout_url,
            created_at,
            billing_address
        } = payload;

        const customer_name = billing_address 
            ? `${billing_address.first_name || ''} ${billing_address.last_name || ''}`.trim() 
            : 'Unknown';
        
        const phone = payload.phone || (payload.billing_address ? payload.billing_address.phone : '') || (payload.customer ? payload.customer.phone : '');
        const products = payload.line_items ? payload.line_items.map(item => ({
            title: item.title,
            quantity: item.quantity,
            price: item.price
        })) : [];

        // Save to MongoDB
        await Checkout.findOneAndUpdate(
            { checkout_id: checkoutId.toString() },
            {
                checkout_id: checkoutId.toString(),
                name: customer_name,
                email: email || (payload.customer ? payload.customer.email : 'No Email'),
                phone: phone || '',
                amount: total_price || 0,
                currency: currency || 'INR',
                checkout_url: abandoned_checkout_url || '',
                products: products,
                created_at: created_at ? new Date(created_at) : new Date(),
                status: 'pending'
            },
            { upsert: true, returnDocument: 'after' }
        );

        console.log(`Checkout ${checkoutId} successfully saved/updated.`);
        res.status(200).send('Webhook received');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Internal Server Error');
    }
};
