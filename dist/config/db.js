import mongoose from "mongoose";
const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI is not defined in .env" + uri);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected ✅");
    }
    catch (err) {
        console.error("MongoDB connection failed ❌", err);
        process.exit(1);
    }
};
export default connectDB;
//# sourceMappingURL=db.js.map