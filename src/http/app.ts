import sensible from "@fastify/sensible";
import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest
} from "fastify";
import { z } from "zod";
import { getTakedownJobStatus, enqueueTakedownJob } from "../services/jobs.service.js";
import { violationWebhookSchema } from "../schemas/violation.schema.js";

const jobParamsSchema = z.object({
  id: z.string().min(1, "job id is required")
});

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: true
  });

  await app.register(sensible);

  app.get("/health", () => ({
    status: "ok"
  }));

  app.post(
    "/webhook/violation",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedPayload = violationWebhookSchema.safeParse(request.body);

      if (!parsedPayload.success) {
        return reply.status(400).send({
          message: "Invalid violation webhook payload",
          errors: parsedPayload.error.flatten()
        });
      }

      const job = await enqueueTakedownJob(parsedPayload.data);

      return reply.status(job.deduplicated ? 200 : 202).send({
        jobId: job.jobId,
        status: job.deduplicated ? "already_queued" : "queued"
      });
    }
  );

  app.get(
    "/jobs/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsedParams = jobParamsSchema.safeParse(request.params);

      if (!parsedParams.success) {
        return reply.status(400).send({
          message: "Invalid job id",
          errors: parsedParams.error.flatten()
        });
      }

      const jobStatus = await getTakedownJobStatus(parsedParams.data.id);

      if (!jobStatus) {
        return reply.notFound("Job not found");
      }

      return reply.send(jobStatus);
    }
  );

  return app;
};
