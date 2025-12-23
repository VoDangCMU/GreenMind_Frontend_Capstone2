import {z} from "zod";
import AppDataSource from "../infrastructure/database";
import {User} from "../entity/user";
import {Checkins} from "../entity/checkin";
import {RequestHandler} from "express";


const CheckinParamsSchema = z.object({
    location: z.string(),
    coordinate: z.object({
        latitude: z.number(),
        longitude: z.number()
    })
});
const UpdateCheckinParamsSchema = z.object({
    location: z.string().optional(),
    coordinate: z.object({
        latitude: z.number().optional(),
        longitude: z.number().optional()
    }).optional()
});
const CheckinRepo = AppDataSource.getRepository(Checkins);
class CheckinController {
    public CreateCheckin: RequestHandler = async (req, res) => {

        const parsed = CheckinParamsSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ message: "Invalid request parameters", errors: parsed.error.errors });
        }
        try {

            if (!req.user?.userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const user = await AppDataSource.getRepository(User).findOneBy({ id: req.user?.userId });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            const checkin = CheckinRepo.create({
                user: user!,
                location: parsed.data.location,
                latitude: parsed.data.coordinate.latitude,
                longitude: parsed.data.coordinate.longitude
            });

            const savedCheckin = await CheckinRepo.save(checkin);

            return res.status(201).json({ message: "Check-in created successfully", checkin: savedCheckin });

        } catch (e: any) {
            return res.status(500).json({ message: "Internal Server Error", error: e.message } );
        }
    }

    public GetCheckins: RequestHandler = async (req, res) => {
        try {
            const checkins = await CheckinRepo.find({
                where: {user: {id: req.user?.userId}},
                order: {createdAt: "DESC"}
            });

            if (checkins.length === 0) {
                return res.status(404).json({message: "No check-ins found for the user"});
            }
            return res.status(200).json({message: "Check-ins retrieved successfully", data: {checkins, user: checkins[0].user}});
        } catch (e: any) {
            return res.status(500).json({message: "Internal Server Error", error: e.message});
        }
    }

    public UpdateCheckin: RequestHandler = async (req, res) => {

        const checkinId = req.params.id;
        if (!checkinId) {
            return res.status(400).json({message: "Check-in ID is required"});
        }
        const parsed = UpdateCheckinParamsSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({message: "Invalid request parameters", errors: parsed.error.errors});
        }
        try {
            const checkin = await CheckinRepo.findOne({
                where: {id: checkinId, user: {id: req.user?.userId}}
            });
            if (!checkin) {
                return res.status(404).json({message: "Check-in not found"});
            }

            const newCheckin = new Checkins();
            newCheckin.location = parsed.data.location || checkin.location;
            newCheckin.latitude = parsed.data.coordinate?.latitude || checkin.latitude;
            newCheckin.longitude = parsed.data.coordinate?.longitude || checkin.longitude;

            Object.assign(checkin, newCheckin);

            const updatedCheckin = await CheckinRepo.save(checkin);

            return res.status(200).json({message: "Check-in updated successfully", checkin: updatedCheckin});

        } catch (e:any) {
            return res.status(500).json({message: "Internal Server Error", error: e.message});
        }
    }

    public DeleteCheckin: RequestHandler = async (req, res) => {
        const checkinId = req.params.id;
        if (!checkinId) {
            return res.status(400).json({message: "Check-in ID is required"});
        }
        try {
            const checkin = await CheckinRepo.findOne({
                where: {id: checkinId, user: {id: req.user?.userId}}
            });
            if (!checkin) {
                return res.status(404).json({message: "Check-in not found"});
            }

            await CheckinRepo.remove(checkin);

            return res.status(200).json({message: "Check-in deleted successfully", deleted: checkin});

        } catch (e:any) {
            return res.status(500).json({message: "Internal Server Error", error: e.message});
        }
    }

    public GetCheckinsByPeriod: RequestHandler = async (req, res) => {
        try {
            if (!req.user?.userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const checkins = await CheckinRepo.find({
                where: {user: {id: req.user?.userId}},
                order: {createdAt: "DESC"},
                take: 6,
                relations: {user: true}
            })

            if (checkins.length === 0) {
                return res.status(404).json({message: "No check-ins found for the user"});
            }
            return res.status(200).json({message: "Check-ins retrieved successfully", data: {checkins, count: checkins.length}});
        }  catch (e: any) {
            return res.status(500).json({ message: "Internal Server Error", error: e.message } );
        }
    }

    public GetCheckinsByParams: RequestHandler = async (req, res) => {

        const days = parseInt(req.body.days);

        if (isNaN(days) || days <= 0) {
            return res.status(400).json({ message: "Invalid 'days' parameter" });
        }

        try {
            if (!req.user?.userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const checkins = await CheckinRepo.find({
                where: {user: {id: req.user?.userId}},
                order: {createdAt: "DESC"},
                take: days,
                relations: {user: true}
            })

            if (checkins.length === 0) {
                return res.status(404).json({message: "No check-ins found for the user"});
            }
            return res.status(200).json({
                message: "Check-ins retrieved successfully",
                data: {
                    checkins,
                    count: checkins.length,
                }
            });
        } catch (e: any) {
            return res.status(500).json({message: "Internal Server Error", error: e.message});
        }
    }
}

export default new CheckinController();