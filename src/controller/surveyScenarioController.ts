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
    locationId: z.string().uuid().optional(),
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
                    error: parsed.error.format()
                });
            }

            const { minAge, maxAge, percentage, locationId } = parsed.data;

            if (minAge > maxAge) {
                return res.status(400).json({
                    success: false,
                    message: "Min age cannot be greater than max age"
                });
            }

            if (percentage <= 0 || percentage > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Percentage must be between 1 and 100"
                });
            }

            let location;
            if (locationId) {
                location = await LocationRepo.findOne({ where: { id: locationId } });
                if (!location) {
                    return res.status(404).json({
                        success: false,
                        message: "Location not found"
                    });
                }
            }

            const scenario = await SurveyScenarioRepo.save({
                minAge,
                maxAge,
                percentage,
                location,
                status: "draft"
            });

            const scenarioWithRelations = await SurveyScenarioRepo.findOne({
                where: { id: scenario.id },
                relations: ["location", "questions"]
            });

            return res.status(201).json({
                success: true,
                message: "Survey scenario created successfully",
                data: scenarioWithRelations
            });

        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message
            });
        }
    }

    public AttachQuestions: RequestHandler = async (req: Request, res: Response) => {
        try {
            const { id: scenarioId } = req.params;

            const parsed = QuestionIdsSchema.safeParse(req.body);
            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid input",
                    error: parsed.error.format()
                });
            }

            const scenario = await SurveyScenarioRepo.findOne({
                where: { id: scenarioId },
                relations: ["questions"]
            });

            if (!scenario) {
                return res.status(404).json({
                    success: false,
                    message: "Scenario not found"
                });
            }

            const questions = await QuestionsRepo.findBy({
                id: In(parsed.data.questionIds)
            });

            if (questions.length !== parsed.data.questionIds.length) {
                return res.status(404).json({
                    success: false,
                    message: "One or more questions not found"
                });
            }

            scenario.questions = questions;
            await SurveyScenarioRepo.save(scenario);

            return res.status(200).json({
                success: true,
                message: "Questions attached successfully",
                data: scenario
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message
            });
        }
    }

    public GetSurveyScenarios: RequestHandler = async (_req: Request, res: Response) => {
        try {
            const scenarios = await SurveyScenarioRepo.find({
                relations: ["location", "questions"],
                order: { createdAt: "DESC" }
            });

            return res.status(200).json({
                success: true,
                message: "Survey scenarios retrieved successfully",
                data: scenarios
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message
            });
        }
    }

    public DeleteSurveyScenario: RequestHandler = async (req: Request, res: Response) => {
        try {
            const { id: scenarioId } = req.params;

            const result = await SurveyScenarioRepo.delete(scenarioId);

            if (result.affected === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Scenario not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Survey scenario deleted successfully"
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message
            });
        }
    }

    private calculateAgeDateRange(minAge: number, maxAge: number) {
        const today = new Date();
        return {
            maxBirthDate: new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate()),
            minBirthDate: new Date(today.getFullYear() - maxAge - 1, today.getMonth(), today.getDate())
        };
    }

    private buildEligibleUsersQuery(minBirthDate: Date, maxBirthDate: Date, locationId?: string) {
        const query = UserRepo
            .createQueryBuilder("user")
            .where("user.dateOfBirth BETWEEN :minBirthDate AND :maxBirthDate", {
                minBirthDate,
                maxBirthDate
            });

        if (locationId) {
            query.innerJoin("user.locations", "loc").andWhere("loc.id = :locationId", { locationId });
        }

        return query;
    }

    public SimulateScenario: RequestHandler = async (req: Request, res: Response) => {
        try {
            const scenario = await SurveyScenarioRepo.findOne({
                where: { id: req.params.id },
                relations: ["location", "questions"]
            });

            if (!scenario) {
                return res.status(404).json({ success: false, message: "Scenario not found" });
            }

            if (scenario.status !== "draft") {
                return res.status(400).json({ success: false, message: "Scenario has already been sent" });
            }

            if (!scenario.questions?.length) {
                return res.status(400).json({ success: false, message: "Please select at least one question" });
            }

            // Calculate eligible users
            const { minBirthDate, maxBirthDate } = this.calculateAgeDateRange(scenario.minAge, scenario.maxAge);
            const eligibleQuery = this.buildEligibleUsersQuery(minBirthDate, maxBirthDate, scenario.location?.id);

            const totalEligible = await eligibleQuery.getCount();
            if (totalEligible === 0) {
                return res.status(400).json({ success: false, message: "No eligible users found" });
            }

            // Select random users based on percentage
            const targetCount = Math.ceil(totalEligible * (scenario.percentage / 100));
            const selectedUsers = await eligibleQuery.orderBy("RANDOM()").limit(targetCount).getMany();

            // Create assignments
            const assignments = selectedUsers.map(user =>
                AssignmentRepo.create({ scenario, user, status: "assigned" })
            );

            await AssignmentRepo.save(assignments);

            scenario.status = "sent";
            await SurveyScenarioRepo.save(scenario);

            return res.status(200).json({
                success: true,
                message: "Scenario simulated successfully",
                data: {
                    scenarioId: scenario.id,
                    totalEligible,
                    targetCount,
                    assigned: assignments.length,
                    unassigned: targetCount - assignments.length
                }
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message
            });
        }
    }

    public GetSimulatedDetails: RequestHandler = async (req: Request, res: Response) => {
        try {
            const { id: scenarioId } = req.params;

            const scenario = await SurveyScenarioRepo.findOne({
                where: { id: scenarioId },
                relations: ["location", "questions"]
            });

            if (!scenario) {
                return res.status(404).json({
                    success: false,
                    message: "Scenario not found"
                });
            }

            const today = new Date();
            const maxBirthDate = new Date(
                today.getFullYear() - scenario.minAge,
                today.getMonth(),
                today.getDate()
            );
            const minBirthDate = new Date(
                today.getFullYear() - scenario.maxAge - 1,
                today.getMonth(),
                today.getDate()
            );

            const eligibleQuery = UserRepo
                .createQueryBuilder("user")
                .leftJoinAndSelect("user.locations", "loc")
                .where("user.dateOfBirth BETWEEN :minBirthDate AND :maxBirthDate", {
                    minBirthDate,
                    maxBirthDate
                });

            if (scenario.location?.id) {
                eligibleQuery.andWhere("loc.id = :locationId", { locationId: scenario.location.id });
            }

            const allEligibleUsers = await eligibleQuery.getMany();

            const assignments = await AssignmentRepo
                .createQueryBuilder("assignment")
                .leftJoinAndSelect("assignment.user", "user")
                .leftJoinAndSelect("user.locations", "userLoc")
                .leftJoinAndSelect("assignment.scenario", "scenario")
                .where("scenario.id = :scenarioId", { scenarioId })
                .getMany();

            const assignedUserIds = new Set(assignments.map(a => a.user?.id).filter(Boolean));

            const assignedUsers = assignments.map(a => {
                const dob = a.user?.dateOfBirth ? new Date(a.user.dateOfBirth) : null;
                const age = dob
                    ? Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                    : null;

                return {
                    userId: a.user?.id || '',
                    user: a.user?.username || a.user?.fullName || 'Unknown',
                    age,
                    location: a.user?.locations?.[0]?.address || scenario.location?.address || 'Unknown',
                    assignmentStatus: 'assigned',
                    surveyStatus: a.status || 'not_assigned'
                };
            });

            const notAssignedUsers = allEligibleUsers
                .filter(user => !assignedUserIds.has(user.id))
                .map(user => {
                    const dob = user.dateOfBirth ? new Date(user.dateOfBirth) : null;
                    const age = dob
                        ? Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                        : null;

                    return {
                        userId: user.id,
                        user: user.username || user.fullName || 'Unknown',
                        age,
                        location: user.locations?.[0]?.address || scenario.location?.address || 'Unknown',
                        assignmentStatus: 'not_assigned',
                        surveyStatus: 'n/a'
                    };
                });

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
                    }
                }
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message
            });
        }
    }
}

export default new SurveyScenarioController();

