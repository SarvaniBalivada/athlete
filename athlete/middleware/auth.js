const admin = global.admin;

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Get user from Firestore
        const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();

        if (!userDoc.exists) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = {
            _id: userDoc.id,
            ...userDoc.data()
        };

        next();
    } catch (err) {
        return res.status(401).json({ message: 'Not authorized to access this route' });
    }
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role ${req.user.role} is not authorized to access this route` 
            });
        }
        next();
    };
};