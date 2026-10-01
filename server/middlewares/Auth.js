const isAuthenticated = (req, res, next) => {
    // Check if the user is authenticated
    if (req.session && req.session.isLoggedIn && req.session.userId) {
        next();
    } else {
        return res.status(401).json({ message: 'Unauthorized access, Log in first' });
    }
};
export default isAuthenticated;