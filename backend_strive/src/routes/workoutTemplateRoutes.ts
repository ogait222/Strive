import express from "express";
import { authorizeRoles, verifyToken } from "../middlewares/authMiddleware";
import {
  createWorkoutTemplate,
  getWorkoutTemplates,
  deleteWorkoutTemplate,
} from "../controllers/workoutTemplateController";

const router = express.Router();

router.post("/", verifyToken, authorizeRoles("admin", "trainer"), createWorkoutTemplate);
router.get("/", verifyToken, authorizeRoles("admin", "trainer"), getWorkoutTemplates);
router.delete("/:id", verifyToken, authorizeRoles("admin", "trainer"), deleteWorkoutTemplate);

export default router;
