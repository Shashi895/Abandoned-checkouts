import Checkout from '../models/Checkout.js';

export const getAbandonedCheckouts = async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        let query = {};

        if (status) query.status = status;
        if (startDate || endDate) {
            query.created_at = {};
            if (startDate) query.created_at.$gte = new Date(startDate);
            if (endDate) query.created_at.$lte = new Date(endDate);
        }

        const checkouts = await Checkout.find(query).sort({ created_at: -1 });
        res.json(checkouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStats = async (req, res) => {
    try {
        const totalCount = await Checkout.countDocuments({ status: 'abandoned' });
        const pendingCount = await Checkout.countDocuments({ status: 'pending' });
        
        const totalAmountResult = await Checkout.aggregate([
            { $match: { status: 'abandoned' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalAmount = totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;

        res.json({
            totalAbandoned: totalCount,
            totalPending: pendingCount,
            totalAmount: totalAmount.toFixed(2)
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
