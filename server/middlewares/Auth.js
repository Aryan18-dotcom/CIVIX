import UserDB from "../models/userModel.js";

export const isAuthenticated = (req, res, next) => {
    // Check if the user is authenticated
    if (req.session && req.session.isLoggedIn && req.session.userId) {
        next();
    } else {
        return res.status(401).json({ message: 'Unauthorized access, Log in first' });
    }
};

export const isAdmin = (req, res, next) => {
    // Check if the user is authenticated and is an admin
    if (req.session && req.session.isLoggedIn && req.session.userId) {
        UserDB.findById(req.session.userId)
            .then(user => {
                if (user && user.userType === 'admin') {
                    next();
                } else {
                    return res.status(403).json({ message: 'Forbidden, Admin access required' });
                }
            })
            .catch(err => {
                console.error('Error checking admin status:', err);
                return res.status(500).json({ message: 'Server error', error: err.message });
            }
        );
    } else {
        return res.status(401).json({ message: 'Unauthorized access, Log in first' });
    }
};