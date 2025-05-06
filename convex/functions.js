import { query } from "./_generated/server";

export const getUser = query(async (ctx) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
        return null;
    } 

    return user.email;
});