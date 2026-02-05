"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.loginGuest = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("./prisma.js");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
const loginGuest = async (req, res) => {
    const { nickname } = req.body;
    if (!nickname) {
        return res.status(400).json({ error: "Nickname is required" });
    }
    const user = await prisma_js_1.prisma.user.create({
        data: { nickname },
    });
    const token = jsonwebtoken_1.default.sign({ id: user.id, nickname: user.nickname }, JWT_SECRET, {
        expiresIn: "30d",
    });
    res.json({ user, token });
};
exports.loginGuest = loginGuest;
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: "No token" });
    const token = authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ error: "No token" });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.js.map