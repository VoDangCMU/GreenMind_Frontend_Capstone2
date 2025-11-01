import { Request, RequestHandler, Response } from "express";
import { z } from "zod";
import { In } from "typeorm";
import NUMBER from "../config/schemas/Number";
import { SurveyScenario } from "../entity/survey_scenario";
import { Locations } from "../entity/locations";
import { Questions } from "../entity/questions";
import { User } from "../entity/user";
import { ScenarioAssignment } from "../entity/scenario_assignments";
import AppDataSource from "../infrastructure/database";

const SurveyScenarioParamsSchema = z.object({
    minAge: NUMBER,
    maxAge: NUMBER,
    address: z.string().optional(),
    percentage: NUMBER,
});

const QuestionIdsSchema = z.object({
    questionIds: z.array(z.string().uuid()).min(1, {
        message: "At least one question ID is required",
    }),
});

const SurveyScenarioRepo = AppDataSource.getRepository(SurveyScenario);
const QuestionsRepo = AppDataSource.getRepository(Questions);
const LocationRepo = AppDataSource.getRepository(Locations);
const UserRepo = AppDataSource.getRepository(User);
const AssignmentRepo = AppDataSource.getRepository(ScenarioAssignment);


class SurveyScenarioController {
    public CreateSurveyScenario: RequestHandler = async (req: Request, res: Response) => {
        try {
            const parsed = SurveyScenarioParamsSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid input",
                    error: parsed.error.format(),
                });
            }

            const { minAge, maxAge, percentage, address } = parsed.data;

            if (minAge > maxAge) {
                return res.status(400).json({ success: false, message: "Min age cannot be greater than max age" });
            }
            if (percentage <= 0 || percentage > 100) {
                return res.status(400).json({ success: false, message: "Percentage must be between 1 and 100" });
            }

            let location;
            if (address) {
                location = await LocationRepo.findOne({ where: { address } });
                if (!location) {
                    return res.status(404).json({ success: false, message: "Location not found" });
                }
            }

            const scenario = SurveyScenarioRepo.create({
                minAge,
                maxAge,
                percentage,
                location,
                status: "draft",
            });

            await SurveyScenarioRepo.save(scenario);

            return res.status(201).json({
                success: true,
                message: "Survey scenario created successfully",
                data: scenario,
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
        }
    };

    public AttachQuestions: RequestHandler = async (req: Request, res: Response) => {
        try {
            const { id: scenarioId } = req.params;

            const parsed = QuestionIdsSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({ success: false, message: "Invalid input", error: parsed.error.format() });
            }

            const scenario = await SurveyScenarioRepo.findOne({
                where: { id: scenarioId },
                relations: ["questions"],
            });
            if (!scenario) return res.status(404).json({ success: false, message: "Scenario not found" });

            const questions = await QuestionsRepo.findBy({ id: In(parsed.data.questionIds) });
            if (questions.length !== parsed.data.questionIds.length) {
                return res.status(404).json({ success: false, message: "One or more questions not found" });
            }

            scenario.questions = questions;
            await SurveyScenarioRepo.save(scenario);

            return res.status(200).json({ success: true, message: "Questions attached successfully", data: scenario });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
        }
    };

    public GetSurveyScenarios: RequestHandler = async (_req: Request, res: Response) => {
        try {
            const scenarios = await SurveyScenarioRepo.find({
                relations: ["location", "questions"],
                order: { createdAt: "DESC" },
            });

            return res.status(200).json({
                success: true,
                message: "Survey scenarios retrieved successfully",
                data: scenarios,
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
        }
    };

    public DeleteSurveyScenario: RequestHandler = async (req: Request, res: Response) => {
        try {
            const { id: scenarioId } = req.params;
            const result = await SurveyScenarioRepo.delete(scenarioId);
            if (result.affected === 0) {
                return res.status(404).json({ success: false, message: "Scenario not found" });
            }
            return res.status(200).json({ success: true, message: "Survey scenario deleted successfully" });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
        }
    };

    private calculateAgeDateRange(minAge: number, maxAge: number) {
        const today = new Date();
        const maxBirthDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
        const minBirthDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
        return { minBirthDate, maxBirthDate };
    }

    private calculateAge(dateOfBirth?: Date | string | null): number | null {
        if (!dateOfBirth) return null;
        const dob = new Date(dateOfBirth);
        const today = new Date();
        return Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    }

    private buildEligibleUsersQuery(args: {
        minBirthDate: Date;
        maxBirthDate: Date;
        address?: string;
    }) {
        const { minBirthDate, maxBirthDate, address } = args;

        const qb = UserRepo.createQueryBuilder("user")
            .where("user.dateOfBirth BETWEEN :minBirthDate AND :maxBirthDate", {
                minBirthDate,
                maxBirthDate,
            });

        if (address) {
            // Match by address (NOT id)
            qb.innerJoin("user.locations", "loc").andWhere("loc.address = :addr", { addr: address });
        }

        return qb;
    }

    public SimulateScenario: RequestHandler = async (req: Request, res: Response) => {
        try {
            const scenario = await SurveyScenarioRepo.findOne({
                where: { id: req.params.id },
                relations: ["location", "questions"],
            });
            if (!scenario) return res.status(404).json({ success: false, message: "Scenario not found" });

            if (scenario.status !== "draft") {
                return res.status(400).json({ success: false, message: "Scenario has already been sent" });
            }
            if (!scenario.questions?.length) {
                return res.status(400).json({ success: false, message: "Please select at least one question" });
            }

            const { minBirthDate, maxBirthDate } = this.calculateAgeDateRange(scenario.minAge, scenario.maxAge);
            const eligibleQuery = this.buildEligibleUsersQuery({
                minBirthDate,
                maxBirthDate,
                address: scenario.location?.address,
            });

            const totalEligible = await eligibleQuery.getCount();
            if (totalEligible === 0) {
                return res.status(400).json({ success: false, message: "No eligible users found" });
            }

            const targetCount = Math.ceil(totalEligible * (scenario.percentage / 100));

            // Fetch all eligible users and shuffle in-memory
            const allEligibleUsers = await eligibleQuery.getMany();
            const shuffled = allEligibleUsers.sort(() => Math.random() - 0.5);
            const selectedUsers = shuffled.slice(0, targetCount);

            const { assignments } = await AppDataSource.transaction(async (manager) => {

                const assignmentRepo = manager.getRepository(ScenarioAssignment);
                const scenarioRepo = manager.getRepository(SurveyScenario);

                const newAssignments = selectedUsers.map((user) =>
                    assignmentRepo.create({ scenario, user, status: "assigned" })
                );

                await assignmentRepo.save(newAssignments);

                scenario.status = "sent";
                await scenarioRepo.save(scenario);

                return { assignments: newAssignments };
            });

            const assigned = assignments.length;
            const unassigned = Math.max(0, targetCount - assigned);

            return res.status(200).json({
                success: true,
                message: "Scenario simulated successfully",
                data: {
                    scenarioId: scenario.id,
                    totalEligible,
                    targetCount,
                    assigned,
                    unassigned,
                },
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
        }
    };

    public GetSimulatedDetails: RequestHandler = async (req: Request, res: Response) => {
        try {
            const { id: scenarioId } = req.params;

            const scenario = await SurveyScenarioRepo.findOne({
                where: { id: scenarioId },
                relations: ["location", "questions"],
            });
            if (!scenario) return res.status(404).json({ success: false, message: "Scenario not found" });

            const { minBirthDate, maxBirthDate } = this.calculateAgeDateRange(scenario.minAge, scenario.maxAge);

            // Same filter logic (address match) as simulate
            const eligibleQuery = UserRepo.createQueryBuilder("user")
                .leftJoinAndSelect("user.locations", "loc")
                .where("user.dateOfBirth BETWEEN :minBirthDate AND :maxBirthDate", {
                    minBirthDate,
                    maxBirthDate,
                });

            if (scenario.location?.address) {
                eligibleQuery.andWhere("loc.address = :addr", { addr: scenario.location.address });
            }

            const allEligibleUsers = await eligibleQuery.getMany();

            const assignments = await AssignmentRepo.createQueryBuilder("assignment")
                .leftJoinAndSelect("assignment.user", "user")
                .leftJoinAndSelect("user.locations", "userLoc")
                .leftJoinAndSelect("assignment.scenario", "scenario")
                .where("scenario.id = :scenarioId", { scenarioId })
                .getMany();

            const assignedUserIds = new Set(assignments.map((a) => a.user?.id).filter(Boolean) as string[]);

            const assignedUsers = assignments.map((a) => ({
                userId: a.user?.id || "",
                user: a.user?.username || a.user?.fullName || "Unknown",
                age: this.calculateAge(a.user?.dateOfBirth),
                location: a.user?.locations?.[0]?.address || scenario.location?.address || "Unknown",
                assignmentStatus: "assigned",
                surveyStatus: a.status || "not_assigned",
            }));

            const notAssignedUsers = allEligibleUsers
                .filter((u) => !assignedUserIds.has(u.id))
                .map((user) => ({
                    userId: user.id,
                    user: user.username || user.fullName || "Unknown",
                    age: this.calculateAge(user.dateOfBirth),
                    location: user.locations?.[0]?.address || scenario.location?.address || "Unknown",
                    assignmentStatus: "not_assigned",
                    surveyStatus: "n/a",
                }));

            const totalEligible = allEligibleUsers.length;
            const targetCount = Math.ceil(totalEligible * (scenario.percentage / 100));

            return res.status(200).json({
                success: true,
                message: "Simulated scenario details retrieved successfully",
                data: {
                    scenarioId: scenario.id,
                    status: scenario.status,
                    totalEligible,
                    targetCount,
                    assignedCount: assignedUsers.length,
                    notAssignedCount: notAssignedUsers.length,
                    users: {
                        assigned: assignedUsers,
                        notAssigned: notAssignedUsers,
                    },
                },
            });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
        }
    };
}

export default new SurveyScenarioController();
