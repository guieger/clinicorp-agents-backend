import { Router } from 'express';
import { SchedulerService } from '../services/schedulerService';

const router = Router();

router.post('/upcrete_job', async (req, res) => {

    const { accountId, activityType, active, dispatchHour, dispatchMinute } = req.body;

    if (!accountId || !activityType || !active || !dispatchHour || !dispatchMinute) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const jobId = `config-${accountId}-${activityType}`;
    const schedule = `${dispatchMinute} ${dispatchHour} * * *`;

    await SchedulerService.createOrUpdateJob(jobId, schedule, accountId, activityType);

    return res.status(200).json({ message: 'Job created successfully' });

});

export default router;