export default {
  providers: [
    {
      /**Change to PROD */
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
