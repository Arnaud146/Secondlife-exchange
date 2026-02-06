import { z } from "zod";

import { roleSchema } from "./common.js";

export const signInInputSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(8).max(128),
  })
  .strict();

export const signUpInputSchema = signInInputSchema
  .extend({
    displayName: z.string().trim().min(2).max(60),
    confirmPassword: z.string().min(8).max(128),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export const establishSessionInputSchema = z
  .object({
    idToken: z.string().min(20),
  })
  .strict();

export const appSessionClaimsSchema = z
  .object({
    uid: z.string().min(1),
    role: roleSchema,
    email: z.string().email().optional(),
  })
  .strict();

export type SignInInput = z.infer<typeof signInInputSchema>;
export type SignUpInput = z.infer<typeof signUpInputSchema>;
export type EstablishSessionInput = z.infer<typeof establishSessionInputSchema>;
export type AppSessionClaims = z.infer<typeof appSessionClaimsSchema>;
