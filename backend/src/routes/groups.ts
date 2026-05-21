import { Router } from "express";

const router = Router();

//  implement group routes
router.get("/", (req, res) => {
  res.json({ message: "Groups endpoint - to be implemented" });
});

export default router;
