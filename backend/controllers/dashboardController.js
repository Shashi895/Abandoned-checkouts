import Checkout from '../models/Checkout.js';

export const getAbandonedCheckouts = async (req, res) => {
    try {
        const { status, startDate, endDate, page = 1, limit = 30 } = req.query;
        let query = {};

        if (status) query.status = status;
        if (startDate || endDate) {
            query.created_at = {};
            if (startDate) query.created_at.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Include full day
                query.created_at.$lte = end;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Checkout.countDocuments(query);
        const checkouts = await Checkout.find(query)
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            data: checkouts,
            total,
            pages: Math.ceil(total / limit),
            currentPage: parseInt(page)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.created_at = {};
            if (startDate) query.created_at.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.created_at.$lte = end;
            }
        }

        const totalAbandoned = await Checkout.countDocuments({ ...query, status: 'abandoned' });
        const totalPending = await Checkout.countDocuments({ ...query, status: 'pending' });
        
        const amountResult = await Checkout.aggregate([
            { $match: { ...query, status: 'abandoned' } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);

        const totalAmount = amountResult.length > 0 ? amountResult[0].total : 0;

        res.json({
            totalAbandoned,
            totalPending,
            totalAmount
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
