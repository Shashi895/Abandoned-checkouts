import mongoose from 'mongoose';

const checkoutSchema = new mongoose.Schema({
    checkout_id: {
        type: String,
        required: true,
        unique: true,
        default: () => 'manual_' + new mongoose.Types.ObjectId()
    },
    name: {
        type: String,
        default: 'Unknown'
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
        default: 0
    },
    currency: {
        type: String,
        default: 'INR'
    },
    checkout_url: {
        type: String,
        default: ''
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
