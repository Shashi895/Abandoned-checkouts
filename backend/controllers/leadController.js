import Checkout from '../models/Checkout.js';

export const createNewLead = async (req, res) => {
    try {
        const { name, phone, product } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and Phone are required' });
        }

        // Logic to save the lead to database
        const newLead = new Checkout({
            name,
            phone,
            email: req.body.email || '',
            amount: req.body.amount || 0,
            status: 'pending',
            address: req.body.address || '',
            pincode: req.body.pincode || '',
            checkout_url: req.body.checkout_url || '',
            products: product ? [{ title: product, quantity: 1 }] : [],
            created_at: new Date()
        });

        await newLead.save();

        res.status(201).json({
            message: 'Lead created successfully.',
            data: newLead
        });

    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
