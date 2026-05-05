import mongoose from 'mongoose';

const checkoutSchema = new mongoose.Schema({
    checkout_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: 'No Email'
    },
    phone: {
        type: String
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    checkout_url: {
        type: String,
        required: true
    },
    address: {
        type: String
    },
    pincode: {
        type: String
    },
    products: [
        {
            title: String,
            quantity: Number,
            price: Number
        }
    ],
    status: {
        type: String,
        enum: ['pending', 'abandoned', 'converted'],
        default: 'pending'
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });


const Checkout = mongoose.model('Checkout', checkoutSchema);
export default Checkout;
