const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====== MongoDB connection ======
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
    .catch(err => console.error("DB connection error:", err));

    // === AUTH MIDDLEWARE ===
    function auth(req, res, next) {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ message: 'No token' });
    
        const [bearer, token] = authHeader.split(' ');
        if (bearer !== 'Bearer' || !token) return res.status(401).json({ message: 'Invalid token format' });
    
        try {
            // ✅ FIX
             const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // { userId, role }
            next();
        } catch (err) {
            return res.status(401).json({ message: 'Token not valid' });
        }
    }

    async function adminAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.type !== "admin") {
            return res.status(403).json({ message: "Forbidden: Admins only" });
        }
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
}

// ====== Models ======
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    role: { type: String, enum: ["admin", "owner", "tenant"], default: "tenant" },
    company: String,
    isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

const propertySchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: String,
    type: { type: String, enum: ["apartment", "house", "villa", "room"] },
    address: String,
    city: String,
    state: String,
    pincode: String,
    price: Number,
    bedrooms: Number,
    bathrooms: Number,
    description: String,
    age: String,
    floor: String,
    totalFloors: String,
    facing: String,
    roommateRequired: { type: Boolean, default: false },
    amenities: [String],
    images: [String],
    latitude: Number,
    longitude: Number,
    status: { type: String, enum: ["pending", "approved"], default: "pending" }
}, { timestamps: true });

const Property = mongoose.model("Property", propertySchema);

// ====== Middleware ======
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select("-password");
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

// ====== Multer upload ======
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });


// ====== Routes ======

// Signup
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { name, email, password, phone, role, company } = req.body;
        if (await User.findOne({ email })) return res.status(400).json({ message: "Email exists" });
        const user = new User({ name, email, password, phone, role, company, isAdmin: role === "admin" });
        await user.save();
        res.json({ message: "User created" });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Login
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid credentials" });
        const match = await user.comparePassword(password);
        if (!match) return res.status(400).json({ message: "Invalid credentials" });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({ token, user });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get current user
app.get("/api/auth/me", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.json({ user: null });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        res.json({ user });
    } catch (err) { res.json({ user: null }); }
});

// ✅ FIXED CODE — add the roommateRequired cast before creating the Property
app.post("/api/properties", authMiddleware, upload.array("images", 10), async (req, res) => {
    try {
        const files = req.files.map(f => `/uploads/${f.filename}`);
        const roommateRequired = req.body.roommateRequired === "true"; // 👈 add this line
        const property = new Property({ ...req.body, roommateRequired, images: files, owner: req.user._id });
        await property.save();
        res.json({ property });
    } catch (err) { res.status(500).json({ error: err.message }); }
});


// Get all approved properties
app.get("/api/properties", async (req, res) => {
    try {
        const properties = await Property.find({ status: "approved" });
        res.json({ properties });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// Get single property
app.get("/api/properties/:id", async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);
        if (!property) return res.status(404).json({ message: "Property not found" });
        res.json({ property });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/users
app.get('/api/admin/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ users }); // make sure it's { users: [...] }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/admin/properties – list all properties for admin
app.get('/api/admin/properties', auth, adminAuth, async (req, res) => {
    try {
        const properties = await Property.find()
            .populate('owner', 'name email');

        // Shape data for admin table (adds ownerName and location fields expected by frontend)
        const shaped = properties.map((p) => ({
            _id: p._id,
            title: p.title,
            ownerName: p.owner && p.owner.name ? p.owner.name : null,
            location: p.city || p.state || p.address || '',
            price: p.price,
            status: p.status
        }));

        res.json({ properties: shaped });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});



// PUT /api/admin/properties/:id/approve
app.put('/api/admin/properties/:id/approve', auth, adminAuth, async (req, res) => {
    try {
        const prop = await Property.findById(req.params.id);
        if (!prop) return res.status(404).json({ message: 'Property not found' });

        prop.status = 'approved';
        await prop.save();
        res.json({ message: 'Property approved' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/admin/properties/:id/reject
app.put('/api/admin/properties/:id/reject', auth, adminAuth, async (req, res) => {
    try {
        const prop = await Property.findById(req.params.id);
        if (!prop) return res.status(404).json({ message: 'Property not found' });

        prop.status = 'rejected';
        await prop.save();
        res.json({ message: 'Property rejected' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


// ====== Start server ======
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
