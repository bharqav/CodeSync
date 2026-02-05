"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("./auth.js");
const prisma_js_1 = require("./prisma.js");
const router = (0, express_1.Router)();
router.post("/auth/guest", auth_js_1.loginGuest);
router.post("/workspace", auth_js_1.verifyToken, async (req, res) => {
    const workspace = await prisma_js_1.prisma.workspace.create({
        data: {},
    });
    res.json(workspace);
});
router.get("/workspace/:id", auth_js_1.verifyToken, async (req, res) => {
    const { id } = req.params;
    const workspace = await prisma_js_1.prisma.workspace.findUnique({
        where: { id },
        include: {
            messages: {
                take: 50,
                orderBy: { createdAt: "asc" },
                include: { user: true }
            }
        }
    });
    if (!workspace)
        return res.status(404).json({ error: "Not found" });
    res.json(workspace);
});
exports.default = router;
//# sourceMappingURL=routes.js.map