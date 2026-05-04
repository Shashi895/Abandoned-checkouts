import axios from 'axios';

export const sendToGoQuick = async (checkoutData) => {
    try {
        const payload = {
            name: checkoutData.name,
            phone: checkoutData.phone || '',
            email: (checkoutData.email && checkoutData.email !== 'No Email') ? checkoutData.email : `${checkoutData.phone || checkoutData.checkout_id}@no-email.com`,
            amount: checkoutData.amount,
            source: "Shopify Abandoned Checkout",
            tag: "abandoned_checkout"
        };

        const response = await axios.post(process.env.GOQUICK_API_URL, payload, {
            headers: {
                'Authorization': `Bearer ${process.env.GOQUICK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 seconds timeout
        });

        console.log(`Lead sent to GoQuick CRM for ${checkoutData.email}`);
        return response.data;
    } catch (error) {
        console.error('Error sending to GoQuick CRM:', error.response?.data || error.message);
        throw error;
    }
};
